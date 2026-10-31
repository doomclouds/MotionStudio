"""Positive allowlist for this candidate; does not modify source or relax root policy."""
from pathlib import Path
import json
root=Path(__file__).resolve().parent
expected=set(json.loads((root/'source-policy.json').read_text())['allowedPaths'])
actual=set()
for p in root.rglob('*'):
    if p.is_symlink():raise SystemExit('Symlink not admitted: '+str(p))
    if p.is_file():
        name=str(p.relative_to(root));actual.add(name)
        b=p.read_bytes()
        if len(b)>200_000:raise SystemExit('Unexpected large source: '+name)
        b.decode('utf8')
        if any(x in b for x in [b'lib'+b'file_',b'sediment'+b'://',b'/work'+b'space/',b'data:'+b'image/']):raise SystemExit('Private/binary payload: '+name)
if actual!=expected:raise SystemExit('Allowlist mismatch: '+repr(actual^expected))
print('Candidate source-only allowlist PASS:',len(actual),'UTF-8 files; no media/font binary exception')
