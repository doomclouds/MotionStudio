"""Synthetic source/contract tests. Never claim a real listening review."""
import copy
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import wave
import sound

class SoundTests(unittest.TestCase):
    def setUp(self):
        self.rows=sound.load(); self.d,self.path=next((d,p) for d,p in self.rows if d['kind']=='sfx')
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
    def tearDown(self):self.temp.cleanup()
    def invalid(self,edit):
        d=copy.deepcopy(self.d);edit(d)
        with self.assertRaises((ValueError,TypeError)):sound.validate(d,self.path.parent,sound.ROOT)
    def test_catalog_and_index(self):
        self.assertEqual(len(self.rows),5)
        self.assertEqual(sound.index(self.rows),(sound.ROOT/'INDEX.md').read_text())
        self.assertEqual([d['id'] for d,_ in sound.query(self.rows,kind='bgm')],['quiet-pulse-bed'])
        self.assertEqual(sound.query(self.rows,kind='voice'),[])
        self.assertEqual(sound.query(self.rows,mood='unknown'),[])
    def test_design_and_folder_contract(self):
        for d,p in self.rows:
            self.assertEqual(p.parent.parent.name,d['kind'])
            self.assertEqual((p.parent/'design.md').read_text(),sound.design(d))
        d,p,lib=self.make_local()
        (p.parent/'design.md').write_text('stale')
        with self.assertRaises(ValueError):sound.load(lib)
        self.assertEqual(len(sound.load(lib,validate_views=False)),1)
        d['kind']='bgm';d['category']='pulse-bed'
        with self.assertRaises(ValueError):sound.validate(d,p.parent,lib)
    def test_retired_and_distribution_boundaries(self):
        d,p,lib=self.make_local()
        d['status']='retired'
        self.assertEqual(sound.query([(d,p)]),[])
        with self.assertRaises(ValueError):sound.materialize(d,p,self.root/'retired',lib)
        d['status']='candidate';d['rights']['standalone_distribution']='prohibited'
        p.write_text(json.dumps(d))
        receipt=sound.materialize(d,p,self.root/'private-only',lib)
        self.assertEqual(receipt['standalone_distribution'],'prohibited')
        d['rights']['use']='prohibited'
        with self.assertRaises(ValueError):sound.materialize(d,p,self.root/'no-use',lib)
    def test_changed_contract_rejected(self):
        d,p,lib=self.make_local()
        changed=copy.deepcopy(d);changed['title']='Changed title'
        p.write_text(json.dumps(changed))
        with self.assertRaises(ValueError):sound.materialize(d,p,self.root/'changed',lib)
    def test_unknown_fields_and_evidence(self):
        for edit in [lambda d:d.update(extra=True),lambda d:d['review'].update(listening='PASS'),lambda d:d['review'].update(technical='PASS'),lambda d:d['audio']['loop'].update(listened_seam=True),lambda d:d.update(status='accepted')]:self.invalid(edit)
    def test_bad_source_and_format(self):
        for edit in [lambda d:d['source'].update(entry='/tmp/fake'),lambda d:d['source'].update(entry='../../../../LICENSE'),lambda d:d['source'].update(recipe='exec'),lambda d:d['audio'].update(duration_seconds=float('nan')),lambda d:d['audio'].update(channels=1),lambda d:d['rights'].update(license='unknown')]:self.invalid(edit)
    def test_all_generate_and_repeat(self):
        for d,p in self.rows:
            receipts=[sound.materialize(d,p,self.root/(d['id']+str(i))) for i in range(2)]
            self.assertEqual(receipts[0]['output_sha256'],receipts[1]['output_sha256'])
            self.assertEqual(receipts[0]['listening'],'NOT_LISTENED')
            self.assertGreater(receipts[0]['technical']['sample_peak'],0)
            self.assertLess(receipts[0]['technical']['sample_peak'],1)
            with wave.open(str(self.root/(d['id']+'0')/'source.wav'),'rb') as f:
                self.assertEqual(f.getnframes(),round(d['audio']['duration_seconds']*48000))
                if d['kind']=='sfx':
                    self.assertEqual(f.readframes(1),b'\0'*4);f.setpos(f.getnframes()-1);self.assertEqual(f.readframes(1),b'\0'*4)
    def test_no_overwrite_or_source_output(self):
        sound.materialize(self.d,self.path,self.root/'out')
        with self.assertRaises(ValueError):sound.materialize(self.d,self.path,self.root/'out')
        with self.assertRaises(ValueError):sound.materialize(self.d,self.path,sound.ROOT/'out')
    def test_loop_is_explicit(self):
        with self.assertRaises(ValueError):sound.materialize(self.d,self.path,self.root/'no',repeats=2)
        d,p=next((d,p) for d,p in self.rows if d['kind']=='bgm')
        sound.materialize(d,p,self.root/'loop',repeats=2)
        plan=json.loads((self.root/'loop/timeline.json').read_text())
        self.assertEqual(len(plan['clips']),2);self.assertEqual(plan['project']['duration'],{'n':'16','d':'1'})
        for bad in [0,33,True]:
            with self.assertRaises(ValueError):sound.materialize(d,p,self.root/'bad',repeats=bad)
    def make_local(self):
        sound.materialize(self.d,self.path,self.root/'generated')
        library=self.root/'library';folder=library/'assets'/self.d['kind']/self.d['id'];folder.mkdir(parents=True)
        shutil.copyfile(self.root/'generated/source.wav',folder/'source.wav')
        shutil.copyfile(sound.ROOT/'LICENSE',library/'LICENSE')
        d=copy.deepcopy(self.d)
        d['source'].update(kind='local-file',entry='source.wav',recipe=None,sha256=hashlib.sha256((folder/'source.wav').read_bytes()).hexdigest())
        d['audio']['duration_basis']='measured'
        p=folder/'asset.json';p.write_text(json.dumps(d));(folder/'design.md').write_text(sound.design(d))
        return d,p,library
    def test_local_file_restore_and_rights(self):
        d,p,lib=self.make_local();sound.load(lib)
        sound.materialize(d,p,self.root/'restored',lib)
        d['rights']['use']='unknown'
        with self.assertRaises(ValueError):sound.materialize(d,p,self.root/'blocked',lib)
    def test_hash_mismatch_and_symlink(self):
        d,p,lib=self.make_local();d['source']['sha256']='0'*64
        with self.assertRaises(ValueError):sound.materialize(d,p,self.root/'bad',lib)
        (p.parent/'alias.wav').symlink_to(p.parent/'source.wav');d['source']['entry']='alias.wav'
        with self.assertRaises(ValueError):sound.validate(d,p.parent,lib)
    def test_real_audio_core_consumer(self):
        if not shutil.which('ffmpeg') or not shutil.which('ffprobe') or not shutil.which('node'):self.skipTest('Audio Core runtime unavailable')
        d,p=next((d,p) for d,p in self.rows if d['kind']=='bgm')
        sound.materialize(d,p,self.root/'in',repeats=2)
        # Repository and portable layouts share sibling Audio Core.
        cli=sound.ROOT.parent/'motion-audio-core/scripts/audio.mjs'
        subprocess.run(['node',str(cli),'render','--timeline',str(self.root/'in/timeline.json'),'--source-root',str(self.root/'in'),'--work',str(self.root/'mix')],check=True,capture_output=True)
        report=json.loads((self.root/'mix/result/report.json').read_text())
        self.assertEqual(report['review']['listening']['status'],'NOT_RUN')
        self.assertEqual(report['review']['owner']['status'],'NOT_RUN')
        with wave.open(str(self.root/'in/source.wav'),'rb') as f:self.assertEqual(f.getnframes(),384000)

if __name__=='__main__':unittest.main()
