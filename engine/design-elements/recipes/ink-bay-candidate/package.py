# SPDX-License-Identifier: MIT
from pathlib import Path
import os,argparse,json,zipfile,importlib.util
SELF=Path(os.path.abspath(__file__));R=SELF.parent
for f in [SELF,R/'fs-policy.py']:
 if any(q.is_symlink() for q in [f,*f.parents]) or not f.is_file():raise ValueError('regular source entry')
sp=importlib.util.spec_from_file_location('policy',R/'fs-policy.py');p=importlib.util.module_from_spec(sp);sp.loader.exec_module(p)
PACKAGE_FILES=['CONTRACT.md', 'CREDITS.md', 'DESIGN-GUIDE.md', 'LICENSE', 'README.md', 'examples/content.mjs', 'examples/render.mjs', 'fonts.json', 'fs-policy.py', 'lib/input.mjs', 'lib/kit.mjs', 'lib/layout.mjs', 'lib/model.mjs', 'notices/Helper-MIT.txt', 'notices/Native-Canvas-MIT.txt', 'notices/Reference-8B-MIT.txt', 'notices/fonts/README.md', 'notices/fonts/geist-OFL.txt', 'notices/fonts/instrumentsans-OFL.txt', 'package-lock.json', 'package.json', 'package.py', 'requirements-tools.txt', 'runtime.mjs', 'test-io.py', 'test-resources.py', 'test.mjs', 'tools/fetch-fonts.py', 'tools/prepare-fonts.py', 'tools/verify-fonts.py', 'verify-ink.mjs', 'verify-model.py']

def build(raw):
 out=p.external(raw,'file')
 if out.suffix!='.zip':raise ValueError('zip output')
 payload=[(n,p.regular(R/n))for n in PACKAGE_FILES]
 with zipfile.ZipFile(out,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=9)as z:
  for n,b in payload:
   i=zipfile.ZipInfo(n,(2026,11,1,0,0,0));i.external_attr=0o100644<<16;i.compress_type=zipfile.ZIP_DEFLATED;z.writestr(i,b)
 return {'members':len(payload),'bytes':out.stat().st_size,'sha256':p.sha(out.read_bytes()),'files':[{'path':n,'bytes':len(b),'sha256':p.sha(b)}for n,b in payload]}
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--output',required=True);args=a.parse_args();print(json.dumps(build(args.output),indent=2))
