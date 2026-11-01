"""Isolated package-scope and no-write CLI checks; never modify author source."""
import argparse,hashlib,json,os,shutil,subprocess,sys
from pathlib import Path
a=argparse.ArgumentParser();a.add_argument('--work',required=True);arg=a.parse_args();root=Path(__file__).absolute().parent;work=Path(arg.work)
if not work.is_absolute() or work.exists() or not work.parent.is_dir():raise ValueError('fresh absolute work directory')
work.mkdir();src=work/'source';shutil.copytree(root,src,ignore=shutil.ignore_patterns('node_modules'))
trusted_builder=(root/'build-package.py').read_text()
def run(out):
 code='__file__='+repr(str(src/'build-package.py'))+'\n'+trusted_builder
 return subprocess.run([sys.executable,'-c',code,'--output',str(out)],capture_output=True,text=True,timeout=10)
r=run(work/'baseline');assert r.returncode==0,r.stderr
expected=(work/'baseline/text-candidates.zip').read_bytes();members=json.loads((work/'baseline/text-members.json').read_text())['files'];checks=[]
# Real unsupported reference-like and nested output artifacts must never enter projection.
(src/'fonts/private-comparison').mkdir(parents=True);(src/'fonts/private-comparison/comparison.png').write_bytes(b'NO PRIVATE IMAGE');(src/'unlisted-secret.txt').write_text('UNLISTED');(src/'fonts/linked.txt').symlink_to(src/'unlisted-secret.txt')
r=run(src/'fonts/nested-package');assert r.returncode==0,r.stderr;assert (src/'fonts/nested-package/text-candidates.zip').read_bytes()==expected;checks.append('extras-and-nested-output-excluded')
for i,f in enumerate(members):
 p=src/f['path'];b=p.read_bytes();p.unlink()
 for kind in ['missing','directory','fifo','live-link','dangling-link']:
  if kind=='directory':p.mkdir()
  elif kind=='fifo':os.mkfifo(p)
  elif kind=='live-link':p.symlink_to(src/'unlisted-secret.txt')
  elif kind=='dangling-link':p.symlink_to(src/'missing-target')
  out=work/f'reject-{i}-{kind}';r=run(out)
  assert r.returncode!=0 and not out.exists(),(f['path'],kind,r.stdout,r.stderr)
  checks.append(f"{f['path']}:{kind}")
  if kind=='directory':p.rmdir()
  elif kind!='missing':p.unlink()
 p.write_bytes(b)
for kind in ['dot','existing','live-output-link','dangling-output-link']:
 if kind=='dot':out=str(work)+'/./dot-out'
 elif kind=='existing':out=str(work/'baseline')
 else:
  p=work/kind;p.symlink_to(work/('baseline' if kind=='live-output-link' else 'missing-output'),target_is_directory=True);out=str(p)
 r=run(out);assert r.returncode!=0;checks.append(kind)
(work/'RESULT.json').write_text(json.dumps({'checks':checks,'count':len(checks),'pass':True},indent=2)+'\n');print(json.dumps({'pass':True,'checks':len(checks)}))
