"""Derive a pinned licensed text font outside the source package; never rewrite the lock."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
from io import BytesIO
import fontTools,os,json,hashlib
r=Path(__file__).resolve().parent;lock=json.loads((r/'font-lock.json').read_text())
source=Path(os.environ['B06_FONT_FILE']);target=Path(os.environ['B06_TEXT_FONT_FILE'])
if not source.is_absolute() or not target.is_absolute():raise ValueError('absolute source/derived paths required')
target=target.resolve()
if target==r or r in target.parents:raise ValueError('derived font must be outside source package')
if hashlib.sha256(source.read_bytes()).hexdigest()!=lock['sourceSha256']:raise ValueError('source font SHA256 mismatch')
if fontTools.__version__!=lock['fontToolsVersion']:raise ValueError('fontTools version mismatch; expected '+lock['fontToolsVersion'])
if target.exists():
 if hashlib.sha256(target.read_bytes()).hexdigest()!=lock['derivedSha256']:raise ValueError('existing derived font SHA256 mismatch; will not overwrite')
 print('Pinned derived font already exists; unchanged');raise SystemExit(0)
s=''.join(p.read_text()for d in ['recipes','examples']for p in sorted((r/d).glob('*.mjs')))+''.join(chr(n)for n in range(32,127))
f=TTFont(source);ss=subset.Subsetter();ss.populate(text=s);ss.subset(f);instantiateVariableFont(f,{'wght':600},inplace=True)
for n in f['name'].names:
 if n.nameID in [1,2,3,4,6,16,17]:n.string=('Regular'if n.nameID in[2,17]else'B06Text600').encode(n.getEncoding())
f.recalcTimestamp=False;f['head'].modified=3400000000;stream=BytesIO();f.save(stream);data=stream.getvalue()
if hashlib.sha256(data).hexdigest()!=lock['derivedSha256']:raise ValueError('derived font SHA256 mismatch; no output written')
target.parent.mkdir(parents=True,exist_ok=True)
with target.open('xb') as out:out.write(data)
print('Pinned derived font created outside package')
