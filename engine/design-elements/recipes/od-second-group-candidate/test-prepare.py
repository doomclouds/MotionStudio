import unittest,tempfile,pathlib,shutil,subprocess,sys,os
ROOT=pathlib.Path(__file__).resolve().parent
class Preparation(unittest.TestCase):
 def test_preflight_and_exact_copy(self):
  with tempfile.TemporaryDirectory() as t:
   t=pathlib.Path(t);source=t/'source';shutil.copytree(pathlib.Path(os.environ['OD_SECOND_ASSETS'])/'bold-poster',source)
   def run(dst):return subprocess.run([sys.executable,'-O',str(ROOT/'prepare-assets.py'),'bold-poster',str(source),str(dst)],capture_output=True)
   dst=t/'good';self.assertEqual(run(dst).returncode,0)
   for f in source.iterdir():self.assertEqual(f.read_bytes(),(dst/f.name).read_bytes())
   self.assertNotEqual(run(dst).returncode,0)
   (source/'Display.ttf').write_bytes(b'tampered');bad=t/'bad';self.assertNotEqual(run(bad).returncode,0);self.assertFalse(bad.exists())
   (source/'Display.ttf').unlink();self.assertNotEqual(run(bad).returncode,0);self.assertFalse(bad.exists())
   (source/'Display.ttf').symlink_to(dst/'Display.ttf');self.assertNotEqual(run(bad).returncode,0);self.assertFalse(bad.exists())
   self.assertNotEqual(run(ROOT/'must-not-create').returncode,0);self.assertFalse((ROOT/'must-not-create').exists())
if __name__=='__main__':unittest.main()
