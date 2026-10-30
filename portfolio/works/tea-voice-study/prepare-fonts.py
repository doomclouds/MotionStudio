"""Prepare licensed, externally provided fonts offline; no download or fallback."""
from pathlib import Path
import argparse,hashlib,json
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
import fontTools
parser=argparse.ArgumentParser();parser.add_argument('--font-dir',type=Path,required=True);root=parser.parse_args().font_dir.resolve();here=Path(__file__).resolve().parent
spec=json.loads((here/'font-inputs.json').read_text());manifest=[]
if fontTools.__version__ != '4.61.1':raise SystemExit('Use fonttools==4.61.1 for the recorded preparation contract')
# Validate all original inputs before creating any output.
for item in spec['inputs']:
 f=root/item['file']
 if not f.is_file() or hashlib.sha256(f.read_bytes()).hexdigest()!=item['sha256']:raise SystemExit('Missing or mismatched licensed input: '+item['file'])
chars=(here/'design/content.json').read_text()+''.join(chr(i) for i in range(32,127))
for item in spec['inputs']:
 for weight in item['weights']:
  name=item['prefix']+str(weight);f=TTFont(root/item['file'],recalcTimestamp=False);opts=subset.Options();opts.layout_features=['*'];s=subset.Subsetter(options=opts);s.populate(text=chars);s.subset(f);instantiateVariableFont(f,{'wght':weight},inplace=True)
  for n in f['name'].names:
   if n.nameID in [1,2,3,4,6,16,17]:n.string=('Regular' if n.nameID in [2,17] else name).encode(n.getEncoding())
  target=root/(name+'.ttf');f.save(target);manifest.append({'source':item['file'],'source_sha256':item['sha256'],'output':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'weight':weight,'renamed':True})
(root/'tea-font-manifest.json').write_text(json.dumps(manifest,indent=2))
print('Prepared',len(manifest),'derived fonts into supplied external directory')
