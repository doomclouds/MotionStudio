# SPDX-License-Identifier: MIT
"""Actual trusted-local CLI regression; creates only a fresh external work directory."""
from pathlib import Path
import tempfile,subprocess,os,json,zipfile,hashlib,shutil,sys
ROOT=Path(__file__).absolute().parent
parent=Path(os.environ.get('FLOW_TEST_ROOT',tempfile.gettempdir())).resolve()
W=Path(tempfile.mkdtemp(prefix='flow-io-',dir=parent)); S=W/'source';shutil.copytree(ROOT,S,ignore=shutil.ignore_patterns('__pycache__'));calls=[]
def invoke(script,arg,ok):
 cmd=['node',str(S/script),arg]if script.endswith('.mjs')else[sys.executable,str(S/script),arg]
 p=subprocess.run(cmd,capture_output=True,text=True);assert (p.returncode==0)==ok,(cmd,p.stdout,p.stderr);calls.append({'script':script,'expectedSuccess':ok,'exit':p.returncode})
def no_output(script,arg):
 invoke(script,arg,False);assert not (W/'target').exists()
for script in ['render.mjs','make-package.py']:
 (W/'existing').mkdir(exist_ok=True);(W/'dangling').symlink_to(W/'target',target_is_directory=True);(W/'link').symlink_to(W/'existing',target_is_directory=True)
 for p in ['relative',str(W)+'/./target',str(W)+'//target',str(W/'target')+'/',str(W/'dangling'),str(W/'link'/'target'),str(W/'absent'/'target'),str(S/'private-output'),str(W/'existing')]:no_output(script,p)
 (W/'dangling').unlink();(W/'link').unlink()
base=W/'base.zip';invoke('make-package.py',str(base),True);digest=hashlib.sha256(base.read_bytes()).hexdigest();(S/'private-report.html').write_text('PRIVATE');(S/'lib'/'private.png').write_bytes(b'not an image');(S/'licenses'/'unlisted-link.txt').symlink_to(S/'private-report.html');invoke('make-package.py',str(W/'junk-excluded.zip'),True);assert hashlib.sha256((W/'junk-excluded.zip').read_bytes()).hexdigest()==digest
with zipfile.ZipFile(base)as z:names=z.namelist()
# Every allowlisted member rejects if replaced by a symlink; no output created.
for i,name in enumerate(names):
 p=S/name;original=p.read_bytes();p.unlink();p.symlink_to(ROOT/name)
 try:invoke('make-package.py',str(W/'target'),False);assert not(W/'target').exists()
 finally:p.unlink();p.write_bytes(original)
invoke('render.mjs',str(W/'rendered'),True);assert len(list((W/'rendered').iterdir()))==4
print(json.dumps({'pass':True,'work':str(W),'cases':len(calls),'listedMembers':len(names),'checks':calls},indent=2))
