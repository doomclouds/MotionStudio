# SPDX-License-Identifier: Apache-2.0
from pathlib import Path
import json,re
ROOT=Path(__file__).absolute().parent;allowed=set(json.loads((ROOT/'source-policy.json').read_text())['allowedPaths']);actual=set()
for p in ROOT.rglob('*'):
 if p.is_symlink():raise ValueError('no symlink in text payload')
 if not p.is_file():continue
 rel=p.relative_to(ROOT).as_posix();actual.add(rel)
 if rel not in allowed:raise ValueError('not allowlisted: '+rel)
 b=p.read_bytes();s=b.decode('utf-8')
 if b'\0' in b:raise ValueError('binary/NUL')
 for pattern in [r'libfile_[0-9a-f]{12,}',r'file_[0-9a-f]{12,}',r'/'+'workspace/',r'/home/'+'agent/',r'data:'+'image/',r'base64,[A-Za-z0-9+/]{100}',r'ext-'+'fontgoggles-'+'glyphscope-native']:
  if re.search(pattern,s):raise ValueError('private/media leakage: '+rel)
assert actual==allowed
m=json.loads((ROOT/'candidate-manifest.json').read_text());assert m['newPublicFamilies']==m['catalogRegistrations']==0 and not m['published']
print(json.dumps({'status':'PASS','textFiles':len(actual),'fontBinaryOutlineMediaPrivateCount':0,'newPublicFamilies':0,'scope':'Only this text candidate; not full repository/history'}))
