"""Limited source projection check; NOT full repository/history policy."""
from pathlib import Path
import json
r=Path(__file__).resolve().parent;files=[]
for p in sorted(r.rglob('*')):
 if '__pycache__'in p.parts:continue
 if p.is_symlink():raise ValueError('no symlinks in public package')
 if not p.is_file():continue
 if p.suffix not in ['.mjs','.py','.json','.md','.txt']and p.name!='LICENSE':raise ValueError('text only: '+str(p))
 s=p.read_text();assert '\0'not in s
 for forbidden in ['libfile_','file_00000000','/workspace/','/tmp/','data:image/','base64,','reference/original','independent-audit-2026','READBACK-VERIFIED']:
  if forbidden in s and p.name!='check-package.py':raise ValueError('private/binary marker: '+forbidden)
 files.append(p.relative_to(r).as_posix())
print(json.dumps({'textFiles':len(files),'paths':files,'sourceOnly':True,'fullRepositoryHistoryPolicy':'NOT_RUN'}))
