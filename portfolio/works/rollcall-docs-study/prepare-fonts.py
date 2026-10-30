from pathlib import Path
import argparse,json,hashlib
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
p=argparse.ArgumentParser();p.add_argument('--font-dir',required=True,type=Path);root=p.parse_args().font_dir;here=Path(__file__).parent
m=json.loads((here/'font-inputs.json').read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for row in m['originalInputs']:
 if sha(root/row['filename'])!=row['sha256']:raise ValueError('Original font mismatch: '+row['filename'])
for row in m['recipes']:
 f=TTFont(root/row['source'],recalcTimestamp=False)
 if row['codepoints'] is not None:
  o=subset.Options();o.name_IDs=['*'];s=subset.Subsetter(options=o);s.populate(unicodes=row['codepoints']);s.subset(f)
 instantiateVariableFont(f,row['axes'],inplace=True)
 for n in f['name'].names:
  if n.nameID in [1,2,3,4,6,16,17]:n.string=('Regular' if n.nameID in [2,17] else 'MotionStudy'+row['filename'].removesuffix('.ttf')).encode(n.getEncoding())
 f.save(root/row['filename'])
for row in m['outputs']:
 if sha(root/row['filename'])!=row['sha256']:raise ValueError('Derived font mismatch: '+row['filename'])
print('External font originals and derived outputs verified')
