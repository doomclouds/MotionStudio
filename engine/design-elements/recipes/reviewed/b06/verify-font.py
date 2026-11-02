from pathlib import Path
from fontTools.ttLib import TTFont
import os,json,hashlib
r=Path(__file__).resolve().parent;lock=json.loads((r/'font-lock.json').read_text());out=Path(os.environ['B06_EVIDENCE_DIR'])
if not out.is_absolute() or r==out.resolve() or r in out.resolve().parents:raise ValueError('external absolute evidence directory required')
source=Path(os.environ['B06_FONT_FILE']);bodyFile=Path(os.environ['B06_TEXT_FONT_FILE'])
for f,key in [(source,'sourceSha256'),(bodyFile,'derivedSha256')]:
 if hashlib.sha256(f.read_bytes()).hexdigest()!=lock[key]:raise ValueError('font SHA256 mismatch')
s=''.join(p.read_text()for d in ['recipes','examples']for p in(r/d).glob('*.mjs'));chars=sorted({c for c in s if '\u3400'<=c<='\u9fff'})
cmap=TTFont(source).getBestCmap();body=TTFont(bodyFile).getBestCmap();missing=[c for c in chars if ord(c)not in cmap or ord(c)not in body]
if missing:raise ValueError(missing)
with(out/'font-coverage.json').open('x')as f:json.dump({'characters':len(chars),'missing':missing,'status':'PASS','sourceSha256':lock['sourceSha256'],'derivedSha256':lock['derivedSha256']},f,ensure_ascii=False,indent=2)
