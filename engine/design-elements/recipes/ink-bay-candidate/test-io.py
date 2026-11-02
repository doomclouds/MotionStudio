# SPDX-License-Identifier: MIT
from pathlib import Path
import argparse,importlib.util,subprocess,shutil,os,json,zipfile
R=Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('p',R/'fs-policy.py');p=importlib.util.module_from_spec(s);s.loader.exec_module(p)
s=importlib.util.spec_from_file_location('pack',R/'package.py');pack=importlib.util.module_from_spec(s);s.loader.exec_module(pack)
a=argparse.ArgumentParser();a.add_argument('--work',required=True);a.add_argument('--masters',required=True);args=a.parse_args();w=p.external(args.work);w.mkdir();r=w/'source';r.mkdir()
for n in pack.PACKAGE_FILES:(r/n).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(R/n,r/n)
rows=[]
def run(script,out,expected=False):
 cmd=(['node',script]if script.endswith('.mjs')else['python3',script])
 if script=='tools/prepare-fonts.py':cmd+=['--input-root',args.masters]
 cmd+=['--output',str(out)];q=subprocess.run(cmd,cwd=r,env=os.environ.copy(),capture_output=True,text=True,timeout=40);assert(q.returncode==0)==expected,(cmd,q.stdout,q.stderr);rows.append({'script':script,'target':str(out),'exit':q.returncode})
(w/'existing').mkdir();(w/'link.zip').symlink_to(w/'absent');(w/'parent').symlink_to(w/'existing',target_is_directory=True)
for script in ['package.py','examples/render.mjs','tools/fetch-fonts.py','tools/prepare-fonts.py']:
 for out in ['relative.zip',str(w)+'/./bad.zip',w/'existing',w/'link.zip',w/'parent/out.zip',r/'forbidden.zip']:
  run(script,out);assert not(w/'bad.zip').exists()and not(r/'forbidden.zip').exists()and not(w/'absent').exists()
run('package.py',w/'baseline.zip',True)
(r/'lib/private.png').write_bytes(b'not-public');(r/'notices/private.html').write_text('<html>private</html>');(r/'notices/linked').symlink_to(r/'lib/private.png');os.mkfifo(r/'notices/fifo')
run('package.py',w/'junk.zip',True);assert(w/'baseline.zip').read_bytes()==(w/'junk.zip').read_bytes()
for i,n in enumerate(pack.PACKAGE_FILES):
 f=r/n;held=w/('hold'+str(i));f.rename(held);f.symlink_to(held);out=w/('member-'+str(i)+'.zip');run('package.py',out);assert not out.exists();f.unlink();held.rename(f)
for n in ['lib','tools','notices']:
 f=r/n;held=w/(n+'-held');f.rename(held);f.symlink_to(held,target_is_directory=True);out=w/(n+'-alias.zip');run('package.py',out);assert not out.exists();f.unlink();held.rename(f)
for n in ['README.md','lib/layout.mjs','fonts.json']:
 f=r/n;b=f.read_bytes();f.unlink();os.mkfifo(f);out=w/(f.name+'-fifo.zip');run('package.py',out);assert not out.exists();f.unlink();f.write_bytes(b)
print(json.dumps({'PASS':True,'cases':len(rows),'fixedMembers':len(pack.PACKAGE_FILES),'fourUnknownExcluded':True,'rows':rows},indent=2))
