import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock
import subprocess
import sys

import audit_export
import benchmark
import report


class ExportSafetyTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='benchmark-safety-')
        self.root=Path(self.tmp.name);self.out=self.root/'output';self.out.mkdir()
    def tearDown(self): self.tmp.cleanup()
    def test_existing_output_is_never_overwritten(self):
        with self.assertRaises(benchmark.BenchmarkError): benchmark.ensure_out(self.out,[])
    def test_cli_help_formats_percentage_without_crashing(self):
        result=subprocess.run([sys.executable,str(Path(benchmark.__file__)),'--help'],capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertIn('center50%',result.stdout)
        self.assertIn('--roi',result.stdout)
    def test_overview_each_input_keeps_its_own_duration(self):
        profiles=[{'input':{'video':{'width':1920,'height':1080,'duration_s':duration}},
                   'timeline':{'duration_s':duration},'visual':{'samples':[]},'audio':{}}
                  for duration in [13,19.25]]
        original=report.ImageDraw.Draw; labels=[]
        class Recorder:
            def __init__(self,image): self.real=original(image)
            def __getattr__(self,key): return getattr(self.real,key)
            def text(self,xy,text,*args,**kwargs):
                labels.append(str(text));return self.real.text(xy,text,*args,**kwargs)
        with mock.patch.object(report.ImageDraw,'Draw',side_effect=Recorder):
            report._overview(self.out,*profiles,{},['reference','candidate'],(-100,0))
        identities=[label for label in labels if '1920 × 1080' in label]
        self.assertEqual(len(identities),2)
        self.assertIn('13.00s',identities[0])
        self.assertNotIn('19.25s',identities[0])
        self.assertIn('19.25s',identities[1])
    def test_overview_never_repeats_last_keyframe_for_short_films(self):
        keys=[{'t_s':t,'frame_index':int(t*30)} for t in [2,5,9,12]]
        chosen=report._overview_keyframes({'visual':{'keyframes':keys}})
        self.assertEqual(len(chosen),3)
        self.assertEqual(len({r['frame_index'] for r in chosen}),3)
        self.assertTrue(all(r in keys for r in chosen))
        duplicated=[{'t_s':1.01,'frame_index':30},{'t_s':1.02,'frame_index':30},{'t_s':2,'frame_index':60}]
        self.assertEqual(len(report._overview_keyframes({'visual':{'keyframes':duplicated}})),2)
    def test_overview_thumbnail_positions_use_common_time_without_stretch(self):
        short={'visual':{'thumbnails':[{'t_s':0},{'t_s':5},{'t_s':12}]}}
        long={'visual':{'thumbnails':[{'t_s':0},{'t_s':5},{'t_s':19}]}}
        a=report._overview_thumbnail_samples(short,19.25)
        c=report._overview_thumbnail_samples(long,19.25)
        self.assertEqual(a[1][1],c[1][1])
        self.assertLess(a[-1][1],c[-1][1])
    def test_input_parent_cannot_be_output(self):
        nonexistent=self.root/'future'; source=nonexistent/'input.mp4'
        with self.assertRaises(benchmark.BenchmarkError): benchmark.ensure_out(nonexistent,[source])
    def test_renderer_does_not_read_outside_output(self):
        (self.root/'private.txt').write_text('not an output asset')
        self.assertIsNone(report._asset(self.out,'../private.txt'))
        self.assertIsNone(report._asset(self.out,str(self.root/'private.txt')))
        (self.out/'link').symlink_to(self.root/'private.txt')
        self.assertIsNone(report._asset(self.out,'link'))
    def test_mel_preserves_origin_and_missing_is_not_silence(self):
        matrix=[[-30,-30,-30],[-30,-30,-30]]
        profile=lambda ts:{'audio':{'mel':{'times_s':ts,'power_db':matrix,'display_bin_s':.1}}}
        import numpy as np
        early=np.asarray(report._mel_image(profile([.1,.2,.3]),width=600,height=40,duration=6))
        late=np.asarray(report._mel_image(profile([5.1,5.2,5.3]),width=600,height=40,duration=6))
        self.assertFalse(np.array_equal(early,late))
        # Measured bin moves to the right; unobserved coverage is distinct from low-power color.
        self.assertFalse(np.array_equal(early[:,10:30],late[:,10:30]))
        silent={'audio':{'mel':{'times_s':[.1,.2,.3],'power_db':[[-120]*3]*2,'display_bin_s':.1}}}
        silence=np.asarray(report._mel_image(silent,width=600,height=40,duration=6))
        self.assertFalse(np.array_equal(early[:,400],silence[:,20]))
    def test_manifest_rejects_path_traversal(self):
        (self.out/'manifest.json').write_text(json.dumps({'files':[{'path':'../private.txt','bytes':0,'sha256':'x'}]}))
        with self.assertRaises(ValueError): audit_export.audit(self.out)
    def test_manifest_integrity_and_staleness_not_artistic_pass(self):
        profile={'schema_version':'same','algorithm':{'version':'test'},'input':{'sha256':'a'}}
        for name in ['reference','candidate']:
            benchmark.write_json(self.out/(name+'.profile.json'),profile)
        benchmark.write_json(self.out/'comparison.json',{'inputs':{'reference_sha256':'a','candidate_sha256':'a'}})
        benchmark.finalize_manifest(self.out)
        result=audit_export.audit(self.out)
        self.assertEqual(result['status'],'ARTIFACT_HASHES_MATCH')
        self.assertIn('Not source rights',result['meaning'])
        with (self.out/'reference.profile.json').open('a') as f: f.write(' ')
        stale=audit_export.audit(self.out)
        self.assertEqual(stale['status'],'INVALID_OR_STALE')


if __name__=='__main__':unittest.main()
