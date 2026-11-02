"""Trusted local UTF-8 text-only projection. Fixed members, no recursive discovery."""
import argparse,hashlib,json,os,stat,zipfile
from pathlib import Path
ROOT=Path(__file__).absolute().parent
MEMBERS=('LICENSE','README.md','CONTRACT.md','DESIGN-GUIDE.md','CREDITS.md','INDEX.md','package.json','package-lock.json','prepare-fonts.py','build-package.py','package-tests.py','test-model.mjs','test-native.mjs','lib/data.mjs','lib/sampled-window.mjs','lib/authored-dialogue.mjs','examples/runtime.mjs','examples/fixtures.mjs','examples/render.mjs','examples/font-lock.json','examples/font-sources.json','licenses/OpenSans-OFL.txt','licenses/Native-Canvas-MIT.txt')
def checked(raw,fresh=False,file=False):
 if not os.path.isabs(raw) or {'.','..'}&set(raw.split('/')):raise ValueError('absolute canonical path')
 p=Path(raw)
 for q in (p,*p.parents):
  try:s=q.lstat()
  except FileNotFoundError:continue
  if stat.S_ISLNK(s.st_mode):raise ValueError('symbolic link')
 if fresh:
  if os.path.lexists(raw) or not p.parent.is_dir():raise ValueError('fresh output existing parent')
 else:
  s=p.lstat()
  if not (stat.S_ISREG(s.st_mode) if file else stat.S_ISDIR(s.st_mode)):raise ValueError('regular source expected')
 return p
def main():
 a=argparse.ArgumentParser();a.add_argument('--output',required=True);o=a.parse_args();out=checked(o.output,True);checked(str(ROOT))
 # Validate all inputs and ancestors BEFORE any payload read.
 paths=[checked(str(ROOT/n),file=True) for n in MEMBERS]
 contents=[]
 for n,p in zip(MEMBERS,paths):
  b=p.read_bytes();b.decode('utf-8')
  if b'\0' in b or len(b)>2000000:raise ValueError('UTF-8 text projection only')
  contents.append((n,b))
 out.mkdir()
 with zipfile.ZipFile(out/'text-candidates.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9)as z:
  for n,b in contents:
   i=zipfile.ZipInfo(n,(2026,11,1,0,0,0));i.external_attr=0o100644<<16;i.compress_type=zipfile.ZIP_DEFLATED;z.writestr(i,b)
 result={'files':[{'path':n,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}for n,b in contents],'boundary':'Exact UTF-8 projection only, no fonts, pictures, source references, private evidence or node_modules.'}
 (out/'text-members.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'members':len(contents),'output':str(out)}))
if __name__=='__main__':main()
