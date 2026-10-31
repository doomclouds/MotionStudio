"""MIT. Resource gates: real offline rebuild plus no-network/no-write failures."""
import contextlib,hashlib,io,json,os,runpy,shutil,subprocess,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from font_support import ROOT,lock,digest
INPUTS=Path(os.environ['PORTAGE_FONT_INPUTS']);FONTS=Path(os.environ['PORTAGE_FONT_DIR'])
class Resources(unittest.TestCase):
 def setUp(self):self.tmp=Path(tempfile.mkdtemp(prefix='file-grid-resource-',dir=os.environ.get('TMPDIR',ROOT.parent.parent)))
 def tearDown(self):shutil.rmtree(self.tmp)
 def invoke(self,script,args):
  with patch.object(sys,'argv',[script,*args]),contextlib.redirect_stdout(io.StringIO()):runpy.run_path(str(ROOT/script),run_name='__main__')
 def test_fetch_rejects_paths_without_network_or_writes(self):
  targets=[ROOT/'forbidden',Path('relative'),self.tmp/'exists',self.tmp/'live',self.tmp/'dangling'];targets[2].mkdir();targets[3].symlink_to(targets[2],target_is_directory=True);targets[4].symlink_to(self.tmp/'absent',target_is_directory=True)
  for p in targets:
   with self.subTest(path=p.name),patch('urllib.request.urlopen') as net:
    with self.assertRaises((ValueError,OSError)):self.invoke('fetch-fonts.py',['--output',str(p)])
    net.assert_not_called();self.assertFalse((self.tmp/'absent').exists());self.assertFalse((ROOT/'forbidden').exists())
 def test_bad_remote_hash_leaves_no_output(self):
  class Response:
   def __enter__(self):return self
   def __exit__(self,*args):pass
   def read(self,n):return b'not a font'
  with patch('urllib.request.urlopen',return_value=Response()) as net:
   with self.assertRaises(ValueError):self.invoke('fetch-fonts.py',['--output',str(self.tmp/'out')])
   self.assertEqual(net.call_count,1);self.assertFalse((self.tmp/'out').exists())
 def test_prepare_symlink_output_rejects_without_deriving(self):
  for mode in ['live','dangling']:
   out=self.tmp/mode;target=self.tmp/(mode+'-target')
   if mode=='live':target.mkdir()
   out.symlink_to(target,target_is_directory=True)
   with patch('fontTools.varLib.instancer.instantiateVariableFont') as derive:
    with self.assertRaises(ValueError):self.invoke('prepare-fonts.py',['--inputs',str(INPUTS),'--output',str(out)])
    derive.assert_not_called();self.assertEqual(list(target.iterdir()) if target.exists() else [],[])
 def test_bad_source_and_notice_precede_output_writes(self):
  for name in [lock()['source']['file'],'Inter-OFL.txt']:
   src=self.tmp/name.replace('.','-');src.mkdir()
   for p in INPUTS.iterdir():shutil.copyfile(p,src/p.name)
   (src/name).write_bytes(b'changed')
   out=self.tmp/(src.name+'-out')
   with self.assertRaises(ValueError):self.invoke('prepare-fonts.py',['--inputs',str(src),'--output',str(out)])
   self.assertFalse(out.exists())
 def test_derived_leaves_gate_all_writes(self):
  name=lock()['derived'][1]['file']
  for mode in ['changed','dangling','directory']:
   out=self.tmp/mode;out.mkdir();p=out/name
   if mode=='changed':p.write_bytes(b'keep')
   elif mode=='dangling':p.symlink_to(self.tmp/'never-written')
   else:p.mkdir()
   with self.assertRaises(ValueError):self.invoke('prepare-fonts.py',['--inputs',str(INPUTS),'--output',str(out)])
   self.assertEqual(sorted(x.name for x in out.iterdir()),[name]);self.assertFalse((self.tmp/'never-written').exists())
 def test_exact_rebuild_and_repeated_prepare(self):
  out=self.tmp/'derived'
  for _ in range(2):self.invoke('prepare-fonts.py',['--inputs',str(INPUTS),'--output',str(out)])
  for r in lock()['derived']:self.assertEqual(digest((out/r['file']).read_bytes()),r['sha256'])
  self.assertEqual((out/'font-lock.json').read_bytes(),(ROOT/'font-lock.json').read_bytes())
 def test_names_licenses_and_coverage(self):
  from fontTools.ttLib import TTFont
  for r in lock()['derived']:
   f=TTFont(FONTS/r['file']);self.assertTrue(set(range(32,127)).issubset(f.getBestCmap()));self.assertEqual(f['OS/2'].usWeightClass,400);self.assertEqual(f['head'].macStyle,0)
   self.assertTrue(any(n.nameID==13 and 'Font Software' in n.toUnicode() for n in f['name'].names))
   self.assertTrue(any(n.nameID==0 and 'Inter Project' in n.toUnicode() for n in f['name'].names))
   for n in f['name'].names:
    if n.nameID in (1,3,4,6,16,25):self.assertEqual(n.toUnicode(),r['alias'])
 def test_runtime_bad_font_before_any_registration(self):
  mod=self.tmp/'mock';mod.mkdir();(mod/'package.json').write_text('{"version":"0.1.100","main":"index.cjs"}')
  log=self.tmp/'calls';(mod/'index.cjs').write_text("exports.GlobalFonts={registerFromPath(){require('fs').appendFileSync(process.env.PROBE_LOG,'registered');return true}}")
  for index in [0,1]:
   for mode in ['missing','corrupt','live','dangling','directory']:
    dest=self.tmp/f'f-{index}-{mode}';shutil.copytree(FONTS,dest);p=dest/lock()['derived'][index]['file'];p.unlink()
    if mode=='corrupt':p.write_bytes(b'wrong')
    elif mode=='live':p.symlink_to(FONTS/p.name)
    elif mode=='dangling':p.symlink_to(self.tmp/'absent')
    elif mode=='directory':p.mkdir()
    env={**os.environ,'PORTAGE_FONT_DIR':str(dest),'CANVAS_MODULE':str(mod),'PROBE_LOG':str(log)}
    r=subprocess.run(['node','--input-type=module','-e',"import {setup} from './runtime.mjs'; setup();"],cwd=ROOT,env=env,capture_output=True)
    self.assertNotEqual(r.returncode,0);self.assertFalse(log.exists())
 def test_runtime_mock_registration_controls(self):
  mod=self.tmp/'control';mod.mkdir();(mod/'package.json').write_text('{"version":"0.1.100","main":"index.cjs"}')
  (mod/'index.cjs').write_text("let n=0;exports.GlobalFonts={registerFromPath(){n++;require('fs').appendFileSync(process.env.PROBE_LOG,'x');return n!==Number(process.env.FAIL_AT)}}")
  for fail,code,calls in [(0,0,2),(1,1,1),(2,1,2)]:
   log=self.tmp/('calls'+str(fail));env={**os.environ,'PORTAGE_FONT_DIR':str(FONTS),'CANVAS_MODULE':str(mod),'PROBE_LOG':str(log),'FAIL_AT':str(fail)}
   r=subprocess.run(['node','--input-type=module','-e',"import {setup} from './runtime.mjs'; setup();"],cwd=ROOT,env=env,capture_output=True)
   self.assertEqual(r.returncode,code);self.assertEqual(log.read_text(),'x'*calls)
if __name__=='__main__':unittest.main(verbosity=2)

