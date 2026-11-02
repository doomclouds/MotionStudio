"""Copy a supplied exact asset set into a new external directory; no downloads."""
import argparse,hashlib,json,pathlib,shutil
p=argparse.ArgumentParser();p.add_argument('name',choices=['bold-poster','decision-tree','creative-voltage']);p.add_argument('source',type=pathlib.Path);p.add_argument('destination',type=pathlib.Path);a=p.parse_args()
root=pathlib.Path(__file__).resolve().parent;dst=a.destination.resolve()
if dst==root or root in dst.parents or a.destination.exists() or a.destination.is_symlink():raise SystemExit('destination must be new and external to candidate')
records=json.loads((root/a.name/'asset-lock.json').read_text());contents=[]
for r in records:
 f=a.source/r['file']
 if f.is_symlink() or not f.is_file():raise SystemExit('regular source required: '+r['file'])
 data=f.read_bytes()
 if len(data)!=r['bytes'] or hashlib.sha256(data).hexdigest()!=r['sha256']:raise SystemExit('asset SHA mismatch: '+r['file'])
 contents.append((r['file'],data))
dst.mkdir(parents=True,exist_ok=False)
for name,data in contents:(dst/name).write_bytes(data)
print(json.dumps({'files':len(contents),'mode':'provided-exact','destination':str(dst)}))
