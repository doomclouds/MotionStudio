"""Read-only SHA256 inventory check; no network, writes, media or artistic claims."""
import hashlib
import json
import pathlib
import sys


def verify(root):
    root = pathlib.Path(root).resolve()
    manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
    issues, seen = [], set()
    for item in manifest['files']:
        rel = item['path']
        p = (root / rel).resolve()
        if pathlib.PurePosixPath(rel).is_absolute() or '\\' in rel or root not in p.parents:
            issues.append({'path': rel, 'issue': 'unsafe_path'})
            continue
        if rel in seen:
            issues.append({'path': rel, 'issue': 'duplicate_path'})
        seen.add(rel)
        if not p.is_file():
            issues.append({'path': rel, 'issue': 'missing'})
            continue
        data = p.read_bytes()
        if len(data) != item['bytes'] or hashlib.sha256(data).hexdigest() != item['sha256']:
            issues.append({'path': rel, 'issue': 'content_mismatch'})
        if data.startswith(b'version https://git-lfs.github.com/spec/v1'):
            issues.append({'path': rel, 'issue': 'lfs_pointer'})
    actual = {p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file() and p.name != '.DS_Store'}
    for rel in sorted(actual - seen - {'manifest.json'}):
        issues.append({'path': rel, 'issue': 'unlisted'})
    return {'package_integrity': 'fail' if issues else 'pass', 'issues': issues,
            'artistic_quality': 'not_tested', 'media_playback': 'not_tested',
            'source_revalidation': 'not_tested', 'cross_platform': 'not_tested'}


if __name__ == '__main__':
    try:
        result = verify(sys.argv[1] if len(sys.argv) > 1 else '.')
    except (OSError, ValueError, KeyError, TypeError) as error:
        result = {'package_integrity': 'fail', 'issues': [{'issue': type(error).__name__}]}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(result['package_integrity'] != 'pass')
