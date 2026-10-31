"""Fetch one pinned public OFL font into a fresh external directory. No font modification."""
from pathlib import Path
import argparse,hashlib,json,os,stat,urllib.request
ROOT=Path(__file__).resolve().parent
LOCK_SHA='35e6fc1d9370d699bc8ae63353397a07e13a596803bc44f78cec07b3ff478fef'
def external_new(arg):
 p=Path(arg)
 if not p.is_absolute():raise ValueError('absolute output required')
 p=Path(os.path.abspath(p))
 if p==ROOT or ROOT in p.parents:raise ValueError('output outside source package required')
 parents=list(reversed([p]+list(p.parents)))
 for q in parents:
  try:s=q.lstat()
  except FileNotFoundError:
   if q!=p:raise ValueError('existing parent required')
  else:
   if stat.S_ISLNK(s.st_mode) or not stat.S_ISDIR(s.st_mode) or q==p:raise ValueError('new output and real parents required')
 return p
def run(arg):
 out=external_new(arg) # Before lock reads, network or any writes.
 lock=ROOT/'font-lock.json'
 if lock.is_symlink() or not lock.is_file():raise ValueError('regular lock')
 raw=lock.read_bytes()
 if hashlib.sha256(raw).hexdigest()!=LOCK_SHA:raise ValueError('code-pinned lock identity')
 r=json.loads(raw)['fonts'][0];lic=ROOT/r['license']
 if lic.is_symlink() or not lic.is_file() or hashlib.sha256(lic.read_bytes()).hexdigest()!=r['licenseSHA256']:raise ValueError('license identity')
 with urllib.request.urlopen(r['url'],timeout=30) as response:data=response.read(r['bytes']+1)
 if len(data)!=r['bytes'] or hashlib.sha256(data).hexdigest()!=r['sha256'] or hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()!=r['gitBlob']:raise ValueError('public font identity')
 out.mkdir();(out/r['file']).write_bytes(data)
 print(json.dumps({'file':r['file'],'bytes':len(data),'sha256':r['sha256'],'gitBlob':r['gitBlob'],'unmodified':True}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--output',required=True);run(p.parse_args().output)
