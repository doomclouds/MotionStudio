"""Check only this candidate's allowlisted text projection; not a repository-history scan."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parent
policy=json.loads((ROOT/'source-policy.json').read_text());allowed=set(policy['allowedPaths']);actual=set()
for p in ROOT.rglob('*'):
 if p.is_symlink():raise ValueError('no symlink in text payload')
 if not p.is_file():continue
 rel=p.relative_to(ROOT).as_posix();actual.add(rel)
 if rel not in allowed:raise ValueError('not allowlisted: '+rel)
 raw=p.read_bytes();text=raw.decode('utf-8')
 if b'\0' in raw:raise ValueError('binary/NUL: '+rel)
 for pattern in [r'libfile_[0-9a-f]{12,}',r'file_[0-9a-f]{12,}',r'/'+'workspace/',r'/home/'+'agent/',r'data:'+'image/',r'base64,[A-Za-z0-9+/]{100}',r'ext-'+'orca-'+'weave-native',r'od-'+'sixth-reusable-'+'inventory']:
  if re.search(pattern,text):raise ValueError('private/media leakage: '+rel)
assert actual==allowed,(sorted(allowed-actual),sorted(actual-allowed))
manifest=json.loads((ROOT/'candidate-manifest.json').read_text());assert manifest['newPublicFamilies']==0 and manifest['catalogRegistrations']==0 and not manifest['published']
print(json.dumps({'status':'PASS','allowlistedTextFiles':len(actual),'mediaFontPrivateEvidenceCount':0,'newPublicFamilies':0,'catalogRegistrations':0,'scope':'Current text candidate only, not full repository or Git history'}))
