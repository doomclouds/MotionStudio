"""Explicit offline import of a hash-locked OFL variable font; outputs stay external."""
import argparse,hashlib,io,json,os,pathlib,stat,re
import fontTools
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
HERE=pathlib.Path(__file__).resolve().parent
SHA=lambda b:hashlib.sha256(b).hexdigest()
def valid_git_root(root):
 try:
  marker=root/'.git';gitdir=marker
  if marker.is_file():
   match=re.fullmatch(r'gitdir: ([^\r\n]+)\r?\n?',marker.read_text())
   if not match:return False
   gitdir=(root/match.group(1)).resolve()
  elif not marker.is_dir():return False
  if not re.fullmatch(r'(ref: refs/[^\s]+|[0-9a-f]{40,64})',(gitdir/'HEAD').read_text().strip()):return False
  common=(gitdir/(gitdir/'commondir').read_text().strip()).resolve() if (gitdir/'commondir').exists() else gitdir
  return (common/'objects').is_dir() and (common/'config').is_file()
 except PermissionError:return True
 except (OSError,UnicodeError):return False
def repo_root():
 for p in (HERE,*HERE.parents):
  if valid_git_root(p):return p
 return HERE
def outside(raw,exists=True):
 p=pathlib.Path(raw)
 if not p.is_absolute():raise ValueError('absolute external path required')
 p=pathlib.Path(os.path.abspath(p));real=p.resolve(strict=exists)
 if real!=p:raise ValueError('symlink paths forbidden')
 if p==repo_root() or repo_root() in p.parents:raise ValueError('path must be outside repository')
 return p
def prepare(source,output):
 if fontTools.__version__!='4.61.1':raise RuntimeError('FontTools 4.61.1 required for exact outputs')
 lock=json.loads((HERE/'font-lock.json').read_text());src=outside(source);out=outside(output,False)
 if os.path.lexists(out):raise FileExistsError('output must not exist, including dangling symlinks')
 if out.parent.resolve(strict=True)!=out.parent:raise ValueError('output parent must be a real existing directory')
 fd=os.open(src,os.O_RDONLY|os.O_NOFOLLOW)
 try:
  st=os.fstat(fd)
  if not stat.S_ISREG(st.st_mode):raise ValueError('regular font required')
  if st.st_size!=lock['input']['bytes']:raise ValueError('input size mismatch')
  with os.fdopen(fd,'rb',closefd=False) as f:data=f.read()
 finally:os.close(fd)
 if SHA(data)!=lock['input']['sha256']:raise ValueError('input SHA mismatch')
 derived=[]
 for spec in lock['outputs']:
  font=TTFont(io.BytesIO(data),recalcTimestamp=False);font=instantiateVariableFont(font,{'wght':spec['weight']},inplace=True)
  for rec in font['name'].names:
   if rec.nameID in (1,2,3,4,6,16,17):rec.string=('Regular' if rec.nameID in (2,17) else spec['alias']).encode(rec.getEncoding(),errors='replace')
  if not all(cp in font.getBestCmap() for cp in range(32,127)):raise ValueError('ASCII coverage missing')
  b=io.BytesIO();font.save(b);raw=b.getvalue()
  if SHA(raw)!=spec['sha256']:raise ValueError('derived SHA mismatch')
  derived.append((spec['file'],raw))
 # All input parsing/derivation/hashes pass before exclusive directory creation.
 out.mkdir(mode=0o700);dfd=os.open(out,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)
 try:
  for name,raw in derived:
   fd=os.open(name,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600,dir_fd=dfd)
   with os.fdopen(fd,'wb') as f:f.write(raw)
 finally:os.close(dfd)
 return [{'file':n,'sha256':SHA(b),'bytes':len(b)} for n,b in derived]
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--out',required=True);a=p.parse_args();print(json.dumps(prepare(a.input,a.out),indent=2))
