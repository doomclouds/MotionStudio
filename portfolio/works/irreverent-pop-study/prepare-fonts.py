"""Offline font preparation, originals and derived outputs both hash-checked."""
from pathlib import Path
import argparse,json,hashlib,fontTools
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
p=argparse.ArgumentParser();p.add_argument('--source-dir',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);a=p.parse_args();here=Path(__file__).resolve().parent
if fontTools.__version__!='4.61.1':raise SystemExit('Requires fonttools==4.61.1')
spec=json.loads((here/'font-inputs.json').read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for item in spec['inputs']:
 f=a.source_dir/item['file']
 if not f.is_file() or sha(f)!=item['sha256']:raise SystemExit('Missing or mismatched source font: '+item['file'])
chars=(here/'font-charset.txt').read_text();a.output_dir.mkdir(parents=True,exist_ok=True)
for item in spec['inputs']:
 for weight in item['weights']:
  f=TTFont(a.source_dir/item['file'],recalcTimestamp=False);instantiateVariableFont(f,{ax.axisTag:(weight if ax.axisTag=='wght' else ax.defaultValue) for ax in f['fvar'].axes},inplace=True)
  opt=subset.Options();opt.name_IDs=['*'];ss=subset.Subsetter(options=opt);ss.populate(text=chars);ss.subset(f)
  name=item['prefix']+str(weight)
  for n in f['name'].names:
   if n.nameID in [1,2,3,4,6,16,17]:n.string=('Regular' if n.nameID in [2,17] else name).encode(n.getEncoding())
  f['OS/2'].usWeightClass=400;f.save(a.output_dir/(name+'.ttf'))
for f in json.loads((here/'fonts.lock.json').read_text())['fonts']:
 if sha(a.output_dir/f['output'])!=f['sha256']:raise SystemExit('Derived font mismatch: '+f['output'])
print('Prepared and verified 4 external fonts')
