from pathlib import Path
import json,hashlib,argparse,fontTools
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
p=argparse.ArgumentParser();p.add_argument('--font-dir',required=True,type=Path);root=p.parse_args().font_dir;here=Path(__file__).resolve().parent
if fontTools.__version__!='4.61.1':raise SystemExit('Requires fontTools 4.61.1')
m=json.loads((here/'font-inputs.json').read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for row in m['originalInputs']:
 if sha(root/row['filename'])!=row['sha256']:raise ValueError('Original font mismatch: '+row['filename'])
chars=(here/'font-charset.txt').read_text()
for row in m['recipes']:
 f=TTFont(root/row['source'],recalcTimestamp=False)
 axes={a.axisTag:(row['weight'] if a.axisTag=='wght' else a.defaultValue) for a in f['fvar'].axes} if row['instantiateFirst'] else {'wght':row['weight']}
 if row['instantiateFirst']:instantiateVariableFont(f,axes,inplace=True)
 o=subset.Options();o.name_IDs=['*'];s=subset.Subsetter(options=o);s.populate(text=chars);s.subset(f)
 if not row['instantiateFirst']:instantiateVariableFont(f,axes,inplace=True)
 for n in f['name'].names:
  if n.nameID in [1,2,3,4,6,16,17]:n.string=('Regular' if n.nameID in [2,17] else 'MotionStudy'+row['filename'].removesuffix('.ttf')).encode(n.getEncoding())
 if row['legacyWeight400']:f['OS/2'].usWeightClass=400
 f.save(root/row['filename'])
for row in m['outputs']:
 if sha(root/row['filename'])!=row['sha256']:raise ValueError('Derived font mismatch: '+row['filename'])
print('External originals and derived font hashes verified')
