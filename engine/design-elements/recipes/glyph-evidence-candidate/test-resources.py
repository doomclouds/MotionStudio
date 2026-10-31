# SPDX-License-Identifier: Apache-2.0
from pathlib import Path
import json,os,shutil,subprocess,tempfile
ROOT=Path(__file__).absolute().parent;resources=Path(os.environ['GE_RESOURCE_DIR']);base=Path(tempfile.mkdtemp(prefix='glyph-resource-'));results=[]
probe="import {createEnvironment} from './runtime.mjs';try{createEnvironment();console.log('ACCEPT')}catch(e){console.log('REJECT '+e.message);process.exit(2)}"
for case in ['valid','empty-outline','tampered-outline','missing-outline','missing-license','license-tamper','outline-symlink','dangling','resource-root-symlink','mutable-lock','empty-lock','lock-symlink']:
 p=base/case;p.mkdir();src=p/'package';shutil.copytree(ROOT,src,ignore=shutil.ignore_patterns('__pycache__'));r=p/'external';shutil.copytree(resources,r)
 if case=='empty-outline':(r/'outlines.json').write_text('{"faces":[]}')
 if case=='tampered-outline':
  b=bytearray((r/'outlines.json').read_bytes());b[-2]=32;(r/'outlines.json').write_bytes(b)
 if case=='missing-outline':(r/'outlines.json').unlink()
 if case=='missing-license':(r/'inter-OFL.txt').unlink()
 if case=='license-tamper':(r/'inter-OFL.txt').write_text('OFL')
 if case in ['outline-symlink','dangling']:(r/'outlines.json').unlink();(r/'outlines.json').symlink_to(resources/'outlines.json' if case=='outline-symlink' else p/'missing')
 if case=='resource-root-symlink':x=p/'link';x.symlink_to(r,target_is_directory=True);r=x
 if case in ['mutable-lock','empty-lock']:
  data=json.loads((src/'outline-lock.json').read_text());data['files']=[]if case=='empty-lock'else data['files'][1:];(src/'outline-lock.json').write_text(json.dumps(data))
 if case=='lock-symlink':(src/'outline-lock.json').unlink();(src/'outline-lock.json').symlink_to(ROOT/'outline-lock.json')
 run=subprocess.run(['node','--input-type=module','-e',probe],cwd=src,env={**os.environ,'GE_RESOURCE_DIR':str(r),'DISABLE_SYSTEM_FONTS_LOAD':'1'},capture_output=True,text=True);assert run.returncode==(0 if case=='valid'else 2),(case,run.stdout,run.stderr);results.append({'case':case,'expected':True,'result':run.stdout.strip()})
print(json.dumps({'status':'PASS','cases':results},indent=2))
