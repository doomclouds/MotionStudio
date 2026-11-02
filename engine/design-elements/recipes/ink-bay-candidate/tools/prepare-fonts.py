# SPDX-License-Identifier: MIT
"""Fixed OFL masters -> independent ASCII+closure aliases. No network or system fonts."""
from pathlib import Path
import argparse,hashlib,io,json,os,stat
import fontTools
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
ROOT=Path(__file__).absolute().parent.parent
SOURCE_LOCK_SHA='cbdc041b1f1a574d39793a0fa8bf07f22bf0e66b32e00de570e8a9a12a9e3dff'
DERIVED_LOCK_SHA='e20264693a5bf0bb89826c2d805152cd5abeccd3d6069642313ddf972de13461'
SPECS=[('BayDisplay','instrumentsans/InstrumentSans[wdth,wght].ttf',{'wdth':88,'wght':400}),('BayText','geist/Geist[wght].ttf',{'wght':400})]
def normalized(raw):
 if not isinstance(raw,str)or not os.path.isabs(raw)or os.path.normpath(raw)!=raw or any(v in ('.','..')for v in raw.split('/')):raise ValueError('normalized absolute path required')
 return Path(raw)
def checked(raw,kind='file'):
 p=normalized(raw)
 for q in [p,*p.parents]:
  s=q.lstat()
  if stat.S_ISLNK(s.st_mode):raise ValueError('symbolic input component')
  if q==p:
   if not(stat.S_ISREG(s.st_mode)if kind=='file'else stat.S_ISDIR(s.st_mode)):raise ValueError('regular input required')
  elif not stat.S_ISDIR(s.st_mode):raise ValueError('directory ancestors required')
 return p

def fresh(raw,input_root):
 p=normalized(raw)
 if p==ROOT or ROOT in p.parents or p==input_root or input_root in p.parents:raise ValueError('output external to source and input')
 try:p.lstat()
 except FileNotFoundError:pass
 else:raise ValueError('absent output required')
 checked(str(p.parent),'dir');return p

def prepare(input_root,output):
 checked(str(Path(__file__).absolute()));checked(str(ROOT),'dir')
 root=checked(input_root,'dir');out=fresh(output,root)
 if fontTools.__version__!='4.61.1':raise ValueError('FontTools4.61.1 required')
 lockbytes=checked(str(root/'source-lock.json')).read_bytes()
 if hashlib.sha256(lockbytes).hexdigest()!=SOURCE_LOCK_SHA:raise ValueError('fixed whole font source lock')
 lock=json.loads(lockbytes);source={}
 for row in lock['files']:
  b=checked(str(root/row['path'])).read_bytes()
  if len(b)!=row['bytes']or hashlib.sha256(b).hexdigest()!=row['sha256']:raise ValueError('fixed input identity '+row['path'])
  source[row['path']]=b
 outputs={};derived=[]
 for alias,master,axes in SPECS:
  f=instantiateVariableFont(TTFont(io.BytesIO(source[master]),recalcTimestamp=False),axes,inplace=True)
  options=subset.Options();options.name_IDs=['*'];options.name_legacy=True;options.name_languages=['*'];options.recalc_timestamp=False;options.glyph_names=True;options.notdef_outline=True
  sub=subset.Subsetter(options=options);sub.populate(unicodes=range(32,127));sub.subset(f)
  for nid,value in {1:alias,2:'Regular',3:alias+'-Regular',4:alias+' Regular',6:alias+'-Regular',16:alias,17:'Regular',25:alias}.items():
   f['name'].removeNames(nameID=nid);f['name'].setName(value,nid,3,1,0x409);f['name'].setName(value,nid,1,0,0)
  f['OS/2'].usWeightClass=400;f['OS/2'].fsSelection=(f['OS/2'].fsSelection&~0x21)|0x40;f['head'].macStyle=0
  buf=io.BytesIO();f.save(buf);b=buf.getvalue();outputs[alias+'.ttf']=b
  derived.append({'alias':alias,'file':alias+'.ttf','master':master,'axes':axes,'metadataWeight':400,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'glyphs':len(f.getGlyphOrder())})
 result={'schema':1,'fontTools':'4.61.1','sourceLockSHA256':SOURCE_LOCK_SHA,'sourceInputs':lock['files'],'scope':'ASCII U+0020..U+007E plus layout/composite closure; two OFL derivatives, not full original-family coverage. Original copyright/license name records retained.','changes':['Instrument Sans true wdth88/wght400 and Geist wght400 selected instance outlines; no synthetic horizontal scaling or bold.','Independent Bay aliases, regular metadata400; original selected outlines retained.','All name records retained except family/subfamily/unique/full/PostScript/typographic-prefix renamed. Unsupported meta table may be dropped by FontTools subset; original masters unchanged.'],'derived':derived}
 outputs['font-lock.json']=(json.dumps(result,indent=2)+'\n').encode()
 if hashlib.sha256(outputs['font-lock.json']).hexdigest()!=DERIVED_LOCK_SHA:raise ValueError('fixed derived lock identity')
 out.mkdir()
 for name,b in outputs.items():
  with(out/name).open('xb')as f:f.write(b)
 return result
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--input-root',required=True);p.add_argument('--output',required=True);a=p.parse_args();print(json.dumps(prepare(a.input_root,a.output),indent=2))
