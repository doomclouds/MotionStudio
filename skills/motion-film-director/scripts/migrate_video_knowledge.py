#!/usr/bin/env python3
"""Explicit one-time conversion to knowledge schema 3; never used by runtime loading.

Default is a dry-run. Apply writes a NEW library and a sibling .migration-history
snapshot. It never changes the source, follows links, or reads artifact targets.
"""
import argparse
import copy
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import tempfile

import video_knowledge as current


def require(ok, message):
    if not ok:
        raise ValueError(message)


def fields(value, allowed, label, required=()):
    require(isinstance(value, dict), f'{label}: expected object')
    unknown = set(value) - set(allowed.split())
    require(not unknown, f'{label}: unknown fields {sorted(unknown)}; explicit mapping required')
    require(set(required) <= set(value), f'{label}: missing required fields')


def load(raw):
    def pairs(items):
        result = {}
        for k, v in items:
            require(k not in result, f'duplicate JSON field: {k}')
            result[k] = v
        return result
    return json.loads(raw, object_pairs_hook=pairs,
                      parse_constant=lambda x: (_ for _ in ()).throw(ValueError('nonfinite JSON')))


def safe_path(value):
    require(isinstance(value, str) and value and '\\' not in value, 'invalid relative path')
    p = PurePosixPath(value)
    require(not p.is_absolute() and all(x not in ('', '.', '..') for x in value.split('/'))
            and p.as_posix() == value, 'unsafe relative path')
    return p


def snapshot(source):
    require(not any(p.is_symlink() for p in [source, *source.parents]), 'source path contains symlink')
    require(source.is_dir(), 'source must be an existing directory')
    result = {}
    for p in sorted(source.rglob('*')):
        require(not p.is_symlink(), f'symlink forbidden: {p.relative_to(source)}')
        if p.is_dir():
            continue
        require(p.is_file(), 'nonregular source entry')
        rel = p.relative_to(source).as_posix()
        require(p.suffix in {'.json', '.md'}, f'unsupported source file: {rel}')
        fd = os.open(p, os.O_RDONLY | os.O_NOFOLLOW)
        with os.fdopen(fd, 'rb') as stream:
            before = os.fstat(stream.fileno())
            raw = stream.read()
            after = os.fstat(stream.fileno())
        require((before.st_ino, before.st_size, before.st_mtime_ns, before.st_ctime_ns) ==
                (after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns), 'source changed during read')
        result[rel] = raw
    return result


def convert(files):
    require('index.json' in files, 'missing index.json')
    index = load(files['index.json'])
    require(isinstance(index, dict) and type(index.get('schema_version')) is int, 'invalid source index version')
    version = index['schema_version']
    require(version in (1, 2), 'only explicit old index 1 or 2 can be converted; no repeat conversion')
    expected = 'schema_version scope cases techniques ' + ('legacy' if version == 1 else 'capabilities')
    fields(index, expected, 'source index', expected.split())
    if version == 1:
        require(index['legacy'] == [], 'nonempty legacy requires a maintainer mapping; no target is read or discarded')
    else:
        require(index['capabilities'] == ['synthetic-static-probe-v1'], 'unknown source capabilities')
    output = {}
    kind_type = 'video' if version == 1 else 'static-probe'
    active = {'index.json'}
    mappings = []
    for group, kind in [('cases', 'case'), ('techniques', 'technique')]:
        require(isinstance(index[group], list), 'index entries must be arrays')
        for entry in index[group]:
            fields(entry, 'id path tags', 'index entry', ('id', 'path', 'tags'))
            rel = safe_path(entry['path']).as_posix()
            require(rel.startswith(group + '/') and rel.endswith('.json'), 'card path has wrong group/type')
            require(rel not in active and rel in files, 'duplicate or missing card path')
            active.add(rel)
            c = copy.deepcopy(load(files[rel]))
            require(isinstance(c, dict) and c.get('kind') == kind, 'wrong card kind')
            require('evidence_type' not in c, 'unknown old card field evidence_type; explicit mapping required')
            old_card_version = 2 if version == 2 and kind == 'case' else 1
            require(type(c.get('schema_version')) is int and c['schema_version'] == old_card_version, 'unexpected old card version')
            if version == 1 and kind == 'case':
                require(isinstance(c.get('source'), dict), 'video source must be an object')
                c['source'].setdefault('origin', 'external-reference')
            c['schema_version'] = 3
            c['evidence_type'] = kind_type
            if kind == 'case':
                if 'decision' not in c:
                    c['decision'] = {'schema_version': 3, 'record_state': 'not-recorded',
                        'reason': 'Source did not record a decision; no options, execution or outcome inferred.'}
                else:
                    require(isinstance(c['decision'], dict), 'old decision must be an object')
                    require('record_state' not in c['decision'], 'unknown old decision field record_state; explicit mapping required')
                    require(type(c['decision'].get('schema_version')) is int and c['decision']['schema_version'] == version,
                            'unknown old decision version')
                    c['decision']['schema_version'] = 3
                    c['decision']['record_state'] = 'recorded'
            output[rel] = (json.dumps(c, ensure_ascii=False, indent=2) + '\n').encode()
            mappings.append({'id': entry['id'], 'old_path': rel, 'new_path': rel, 'evidence_type': kind_type})
    # Unindexed records are never silently dropped or promoted. Notes are retained
    # byte-for-byte in history, not presented as current machine-readable knowledge.
    require(not [p for p in files if p.endswith('.json') and p not in active],
            'unindexed JSON requires explicit maintainer mapping')
    new_index = {k: copy.deepcopy(index[k]) for k in ('scope', 'cases', 'techniques')}
    new_index['schema_version'] = 3
    output['index.json'] = (json.dumps(new_index, ensure_ascii=False, indent=2) + '\n').encode()
    return output, mappings


def write_files(root, files, index_last=False):
    for rel in sorted(files, key=lambda p: (p == 'index.json' if index_last else False, p)):
        path = root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open('xb') as target:
            target.write(files[rel])


def migrate(source, destination, apply=False):
    source = Path(source).absolute()
    destination = Path(destination).absolute()
    require('..' not in source.parts and '..' not in destination.parts, 'source/destination must use normalized paths')
    require(not any(p.is_symlink() for p in [source, *source.parents]), 'source path contains symlink')
    require(not any(p.is_symlink() for p in [destination, *destination.parents]), 'destination path contains symlink')
    source, destination = source.resolve(), destination.resolve()
    require(source != destination and source not in destination.parents and destination not in source.parents,
            'source and destination must be disjoint')
    history = destination.with_name(destination.name + '.migration-history')
    require(not destination.exists() and not history.exists(), 'destination/history already exists; never overwritten')
    files = snapshot(source)
    output, mappings = convert(files)
    with tempfile.TemporaryDirectory(prefix='knowledge-migration-check-') as tmp:
        staging = Path(tmp)
        write_files(staging, output)
        errors, _ = current.validate(staging)
        require(not errors, 'converted library rejected: ' + '; '.join(errors))
    manifest = {'migration': 'knowledge-v1-v2-to-v3', 'status': 'dry-run',
                'source_files': {p: hashlib.sha256(raw).hexdigest() for p, raw in files.items()},
                'target_files': {p: hashlib.sha256(raw).hexdigest() for p, raw in output.items()},
                'mappings': mappings, 'preserved_history_only': sorted(set(files) - set(output)),
                'limits': 'Structural conversion only; no artifact targets read, no perception or acceptance inferred.'}
    require(snapshot(source) == files, 'source changed before publication')
    if not apply:
        return manifest
    require(destination.parent.is_dir(), 'destination parent must already exist')
    history.mkdir()  # Exclusive; retains original bytes even if publication fails.
    manifest['status'] = 'incomplete'
    history_manifest = history / 'migration.json'
    created_destination = False
    try:
        write_files(history / 'original', files)
        history_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        require(snapshot(source) == files, 'source changed before apply')
        destination.mkdir()
        created_destination = True
        try:
            write_files(destination, output, index_last=True)
            require(snapshot(source) == files, 'source changed during apply')
            errors, _ = current.validate(destination)
            require(not errors, 'published library rejected: ' + '; '.join(errors))
        except BaseException:
            shutil.rmtree(destination)  # Only this invocation's new destination.
            created_destination = False
            raise
        manifest['status'] = 'converted-not-accepted'
        complete_manifest = history / '.migration-complete.json'
        complete_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        os.replace(complete_manifest, history_manifest)
    except BaseException:
        # The untouched source and separate history survive; no valid-looking target.
        if created_destination:
            shutil.rmtree(destination)
        if not history_manifest.exists():
            history_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        raise
    return manifest


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    p.add_argument('--source', type=Path, required=True)
    p.add_argument('--destination', type=Path, required=True)
    p.add_argument('--apply', action='store_true', help='Explicitly create new destination and sibling history; never in-place')
    args = p.parse_args(argv)
    try:
        print(json.dumps(migrate(args.source, args.destination, args.apply), ensure_ascii=False, indent=2))
        return 0
    except (OSError, ValueError, TypeError, KeyError) as exc:
        print(json.dumps({'status': 'blocked', 'error': str(exc), 'source_modified': False}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
