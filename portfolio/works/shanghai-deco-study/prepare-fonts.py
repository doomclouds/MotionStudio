from pathlib import Path
import argparse,json,hashlib
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
p=argparse.ArgumentParser(description="Provide original NotoSansSC-variable.ttf plus case-specific fonts; writes renamed derived fonts only into the external directory.");p.add_argument('--font-dir',type=Path,required=True);root=p.parse_args().font_dir.resolve()
chars=(Path(__file__).parent/'font-charset.txt').read_text()
manifest=[]
def prepare(source,output,axes=None,text=None):
 f=TTFont(root/source)
 if axes:instantiateVariableFont(f,axes,inplace=True)
 if text is not None:
  o=subset.Options();o.name_IDs=['*'];s=subset.Subsetter(options=o);s.populate(text=text);s.subset(f)
 name='DecoStudy'+Path(output).stem.replace('-','')
 for n in f['name'].names:
  if not source.startswith('Noto') and n.nameID in [1,2,3,4,6,16,17]:n.string=('Regular' if n.nameID in [2,17] else name).encode(n.getEncoding())
 f.save(root/output);manifest.append({'source':source,'source_sha256':hashlib.sha256((root/source).read_bytes()).hexdigest(),'output':output,'sha256':hashlib.sha256((root/output).read_bytes()).hexdigest(),'familyRenamed':not source.startswith('Noto')})
for w in [500,700]:prepare('NotoSansSC-variable.ttf',f'Sans{w}.ttf',{'wght':w},chars)
prepare('NotoSerifSC-variable.ttf','Serif600.ttf',{'wght':600},chars)
prepare('ZCOOLXiaoWei-Regular.ttf','XiaoWei-subset.ttf',text='摩登焙香十一月')
(root/'font-manifest.json').write_text(json.dumps(manifest,indent=2))
