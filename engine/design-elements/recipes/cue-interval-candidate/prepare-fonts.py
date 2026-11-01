"""MIT code; complete externally derived Inter outlines/notices remain OFL."""
import argparse,hashlib,json,io,sys,importlib.util
from pathlib import Path
import fontTools
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
spec=importlib.util.spec_from_file_location('cueio',Path(__file__).with_name('io.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
p=argparse.ArgumentParser();p.add_argument('--inputs',required=True);p.add_argument('--output',required=True);a=p.parse_args();inputs=m.external(a.inputs);out=m.external(a.output,new=True)
if sys.version_info[:3]!=(3,12,14)or fontTools.__version__!='4.61.1':raise RuntimeError('Python3.12.14/fontTools4.61.1 required')
pins={'Inter.ttf':'29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031','OFL.txt':'5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57'};src={}
for n,h in pins.items():
 f=m.external(str(inputs/n),directory=False);b=f.read_bytes()
 if hashlib.sha256(b).hexdigest()!=h:raise ValueError('input identity')
 src[n]=b
outputs={'OFL.txt':src['OFL.txt']};rows=[]
for alias,weight in [('CueRegular',400),('CueSemibold',600)]:
 f=instantiateVariableFont(TTFont(io.BytesIO(src['Inter.ttf']),recalcTimestamp=False),{'opsz':14,'wght':weight},inplace=True)
 for r in f['name'].names:
  if r.nameID in [1,2,3,4,6,16,17,25]:r.string=('Regular'if r.nameID in [2,17]else alias).encode(r.getEncoding())
 f['OS/2'].usWeightClass=400;f['OS/2'].fsSelection=(f['OS/2'].fsSelection&~33)|64;f['head'].macStyle=0;b=io.BytesIO();f.save(b);v=b.getvalue();outputs[alias+'.ttf']=v;rows.append({'alias':alias,'path':alias+'.ttf','axes':{'opsz':14,'wght':weight},'bytes':len(v),'sha256':hashlib.sha256(v).hexdigest()})
outputs['font-lock.json']=(json.dumps({'python':sys.version.split()[0],'fontTools':fontTools.__version__,'fonts':rows,'notice':{'path':'OFL.txt','sha256':pins['OFL.txt']}},indent=2)+'\n').encode();out.mkdir()
for n,b in outputs.items():(out/n).write_bytes(b)
print(json.dumps({'files':len(outputs),'fontLockSHA256':hashlib.sha256(outputs['font-lock.json']).hexdigest()}))
