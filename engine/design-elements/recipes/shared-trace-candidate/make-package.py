# SPDX-License-Identifier: MPL-2.0
"""Exact source-only allowlist; no directory globbing or private media inclusion."""
from pathlib import Path
import os,stat,sys,zipfile
ROOT=Path(__file__).absolute().parent
FILES=('CONTRACT.md','CREDITS.md','DEDUP.md','DESIGN-GUIDE.md','LICENSE','README.md','examples.mjs','index.mjs','lib/block-label.mjs','lib/geometry.mjs','lib/input.mjs','lib/model.mjs','licenses/Input-MIT.txt','make-package.py','package.json','render.mjs','source-policy.json','test.mjs')
def regular(p):
 for a in [p,*p.parents]:
  s=a.lstat()
  if stat.S_ISLNK(s.st_mode):raise ValueError('no symlinks')
 if not stat.S_ISREG(p.stat().st_mode):raise ValueError('regular files only')
def output(raw):
 p=Path(raw)
 if not p.is_absolute() or os.path.normpath(raw)!=raw or raw.endswith('/') or p==ROOT or ROOT in p.parents:raise ValueError('normalized external absolute output')
 for a in [p,*p.parents]:
  if a.is_symlink():raise ValueError('no symlinks')
 if p.exists() or not p.parent.is_dir():raise ValueError('absent output/existing parent')
 return p
def package(raw):
 out=output(raw);payload=[]
 for name in FILES:
  p=ROOT/name;regular(p);b=p.read_bytes();b.decode('utf-8');payload.append((name,b))
 with out.open('xb') as f:
  with zipfile.ZipFile(f,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
   for name,b in payload:
    i=zipfile.ZipInfo(name,(2026,11,1,0,0,0));i.external_attr=0o100644<<16;i.compress_type=zipfile.ZIP_DEFLATED;z.writestr(i,b)
 return out
if __name__=='__main__':
 if len(sys.argv)!=2:raise SystemExit('python3 make-package.py /absolute/new.zip')
 print(package(sys.argv[1]))
