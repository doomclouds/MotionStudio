#!/usr/bin/env python3
"""Finite package inventory/rights check, not a universal secret scanner."""
from pathlib import Path
import hashlib,json,re
root=Path(__file__).resolve().parent
policy=json.loads((root/'source-policy.json').read_text())
expected=set(policy['files']); assert len(expected)==27
actual=set()
for p in root.rglob('*'):
    rel=p.relative_to(root)
    if 'node_modules' in rel.parts: continue
    assert not p.is_symlink(), f'symlink: {rel}'
    if p.is_file(): actual.add(rel.as_posix())
assert actual==expected, {'missing':sorted(expected-actual),'extra':sorted(actual-expected)}
private=re.compile(r'(?:libfile_|record_)[a-f0-9]{20,}|'+r'/work'+'space/|/t'+'mp/|fi'+'le://')
for name in sorted(expected):
    raw=(root/name).read_bytes(); text=raw.decode('utf-8')
    assert b'\0' not in raw, name
    assert not private.search(text), f'private identifier or local path: {name}'
    assert not name.lower().endswith(('.png','.jpg','.ttf','.otf','.woff','.zip')), name
for name,sha in policy['licenseSha256'].items():
    assert hashlib.sha256((root/name).read_bytes()).hexdigest()==sha,name
assert len(policy['licenseSha256'])==5
print(json.dumps({'result':'PASS','textFiles':len(expected),'licenseIdentities':5,'scope':policy['scope']}))
