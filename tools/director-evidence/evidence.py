#!/usr/bin/env python3
"""Local, opt-in evidence capture. Not a model observer or acceptance gate."""
import argparse
import hashlib
import json
import os
import re
from pathlib import Path
import subprocess
import sys
import tempfile
import uuid
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[2]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def identity(path):
    path = Path(path).resolve(strict=True)
    return {'path': str(path), 'sha256': digest(path.read_bytes())}


def save(store, record):
    record.update(schema='director-evidence/2', authentication='local_unsigned',
                  interpretation='tool_observation_not_model_understanding_or_acceptance')
    target = store / (uuid.uuid4().hex + '.json')
    target.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
    print(f'RECEIPT {target}', file=sys.stderr)
    return target


def read_file(store, path, start, end):
    path = Path(path).resolve(strict=True)
    data = path.read_bytes()
    lines = data.decode('utf-8').splitlines(keepends=True)
    end = len(lines) if end is None else end
    if start < 1 or end < start or end > len(lines):
        raise ValueError('line range must be within the file')
    payload = ''.join(lines[start - 1:end])
    # Record only after the requested text has been emitted successfully.
    sys.stdout.write(payload)
    sys.stdout.flush()
    return save(store, {'kind': 'text_emitted', 'file': {'path': str(path), 'sha256': digest(data)},
                        'lines': [start, end], 'total_lines': len(lines),
                        'emitted_sha256': digest(payload.encode()),
                        'limit': 'stdout emission only; downstream truncation, reading and understanding are unknown'})


def run_node(store, entry, watched, outputs, arguments):
    entry = Path(entry).resolve(strict=True)
    paths = sorted(set([entry] + [Path(p).resolve(strict=True) for p in watched]))
    before = [identity(p) for p in paths]
    output_paths = [Path(p).resolve() for p in outputs]
    prior_outputs = {str(p): identity(p)['sha256'] if p.is_file() else None for p in output_paths}
    with tempfile.TemporaryDirectory(prefix='v8-', dir=store) as temporary:
        env = dict(os.environ, NODE_V8_COVERAGE=temporary)
        process = subprocess.Popen(['node', str(entry), *arguments], env=env,
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()
        completed = subprocess.CompletedProcess(process.args, process.returncode, stdout, stderr)
        raw = []
        coverage = []
        for p in sorted(Path(temporary).glob('*.json')):
            target = store / (uuid.uuid4().hex + '.v8.json')
            target.write_bytes(p.read_bytes())
            match = re.fullmatch(r'coverage-(\d+)-(\d+)-(\d+)\.json', p.name)
            producer_pid = int(match[1]) if match else None
            thread_id = int(match[3]) if match else None
            included = producer_pid == process.pid and thread_id == 0
            raw.append(dict(identity(target), original_name=p.name, producer_pid=producer_pid,
                            thread_id=thread_id, included=included))
            if not included:
                continue
            for script in json.loads(p.read_text()).get('result', []):
                url = urlparse(script['url'])
                if url.scheme != 'file':
                    continue
                source = Path(unquote(url.path)).resolve()
                if source not in paths:
                    continue
                coverage.append({'path': str(source), 'functions': script['functions']})
        logs = []
        for name, data in [('stdout', completed.stdout), ('stderr', completed.stderr)]:
            p = store / (uuid.uuid4().hex + '.' + name + '.txt')
            p.write_bytes(data)
            logs.append(identity(p))
        after = [identity(p) if p.is_file() else {'path': str(p), 'sha256': None} for p in paths]
        artifacts = []
        for p in output_paths:
            if p.is_file():
                artifact = identity(p)
                artifact['changed_from_before'] = artifact['sha256'] != prior_outputs[str(p)]
                artifacts.append(artifact)
            else:
                artifacts.append({'path': str(p), 'sha256': None, 'changed_from_before': False})
        save(store, {'kind': 'node_execution', 'command': ['node', str(entry), *arguments],
                     'cwd': str(Path.cwd()), 'returncode': completed.returncode,
                     'execution_scope': 'entry_process_main_thread', 'entry_pid': process.pid,
                     'sources_before': before, 'sources_after': after,
                     'sources_unchanged': before == after, 'coverage': coverage,
                     'raw_coverage': raw, 'logs': logs, 'outputs': artifacts,
                     'limit': 'V8 ranges observed only in watched files of the entry process main thread. Child processes and workers are excluded. Module evaluation is not API consumption; function entry is not return-value use, pixel impact, quality, or listening. Unwatched code and other runtimes are not covered.'})
        sys.stdout.buffer.write(completed.stdout)
        sys.stderr.buffer.write(completed.stderr)
        return completed.returncode


def check(store):
    errors = []
    count = 0
    for receipt in sorted(store.glob('*.json')):
        if receipt.name.endswith('.v8.json'):
            continue
        data = json.loads(receipt.read_text())
        if data.get('schema') not in ('director-evidence/1', 'director-evidence/2'):
            errors.append(f'{receipt.name}: unsupported receipt')
            continue
        count += 1
        if data['kind'] == 'text_emitted':
            references = [data['file']]
        elif data['kind'] == 'node_execution':
            references = data['sources_after'] + data['raw_coverage'] + data['logs'] + data['outputs']
            if data['returncode'] != 0:
                errors.append(f'{receipt.name}: execution failed ({data["returncode"]})')
            if not data['sources_unchanged']:
                errors.append(f'{receipt.name}: source changed during execution')
            if data.get('execution_scope') != 'entry_process_main_thread' or not data.get('entry_pid'):
                errors.append(f'{receipt.name}: legacy/unscoped execution receipt; rerun to establish process scope')
            included = [raw for raw in data['raw_coverage'] if raw.get('included')]
            if not included:
                errors.append(f'{receipt.name}: no entry-process main-thread V8 coverage produced')
            for raw in included:
                if raw.get('producer_pid') != data.get('entry_pid') or raw.get('thread_id') != 0:
                    errors.append(f'{receipt.name}: coverage producer does not match entry process main thread')
            observed = {item['path'] for item in data['coverage']}
            for source in data['sources_before']:
                if source['path'] not in observed:
                    errors.append(f'{receipt.name}: requested source not observed by V8: {source["path"]}')
        else:
            errors.append(f'{receipt.name}: unknown kind')
            continue
        for ref in references:
            p = Path(ref['path'])
            if ref['sha256'] is None or not p.is_file() or digest(p.read_bytes()) != ref['sha256']:
                errors.append(f'{receipt.name}: missing or stale: {p}')
    if not count:
        errors.append('no receipts')
    print(json.dumps({'receipts': count, 'integrity_errors': errors,
                      'acceptance': 'NOT_ASSESSED', 'model_understanding': 'NOT_OBSERVABLE',
                      'authentication': 'local_unsigned'}, ensure_ascii=False, indent=2))
    return bool(errors)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--store', required=True, help='authorized private directory outside repository')
    sub = parser.add_subparsers(dest='action', required=True)
    read = sub.add_parser('read', help='emit exact UTF-8 text and a range receipt; no search')
    read.add_argument('path')
    read.add_argument('--start', type=int, default=1)
    read.add_argument('--end', type=int)
    run = sub.add_parser('run-node', help='execute the requested Node entry with V8 coverage')
    run.add_argument('--watch', action='append', default=[], help='exact implementation file to observe')
    run.add_argument('--output', action='append', default=[], help='expected output file; hash is not quality')
    run.add_argument('entry')
    run.add_argument('arguments', nargs=argparse.REMAINDER)
    sub.add_parser('check', help='recheck local byte identities, not artistic acceptance')
    args = parser.parse_args()
    store = Path(args.store).resolve()
    if store == ROOT or ROOT in store.parents:
        parser.error('evidence must stay outside the source repository')
    store.mkdir(parents=True, exist_ok=True)
    try:
        if args.action == 'read':
            read_file(store, args.path, args.start, args.end)
            return 0
        if args.action == 'run-node':
            return run_node(store, args.entry, args.watch, args.output, args.arguments)
        return check(store)
    except (OSError, ValueError, KeyError) as error:
        print(str(error), file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
