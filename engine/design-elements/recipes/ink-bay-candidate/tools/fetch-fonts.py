# SPDX-License-Identifier: MIT
"""Fetch six pinned public OFL inputs once each. Refusal/error is not retried."""
from pathlib import Path
import argparse,hashlib,importlib.util,json,urllib.request,sys
sys.dont_write_bytecode=True
P=Path(__file__).absolute(); ROOT=P.parent.parent
spec=importlib.util.spec_from_file_location('bay_prepare',P.parent/'prepare-fonts.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
def fetch(output):
 mod.checked(str(P));mod.checked(str(ROOT),'dir');out=mod.fresh(output,ROOT)
 b=mod.checked(str(ROOT/'fonts.json')).read_bytes()
 if hashlib.sha256(b).hexdigest()!=mod.SOURCE_LOCK_SHA:raise ValueError('fixed whole fonts.json')
 lock=json.loads(b);payload={}
 for row in lock['files']:
  with urllib.request.urlopen(urllib.request.Request(row['url'],headers={'User-Agent':'Bay-fonts-restore/1.0'}),timeout=60)as response:raw=response.read()
  if len(raw)!=row['bytes']or hashlib.sha256(raw).hexdigest()!=row['sha256']or hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()!=row['gitBlob']:raise ValueError('fixed remote identity '+row['path'])
  payload[row['path']]=raw
 # Validate every remote byte before first output write.
 out.mkdir()
 for name,raw in payload.items():
  target=out/name;target.parent.mkdir(exist_ok=True)
  with target.open('xb')as f:f.write(raw)
 with(out/'source-lock.json').open('xb')as f:f.write(b)
 return {'status':'PASS','files':lock['files'],'sourceLockSHA256':mod.SOURCE_LOCK_SHA,'networkAttemptsPerInput':1}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args();print(json.dumps(fetch(a.output),indent=2))
