"""Real locked-master preparation and same-byte input-symlink CLI regression.
Requires CUE_MASTER_DIR plus the Python/FontTools versions in prepare-fonts.py.
No network acquisition. This is separate from the font-free test-io.py suite.
"""
import hashlib,json,os,shutil,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent
raw=os.environ.get('CUE_MASTER_DIR')
if not raw:
 raise SystemExit('CUE_MASTER_DIR with exact authorized Inter.ttf and OFL.txt is required; see README.md. Resource test not run.')
masters=Path(raw)
checks=[]
def prepare(source,out):
 return subprocess.run([sys.executable,str(ROOT/'prepare-fonts.py'),'--inputs',str(source),'--output',str(out)],capture_output=True,text=True)
with tempfile.TemporaryDirectory(prefix='cue-prepare-inputs-') as tmp:
 base=Path(tmp)
 # Positive control reaches real derivation with the unmodified locked masters.
 out=base/'valid-derived';p=prepare(masters,out)
 assert p.returncode==0,('valid locked-master control failed',p.stdout,p.stderr)
 lock=json.loads((out/'font-lock.json').read_text())
 assert [x['alias']for x in lock['fonts']]==['CueRegular','CueSemibold']
 for row in lock['fonts']:
  data=(out/row['path']).read_bytes();assert len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256']
 assert (out/'OFL.txt').read_bytes()==(masters/'OFL.txt').read_bytes()
 checks.append('valid-locked-master-real-derivation')
 # Preserve both original real CLI cases: only one same-byte input is a symlink.
 for name in ['Inter.ttf','OFL.txt']:
  source=base/('input-'+name);source.mkdir()
  for item in ['Inter.ttf','OFL.txt']:
   if item==name:(source/item).symlink_to(masters/item)
   else:shutil.copyfile(masters/item,source/item)
  target=base/('rejected-'+name);p=prepare(source,target)
  assert p.returncode!=0,(name,'input symlink accepted')
  assert p.stderr.rstrip().endswith('ValueError: nonsymlink path'),(name,'wrong failure stage',p.stderr)
  assert not target.exists() and not target.is_symlink(),(name,'output was created')
  checks.append('real-cli-same-byte-input-symlink:'+name)
print(json.dumps({'passed':len(checks),'checks':checks,'scope':'real locked font preparation and CLI input guards; no artwork or visual acceptance'}))
