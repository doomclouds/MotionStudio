# SPDX-License-Identifier: MIT
"""Independent instancing/outline oracle and real CLI IO probes; author self-check, not final audit."""
from pathlib import Path
import argparse,hashlib,io,json,os,shutil,subprocess,sys,tempfile,importlib.util
sys.dont_write_bytecode=True
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
ROOT=Path(__file__).absolute().parent.parent
SOURCE_LOCK_SHA='cbdc041b1f1a574d39793a0fa8bf07f22bf0e66b32e00de570e8a9a12a9e3dff'
SPECS=[('BayDisplay','instrumentsans/InstrumentSans[wdth,wght].ttf',{'wdth':88,'wght':400}),('BayText','geist/Geist[wght].ttf',{'wght':400})]
sha=lambda b:hashlib.sha256(b).hexdigest()
def names(f,nid):return sorted((n.platformID,n.platEncID,n.langID,n.toUnicode())for n in f['name'].names if n.nameID==nid)
def outline(gs,n):
 p=DecomposingRecordingPen(gs);gs[n].draw(p);return p.value

def verify(input_root,derived_root):
 spec=importlib.util.spec_from_file_location('bay_prepare',ROOT/'tools/prepare-fonts.py');safe=importlib.util.module_from_spec(spec);spec.loader.exec_module(safe)
 safe.checked(str(Path(__file__).absolute()));safe.checked(str(input_root),'dir');safe.checked(str(derived_root),'dir')
 safe.checked(str(input_root/'source-lock.json'));safe.checked(str(derived_root/'font-lock.json'))
 lb=(input_root/'source-lock.json').read_bytes();assert sha(lb)==SOURCE_LOCK_SHA;source_lock=json.loads(lb)
 for row in source_lock['files']:
  b=safe.checked(str(input_root/row['path'])).read_bytes();assert len(b)==row['bytes']and sha(b)==row['sha256'];assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==row['gitBlob']
 fb=(derived_root/'font-lock.json').read_bytes();assert sha(fb)==safe.DERIVED_LOCK_SHA;lock=json.loads(fb);assert lock['sourceLockSHA256']==SOURCE_LOCK_SHA;results=[]
 for alias,master,axes in SPECS:
  master_bytes=(input_root/master).read_bytes();s=instantiateVariableFont(TTFont(io.BytesIO(master_bytes),recalcTimestamp=False),axes,inplace=False);buf=io.BytesIO();s.save(buf);s=TTFont(io.BytesIO(buf.getvalue()),recalcTimestamp=False)
  b=safe.checked(str(derived_root/f'{alias}.ttf')).read_bytes();d=TTFont(io.BytesIO(b),recalcTimestamp=False);sg=s.getGlyphSet();dg=d.getGlyphSet();ascii_rows=[]
  for cp in range(32,127):
   g=s.getBestCmap()[cp];assert d.getBestCmap()[cp]==g;assert s['hmtx'][g]==d['hmtx'][g];assert outline(sg,g)==outline(dg,g);ascii_rows.append({'cp':cp,'glyph':g,'hmtx':list(d['hmtx'][g]),'outlineSHA256':sha(repr(outline(dg,g)).encode())})
  closure=[]
  for g in d.getGlyphOrder():
   assert g in s.getGlyphOrder();assert s['hmtx'][g]==d['hmtx'][g];assert outline(sg,g)==outline(dg,g);closure.append(g)
  for nid in [0,7,8,9,11,13,14]:assert names(s,nid)==names(d,nid),(alias,nid)
  assert names(s,13)and names(s,14)
  for nid,val in [(1,alias),(2,'Regular'),(3,alias+'-Regular'),(4,alias+' Regular'),(6,alias+'-Regular'),(16,alias),(17,'Regular'),(25,alias)]:assert {r[3]for r in names(d,nid)}=={val}
  assert d['OS/2'].usWeightClass==400 and d['head'].macStyle==0 and d['OS/2'].fsSelection&0x40 and not d['OS/2'].fsSelection&0x21
  assert 'fvar'not in d and 'gvar'not in d and d['head'].unitsPerEm==s['head'].unitsPerEm
  row=next(x for x in lock['derived']if x['alias']==alias);assert row['sha256']==sha(b)and row['bytes']==len(b)and row['axes']==axes
  results.append({'alias':alias,'sourceAxes':axes,'metadataWeight':400,'bytes':len(b),'sha256':sha(b),'asciiChecks':ascii_rows,'asciiCount':95,'closureHmtxOutlineCount':len(closure),'closureGlyphs':closure,'copyright':names(d,0),'OFL':names(d,13),'OFLURL':names(d,14),'notdefPreserved':'.notdef'in closure})
 return {'status':'PASS','role':'Author collaboration self-check, not independent final audit','sourceInputs':source_lock['files'],'fonts':results,'asciiChecks':190,'closureHmtxOutlineChecks':sum(x['closureHmtxOutlineCount']for x in results),'fontLockSHA256':sha(fb),'sourceLockSHA256':SOURCE_LOCK_SHA,'boundaries':['Current pinned same-family masters, not historical screenshot WOFF2-byte proof.','Instrument Sans actual wdth88/wght400 outlines; no synthetic squeeze. Geist source400 outlines, metadata regular400.','ASCII plus retained layout/composite closure only, not full language support. No browser/shaping/raster equivalence asserted.','Full original masters and original OFL/copyright metadata preserved; derivatives remain OFL rather than MIT.']}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--input-root',required=True);p.add_argument('--derived-root',required=True);a=p.parse_args();print(json.dumps(verify(Path(a.input_root),Path(a.derived_root)),indent=2))
