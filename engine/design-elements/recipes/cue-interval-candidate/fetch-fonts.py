"""Fetch two pinned official inputs into a NEW external directory, not a public payload."""
import argparse,urllib.request,hashlib,json
from io import BytesIO
from pathlib import Path
# Avoid builtin io collision; import the local helper explicitly.
import importlib.util
spec=importlib.util.spec_from_file_location('cueio',Path(__file__).with_name('io.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args();out=m.external(a.output,new=True);commit='2e61f4355afd22b801791b0df176065082423b87';files=[('Inter.ttf','Inter%5Bopsz%2Cwght%5D.ttf','29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031','047c92f6e2212473dc436020afed689527076d44'),('OFL.txt','OFL.txt','5b9321a4298cfeb6b34354164a1c3afc3db114569984c502b9b35d988fd58c57','21f6aff961064c2e429f570995e446bcdd555422')];data={}
for name,path,sha,blob in files:
 with urllib.request.urlopen('https://raw.githubusercontent.com/google/fonts/'+commit+'/ofl/inter/'+path,timeout=40)as r:b=r.read()
 if hashlib.sha256(b).hexdigest()!=sha or hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()!=blob:raise ValueError('official input identity')
 data[name]=b
out.mkdir()
for n,b in data.items():(out/n).write_bytes(b)
print(json.dumps({'fetched':len(data),'commit':commit,'output':str(out)}))
