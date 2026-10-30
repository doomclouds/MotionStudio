from pathlib import Path
import argparse,json,hashlib
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
p=argparse.ArgumentParser();p.add_argument('--font-dir',type=Path,required=True);root=p.parse_args().font_dir.resolve();here=Path(__file__).parent
m=json.loads((here/'font-inputs.json').read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for row in m['originalInputs']:
 f=root/row['filename']
 if not f.is_file() or sha(f)!=row['sha256']:raise ValueError('Missing/mismatched original font: '+row['filename'])
text=(here/'font-charset.txt').read_text()
for source,out,w,sub in m['recipes']:
 if w is None:continue
 f=TTFont(root/source,recalcTimestamp=False);instantiateVariableFont(f,{'wght':w},inplace=True)
 if sub:
  o=subset.Options();o.name_IDs=['*'];s=subset.Subsetter(options=o);s.populate(text=text);s.subset(f)
 name='MotionStudy'+out.removesuffix('.ttf')
 for n in f['name'].names:
  if n.nameID in [1,2,3,4,6,16,17]:n.string=('Regular' if n.nameID in [2,17] else name).encode(n.getEncoding())
 f.save(root/out)
for row in m['outputs']:
 if sha(root/row['filename'])!=row['sha256']:raise ValueError('Derived font mismatch: '+row['filename'])
print('Prepared and verified external fonts')
