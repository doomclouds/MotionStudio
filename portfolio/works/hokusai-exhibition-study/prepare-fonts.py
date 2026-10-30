import sys,json,hashlib
from pathlib import Path
import fontTools
if fontTools.__version__ != "4.61.1":raise ValueError("fontTools 4.61.1 required")
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
root=Path(__file__).resolve().parent
source=Path(sys.argv[1]).resolve();target=Path(sys.argv[2]).resolve()
repo=root.parents[2]
if target==repo or repo in target.parents:raise ValueError('Font output must be external')
spec=json.loads((root/'font-preparation.json').read_text())
for r in spec:
 p=source/r['input']
 if hashlib.sha256(p.read_bytes()).hexdigest()!=r['inputSha256']:raise ValueError('Original font SHA mismatch')
target.mkdir(parents=True,exist_ok=True)
for r in spec:
 f=TTFont(source/r['input']);f=instantiateVariableFont(f,{'wght':r['weight']},inplace=False)
 o=subset.Options();o.name_IDs=['*'];sub=subset.Subsetter(options=o);sub.populate(text=(root/'font-charset.txt').read_text());sub.subset(f)
 name=Path(r['output']).stem
 for n in f['name'].names:
  if n.nameID in (1,2,4,6):n.string=(('Regular' if n.nameID==2 else name)).encode(n.getEncoding(),errors='replace')
 f.recalcTimestamp=False;f['head'].modified=r['modified']
 import io
 b=io.BytesIO();f.save(b);data=b.getvalue()
 if hashlib.sha256(data).hexdigest()!=r['outputSha256']:raise ValueError('Derived font SHA mismatch')
 out=target/r['output']
 if out.is_symlink():raise ValueError('Symlink output rejected')
 out.write_bytes(data)
print('Two original and derived font identities verified')
