# SPDX-License-Identifier: BSD-2-Clause
"""Exact text projection check; not a combined-repository/history audit."""
from pathlib import Path
import json,re
R=Path(__file__).absolute().parent;spec=json.loads((R/'source-policy.json').read_text());expected=sorted(spec['allowedPaths']);found=[]
for f in sorted(R.rglob('*')):
 if f.is_symlink():raise ValueError('symlink in source')
 if not f.is_file():continue
 n=f.relative_to(R).as_posix();found.append(n)
 if n not in expected:raise ValueError('unlisted source '+n)
 b=f.read_bytes();s=b.decode('utf-8')
 if len(b)>200000 or b'\0' in b:raise ValueError('non-text/oversized source')
 if f.suffix.lower()in{'.png','.jpg','.jpeg','.gif','.ttf','.otf','.woff','.woff2','.zip','.mp4','.pdf'}:raise ValueError('media not source')
 patterns=[r'libfile_'+'[0-9a-f]{12,}',r'file_'+'[0-9a-f]{12,}',r'/'+'workspace/',r'/'+'home/agent/',r'data:'+'image/[^;]+;base64,[A-Za-z0-9+/]{100}',r'ext-hexfiend-'+'bytefold-native',r'independent-'+'audit-[0-9]{8}']
 if any(re.search(p,s)for p in patterns):raise ValueError('private/media source '+n)
if found!=expected:raise ValueError('missing source paths')
m=json.loads((R/'candidate-manifest.json').read_text());assert m['newPublicFamilies']==m['registryChanges']==0 and not m['published'];print(json.dumps({'status':'PASS','textFiles':len(found),'mediaFontPrivateFiles':0,'scope':'this exact projection only; zero repository history checked'}))
