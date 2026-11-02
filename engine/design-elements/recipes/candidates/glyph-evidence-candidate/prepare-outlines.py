#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""External OFL subset generation; no shaping or live variable-font API."""
import argparse,json
from resource_io import external,checked_masters,check,digest,regular,ROOT,locked
import fontTools
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
p=argparse.ArgumentParser();p.add_argument('--inputs',required=True);p.add_argument('--output',required=True);a=p.parse_args();out=external(a.output,new=True);inputs=external(a.inputs);check(out!=inputs and inputs not in out.parents,'separate output');check(fontTools.__version__=='4.61.1','FontTools 4.61.1 required');lock,spec=checked_masters(inputs);faces=[]
for rec in spec['instances']:
 master=regular(inputs/rec['master']);font=TTFont(master,recalcTimestamp=False);names={str(i):font['name'].getDebugName(i)for i in[0,1,2,5,13,14]};axes=[];values={}
 for axis in font['fvar'].axes:
  v=rec['axes'].get(axis.axisTag,axis.defaultValue);check(axis.minValue<=v<=axis.maxValue,'axis range');values[axis.axisTag]=v;axes.append({'tag':axis.axisTag,'min':axis.minValue,'default':axis.defaultValue,'max':axis.maxValue,'value':v})
 check(set(rec['axes'])<=set(values),'unknown axis');font=instantiateVariableFont(font,values,inplace=True,optimize=True);gs=font.getGlyphSet();cmap=font.getBestCmap();glyphs={}
 for cp in range(32,127):
  name=cmap[cp];pen=SVGPathPen(gs);gs[name].draw(pen);bounds=BoundsPen(gs);gs[name].draw(bounds);glyphs[str(cp)]={'char':chr(cp),'unicode':f'U+{cp:04X}','name':name,'advance':font['hmtx'].metrics[name][0],'bounds':list(bounds.bounds)if bounds.bounds else None,'path':pen.getCommands()}
 faces.append({'id':rec['id'],'label':rec['label'],'modifiedSubsetName':'Evidence Outline '+rec['id'],'sourceMaster':rec['master'],'sourceMasterSHA256':digest(master.read_bytes()),'sourceNameRecords':names,'unitsPerEm':font['head'].unitsPerEm,'axes':axes,'glyphs':glyphs,'license':'OFL-1.1','mode':'Unshaped cmap/hmtx; no kerning, GSUB, GPOS, BiDi or script shaping'})
raw=(json.dumps({'schema':'glyph-evidence-ascii-outline/v1','fontTools':fontTools.__version__,'faces':faces},ensure_ascii=True,separators=(',',':'))+'\n').encode();files={'outlines.json':raw}
for name in ['fraunces-OFL.txt','inter-OFL.txt']:files[name]=regular(ROOT/'licenses'/name).read_bytes()
files['generation.json']=(json.dumps({'schema':'glyph-evidence-generation/v1','fontTools':fontTools.__version__,'faces':len(faces),'glyphsPerFace':95,'sha256':digest(raw),'bytes':len(raw),'mastersUnmodified':True,'instanceTTFsSaved':False,'shapingEngineRun':False},indent=2)+'\n').encode()
expected=locked('outline-lock.json','5dc9904f5fddd777bc7da2effc7bcf520005c02a2872a2ac8d6004ad38bf4290')
for item in expected['files']:
 check(len(files[item['path']])==item['bytes'] and digest(files[item['path']])==item['sha256'],'derived resource exact identity')
out.mkdir(mode=0o700)
for name,b in files.items():
 with (out/name).open('xb')as f:f.write(b)
print(json.dumps({'sha256':digest(raw),'bytes':len(raw),'faces':len(faces)}))
