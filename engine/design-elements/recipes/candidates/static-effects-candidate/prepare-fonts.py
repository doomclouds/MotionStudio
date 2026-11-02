"""Explicit external OFL resource preparation. No code install, fonts/media in source, or silent fallback."""
from pathlib import Path
from io import BytesIO
import argparse,hashlib,json,urllib.request,sys
import fontTools
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
ROOT=Path(__file__).resolve().parent
REPO=next(p for p in ROOT.parents if (p/'engine').is_dir() and (p/'portfolio').is_dir())
def external(value):
 p=Path(value)
 if not p.is_absolute():raise ValueError('Absolute external directory required')
 p=p.resolve()
 if p==REPO or REPO in p.parents:raise ValueError('Directory must resolve outside entire repository')
 return p
def regular(p):
 if p.is_symlink() or not p.is_file():raise ValueError('Regular non-symlink resource required: '+p.name)
 return p.read_bytes()
def digest(b):return hashlib.sha256(b).hexdigest()
def write_once(p,b):
 if p.is_symlink():raise ValueError('Refusing symlink output')
 if p.exists():
  if not p.is_file() or p.read_bytes()!=b:raise ValueError('Refusing changed existing output: '+p.name)
  return
 with p.open('xb') as f:f.write(b)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--input-dir',required=True);ap.add_argument('--out',required=True);ap.add_argument('--fetch',action='store_true',help='Explicitly fetch only hash-locked official font URLs when absent');args=ap.parse_args()
 source=external(args.input_dir);dest=external(args.out)
 if fontTools.__version__!='4.57.0':raise ValueError('Verified preparation requires FontTools4.57.0; expected output hashes remain authoritative')
 manifest=json.loads((ROOT/'font-inputs.json').read_text());locks=json.loads((ROOT/'font-lock.json').read_text());inputs={}
 for row in manifest['sources']:
  p=source/row['file']
  if not p.exists() and not p.is_symlink() and args.fetch:
   if not row['url'].startswith('https://raw.githubusercontent.com/'):raise ValueError('Unsupported acquisition host')
   with urllib.request.urlopen(row['url'],timeout=90) as response:b=response.read(row['bytes']+1)
   if len(b)!=row['bytes'] or digest(b)!=row['sha256']:raise ValueError('Fetched font identity mismatch')
   source.mkdir(parents=True,exist_ok=True);write_once(p,b)
  b=regular(p)
  if len(b)!=row['bytes'] or digest(b)!=row['sha256']:raise ValueError('Input font identity mismatch: '+row['id'])
  inputs[row['id']]=b
 output=[]
 for group,rows in locks.items():
  for row in rows:
   f=TTFont(BytesIO(inputs[row['sourceId']]),recalcTimestamp=False)
   if group=='liquid' and row['sourceId'].startswith('noto-'):
    text='最好的让读者忘了它是。个世界级模板零把想法变成清晰画面静态研究文字可编辑画布固定等待审阅流体背景构图练习⌘'
    opt=subset.Options();opt.name_IDs=['*'];opt.name_legacy=True;opt.name_languages=['*'];sub=subset.Subsetter(options=opt);sub.populate(text=text);sub.subset(f)
   f=instantiateVariableFont(f,{'wght':row['weight']},inplace=True);f.flavor=None;f.recalcTimestamp=False
   internal=('ODGlitchDisplay700' if row['alias']=='GlitchDisplay' else 'ODGlitchMono400') if group=='glitch' else row['alias']
   for n in f['name'].names:
    if n.nameID in [1,3,4,6,16]:n.string=internal.encode(n.getEncoding())
    elif n.nameID in [2,17]:n.string=('Bold' if group=='glitch' and row['weight']==700 else 'Regular').encode(n.getEncoding())
   if 'CFF 'in f:
    f['CFF '].cff.fontNames=[internal];top=f['CFF '].cff.topDictIndex[0];top.FamilyName=internal;top.FullName=internal
   buf=BytesIO();f.save(buf);b=buf.getvalue()
   if digest(b)!=row['sha256']:raise ValueError('Derived font identity mismatch: '+row['file'])
   output.append((row['file'],b))
 # Verify every final destination before writing any derived font.
 for name,b in output:
  p=dest/name
  if p.is_symlink() or (p.exists() and (not p.is_file() or regular(p)!=b)):raise ValueError('Unsafe existing destination: '+name)
 dest.mkdir(parents=True,exist_ok=True)
 for name,b in output:write_once(dest/name,b)
 print(json.dumps({'prepared':len(output),'outputSha256':{name:digest(b) for name,b in output}},indent=2))
if __name__=='__main__':main()
