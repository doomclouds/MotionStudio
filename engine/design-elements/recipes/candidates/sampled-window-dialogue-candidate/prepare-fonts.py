"""Reproducible full OFL font preparation. Never executes upstream code."""
import argparse,hashlib,json
from pathlib import Path
from io import BytesIO
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
ROOT=Path(__file__).resolve().parent
EXPECTED={'OpenSans[wdth,wght].ttf': '36643644f318a812aab2d2ed3bb98f8cf0872527f835fe9398d95fe6b9adb878'}
SPECS=[('OpenSans[wdth,wght].ttf', 'ComposeRegular', {'wght': 400, 'wdth': 100}), ('OpenSans[wdth,wght].ttf', 'ComposeSemibold', {'wght': 600, 'wdth': 100}), ('OpenSans[wdth,wght].ttf', 'ComposeBold', {'wght': 700, 'wdth': 100})]
def checked(raw,new=False):
 if not raw.startswith('/') or {'.','..'}&set(raw.split('/')):raise ValueError('absolute canonical path')
 p=Path(raw)
 for q in (p,*p.parents):
  if q.is_symlink():raise ValueError('symbolic link rejected')
 if new:
  if p.exists() or not p.parent.is_dir():raise ValueError('fresh output with existing parent')
 elif not p.is_dir():raise ValueError('input directory')
 return p

def main():
 a=argparse.ArgumentParser();a.add_argument('--input',required=True);a.add_argument('--output',required=True);opts=a.parse_args();src=checked(opts.input);dest=checked(opts.output,True)
 for name,digest in EXPECTED.items():
  q=src/name
  if q.is_symlink() or not q.is_file() or hashlib.sha256(q.read_bytes()).hexdigest()!=digest:raise ValueError('source font identity')
 records=[];outputs={}
 for name,alias,axes in SPECS:
  original=TTFont(src/name,recalcTimestamp=False);font=instantiateVariableFont(original,axes,inplace=False,optimize=True);font.flavor=None
  font['OS/2'].usWeightClass=400; font['OS/2'].fsSelection=(font['OS/2'].fsSelection&~33)|64;font['head'].macStyle=0
  for nr in font['name'].names:
   if nr.nameID in (1,2,3,4,6,16,17,25):nr.string=('Regular' if nr.nameID in (2,17) else alias).encode(nr.getEncoding())
  if not all(code in font.getBestCmap() for code in range(32,127)):raise ValueError('ASCII font coverage')
  stream=BytesIO();font.save(stream);raw=stream.getvalue();outputs[alias+'.ttf']=raw;records.append({'path':alias+'.ttf','alias':alias,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'axes':axes,'source':name,'sourceSHA256':EXPECTED[name],'metadataWeight':400})
 outputs['font-lock.json']=(json.dumps({'fonts':records,'boundary':'Full OFL Open Sans400/600/700 wdth100. Public-recoverable example fonts; core engines only accept injected families. Regular aliases preserve real instance outlines, copyright/OFL/nameID25.'},indent=2)+'\n').encode();dest.mkdir()
 for n,b in outputs.items():(dest/n).write_bytes(b)
if __name__=='__main__':main()
