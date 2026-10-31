"""SPDX-License-Identifier: Apache-2.0. Offline font import path/identity regression."""
from pathlib import Path
import importlib.util,os,tempfile,shutil,json
spec=importlib.util.spec_from_file_location('prepare',Path(__file__).with_name('prepare-fonts.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
src=Path(os.environ['OD_FONT_ROOT']);checks=0
with tempfile.TemporaryDirectory(prefix='ledger-prepare-test-')as tmp:
 d=Path(tmp)
 def bad(source,out):
  global checks
  try:m.prepare(source,out)
  except (ValueError,FileNotFoundError):checks+=1
  else:raise AssertionError('expected reject')
 for name,target in [('dangling',d/'absent'),('live',src)]:
  link=d/name;link.symlink_to(target);bad(src,link)
  if name=='dangling':assert not target.exists()
 bad(src,m.ROOT/'forbidden-output');bad(src,d)
 for i,row in enumerate(json.loads((m.ROOT/'font-lock.json').read_text())):
  copy=d/f'bad-{i}';shutil.copytree(src,copy);p=copy/row['file'];b=bytearray(p.read_bytes());b[100]^=1;p.write_bytes(b);out=d/f'out-{i}';bad(copy,out);assert not out.exists()
 out=d/'good';m.prepare(src,out);assert all((src/p.name).read_bytes()==p.read_bytes()for p in out.iterdir());checks+=1
 link=d/'input-link';link.symlink_to(src,target_is_directory=True);bad(link,d/'out-input-link')
print(json.dumps({'status':'PASS','checks':checks,'networkOperations':0}))
