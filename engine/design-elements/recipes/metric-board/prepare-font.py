"""Fetch only the hash-locked OFL font to an external directory; never install code."""
from pathlib import Path
import argparse,hashlib,json,urllib.request
p=argparse.ArgumentParser();p.add_argument('--out',required=True);a=p.parse_args()
root=Path(__file__).resolve().parent;out=Path(a.out).resolve()
repo=next((p for p in root.parents if (p/'.git').exists() or ((p/'engine').is_dir() and (p/'portfolio').is_dir())),root)
if out==repo or repo in out.parents: raise ValueError('Output must be outside repository')
lock=json.loads((root/'font-lock.json').read_text())
file=out/lock['file']
if file.exists() or file.is_symlink(): raise ValueError('Destination already exists; refusing overwrite or symlink')
lock=json.loads((root/'font-lock.json').read_text())
data=urllib.request.urlopen(lock['downloadUrl'],timeout=30).read()
if hashlib.sha256(data).hexdigest()!=lock['sha256']: raise ValueError('Downloaded font identity mismatch; no output written')
# Create only after source and output checks. Exclusive creation also closes overwrite races.
out.mkdir(parents=True,exist_ok=True)
with file.open('xb') as f: f.write(data)
print(file)
