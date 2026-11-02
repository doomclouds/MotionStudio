"""Run real CLI failure probes in an external temporary directory; no network required."""
import os,sys,json,subprocess,tempfile,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parent
base=Path(tempfile.mkdtemp(prefix='cue-resource-',dir=os.environ.get('TMPDIR')));resource=Path(os.environ['CUE_RESOURCE_DIR']);runtime=os.environ['CUE_RUNTIME_DIR'];checks=[]
def run_node(directory):
 code=f"import{{loadNative,setup}}from {json.dumps((ROOT/'runtime.mjs').as_uri())};let calls=0;const a=loadNative();const p={{...a,GlobalFonts:{{...a.GlobalFonts,register(){{calls++;throw Error('registration reached')}},has:a.GlobalFonts.has}}}};let rejected=false;try{{await setup(p,{json.dumps(str(directory))})}}catch(e){{rejected=true}}if(!rejected||calls)throw Error('early resource rejection failed');console.log('PASS');"
 r=subprocess.run(['node','--input-type=module','-e',code],capture_output=True,text=True);assert r.returncode==0,(r.stdout,r.stderr)
for kind in ['empty-lock','missing-entry','duplicate-alias','modified-hash','missing-font','changed-font','symlink-font','changed-notice','symlink-lock']:
 d=base/kind;shutil.copytree(resource,d);lock=d/'font-lock.json';obj=json.loads(lock.read_text())
 if kind=='empty-lock':obj={'fonts':[]};lock.write_text(json.dumps(obj))
 elif kind=='missing-entry':obj['fonts'].pop();lock.write_text(json.dumps(obj))
 elif kind=='duplicate-alias':obj['fonts'][1]['alias']='CueRegular';lock.write_text(json.dumps(obj))
 elif kind=='modified-hash':obj['fonts'][0]['sha256']='0'*64;lock.write_text(json.dumps(obj))
 elif kind=='missing-font':(d/'CueRegular.ttf').unlink()
 elif kind=='changed-font':(d/'CueRegular.ttf').write_bytes(b'bad')
 elif kind=='symlink-font':(d/'CueRegular.ttf').unlink();(d/'CueRegular.ttf').symlink_to(resource/'CueRegular.ttf')
 elif kind=='changed-notice':(d/'OFL.txt').write_text('changed')
 elif kind=='symlink-lock':lock.unlink();lock.symlink_to(resource/'font-lock.json')
 run_node(d);checks.append(kind)
print(json.dumps({'passed':len(checks),'checks':checks,'workspace':str(base)}))
