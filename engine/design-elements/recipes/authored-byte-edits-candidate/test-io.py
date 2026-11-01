# SPDX-License-Identifier: BSD-2-Clause
"""Exercise destination rejection before a fetch callback or filesystem write."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import os,tempfile,json,runpy,urllib.request
R=Path(__file__).absolute().parent;W=Path(tempfile.mkdtemp(prefix='byte-edit-io-',dir=os.environ.get('BYTE_EDIT_TEST_ROOT')));cases=[];calls=0
original=urllib.request.urlopen
def forbidden(*args,**kwargs):
 global calls
 calls+=1;raise AssertionError('network called for invalid output')
urllib.request.urlopen=forbidden
for kind in ['relative','dot','dotdot','double','trailing','existing','live-final','dangling-final','live-ancestor','dangling-ancestor','internal','source-checkout']:
 p=W/kind;t=W/(kind+'-target');raw=str(p)
 if kind=='relative':raw='new'
 elif kind=='dot':raw=str(W)+'/./new'
 elif kind=='dotdot':raw=str(W)+'/x/../new'
 elif kind=='double':raw=str(W)+'//new'
 elif kind=='trailing':raw+='/'
 elif kind=='existing':p.mkdir()
 elif kind=='live-final':t.mkdir();p.symlink_to(t)
 elif kind=='dangling-final':p.symlink_to(t)
 elif kind=='live-ancestor':t.mkdir();p.symlink_to(t);raw=str(p/'out')
 elif kind=='dangling-ancestor':p.symlink_to(t);raw=str(p/'out')
 elif kind=='internal':raw=str(R/'never-created')
 elif kind=='source-checkout':
  (p/'engine/design-elements').mkdir(parents=True);(p/'scripts').mkdir();(p/'engine/design-elements/catalog.json').write_text('{}');(p/'scripts/check-source-tree.py').write_text('# marker');raw=str(p/'never')
 before=set(W.rglob('*'));sys.argv=['fetch-font.py','--output',raw];bad=False
 try:runpy.run_path(str(R/'fetch-font.py'),run_name='__main__')
 except (ValueError,FileNotFoundError):bad=True
 assert bad and calls==0 and set(W.rglob('*'))==before,kind
 cases.append({'kind':kind,'networkCalls':calls,'treeUnchanged':True})
urllib.request.urlopen=original;print(json.dumps({'status':'PASS','cases':len(cases),'results':cases},indent=2))
