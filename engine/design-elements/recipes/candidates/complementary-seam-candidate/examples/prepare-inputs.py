"""Copy exact existing repository helper + licensed full font to a fresh external input folder."""
import hashlib,json,pathlib,stat,sys
ROOT=pathlib.Path(__file__).absolute().parent.parent
LOCK_SHA='d3664a8c9ca957b12228f63367381df4c7e7feee6ee1203518dc7e1105bea729'
def checked(raw,kind='file',fresh=False):
 p=pathlib.Path(raw)
 if not p.is_absolute() or raw!=str(p) or any(x in ('.','..') for x in raw.split('/')):raise ValueError('absolute normalized path')
 for q in [p,*p.parents]:
  try:s=q.lstat()
  except FileNotFoundError:continue
  if stat.S_ISLNK(s.st_mode):raise ValueError('symlink')
 if fresh:
  if p.exists() or p==ROOT or ROOT in p.parents:raise ValueError('absent external output')
  checked(str(p.parent),'dir')
 else:
  s=p.lstat()
  if not (stat.S_ISREG(s.st_mode) if kind=='file' else stat.S_ISDIR(s.st_mode)):raise ValueError('regular input')
 return p
# Refuse logical source aliases before interpreting any supplied path.
checked(str(pathlib.Path(__file__).absolute()))
checked(str(ROOT),'dir')
repo=checked(sys.argv[1],'dir');font=checked(sys.argv[2]);out=checked(sys.argv[3],fresh=True)
b=(ROOT/'examples/input-lock.json').read_bytes()
if hashlib.sha256(b).hexdigest()!=LOCK_SHA:raise ValueError('complete fixed input lock')
payload=[]
for r in json.loads(b):
 f=font if r['path']=='InstrumentSans.ttf' else checked(str(repo/'engine/design-elements/recipes/candidates/sampled-window-dialogue-candidate/lib'/pathlib.Path(r['path']).name))
 data=f.read_bytes()
 if len(data)!=r['bytes'] or hashlib.sha256(data).hexdigest()!=r['sha256']:raise ValueError('exact input '+r['path'])
 payload.append((r['path'],data))
out.mkdir()
for name,data in payload:
 p=out/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
print(json.dumps({'files':len(payload),'output':str(out)}))
