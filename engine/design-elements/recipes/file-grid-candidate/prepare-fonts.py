#!/usr/bin/env python3
"""MIT. Offline reproducible alias instances; validates all inputs before writes."""
import argparse,io,json,sys
import fontTools
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from font_support import ROOT,external,lock,digest,verified_inputs
def main():
 p=argparse.ArgumentParser();p.add_argument('--inputs',required=True);p.add_argument('--output',required=True);a=p.parse_args()
 out=external(a.output);inputs=external(a.inputs)
 if out.exists() and not out.is_dir():raise ValueError('output directory')
 expected=lock()
 if sys.version_info[:3]!=(3,12,14) or fontTools.__version__!=expected['fontTools']:raise ValueError('Python3.12.14/fontTools4.61.1 required')
 raw=verified_inputs(inputs);outputs={}
 for r in expected['derived']:
  f=TTFont(io.BytesIO(raw),recalcTimestamp=False);instantiateVariableFont(f,r['axes'],inplace=True)
  for n in f['name'].names:
   if n.nameID in (1,2,3,4,6,16,17,25):n.string=('Regular' if n.nameID in (2,17) else r['alias']).encode(n.getEncoding())
  f['OS/2'].usWeightClass=400;f['OS/2'].fsSelection=(f['OS/2'].fsSelection & ~33)|64;f['head'].macStyle=0;f.recalcTimestamp=False
  b=io.BytesIO();f.save(b);data=b.getvalue()
  if len(data)!=r['bytes'] or digest(data)!=r['sha256']:raise ValueError('derived font identity')
  outputs[r['file']]=data
 outputs['font-lock.json']=(ROOT/'font-lock.json').read_bytes()
 for name,b in outputs.items():
  target=out/name
  if target.is_symlink() or (target.exists() and (not target.is_file() or target.read_bytes()!=b)):raise ValueError('refuse changed derivative')
 out.mkdir(parents=True,exist_ok=True)
 for name,b in outputs.items():
  target=out/name
  if not target.exists():
   with target.open('xb') as f:f.write(b)
 print(json.dumps({'status':'PASS','network':False,'fonts':len(expected['derived']),'exactOutputs':len(outputs)}))
if __name__=='__main__':main()
