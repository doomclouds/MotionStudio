#!/usr/bin/env python3
"""Explicit offline restoration from hash-locked original inputs; never downloads."""
from pathlib import Path
import argparse,json,hashlib,io,stat
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
ROOT=Path(__file__).resolve().parent

def repository():
 for p in [ROOT,*ROOT.parents]:
  if (p/'.git').exists():return p.resolve()
 raise ValueError('Run within the MotionStudio source checkout')
def external(path,*,new_output=False):
 p=Path(path)
 if not p.is_absolute():raise ValueError('Absolute external path required')
 # Inspect the lexical final component BEFORE resolve erases a dangling link.
 if new_output:
  try:mode=p.lstat().st_mode
  except FileNotFoundError:pass
  else:
   if stat.S_ISLNK(mode):raise ValueError('Output must not be a symlink, including dangling links')
   raise ValueError('Output must be a new external directory')
 p=p.resolve();repo=repository()
 if p==repo or p.is_relative_to(repo):raise ValueError('Path resolves inside repository')
 return p

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--case',required=True,choices=['data-chart','light-leak','bold-signal']);p.add_argument('--inputs',required=True);p.add_argument('--output',required=True);a=p.parse_args()
 src=external(a.inputs);out=external(a.output,new_output=True)
 if not src.is_dir():raise ValueError('Input directory missing')
 if out.exists() or out.is_symlink():raise ValueError('Output must be a new external directory')
 spec=json.loads((ROOT/'resources.json').read_text())[a.case];originals={}
 for x in spec['inputs']:
  f=src/x['file']
  if f.name!=x['file'] or f.is_symlink() or not f.is_file():raise ValueError('Regular named font input required')
  if f.stat().st_size!=x['bytes']:raise ValueError('Input size mismatch '+x['file'])
  b=f.read_bytes()
  if hashlib.sha256(b).hexdigest()!=x['sha256']:raise ValueError('Input SHA mismatch '+x['file'])
  originals[x['file']]=b
 outputs={}
 for x in spec['outputs']:
  f=TTFont(io.BytesIO(originals[x['sourceFile']]),recalcTimestamp=False);f.flavor=None
  if x['weight'] is not None:instantiateVariableFont(f,{'wght':x['weight']},inplace=True)
  if x['rename']:
   for n in f['name'].names:
    if n.nameID in (1,2,3,4,6,16,17):n.string=('Regular'if n.nameID in(2,17)else x['rename']).encode(n.getEncoding())
  if x['normalizedWeight'] is not None:f['OS/2'].usWeightClass=x['normalizedWeight']
  f.recalcTimestamp=False;b=io.BytesIO();f.save(b);b=b.getvalue()
  if hashlib.sha256(b).hexdigest()!=x['sha256']:raise ValueError('Derived font SHA mismatch '+x['file']+'; use pinned runtime, do not rewrite the lock')
  if list(f.getBestCmap())!=x['glyphs']:raise ValueError('Derived glyph map mismatch')
  outputs[x['file']]=b
 out.mkdir(parents=True)
 for name,b in outputs.items():
  with (out/name).open('xb')as f:f.write(b)
 print(json.dumps({'case':a.case,'fonts':len(outputs),'originalSHA':'PASS','derivedSHA':'PASS','networkUsed':False}))
if __name__=='__main__':main()
