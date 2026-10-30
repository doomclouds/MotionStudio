from pathlib import Path
import argparse,json,hashlib
p=argparse.ArgumentParser();p.add_argument('--font-dir',type=Path,required=True);root=p.parse_args().font_dir.resolve();base=Path(__file__).parent
m=json.loads((base/'font-inputs.json').read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for row in m['originalInputs']:
 f=root/row['filename']
 if not f.is_file() or sha(f)!=row['sha256']:raise ValueError('Missing or mismatched original font: '+row['filename'])
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
text=(base/'font-charset.txt').read_text()
for row in m['derived']:
 name=row['name'];f=TTFont(root/row['source']);o=subset.Options();o.layout_features=['*'];s=subset.Subsetter(options=o);s.populate(text=text);s.subset(f);
 if 'fvar'in f:
  axes={a.axisTag:a.defaultValue for a in f['fvar'].axes};axes['wght']=row['weight'];instantiateVariableFont(f,axes,inplace=True)
 for n in f['name'].names:
  if n.nameID in [1,2,3,4,6,16,17]:n.string=('Regular' if n.nameID in [2,17] else name).encode(n.getEncoding())
 f.recalcTimestamp=False;f['head'].modified=3400000000;f.save(root/(name+'.ttf'))
if not m['expectedOutputs'] or {r['filename']for r in m['expectedOutputs']}!=set(m['outputNames']):raise ValueError('Incomplete output identity contract')
for row in m['expectedOutputs']:
 if sha(root/row['filename'])!=row['sha256']:raise ValueError('Derived/output font identity mismatch: '+row['filename'])
print('Original and output font identities verified')
