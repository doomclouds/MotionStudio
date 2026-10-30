from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
import argparse,json,hashlib
p=argparse.ArgumentParser();p.add_argument('--font-dir',type=Path,required=True);root=p.parse_args().font_dir.resolve()
metadata=json.loads((Path(__file__).parent/'font-inputs.json').read_text())
for row in metadata['originalInputs']:
 source=root/row['filename']
 if not source.is_file() or hashlib.sha256(source.read_bytes()).hexdigest()!=row['sha256']:raise ValueError('Missing or mismatched original font: '+row['filename'])
text=(Path(__file__).parent/'font-charset.txt').read_text();manifest=[]
for source,name,w in [('NotoSansSC-variable.ttf', 'PairSans500', 500), ('NotoSansSC-variable.ttf', 'PairSans550', 550), ('NotoSansSC-variable.ttf', 'PairSans900', 900), ('NotoSerifSC-variable.ttf', 'PairSerif450', 450)]:
 f=TTFont(root/source);o=subset.Options();o.layout_features=['*'];s=subset.Subsetter(options=o);s.populate(text=text);s.subset(f);instantiateVariableFont(f,{'wght':w},inplace=True)
 for n in f['name'].names:
  if n.nameID in [1,2,3,4,6,16,17]:n.string=('Regular' if n.nameID in [2,17] else name).encode(n.getEncoding())
 f.save(root/(name+'.ttf'));manifest.append({'source':source,'output':name+'.ttf','sha256':hashlib.sha256((root/(name+'.ttf')).read_bytes()).hexdigest(),'familyRenamed':True})
(root/'font-manifest.json').write_text(json.dumps(manifest,indent=2))
