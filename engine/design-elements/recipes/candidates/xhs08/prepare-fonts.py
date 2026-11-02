from pathlib import Path
import sys,json,hashlib,fontTools
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
root=Path(__file__).resolve().parent
src=Path(sys.argv[1]);out=Path(sys.argv[2])
if not src.is_absolute() or not out.is_absolute():raise ValueError('absolute source/output required')
if out.is_symlink() or out.resolve()==root or root in out.resolve().parents:raise ValueError('output must be outside recipe package')
if out.exists() and any(out.iterdir()):raise ValueError('output must be new or empty')
j=json.loads((root/'font-lock.json').read_text());spec=j['fonts'][0]
if fontTools.version!=j['fontToolsVersion']:raise ValueError('fontTools version mismatch')
if hashlib.sha256(src.read_bytes()).hexdigest()!=spec['inputSha256']:raise ValueError('original font SHA mismatch')
f=TTFont(src,recalcTimestamp=False);o=subset.Options();o.name_IDs=['*'];sub=subset.Subsetter(options=o);sub.populate(unicodes=j['unicodes']);sub.subset(f);instantiateVariableFont(f,spec['axes'],inplace=True);f['head'].modified=spec['modified']
import io
b=io.BytesIO();f.save(b);data=b.getvalue()
if hashlib.sha256(data).hexdigest()!=spec['outputSha256']:raise ValueError('derived font SHA mismatch')
out.mkdir(parents=True,exist_ok=True);(out/spec['output']).write_bytes(data)
print('original and derived font SHA verified')
