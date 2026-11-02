#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Finite text/notice check, not a universal secret or dependency scanner."""
from pathlib import Path
import hashlib,json,re
root=Path(__file__).resolve().parent
p=json.loads((root/'source-policy.json').read_text())
expected=set(p['files']);actual=set()
for f in root.rglob('*'):
    rel=f.relative_to(root)
    if 'node_modules' in rel.parts:continue
    assert not f.is_symlink(),str(rel)
    if f.is_file():actual.add(rel.as_posix())
assert expected==actual,{'missing':sorted(expected-actual),'extra':sorted(actual-expected)}
private=re.compile(r'(?:libfile_|record_)[a-f0-9]{20,}|'+r'/work'+'space/|/t'+'mp/|fi'+'le://')
for name in sorted(actual):
    raw=(root/name).read_bytes();text=raw.decode('utf-8')
    assert b'\0' not in raw,name
    assert not private.search(text),name
    assert not name.lower().endswith(('.png','.jpg','.jpeg','.webp','.ttf','.woff','.woff2','.otf','.zip')),name
for name,sha in p['licenseSha256'].items():assert hashlib.sha256((root/name).read_bytes()).hexdigest()==sha,name
assert p['publicFamiliesAdded']==0 and p['formalRecipesAdded']==0
print(json.dumps({'status':'PASS','textFiles':len(actual),'exactLicenseNotices':len(p['licenseSha256']),'publicFamiliesAdded':0,'scope':'Finite standalone candidate only; repository index/history gate is NOT_RUN.'}))
