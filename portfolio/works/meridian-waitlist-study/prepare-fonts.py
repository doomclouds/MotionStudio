from pathlib import Path
import sys,json,hashlib,io,fontTools
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
root=Path(__file__).resolve().parent;src=Path(sys.argv[1]);out=Path(sys.argv[2]);boundary=root
for candidate in [root,*root.parents]:
 if (candidate/'.git').exists() or (candidate/'portfolio/works').is_dir():boundary=candidate;break
if not src.is_absolute() or not out.is_absolute():raise ValueError('absolute directories required')
for target in [src,out]:
 if target.is_symlink() or target.resolve()==boundary or boundary in target.resolve().parents:raise ValueError('input/output must be outside repository (or standalone work)')
if out.exists() and any(out.iterdir()):raise ValueError('output must be new or empty')
spec=json.loads((root/'font-preparation.json').read_text())
if fontTools.version!=spec['fontTools']:raise ValueError('fontTools version mismatch')
prepared=[]
for row in spec['fonts']:
 p=src/row['input'];data=p.read_bytes()
 if hashlib.sha256(data).hexdigest()!=row['inputSHA256']:raise ValueError('original SHA mismatch')
 if row['axes'] is not None:
  f=TTFont(p,recalcTimestamp=False);instantiateVariableFont(f,row['axes'],inplace=True);f.recalcTimestamp=False;f['head'].modified=row['modified'];buf=io.BytesIO();f.save(buf);data=buf.getvalue()
 if hashlib.sha256(data).hexdigest()!=row['outputSHA256']:raise ValueError('derived SHA mismatch '+row['output'])
 prepared.append((row['output'],data))
out.mkdir(parents=True,exist_ok=True)
for name,data in prepared:(out/name).write_bytes(data)
print('all original and derived SHA checks passed')
