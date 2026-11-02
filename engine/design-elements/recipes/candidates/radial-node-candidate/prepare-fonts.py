#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Rebuild renamed OFL ASCII instances from the exact, unmodified Noto master."""
import argparse,pathlib,os,stat,hashlib,io,json
import fontTools
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
ROOT=pathlib.Path(__file__).absolute().parent
MASTER='74df1f61ab9d4bfaa961c65f8dc991deaae2885b0a6a6d6a60ed23980b3c8554'
def require(ok,msg):
 if not ok:raise ValueError(msg)
def pathcheck(raw,new=False):
 require(isinstance(raw,str) and os.path.isabs(raw) and not any(v in ('.','..')for v in raw.split('/')),'absolute path without dot components');p=pathlib.Path(raw)
 for q in [p,*p.parents]:
  try:require(not stat.S_ISLNK(os.lstat(q).st_mode),'no symlinks')
  except FileNotFoundError:pass
 if new:require(p!=ROOT and ROOT not in p.parents and p.parent.is_dir() and not os.path.lexists(p),'new external destination')
 return p
p=argparse.ArgumentParser();p.add_argument('--master',required=True);p.add_argument('--output',required=True);a=p.parse_args();out=pathcheck(a.output,True);master=pathcheck(a.master)
require(master.is_file() and master.stat().st_size==2490816,'master type/size');require(hashlib.sha256(master.read_bytes()).hexdigest()==MASTER,'master SHA');require(fontTools.__version__=='4.61.1','FontTools version4.61.1')
files=[];rows=[]
for weight,style in [(400,'Regular'),(600,'Semibold')]:
 font=TTFont(master,recalcTimestamp=False);instantiateVariableFont(font,{'wght':weight,'wdth':100},inplace=True,optimize=True);opts=subset.Options();opts.name_IDs=['*'];opts.name_languages=['*'];opts.name_legacy=True;s=subset.Subsetter(options=opts);s.populate(unicodes=range(32,127));s.subset(font)
 family='RadialRecipe Sans';names={1:family,2:style,3:'RadialRecipeStatic-1-'+style,4:family+' '+style,6:'RadialRecipeSans-'+style,16:family,17:style}
 for n in font['name'].names:
  if n.nameID in names:n.string=names[n.nameID].encode(n.getEncoding())
 font['OS/2'].usWeightClass=weight;buf=io.BytesIO();font.save(buf,reorderTables=True);data=buf.getvalue();name=f'RadialRecipeSans-{weight}.ttf';files.append((name,data));rows.append({'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'alias':f'RadialRecipeSans{weight}','weight':weight})
expected={'RadialRecipeSans-400.ttf':'6892afeb07efd2ebe356e353f1f2126f1c060d0ceed72b787dee2876576dbbff','RadialRecipeSans-600.ttf':'4e1e06eca9217b7c3045a8c89c1f639d4b4abdf88ae10f3b6b756613ea2c8961'}
for n,b in files:require(hashlib.sha256(b).hexdigest()==expected[n],'derived identity')
out.mkdir(mode=0o700)
for name,data in files:(out/name).write_bytes(data)
(out/'font-generation.json').write_text(json.dumps({'masterSHA256':MASTER,'fontTools':fontTools.__version__,'axes':{'wdth':100,'wght':[400,600]},'renamedASCIISubsets':True,'files':rows},indent=2)+'\n');print(json.dumps(rows))
