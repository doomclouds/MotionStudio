"""Fetch one fixed public OFL font into an absent external directory; no fallback."""
import hashlib,json,pathlib,stat,sys,urllib.request
ROOT=pathlib.Path(__file__).absolute().parent.parent
URL='https://raw.githubusercontent.com/google/fonts/6c1dbe27dcf7d817d4b62cec033ba77fa8e2a5ec/ofl/instrumentsans/InstrumentSans%5Bwdth,wght%5D.ttf'
def check(p):
 for q in [p,*p.parents]:
  try:s=q.lstat()
  except FileNotFoundError:continue
  if stat.S_ISLNK(s.st_mode):raise ValueError('symbolic path')
raw=sys.argv[1];p=pathlib.Path(raw)
if not p.is_absolute() or raw!=str(p) or any(v in ('.','..') for v in raw.split('/')):raise ValueError('absolute normalized output')
check(p)
if p.exists() or not p.parent.is_dir() or p==ROOT or ROOT in p.parents:raise ValueError('absent external output')
b=urllib.request.urlopen(URL,timeout=60).read()
if len(b)!=194336 or hashlib.sha256(b).hexdigest()!='b24f1812584816958afcf22e22d08e44318c5e51651e25d2438efdde389b33b1':raise ValueError('fixed font mismatch')
p.mkdir();(p/'InstrumentSans.ttf').write_bytes(b);print(json.dumps({'font':str(p/'InstrumentSans.ttf'),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}))
