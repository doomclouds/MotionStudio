# SPDX-License-Identifier: MIT
"""Build only fixed UTF-8 source paths; no directory traversal or private artifacts."""
from pathlib import Path
import os,stat,sys,json,zipfile
ROOT=Path(__file__).absolute().parent
FILES=('CONTRACT.md','CREDITS.md','DEDUP.md','DESIGN-GUIDE.md','LICENSE','README.md','examples.mjs','index.mjs','lib/geometry.mjs','lib/input.mjs','lib/labels.mjs','lib/model.mjs','licenses/Helper-MIT.txt','licenses/Matrix-Labels-MIT.txt','licenses/Sniffnet-MIT.txt','licenses/Sniffnet-Apache-2.0.txt','make-package.py','package.json','render.mjs','source-policy.json','test.mjs','test-io.py')
def check_file(p):
 for node in [p,*p.parents]:
  if stat.S_ISLNK(node.lstat().st_mode):raise ValueError('non-symlink source and ancestors')
 if not stat.S_ISREG(p.lstat().st_mode):raise ValueError('regular source file')
def check_output(raw):
 p=Path(raw)
 if not p.is_absolute()or os.path.normpath(raw)!=raw or str(p)!=raw or p==ROOT or ROOT in p.parents:raise ValueError('normalized absolute external destination')
 for node in [p,*p.parents]:
  try:st=node.lstat()
  except FileNotFoundError:continue
  if node==p:raise ValueError('output already exists')
  if stat.S_ISLNK(st.st_mode)or not stat.S_ISDIR(st.st_mode):raise ValueError('real directory ancestors')
 if not p.parent.is_dir():raise ValueError('existing parent')
 return p
def build(raw):
 out=check_output(raw);payload=[]
 for name in FILES:
  p=ROOT/name;check_file(p);b=p.read_bytes();b.decode('utf-8');payload.append((name,b))
 with out.open('xb')as f:
  with zipfile.ZipFile(f,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9)as z:
   for name,b in payload:
    i=zipfile.ZipInfo(name,(2026,11,1,0,0,0));i.compress_type=zipfile.ZIP_DEFLATED;i.external_attr=0o100644<<16;z.writestr(i,b)
 return str(out)
if __name__=='__main__':
 if len(sys.argv)!=2:raise SystemExit('python3 make-package.py /absolute/new.zip')
 print(build(sys.argv[1]))
