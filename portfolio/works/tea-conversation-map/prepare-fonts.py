"""Offline font preparation; validates all inputs before producing renamed subsets."""
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
chars=(here/'font-charset.txt').read_text();a.output_dir.mkdir(parents=True,exist_ok=True);manifest=[]
for item in spec['inputs']:
 for weight in item['weights']:
  f=TTFont(a.source_dir/item['file'],recalcTimestamp=False);f.flavor=None;opt=subset.Options();opt.layout_features=['*'];ss=subset.Subsetter(options=opt);ss.populate(text=chars);ss.subset(f)
  if 'fvar' in f:instantiateVariableFont(f,{ax.axisTag:(weight if ax.axisTag=='wght' else ax.defaultValue) for ax in f['fvar'].axes},inplace=True)
  name=item['prefix']+str(weight)
  for n in f['name'].names:
   if n.nameID in [1,2,3,4,6,16,17]:n.string=('Regular' if n.nameID in [2,17] else name).encode(n.getEncoding())
  f['OS/2'].usWeightClass=400;target=a.output_dir/(name+'.ttf');f.save(target);manifest.append({'output':target.name,'sha256':sha(target),'weight':weight,'source':item['file'],'source_sha256':item['sha256']})
(a.output_dir/'fonts.prepared.json').write_text(json.dumps({'fonts':manifest},indent=2))
print('Prepared',len(manifest),'fonts; runtime checks fonts.lock.json before use')
