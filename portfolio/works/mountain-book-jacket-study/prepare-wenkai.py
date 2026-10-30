from pathlib import Path
import argparse,json,hashlib
from fontTools.ttLib import TTFont
from fontTools import subset
p=argparse.ArgumentParser();p.add_argument('--font-dir',type=Path,required=True);root=p.parse_args().font_dir.resolve();base=Path(__file__).parent
m=json.loads((base/'font-inputs.json').read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for row in m['webfontDerived']:
 original=next(r for r in m['originalInputs']if r['filename']==row['source'])
 if sha(root/row['source'])!=original['sha256']:raise ValueError('Webfont input identity mismatch')
 f=TTFont(root/row['source']);f.flavor=None;o=subset.Options();s=subset.Subsetter(options=o);s.populate(text='山行二十八日');s.subset(f);name=row['name']
 for n in f['name'].names:
  if n.nameID in[1,2,3,4,6,16,17]:n.string=('Regular'if n.nameID in[2,17]else name).encode(n.getEncoding())
 f.recalcTimestamp=False;f['head'].modified=3400000000;out=root/(name+'.ttf');f.save(out)
 expected=next(r for r in m['expectedOutputs']if r['filename']==out.name)
 if sha(out)!=expected['sha256']:raise ValueError('Webfont derived identity mismatch: '+out.name)
print('Webfont source and derived identities verified')
