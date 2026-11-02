"""Deterministic fixed text-only projection. No recursive font/assets collection."""
import hashlib,json,pathlib,stat,sys,zipfile
ROOT=pathlib.Path(__file__).absolute().parent
FILES=['CONTRACT.md', 'CREDITS.md', 'DESIGN-GUIDE.md', 'INDEX.md', 'LICENSE', 'NON-DUPLICATION.md', 'README.md', 'SOURCES.json', 'candidate-manifest.json', 'data.mjs', 'examples/compositions.mjs', 'examples/input-lock.json', 'examples/prepare-inputs.py', 'examples/render.mjs', 'examples/runtime.mjs', 'index.mjs', 'io-tests.py', 'licenses/Canvas-MIT.txt', 'licenses/InstrumentSans-OFL.txt', 'package-lock.json', 'package.json', 'package.py', 'resource-tests.mjs', 'test-native.mjs', 'test.mjs']
def check(p,kind):
 for q in [p,*p.parents]:
  try:s=q.lstat()
  except FileNotFoundError:continue
  if stat.S_ISLNK(s.st_mode):raise ValueError('symbolic component')
 s=p.lstat()
 if not (stat.S_ISREG(s.st_mode) if kind=='file' else stat.S_ISDIR(s.st_mode)):raise ValueError('regular input required')
def build(raw):
 p=pathlib.Path(raw)
 if not p.is_absolute() or raw!=str(p) or any(v in ('.','..') for v in raw.split('/')):raise ValueError('absolute normalized output')
 for q in [p,*p.parents]:
  try:s=q.lstat()
  except FileNotFoundError:continue
  if stat.S_ISLNK(s.st_mode):raise ValueError('symbolic component')
 if p.exists() or p==ROOT or ROOT in p.parents:raise ValueError('absent external output')
 check(p.parent,'dir')
 for name in FILES:check(ROOT/name,'file')
 payload=[(name,(ROOT/name).read_bytes()) for name in FILES]
 for name,b in payload:b.decode('utf8')
 p.mkdir()
 with zipfile.ZipFile(p/'text-candidates.zip','x',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for name,b in payload:
   info=zipfile.ZipInfo(name,(2026,11,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,b)
 (p/'members.json').write_text(json.dumps([{'path':name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()} for name,b in payload],indent=2)+'\n')
 return len(payload)
if __name__=='__main__':print(json.dumps({'files':build(sys.argv[1])}))
