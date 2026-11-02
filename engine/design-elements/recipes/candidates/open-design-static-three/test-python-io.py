#!/usr/bin/env python3
"""Offline path regressions: rejected output links cause no reads, writes or network."""
from pathlib import Path
import importlib.util,json,sys,tempfile,unittest
from unittest.mock import patch
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parent

def load(name):
 spec=importlib.util.spec_from_file_location(name.replace('-','_'),ROOT/(name+'.py'))
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 return module

prepare=load('prepare-fonts');fetch=load('fetch-fonts')

class OutputBoundaryTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory(prefix='od-font-boundary-');self.root=Path(self.tmp.name)
  self.inputs=self.root/'inputs';self.inputs.mkdir()
 def tearDown(self):self.tmp.cleanup()
 def reject_link(self,module,existing):
  target=self.root/'target';link=self.root/'link'
  if existing:
   target.mkdir();(target/'sentinel.txt').write_bytes(b'unchanged')
  link.symlink_to(target,target_is_directory=True)
  before=sorted(str(p.relative_to(self.root))for p in self.root.rglob('*'))
  argv=[str(ROOT/(module.__name__.replace('_','-')+'.py')),'--case','light-leak','--output',str(link)]
  if module is prepare:argv+=['--inputs',str(self.inputs)]
  # Any attempt to read font bytes, derive fonts or construct a network opener fails.
  with patch.object(sys,'argv',argv),patch('urllib.request.build_opener')as network,patch('fontTools.ttLib.TTFont')as derive,patch.object(Path,'read_bytes')as reads,patch.object(Path,'read_text')as text_reads,patch.object(prepare,'TTFont')as local_derive:
   with self.assertRaisesRegex(ValueError,'symlink'):module.main()
   for mock in(network,derive,reads,text_reads,local_derive):mock.assert_not_called()
  self.assertTrue(link.is_symlink());self.assertEqual(link.readlink(),target)
  self.assertEqual(sorted(str(p.relative_to(self.root))for p in self.root.rglob('*')),before)
  if existing:self.assertEqual((target/'sentinel.txt').read_bytes(),b'unchanged')
  else:self.assertFalse(target.exists())
 def test_prepare_dangling_output_link_rejected_before_io(self):self.reject_link(prepare,False)
 def test_prepare_existing_output_link_rejected_before_io(self):self.reject_link(prepare,True)
 def test_fetch_dangling_output_link_rejected_before_io(self):self.reject_link(fetch,False)
 def test_fetch_existing_output_link_rejected_before_io(self):self.reject_link(fetch,True)
 def test_new_external_output_path_accepted_without_creation(self):
  target=self.root/'new';self.assertEqual(prepare.external(str(target),new_output=True),target);self.assertFalse(target.exists())
 def test_existing_output_directory_rejected(self):
  with self.assertRaisesRegex(ValueError,'new external'):prepare.external(str(self.inputs),new_output=True)
 def test_relative_output_rejected(self):
  with self.assertRaisesRegex(ValueError,'Absolute'):prepare.external('relative',new_output=True)
 def test_parent_link_into_repository_rejected_without_creation(self):
  link=self.root/'repo';link.symlink_to(prepare.repository(),target_is_directory=True)
  with self.assertRaisesRegex(ValueError,'inside repository'):prepare.external(str(link/'forbidden-font-test-output'),new_output=True)
  self.assertFalse((link/'forbidden-font-test-output').exists())

if __name__=='__main__':
 result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(OutputBoundaryTests))
 print(json.dumps({'pythonBoundaryChecks':result.testsRun,'status':'PASS'if result.wasSuccessful()else'FAIL','networkUsed':False}))
 sys.exit(0 if result.wasSuccessful()else 1)
