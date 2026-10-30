#!/usr/bin/env python3
"""Negative tests for semantic indexing, never renders or changes source repository."""
import copy, importlib.util, json, shutil, tempfile, unittest, subprocess, sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('retention',Path(__file__).with_name('retention.py')); mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
ROOT=Path(__file__).resolve().parents[1]
class RetentionTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
  shutil.copytree(ROOT/'engine/design-elements',self.root/'engine/design-elements')
  for name in ['pixel-hiking-study','irreverent-pop-study']:
   shutil.copytree(ROOT/'portfolio/works'/name,self.root/'portfolio/works'/name)
   # Source card remains agent-authored; fixture permits running before it arrives.
   card=self.root/'portfolio/works'/name/'DESIGN-RETENTION.md'
   if not card.exists():card.write_text('# TEST FIXTURE ONLY\n')
  self.p=self.root/'portfolio/works/pixel-hiking-study/retention.json'
 def tearDown(self):self.tmp.cleanup()
 def change(self,fn):
  d=mod.read(self.p);fn(d);self.p.write_text(json.dumps(d));return d
 def rejects(self,fn):
  self.change(fn)
  with self.assertRaises((ValueError,KeyError,TypeError)):mod.outputs(self.root)
 def test_valid(self):self.assertEqual(len(mod.inspect(self.root)[1]),2)
 def test_unknown_family(self):self.rejects(lambda d:d['assetUsage'][0].update(familyId='design.fake.v1'))
 def test_wrong_hash(self):self.rejects(lambda d:d['assetUsage'][0].update(moduleSha256='0'*64))
 def test_no_call(self):self.rejects(lambda d:d['assetUsage'][0].update(callToken='neverCalled'))
 def test_wrong_mode(self):self.rejects(lambda d:d['assetUsage'][0].update(mode='imagined'))
 def test_duplicate(self):self.rejects(lambda d:d['assetUsage'].append(copy.deepcopy(d['assetUsage'][0])))
 def test_wrong_canvas(self):self.rejects(lambda d:d['canvas'].update(width=123))
 def test_source_missing(self):self.rejects(lambda d:d['sourceAnalysis'].append('missing.md'))
 def test_traversal(self):self.rejects(lambda d:d.update(decisionCard='../entry.json'))
 def test_claim_motion(self):self.rejects(lambda d:d['motionTransfer'].update(status='PASSED'))
 def test_private_path(self):self.rejects(lambda d:d.update(nonAssetNote='/workspace/private'))
 def test_false_public_evidence(self):self.rejects(lambda d:d['evidence']['comparisonBundle'].update(status='PUBLISHED'))
 def test_unlinked_hash(self):self.rejects(lambda d:d['evidence']['independentReview'].update(sha256='not-a-sha'))
 def test_fake_snapshot(self):
  p=self.root/'portfolio/works/irreverent-pop-study/design/material-surfaces.mjs';p.write_text('changed')
  with self.assertRaises(ValueError):mod.outputs(self.root)
 def test_missing_sidecar(self):
  self.p.unlink()
  with self.assertRaises(ValueError):mod.outputs(self.root)
 def test_entrypoint_mismatch(self):self.rejects(lambda d:d.update(entrypoint='README.md'))
 def test_false_located_review(self):self.rejects(lambda d:d['evidence']['independentReview'].update(recordId=None))
 def test_private_review_false_pass(self):self.rejects(lambda d:d['evidence']['independentReview'].update(status='PASSED'))
 def test_comment_not_call(self):
  source=self.root/'portfolio/works/pixel-hiking-study/design/scene.mjs'
  source.write_text(source.read_text()+'\n// fabricatedCall(ctx)\n')
  self.rejects(lambda d:d['assetUsage'][0].update(callToken='fabricatedCall'))
 def test_snapshot_claimed_runtime(self):
  p=self.root/'portfolio/works/irreverent-pop-study/retention.json';d=mod.read(p)
  d['assetUsage'][0].update(mode='runtime-import',snapshotPath=None);p.write_text(json.dumps(d))
  with self.assertRaises(ValueError):mod.outputs(self.root)
 def test_missing_transitive_hash(self):
  p=self.root/'engine/design-elements/shared.mjs';p.write_text(p.read_text()+'\n// drift\n')
  with self.assertRaises(ValueError):mod.outputs(self.root)
 def test_source_unchanged(self):
  before=(self.root/'portfolio/works/pixel-hiking-study/design/scene.mjs').read_bytes();mod.outputs(self.root);self.assertEqual(before,(self.root/'portfolio/works/pixel-hiking-study/design/scene.mjs').read_bytes())
 def test_honest_missing_review_allowed(self):
  self.change(lambda d:d['evidence']['independentReview'].update(status='NOT_LOCATED',recordId=None,sha256=None,storage='NOT_LOCATED',durableStorage='NOT_LOCATED'))
  mod.outputs(self.root)
 def test_deleted_transitive_lock(self):
  p=self.p.parent/'ui-dependencies.json';d=mod.read(p);d['files']=[f for f in d['files'] if f['path']!='shared.mjs'];p.write_text(json.dumps(d))
  with self.assertRaises(ValueError):mod.outputs(self.root)
 def test_parent_symlink_rejected(self):
  outside=self.root/'outside';outside.mkdir();(outside/'note.md').write_text('not allowed')
  folder=self.p.parent;(folder/'escape').symlink_to(outside,target_is_directory=True)
  self.rejects(lambda d:d.update(decisionCard='escape/note.md'))
 def test_generated_drift_rejected(self):
  script=ROOT/'portfolio/retention.py'
  command=[sys.executable,str(script),'--root',str(self.root)]
  self.assertEqual(subprocess.run(command+['--write'],capture_output=True).returncode,0)
  self.assertEqual(subprocess.run(command+['--check'],capture_output=True).returncode,0)
  p=self.root/'portfolio/DESIGN-INDEX.md';p.write_text(p.read_text()+'drift')
  self.assertNotEqual(subprocess.run(command+['--check'],capture_output=True).returncode,0)
 def test_query_all(self):self.assertEqual(mod.query(self.root)['count'],2)
 def test_query_zero(self):self.assertEqual(mod.query(self.root,'no_such_phrase_zz')['count'],0)
 def test_query_family_actual_only(self):
  self.assertEqual([r['workId'] for r in mod.query(self.root,family='design.color-sections.v1')['results']],['pixel-hiking-study'])
 def test_query_intersection(self):
  self.assertEqual(mod.query(self.root,'pixel',family='design.material-surfaces.v1')['count'],0)
  self.assertEqual(mod.query(self.root,'PIXEL',family='design.color-sections.v1')['count'],1)
 def test_query_unknown_family(self):
  with self.assertRaises(ValueError):mod.query(self.root,family='design.fake.v1')
 def test_query_empty_rejected(self):
  with self.assertRaises(ValueError):mod.query(self.root,text='  ')
 def test_query_original_analysis(self):
  d=mod.read(self.p);p=self.p.parent/d['sourceAnalysis'][0];p.write_text(p.read_text()+'\nunique-original-analysis-term')
  self.assertEqual(mod.query(self.root,'unique-original-analysis-term')['count'],1)
 def test_query_read_only(self):
  before={p:str(p.stat().st_mtime_ns) for p in self.root.rglob('*') if p.is_file()};mod.query(self.root,text='pixel')
  self.assertEqual(before,{p:str(p.stat().st_mtime_ns) for p in self.root.rglob('*') if p.is_file()})
 def durable(self,binding='EXACT_PIXELS'):
  self.change(lambda d:d['evidence'].update(visualReport={**d['evidence']['comparisonBundle'],'storage':'PRIVATE_LIBRARY','durableStorage':'ACCESS_VERIFIED','artifactKind':'html-report','acceptedFrameBinding':binding}))
  self.change(lambda d:d['evidence']['independentReview'].update(storage='PRIVATE_OWNER_PAGE',durableStorage='ACCESS_VERIFIED'))
 def test_durable_container_allowed(self):self.durable();mod.outputs(self.root)
 def test_durable_not_matched_preserved(self):
  self.durable('NOT_ESTABLISHED');r=mod.query(self.root,text='pixel')['results'][0];self.assertEqual(r['acceptedFrameBinding'],'NOT_ESTABLISHED')
 def test_durable_missing_binding_rejected(self):
  self.durable();self.rejects(lambda d:d['evidence']['visualReport'].pop('acceptedFrameBinding'))
 def test_durable_cannot_claim_png_hash(self):
  self.durable();self.rejects(lambda d:d['evidence']['visualReport'].update(artifactKind='png'))
 def test_runtime_not_upgraded_by_archive(self):
  self.rejects(lambda d:d['assetUsage'][0]['executionEvidence'].update(storage='PRIVATE_LIBRARY',durableStorage='ACCESS_VERIFIED'))
 def test_generated_deterministic(self):self.assertEqual(mod.outputs(self.root),mod.outputs(self.root))
if __name__=='__main__':unittest.main()
