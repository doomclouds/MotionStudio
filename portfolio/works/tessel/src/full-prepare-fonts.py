#!/usr/bin/env python3
"""Rebuild the exact eleven renamed OFL static instances in a NEW directory."""
import argparse,json,hashlib,platform,shutil
from pathlib import Path
import fontTools,brotli
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
p=argparse.ArgumentParser();p.add_argument('--reference-root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
if a.output.exists():raise SystemExit('Use a new font directory; approved assets are never overwritten')
a.output.mkdir(parents=True);package=a.reference_root/'font-packages/geist-5.3.0/package';source=package/'files/geist-latin-wght-normal.woff2';sha=lambda x:hashlib.sha256(x.read_bytes()).hexdigest()
assert sha(source)=='19f9c92546aa300c312235e3125af1b81394d8db9a4bc4a425cd5b641d2d54e1','Wrong original font'
receipt={'source':str(source),'sourceSHA256':sha(source),'license':'SIL OFL1.1, Copyright2024 The Geist Project Authors; renamed derived family','python':platform.python_version(),'fontTools':fontTools.__version__,'brotli':brotli.__version__,'outputs':[]}
for weight in[400,450,460,480,500,540,560,580,600,620,650]:
 out=a.output/f'TesselGeist-{weight}.ttf';f=instantiateVariableFont(TTFont(source,recalcTimestamp=False),{'wght':weight},inplace=True);f.flavor=None
 for n in f['name'].names:
  if n.nameID in(1,4,6,16):n.string=f'TesselStudyGeist{weight}'.encode(n.getEncoding())
 f.save(out);receipt['outputs'].append({'weight':weight,'path':str(out),'sha256':sha(out)})
shutil.copyfile(package/'LICENSE',a.output/'LICENSE-Geist-OFL.txt');(a.output/'font-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
