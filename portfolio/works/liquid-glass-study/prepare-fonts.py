"""Prepare externally supplied, licensed fonts. No downloading and no repository writes."""
import argparse,hashlib,json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
p=argparse.ArgumentParser();p.add_argument('--source-dir',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);args=p.parse_args();here=Path(__file__).resolve().parent;source=args.source_dir.resolve();out=args.output_dir.resolve()
if out==here or here in out.parents:raise SystemExit('Font output must remain outside this source project')
inputs=json.loads((here/'font-inputs.json').read_text());chars=json.loads((here/'font-subset.json').read_text())['characters']+(here/'design/content.json').read_text();out.mkdir(parents=True,exist_ok=True);manifest=[]
for row in inputs['source_fonts']:
 fpath=source/row['file'];raw=fpath.read_bytes()
 if hashlib.sha256(raw).hexdigest()!=row['sha256']:raise SystemExit('Source SHA mismatch: '+row['file'])
 if not row['weights']:
  (out/row['file']).write_bytes(raw);manifest.append({'file':row['file'],'sha256':row['sha256'],'modified':False});continue
 for weight in row['weights']:
  f=TTFont(fpath,recalcTimestamp=False);s=subset.Subsetter();s.populate(text=chars);s.subset(f);axes={axis.axisTag:axis.defaultValue for axis in f['fvar'].axes};axes['wght']=weight;instantiateVariableFont(f,axes,inplace=True);name=row['prefix']+str(weight)
  for n in f['name'].names:
   if n.nameID in [1,2,3,4,6,16,17]:n.string=('Regular' if n.nameID in [2,17] else name).encode(n.getEncoding())
  result=out/(name+'.ttf');f.save(result);manifest.append({'file':result.name,'sha256':hashlib.sha256(result.read_bytes()).hexdigest(),'modified':True,'weight':weight,'source_sha256':row['sha256']})
(out/'font-manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'status':'prepared','count':len(manifest)},indent=2))
