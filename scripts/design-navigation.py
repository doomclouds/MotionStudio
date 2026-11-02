#!/usr/bin/env python3
"""Git-only navigation of COMMITTED trees; working-tree/untracked edits are excluded.

Read-only projection, never an admission registry. Default: short summary/entries;
use --details for source/status/rights detail.

Stdlib only. Emit JSON (default) or Markdown to stdout; no source-tree writes.
Markdown links are relative to the engine/design-elements/ directory.
Output goes to stdout; this tool does not maintain a navigation file.
"""
import argparse
import json
import posixpath
import re
import subprocess
from collections import Counter

BASE = 'engine/design-elements'
ROOT = BASE + '/recipes/'
ROLES = ('reviewed', 'candidates', 'batches')
MANIFESTS = {'catalog.json', 'recipe-manifest.json', 'candidate-manifest.json', 'candidate.json', 'entry.json'}
FORMAL_STATUS = 'technical-reviewed-static-recipe'
LINK = re.compile(r'\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)')


def git(repo, *args):
    return subprocess.check_output(['git', '-C', str(repo), *args], stderr=subprocess.PIPE)


def projection(repo, ref='HEAD'):
    commit = git(repo, 'rev-parse', '--verify', ref + '^{commit}').decode().strip()
    # Read committed blobs, not a possibly dirty working tree; do not follow symlinks.
    files = {}
    for record in git(repo, 'ls-tree', '-rz', commit, '--', BASE).split(b'\0'):
        if not record:
            continue
        meta, path = record.split(b'\t', 1)
        mode, kind, oid = meta.decode().split()
        if kind == 'blob' and mode != '120000':
            files[path.decode()] = oid
    directories = {posixpath.dirname(p) for p in files}
    for directory in list(directories):
        while '/' in directory:
            directory = posixpath.dirname(directory)
            directories.add(directory)
    texts = {}
    for path in sorted(files):
        name = posixpath.basename(path)
        if name in MANIFESTS or name in {'README.md', 'Index.md', 'package.json'}:
            texts[path] = git(repo, 'cat-file', 'blob', files[path]).decode('utf-8')
    sources = {p: files[p] for p in texts}
    docs = {p: t for p, t in texts.items() if p.endswith('.md')}
    edges = {}
    broken = []
    for path, text in docs.items():
        edges[path] = []
        for href in LINK.findall(text):
            if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', href) or href.startswith('#'):
                continue
            target = posixpath.normpath(posixpath.join(posixpath.dirname(path), href.split('#')[0]))
            if target in files or target in directories:
                edges[path].append(target)
            elif target.startswith(BASE + '/'):
                broken.append({'source': path, 'target': target})
    reached = set()
    todo = [BASE + '/README.md', BASE + '/Index.md']
    while todo:
        p = todo.pop()
        if p in reached:
            continue
        reached.add(p)
        todo.extend(edges.get(p, []))
    catalog_path = BASE + '/catalog.json'
    if catalog_path not in texts:
        raise ValueError('Required catalog missing in selected committed tree: ' + catalog_path)
    catalog = json.loads(texts[catalog_path])
    if not isinstance(catalog, dict) or not isinstance(catalog.get('assets'), list) or any(not isinstance(a, dict) for a in catalog['assets']):
        raise ValueError('Invalid catalog structure: expected object with assets array of objects: ' + catalog_path)
    families = [{k: a[k] for k in ('id', 'status', 'entry', 'guidance', 'sourceCases', 'sourceRelationship', 'sourceSceneMigrated', 'userAestheticApproval', 'verificationLimits') if k in a}
                for a in catalog['assets']]
    catalog_entry_errors = []
    for i, family in enumerate(families):
        entry = family.get('entry')
        target = posixpath.normpath(posixpath.join(BASE, entry)) if isinstance(entry, str) else ''
        valid = target.startswith(BASE + '/') and target in files
        family['entryTarget'] = target if valid else None
        family['statusSource'] = catalog_path + '#/assets/%d/status' % i
        if not valid:
            catalog_entry_errors.append({'source': catalog_path, 'pointer': '/assets/%d/entry' % i, 'value': entry, 'target': target})
    packages = []
    for name in sorted({'/'.join(p[len(ROOT):].split('/')[:2]) for p in files
                        if p.startswith(ROOT) and p[len(ROOT):].split('/')[0] in ROLES
                        and len(p[len(ROOT):].split('/')) >= 3}):
        prefix = ROOT + name + '/'
        owned = sorted(p for p in files if p.startswith(prefix))
        claims, recipe_rows, api_claims = [], [], []
        for path in owned:
            if posixpath.basename(path) not in MANIFESTS or path not in texts:
                continue
            try:
                data = json.loads(texts[path])
            except json.JSONDecodeError as error:
                raise ValueError('Invalid manifest JSON: %s (line %d)' % (path, error.lineno)) from error
            if not isinstance(data, dict) or not isinstance(data.get('recipes', []), list) or any(not isinstance(item, dict) for item in data.get('recipes', [])):
                raise ValueError('Invalid manifest structure: expected object and optional recipes array: ' + path)
            # Allowlist fields: do not copy private evidence/storage objects into another index.
            for key in ('status', 'publication', 'published', 'publicPush'):
                if key in data:
                    claims.append({'source': path, 'pointer': '/' + key, 'value': data[key]})
            for key in ('entry', 'code', 'module', 'guidance', 'guide', 'contract'):
                if key in data:
                    api_claims.append({'source': path, 'pointer': '/' + key, 'value': data[key]})
            entries = data.get('recipes', [])
            if data.get('recipeId'):
                entries = [dict(data, id=data['recipeId'])]
            for i, item in enumerate(entries):
                if not isinstance(item, dict):
                    continue
                status = item.get('status', data.get('status'))
                recipe_rows.append({'id': item.get('id'), 'status': status,
                                    'statusSource': path + ('#/recipes/%d/status' % i if 'status' in item and not data.get('recipeId') else '#/status'),
                                    'explicitReviewedRecipe': status == FORMAL_STATUS})
        # Structural distinction only; neither prose nor one reviewed item upgrades a package.
        only_index = owned == [prefix + 'Index.md']
        category = 'index-only' if only_index else 'source-package'
        rights = [p for p in owned if re.search(r'(^|/)(licenses?|notices?)(/|\.|$)|/(CREDITS|RIGHTS|COPYING|AUTHORS)(\.|$)', p, re.I)]
        incoming = sorted(p for p, targets in edges.items() if not p.startswith(prefix) and any(t.startswith(prefix) for t in targets))
        packages.append({'directory': prefix[:-1], 'category': category, 'role': name.split('/')[0],
                         'entryDocs': [p for p in owned if p in docs and posixpath.dirname(p) == prefix[:-1]],
                         'statusClaims': claims, 'recipeClaims': recipe_rows,
                         'rightsFiles': rights,
                         'entryClaims': api_claims,
                         'packageLicenseClaim': json.loads(texts[prefix + 'package.json']).get('license') if prefix + 'package.json' in texts else None,
                         'provenanceFiles': [p for p in owned if re.search(r'(source|provenance|credits|rights|dedup|retention|font.*lock|font.*spec)', posixpath.basename(p), re.I)],
                         'reachableFromDesignRoots': any(p == prefix[:-1] or p.startswith(prefix) for p in reached),
                         'incomingDesignDocLinks': incoming})
    return {'schemaVersion': 1, 'sourceCommit': commit,
            'scope': 'Committed design catalog and recipe source navigation only; no admission, publication, acceptance or legal verdict. Text/status claims may describe frozen author snapshots. Missing states stay unknown. Reachability is limited to local inline Markdown links in README.md/Index.md under design-elements, not whole-repository usage.',
            'sources': sources, 'families': families, 'packages': packages,
            'summary': {'catalogFamilyEntries': len(families), 'recipeDirectories': len(packages),
                        'directoryCategories': dict(sorted(Counter(p['category'] for p in packages).items())),
                        'directoryRoles': dict(sorted(Counter(p['role'] for p in packages).items())),
                        'explicitReviewedRecipeClaims': sum(r['explicitReviewedRecipe'] for p in packages for r in p['recipeClaims'])},
            'catalogEntryErrors': catalog_entry_errors,
            'linkCheckScope': 'Catalog entry files plus simple local inline README/Index links whose normalized target is inside design-elements; tracked files and directories accepted. No whole-navigation, anchors, external URLs, reference links, HTML, imports, or whole-repository validation.',
            'brokenDesignDocLinks': sorted(broken, key=lambda x: (x['source'], x['target']))}


def compact(data):
    return {'sourceCommit': data['sourceCommit'], 'scope': data['scope'],
            'summary': data['summary'],
            'catalog': BASE + '/catalog.json',
            'packages': [{k: p[k] for k in ('directory', 'role', 'category', 'entryDocs')} for p in data['packages']],
            'details': 'Use --details for individual source claims, rights/provenance links and scoped link diagnostics.'}


def markdown(data, details=False):
    def link(path):
        return '[' + path.removeprefix(BASE + '/') + '](' + posixpath.relpath(path, BASE) + ')'
    lines = ['# Generated design navigation', '', '<!-- Generated by scripts/design-navigation.py. Do not edit; source records remain authoritative. -->', '',
             'Commit: `' + data['sourceCommit'] + '`', '', data['scope'], '',
             data['linkCheckScope'], '',
             'Counts below are source entries/directories, not accepted artworks or new assets.', '',
             '```json', json.dumps(data['summary'], ensure_ascii=False, indent=2), '```', '', '## Catalog families' if details else '## Existing entries', '']
    if not details:
        lines.extend(['Read the authoritative ' + link(BASE + '/catalog.json') + ' and ' + link(BASE + '/Index.md') + '.', '',
                      'Use `--details` for individual lifecycle claims, rights/provenance links and scoped link diagnostics.', '',
                      '| Directory | Role / structure only | Existing entry |', '|---|---|---|'])
        for p in data['packages']:
            lines.append('| ' + p['directory'].split('/')[-1] + ' | ' + p['role'] + ' / ' + p['category'] + ' | ' + ', '.join(link(x) for x in p['entryDocs']) + ' |')
        return '\n'.join(lines) + '\n'
    lines.extend(['## Scoped link diagnostics', '', data['linkCheckScope'], ''])
    for error in data['catalogEntryErrors']:
        lines.append('- Invalid catalog entry: `' + error['source'] + '#' + error['pointer'] + '` → `' + str(error['value']) + '` (resolved: `' + error['target'] + '`).')
    for error in data['brokenDesignDocLinks']:
        lines.append('- Missing local target: `' + error['source'] + '` → `' + error['target'] + '`.')
    if not data['catalogEntryErrors'] and not data['brokenDesignDocLinks']:
        lines.append('No missing targets in the checks above; this is not whole-navigation validation.')
    lines.extend(['', '## Catalog family claims', ''])
    for f in data['families']:
        lines.append('- `' + f['id'] + '` — `' + f.get('status', 'UNKNOWN') + '` — ' + (link(f['entryTarget']) if f['entryTarget'] else 'INVALID entry — consult catalog') + ' — source: ' + link(BASE + '/catalog.json') + ' `' + f['statusSource'].split('#')[1] + '`')
    for p in data['packages']:
        lines.extend(['', '## ' + p['directory'].split('/')[-1], '', '- Directory role: `' + p['role'] + '` (not acceptance).', '- Navigation category: `' + p['category'] + '` (not lifecycle state).',
                      '- Reachable from design roots: `' + str(p['reachableFromDesignRoots']).lower() + '`.',
                      '- Read: ' + ', '.join(link(x) for x in p['entryDocs']),
                      '- Package license claim (not a legal verdict): `' + str(p['packageLicenseClaim']) + '`.',
                      '- Provenance/resources: ' + ', '.join(link(x) for x in p['provenanceFiles']),
                      '- Rights: ' + (', '.join(link(x) for x in p['rightsFiles']) or 'No package-local rights file found; inspect ancestor notices. No license inferred.')])
        for c in p['statusClaims']:
            lines.append('- Source claim `' + c['pointer'] + ' = ' + str(c['value']) + '` — ' + link(c['source']))
        if not p['statusClaims']:
            lines.append('- Machine-readable lifecycle state: UNKNOWN; consult original README/Index, not directory name.')
        for r in p['recipeClaims']:
            lines.append('- Recipe claim `' + str(r['id']) + '` / `' + str(r['status']) + '` (exact reviewed-status match: ' + str(r['explicitReviewedRecipe']).lower() + ').')
    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', default='.')
    parser.add_argument('--ref', default='HEAD')
    parser.add_argument('--format', choices=['json', 'markdown'], default='json')
    parser.add_argument('--details', action='store_true', help='Include per-source lifecycle claims, rights/provenance and scoped diagnostics')
    args = parser.parse_args()
    try:
        data = projection(args.repo, args.ref)
    except subprocess.CalledProcessError as error:
        parser.error('Git-only input failed: verify --repo and committed --ref %r. %s' % (args.ref, error.stderr.decode().strip()))
    except (ValueError, KeyError, TypeError) as error:
        parser.error('Cannot project selected committed sources: %s. This is a scoped navigation check, not full validation.' % error)
    print(markdown(data, args.details) if args.format == 'markdown' else json.dumps(data if args.details else compact(data), ensure_ascii=False, indent=2, sort_keys=True) + '\n', end='')


if __name__ == '__main__':
    main()
