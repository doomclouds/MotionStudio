from pathlib import Path
import argparse,json,hashlib,io
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
p=argparse.ArgumentParser();p.add_argument('--inputs',required=True);p.add_argument('--output',required=True);a=p.parse_args();root=Path(__file__).resolve().parent;src=Path(a.inputs).resolve();out=Path(a.output).resolve()
if out.exists() or out.is_relative_to(root.parents[2]):raise ValueError('new external output required')
j=json.loads((root/'font-inputs.json').read_text());data={}
for x in j['originalInputs']:
 f=src/x['file']
 if f.is_symlink():raise ValueError('symlink input')
 b=f.read_bytes()
 if hashlib.sha256(b).hexdigest()!=x['sha256']:raise ValueError('original SHA mismatch')
 data[x['file']]=b
for x in j['derived']:
 f=TTFont(io.BytesIO(data[x['source']]),recalcTimestamp=False);f=instantiateVariableFont(f,x['axes'],inplace=True);f.recalcTimestamp=False;f['head'].modified=x['modified'];b=io.BytesIO();f.save(b);data[x['file']]=b.getvalue()
 if hashlib.sha256(data[x['file']]).hexdigest()!=x['sha256']:raise ValueError('derived SHA mismatch')
lock=json.loads((root/'resource-lock.json').read_text())
for x in lock:
 if hashlib.sha256(data[x['local_path']]).hexdigest()!=x['sha256']:raise ValueError('runtime SHA mismatch')
out.mkdir(parents=True)
for x in lock:(out/x['local_path']).write_bytes(data[x['local_path']])
print('verified exact resources',len(lock))
