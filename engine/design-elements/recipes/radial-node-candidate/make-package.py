#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
import argparse,pathlib,os,stat,json,subprocess,sys,zipfile
root=pathlib.Path(__file__).absolute().parent
p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args();out=pathlib.Path(a.output)
if not out.is_absolute()or any(x in ['.','..']for x in a.output.split('/')):raise ValueError('absolute dot-free output')
for q in [out,*out.parents]:
 try:
  if stat.S_ISLNK(os.lstat(q).st_mode):raise ValueError('no symlink')
 except FileNotFoundError:pass
if out==root or root in out.parents or os.path.lexists(out) or not out.parent.is_dir():raise ValueError('new external output')
subprocess.run([sys.executable,str(root/'check-source.py')],check=True)
paths=json.loads((root/'source-policy.json').read_text())['allowedPaths']
with zipfile.ZipFile(out,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for name in paths:
  info=zipfile.ZipInfo(name,(2026,10,31,0,0,0));info.create_system=3;info.external_attr=(stat.S_IFREG|0o644)<<16;info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,(root/name).read_bytes(),compresslevel=9)
print(json.dumps({'members':len(paths),'textOnly':True}))
