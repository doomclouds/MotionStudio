from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
from pathlib import Path
import json,hashlib,argparse
parser=argparse.ArgumentParser();parser.add_argument('--font-dir',type=Path,required=True);root=parser.parse_args().font_dir.resolve()
chars=(Path(__file__).parent/'design/content.json').read_text()+''.join(chr(i) for i in range(32,127))+'№¥面'
manifest=[]
for source,name,weight in [('NotoSerifSC-variable.ttf','VinylSerif900',900),('NotoSerifSC-variable.ttf','VinylSerif700',700),('NotoSansSC-variable.ttf','VinylSans500',500),('NotoSansSC-variable.ttf','VinylSans600',600),('NotoSansSC-variable.ttf','VinylSans700',700),('NotoSansSC-variable.ttf','VinylSans900',900)]:
 f=TTFont(root/source); options=subset.Options();options.layout_features=['*'];s=subset.Subsetter(options=options);s.populate(text=chars);s.subset(f);instantiateVariableFont(f,{'wght':weight},inplace=True)
 for n in f['name'].names:
  if n.nameID in [1,2,3,4,6,16,17]:n.string=('Regular' if n.nameID in [2,17] else name).encode(n.getEncoding())
 f.save(root/(name+'.ttf'));manifest.append({'source':source,'source_sha256':hashlib.sha256((root/source).read_bytes()).hexdigest(),'output':name+'.ttf','weight':weight,'subset':True,'familyRenamed':True})
(root/'font-manifest.json').write_text(json.dumps(manifest,indent=2))
