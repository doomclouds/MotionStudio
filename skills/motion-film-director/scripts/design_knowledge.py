"""Read-only public design-method navigation; no media, ranking or video approval."""
import argparse
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1] / 'research/design-knowledge'


def catalog(root=ROOT):
    return json.loads((root / 'index.json').read_text(encoding='utf-8'))


def find(data, text='', category=None):
    return [e for e in data['entries'] + data.get('guides', [])
            if (category is None or e['category'] == category)
            and text.casefold() in json.dumps(e, ensure_ascii=False).casefold()]


def validate(root=ROOT):
    issues = []
    data = catalog(root)
    if data.get('schema_version') != 1:
        issues.append('unsupported schema_version')
    entries = data['entries'] + data.get('guides', [])
    ids, paths = set(), set()
    for e in entries:
        for field in ('id', 'version', 'category', 'title', 'tags', 'path', 'type'):
            if field not in e:
                issues.append('missing field: ' + field)
        if not all(k in e for k in ('id', 'path', 'category', 'type', 'version', 'tags')):
            continue
        if e['id'] in ids or e['path'] in paths:
            issues.append('duplicate identity/path: ' + e['id'])
        ids.add(e['id']); paths.add(e['path'])
        target = (root / e['path']).resolve()
        if root.resolve() not in target.parents or not target.is_file():
            issues.append('invalid target: ' + e['id'])
        if e['type'] not in {'public-method-summary', 'decision-guide'}:
            issues.append('invalid type: ' + e['id'])
        if type(e['version']) is not int or e['version'] < 1 or not isinstance(e['tags'], list):
            issues.append('invalid version/tags: ' + e['id'])
        if e['type'] == 'public-method-summary':
            category = root / 'categories' / e['category'] / 'INDEX.md'
            if not category.is_file() or e['id'] not in category.read_text():
                issues.append('missing category membership: ' + e['id'])
        if e['path'] not in (root / 'INDEX.md').read_text():
            issues.append('missing total index link: ' + e['id'])
    actual = {p.relative_to(root).as_posix() for p in (root / 'cases').glob('*.md')}
    if actual != {e['path'] for e in data['entries']}:
        issues.append('case files/index differ')
    skill = root.parents[1].resolve()
    for p in root.rglob('*'):
        if not p.is_file():
            continue
        if p.suffix not in {'.md', '.json'}:
            issues.append('non-text knowledge file: ' + p.name)
            continue
        text = p.read_text(encoding='utf-8')
        # Detect common accidental private paths/media references; not a rights audit.
        if re.search(r'/workspace/|/home/|file://|data:image|library[-_]file[-_]id', text):
            issues.append('private locator: ' + p.name)
        if p.suffix == '.md':
            for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', text):
                if target.startswith(('https://', 'http://', '#')):
                    continue
                dest = (p.parent / target.split('#', 1)[0]).resolve()
                if skill not in dest.parents or not dest.is_file():
                    issues.append('broken/nonportable link: ' + p.name + ' -> ' + target)
    return issues


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['list', 'find', 'validate'])
    parser.add_argument('--text', default='')
    parser.add_argument('--category')
    args = parser.parse_args()
    try:
        if args.command == 'validate':
            issues = validate()
            result = {'valid': not issues, 'issues': issues, 'scope': 'index-and-local-links-only'}
            status = bool(issues)
        else:
            result = {'results': find(catalog(), args.text if args.command == 'find' else '', args.category),
                      'scope': 'literal-metadata-navigation-not-recommendation'}
            status = False
    except (OSError, ValueError, KeyError, TypeError) as error:
        result, status = {'valid': False, 'error': type(error).__name__}, True
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return int(status)


if __name__ == '__main__':
    raise SystemExit(main())
