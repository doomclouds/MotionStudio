"""Synthetic arithmetic/contracts only, never perceptual validation."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import tempfile
import unittest
import numpy as np

spec=importlib.util.spec_from_file_location('stem_balance',Path(__file__).with_name('stem_balance.py'))
sb=importlib.util.module_from_spec(spec);spec.loader.exec_module(sb)

def wave(path,x,rate=48000,tag=3):
    x=np.asarray(x,dtype='<f4')
    if x.ndim==1:x=x[:,None]
    c=x.shape[1];payload=x.tobytes()
    fmt=struct.pack('<HHIIHH',tag,c,rate,rate*c*4,c*4,32)
    raw=b'WAVE'+b'fmt '+struct.pack('<I',len(fmt))+fmt+b'data'+struct.pack('<I',len(payload))+payload
    path.write_bytes(b'RIFF'+struct.pack('<I',len(raw))+raw)
    return hashlib.sha256(path.read_bytes()).hexdigest()

class StemTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        t=np.arange(48000)/48000
        self.s=(.05*np.sin(2*np.pi*1000*t)).astype('f4')[:,None]
        self.b=(.04*np.sin(2*np.pi*1100*t)).astype('f4')[:,None]
        self.config={'schema':sb.SCHEMA,'rounding_model':'independent_f32_exports_of_common_sum',
            'provenance_note':'Synthetic independently rounded exports, not film evidence',
            'event_interval_s':[.4,.64], 'stems':[], 'per_channel':True}
        for name,x,group in [('s',self.s,'target'),('b',self.b,'background'),('m',self.s.astype(float)+self.b,None)]:
            row={'path':name+'.wav','sha256':wave(self.root/(name+'.wav'),x),'origin_s':0,'channel_labels':['M']}
            if group:row.update(group=group,post_gain_post_pan=True);self.config['stems'].append(row)
            else:self.config['master']=row
    def tearDown(self):self.tmp.cleanup()
    def run_case(self):return sb.evaluate(self.config,self.root)
    def invalid(self):
        with self.assertRaises((sb.ContractError,ValueError,KeyError,TypeError)):self.run_case()
    def replace(self,index,x):
        r=(self.config['stems']+[self.config['master']])[index]
        r['sha256']=wave(self.root/r['path'],x)
    def test_basic_and_repeatable(self):
        r=self.run_case();self.assertEqual(r,self.run_case())
        self.assertEqual(r['reconstruction']['samples_over_local_bound'],0)
        self.assertEqual(r['audio_listening'],'NOT_LISTENED')
        self.assertEqual(r['final_mix_attribution'],'NOT_ESTABLISHED')
        self.assertTrue(any(f['crosses_event_boundary'] for f in r['frames']))
        self.assertTrue(all(f['support_s'][0]<.64 and f['support_s'][1]>.4 for f in r['frames']))
        self.assertAlmostEqual(r['event_rms']['difference_db'],20*np.log10(.05/.04),places=4)
    def test_zero_and_floor(self):
        for a,b,state in [(0,0,'BOTH_ZERO'),(0,1,'NO_TARGET_SIGNAL'),(1,0,'NO_BACKGROUND_SIGNAL')]:
            r=sb.powers(a,b,-100);self.assertEqual(r['state'],state);self.assertIsNone(r['difference_db'])
        r=sb.powers(1e-18,1e-19,-100);self.assertEqual(r['state'],'BOTH_NONZERO');self.assertTrue(r['target_below_analysis_floor']);self.assertAlmostEqual(r['difference_db'],10)
    def test_silence(self):
        for i in range(3):self.replace(i,np.zeros_like(self.s))
        r=self.run_case();self.assertEqual(r['event_rms']['state'],'BOTH_ZERO')
        self.assertTrue(all(v['state']=='BOTH_ZERO' for f in r['frames'] for v in f['bands']))
    def test_reconstruction_failure_and_cancellation(self):
        self.replace(2,np.zeros_like(self.s));self.assertEqual(self.run_case()['reconstruction']['status'],'RECONSTRUCTION_MISMATCH')
        self.replace(1,-self.s);r=self.run_case();self.assertEqual(r['reconstruction']['samples_over_local_bound'],0)
        self.assertEqual(r['event_rms']['difference_db'],0) # NOT audibility!
    def test_native_high_frequency_and_gain(self):
        t=np.arange(48000)/48000;high=.05*np.sin(2*np.pi*12000*t)
        self.replace(0,high);self.replace(1,np.zeros_like(high));self.replace(2,high)
        r=self.run_case();peak=np.argmax([v['target_power_fs2'] for v in r['frames'][3]['bands']])
        self.assertGreater(r['analysis']['band_edges_hz'][peak+1],9000)
        old=r['event_rms']['target_db_re_fs2']
        self.replace(0,high*.5);self.replace(2,high*.5)
        self.assertAlmostEqual(self.run_case()['event_rms']['target_db_re_fs2']-old,20*np.log10(.5),places=5)
    def test_stereo_antiphase(self):
        s=np.column_stack((self.s[:,0],-self.s[:,0]));b=np.zeros_like(s)
        for i,x in enumerate((s,b,s)):self.replace(i,x)
        for r in self.config['stems']+[self.config['master']]:r['channel_labels']=['L','R']
        r=self.run_case();self.assertGreater(r['event_rms']['target_power_fs2'],0)
        self.assertEqual(set(r['frames'][0]['per_channel']),{'L','R'})
    def test_short_boundary_impulse(self):
        x=np.zeros_like(self.s);x[19200]=.5
        self.replace(0,x);self.replace(1,np.zeros_like(x));self.replace(2,x)
        self.config['event_interval_s']=[.4,.401]
        r=self.run_case();self.assertTrue(r['frames']);self.assertTrue(all(f['crosses_event_boundary'] for f in r['frames']))
        self.assertGreater(sum(v['target_power_fs2'] for f in r['frames'] for v in f['bands']),0)
    def test_hash_origin_length_and_declarations(self):
        for key,val in [('sha256','0'*64),('origin_s',.1),('post_gain_post_pan',False),('group','music'),('channel_labels',['L','R'])]:
            old=copy.deepcopy(self.config);self.config['stems'][0][key]=val;self.invalid();self.config=old
        self.replace(0,self.s[:-1]);self.invalid()
    def test_bad_formats_nonfinite(self):
        for rate,tag,x in [(44100,3,self.s),(48000,1,self.s),(48000,3,np.full_like(self.s,np.nan))]:
            row=self.config['stems'][0];row['sha256']=wave(self.root/row['path'],x,rate,tag);self.invalid()
    def test_paths_duplicate_and_resources(self):
        for path in ['../x.wav','/tmp/x.wav','https://x.wav']:
            old=self.config['stems'][0]['path'];self.config['stems'][0]['path']=path;self.invalid();self.config['stems'][0]['path']=old
        old=copy.deepcopy(self.config);self.config['stems'][1]=copy.deepcopy(self.config['stems'][0]);self.invalid();self.config=old
        self.config['event_interval_s']=[.1,3];self.invalid()
    def test_nonzero_origin_and_sample_boundaries(self):
        for row in self.config['stems']+[self.config['master']]:row['origin_s']=10
        self.config['event_interval_s']=[10.4,10.64];r=self.run_case();self.assertGreater(r['frames'][0]['support_s'][0],10)
        self.config['event_interval_s']=[10.400001,10.64];self.invalid()
    def test_corrupt_riff_and_symlink(self):
        p=self.root/'s.wav';raw=p.read_bytes();p.write_bytes(raw+b'bad');self.config['stems'][0]['sha256']=hashlib.sha256(p.read_bytes()).hexdigest();self.invalid()
        with tempfile.TemporaryDirectory() as other:
            target=Path(other)/'outside.wav';wave(target,self.s);p.unlink();p.symlink_to(target);self.invalid()
    def test_unknown_fields_and_nonfinite_no_partial_output(self):
        self.config['mystery']=float('nan');self.invalid()
        cfg=self.root/'bad.json';out=self.root/'bad-out.json';cfg.write_text(json.dumps(self.config))
        self.assertEqual(sb.main([str(cfg),'--input-root',str(self.root),'--output',str(out)]),2)
        self.assertFalse(out.exists())
    def test_short_file_and_tail_coverage(self):
        for i in range(3):self.replace(i,np.zeros((100,1)))
        self.config['event_interval_s']=[0,100/48000]
        r=self.run_case();self.assertEqual(r['analysis']['spectral_status'],'UNAVAILABLE_NO_FULL_WINDOW')
        self.assertEqual(r['analysis']['uncovered_event_intervals_s'],[[0,100/48000]])
        for i in range(3):self.replace(i,np.zeros((48000,1)))
        self.config['event_interval_s']=[.999,1]
        r=self.run_case();self.assertTrue(r['analysis']['uncovered_event_intervals_s'])
    def test_disjoint_band_background(self):
        w,points=sb.filterbank();t=np.arange(3072)/48000;h=np.hanning(3073)[:-1]
        def power(f):
            z=abs(np.fft.rfft(np.sin(2*np.pi*f*t)*h))**2;return w@z
        band=np.argmax(power(1000));self.assertGreater(power(1000)[band],power(12000)[band]*1000)
    def test_empty_rounded_event_and_huge_number(self):
        self.config['event_interval_s']=[0,1e-12];self.invalid()
        self.config['event_interval_s']=[0,10**1000];self.invalid()
    def test_cli_exclusive(self):
        cfg=self.root/'c.json';out=self.root/'r.json';cfg.write_text(json.dumps(self.config))
        args=[str(cfg),'--input-root',str(self.root),'--output',str(out)]
        self.assertEqual(sb.main(args),0);before=out.read_bytes();self.assertEqual(sb.main(args),2);self.assertEqual(before,out.read_bytes())

if __name__=='__main__':unittest.main()
