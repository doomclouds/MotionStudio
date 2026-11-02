# SPDX-License-Identifier: MIT
from pathlib import Path
import argparse,subprocess,os,json,shutil,importlib.util
R=Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('p',R/'fs-policy.py');p=importlib.util.module_from_spec(s);s.loader.exec_module(p)
a=argparse.ArgumentParser();a.add_argument('--work',required=True);args=a.parse_args();w=p.external(args.work);w.mkdir();(w/'source').mkdir();shutil.copy2(R/'runtime.mjs',w/'source/runtime.mjs');(w/'fake').mkdir();(w/'fake/package.json').write_text('{"version":"0.1.100","main":"index.cjs"}');(w/'fake/index.cjs').write_text('module.exports={GlobalFonts:{register(){global.n=(global.n||0)+1;return true},has(){return true}}};');original=Path(os.environ['INKBAY_FONTS']);rows=[]
js="globalThis.n=0;try{const m=await import('./runtime.mjs');m.loadEnvironment();console.log(JSON.stringify({ok:true,n:globalThis.n}))}catch(e){console.log(JSON.stringify({ok:false,n:globalThis.n,error:e.message}))}"
for mode in ['ok','empty-lock','changed-lock','missing-lock','link-lock','bad-display','bad-text','missing-text','link-text','fifo-text','linked-ancestor','system-enabled']:
 d=w/mode;shutil.copytree(original,d);lock=d/'font-lock.json';txt=d/'BayText.ttf'
 if mode=='empty-lock':lock.write_text('{"derived":[]}')
 if mode=='changed-lock':lock.write_text(lock.read_text()+' ')
 if mode=='missing-lock':lock.unlink()
 if mode=='link-lock':lock.unlink();lock.symlink_to(original/'font-lock.json')
 if mode=='bad-display':(d/'BayDisplay.ttf').write_bytes(b'bad')
 if mode=='bad-text':txt.write_bytes(b'bad')
 if mode=='missing-text':txt.unlink()
 if mode=='link-text':txt.unlink();txt.symlink_to(original/'BayText.ttf')
 if mode=='fifo-text':txt.unlink();os.mkfifo(txt)
 if mode=='linked-ancestor':d.rename(w/'held');d.symlink_to(w/'held',target_is_directory=True)
 env={**os.environ,'INKBAY_FONTS':str(d),'INKBAY_RUNTIME':str(w/'fake'),'DISABLE_SYSTEM_FONTS_LOAD':'0'if mode=='system-enabled'else'1'}
 q=subprocess.run(['node','--input-type=module','-e',js],cwd=w/'source',env=env,text=True,capture_output=True,timeout=15);assert q.returncode==0,q.stderr;v=json.loads(q.stdout);assert v['ok']==(mode=='ok');assert v['n']==(2 if mode=='ok'else 0);rows.append({'case':mode,**v})
print(json.dumps({'PASS':True,'cases':len(rows),'rows':rows},indent=2))
