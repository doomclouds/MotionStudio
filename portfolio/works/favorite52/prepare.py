#!/usr/bin/env python3
"""Restore exact, user-supplied resources outside Git. No network or license inference."""
from pathlib import Path
import argparse,hashlib,json,os,sys,tempfile,zipfile
HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
LOCK=json.loads((HERE/'resources.lock.json').read_text())
class Bad(RuntimeError):pass

def sha_file(p):
 h=hashlib.sha256()
 with Path(p).open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()

def regular_path(p):
 p=Path(os.path.abspath(os.fspath(p)))
 for q in (p,*p.parents):
  if q.is_symlink():raise Bad('Symlink path component refused: '+str(q))
 return p

def inside(p,root):
 p=regular_path(p);root=regular_path(root)
 if p.resolve()!=root.resolve() and root.resolve() not in p.resolve().parents:raise Bad('Path outside authorized directory: '+str(p))
 return p

def external(p):
 p=regular_path(p)
 if p==REPO or REPO in p.parents or p in REPO.parents:raise Bad('Resources/output must be outside the source repository')
 return p

def verify(p,row,root):
 p=inside(p,root)
 if not p.is_file():raise Bad('MISSING '+row['path']+'; expected SHA256 '+row['sha256']+'; source '+row['source_url']+'; supply your authorized exact file, no substitute/download is automatic')
 if p.stat().st_size!=row['bytes'] or sha_file(p)!=row['sha256']:raise Bad('HASH/SIZE MISMATCH '+row['path']+'; expected SHA256 '+row['sha256'])
 return p

def check(cache):
 cache=external(cache);errors=[]
 for row in LOCK['assets']:
  try:verify(cache/row['path'],row,cache)
  except Bad as e:errors.append(str(e))
 if errors:raise Bad('\n'.join(errors))
 return cache

def put(p,b,row,cache):
 p=inside(p,cache)
 if len(b)!=row['bytes'] or hashlib.sha256(b).hexdigest()!=row['sha256']:raise Bad('Input identity mismatch: '+row['path'])
 if p.exists():verify(p,row,cache);return
 p.parent.mkdir(parents=True,exist_ok=True);inside(p,cache)
 fd,tmp=tempfile.mkstemp(prefix='.prepare-',dir=p.parent)
 try:
  with os.fdopen(fd,'wb') as f:f.write(b)
  os.replace(tmp,p)
 finally:
  if os.path.exists(tmp):os.unlink(tmp)

def prepare(cache,seed=None,recovery=None):
 cache=external(cache)
 if seed is not None and recovery is not None:raise Bad('Choose --seed-assets OR --recovery-zip')
 seed=regular_path(seed) if seed is not None else None
 if recovery is not None:
  recovery=regular_path(recovery)
  if not recovery.is_file() or sha_file(recovery)!=LOCK['recovery_archive']['sha256']:raise Bad('Recovery ZIP SHA256 mismatch; no entries read or extracted')
 # Preflight every input and target before writing any resource.
 for notice in (HERE/'LICENSES').glob('*.txt'):inside(cache/'LICENSES'/notice.name,cache)
 missing=[];archive=zipfile.ZipFile(recovery) if recovery is not None else None
 try:
  for row in LOCK['assets']:
   target=inside(cache/row['path'],cache)
   if target.exists():verify(target,row,cache);continue
   if seed is not None:
    try:verify(seed/row['path'],row,seed)
    except Bad as e:missing.append(str(e))
   elif archive is not None:
    name=LOCK['recovery_archive']['prefix']+row['path'];infos=[i for i in archive.infolist() if i.filename==name]
    if len(infos)!=1 or infos[0].file_size!=row['bytes'] or infos[0].is_dir() or (infos[0].external_attr>>16)&0o170000==0o120000:raise Bad('Unexpected recovery ZIP member: '+row['path'])
    if hashlib.sha256(archive.read(infos[0])).hexdigest()!=row['sha256']:raise Bad('Recovery member identity mismatch: '+row['path'])
   else:
    try:verify(target,row,cache)
    except Bad as e:missing.append(str(e))
  if missing:raise Bad('\n'.join(missing))
  cache.mkdir(parents=True,exist_ok=True)
  for row in LOCK['assets']:
   target=inside(cache/row['path'],cache)
   if target.exists():continue
   b=verify(seed/row['path'],row,seed).read_bytes() if seed is not None else archive.read(LOCK['recovery_archive']['prefix']+row['path'])
   put(target,b,row,cache)
  notices=inside(cache/'LICENSES',cache);notices.mkdir(exist_ok=True)
  for p in (HERE/'LICENSES').glob('*.txt'):
   target=inside(notices/p.name,cache);b=p.read_bytes()
   put(target,b,{'path':'LICENSES/'+p.name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()},cache)
  check(cache)
 finally:
  if archive is not None:archive.close()
 return {'status':'prepared','resource_count':len(LOCK['assets']),'source':'user-supplied; no permission inferred','cache':str(cache)}

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--cache',type=Path,required=True);g=p.add_mutually_exclusive_group();g.add_argument('--seed-assets',type=Path);g.add_argument('--recovery-zip',type=Path);a=p.parse_args()
 try:print(json.dumps(prepare(a.cache,a.seed_assets,a.recovery_zip)))
 except (Bad,OSError,zipfile.BadZipFile) as e:p.exit(1,str(e)+'\n')
