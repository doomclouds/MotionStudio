# SPDX-License-Identifier: BSD-2-Clause
import sys
sys.dont_write_bytecode=True
import json,argparse,zipfile,subprocess,stat
from pathlib import Path
from io_paths import fresh
R=Path(__file__).absolute().parent;p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args();out=fresh(a.output);subprocess.run([sys.executable,str(R/'check-source.py')],check=True);names=json.loads((R/'source-policy.json').read_text())['allowedPaths']
with zipfile.ZipFile(out,'x',zipfile.ZIP_DEFLATED,compresslevel=9)as z:
 for name in names:
  i=zipfile.ZipInfo(name,(2026,11,1,0,0,0));i.create_system=3;i.external_attr=(stat.S_IFREG|0o644)<<16;i.compress_type=zipfile.ZIP_DEFLATED;z.writestr(i,(R/name).read_bytes(),compresslevel=9)
print(json.dumps({'members':len(names),'textOnly':True}))
