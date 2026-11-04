"""Explicit, single-work frozen Git source verification. Never restores or executes code.

Current catalogs are not historical dependency identities. Only the requested
work is inspected. Missing local Git history is BLOCKED, not a global query gate.
"""
import hashlib
import json
import os
import posixpath
import re
import subprocess
from pathlib import Path
from validate_work import read, validate, unique, Blocked as ManifestError

BASE = 'engine/design-elements/'
MAX_BLOB = 2 * 1024 * 1024

class Invalid(ValueError):
    pass

class Unavailable(ValueError):
    pass

def need(ok, code):
    if not ok:
        raise Invalid(code)

def relative(name):
    need(isinstance(name, str) and bool(name), 'INVALID_PATH')
    need(not any(c in name for c in ('\\', ':', '\x00', '\n', '\r', '\t')), 'INVALID_PATH')
    need(all(p not in ('', '.', '..') for p in name.split('/')), 'NONCANONICAL_PATH')
    return name

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def local(root, name):
    relative(name)
    root = Path(root)
    need(not root.is_symlink(), 'WORK_ROOT_SYMLINK')
    p = root
    for part in name.split('/'):
        p /= part
        need(not p.is_symlink(), 'WORK_SOURCE_SYMLINK')
    need(p.is_file(), 'WORK_SOURCE_MISSING')
    return p

class GitSource:
    """Local objects only. Reject partial clones rather than trigger lazy fetch."""
    def __init__(self, root, commit):
        self.root = Path(root)
        self.commit = commit
        self.cache = {}
        need(re.fullmatch(r'[0-9a-f]{40}', commit or '') is not None, 'INVALID_COMMIT')
        if not self.root.is_dir():
            raise Unavailable('SOURCE_REPOSITORY_MISSING')
        self.env = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
        self.env.update(GIT_NO_REPLACE_OBJECTS='1', GIT_NO_LAZY_FETCH='1', GIT_TERMINAL_PROMPT='0')
        top = self.git('rev-parse', '--show-toplevel', required=False)
        if top.returncode or Path(top.stdout.decode().strip()).resolve() != self.root.resolve():
            raise Unavailable('SOURCE_GIT_ROOT_MISMATCH_OR_UNAVAILABLE')
        config = self.git('config', '--get-regexp', r'^(extensions\.partialclone|remote\..*\.promisor)$', required=False)
        if config.returncode == 0 and config.stdout.strip():
            raise Unavailable('PARTIAL_CLONE_REQUIRES_EXPLICIT_LOCAL_SOURCE')
        obj = self.git('cat-file', '-t', commit, required=False)
        if obj.returncode:
            raise Unavailable('PINNED_COMMIT_UNAVAILABLE')
        need(obj.stdout.strip() == b'commit', 'PINNED_OBJECT_NOT_COMMIT')

    def git(self, *args, required=True):
        try:
            r = subprocess.run(['git', '--no-replace-objects', '-c', 'protocol.allow=never', '-C', str(self.root), *args],
                               capture_output=True, env=self.env, timeout=30)
        except (OSError, subprocess.TimeoutExpired) as e:
            raise Unavailable('LOCAL_GIT_EXECUTION_UNAVAILABLE') from e
        if required and r.returncode:
            raise Unavailable('LOCAL_GIT_OBJECT_READ_BLOCKED')
        return r

    def read(self, name):
        relative(name)
        if name in self.cache:
            return self.cache[name]
        parts = (BASE + name).split('/')
        oid = None
        for i in range(1, len(parts) + 1):
            rel = '/'.join(parts[:i])
            raw = self.git('ls-tree', '-z', self.commit, '--', rel).stdout
            need(raw and raw.count(b'\x00') == 1, 'HISTORICAL_PATH_MISSING')
            meta, actual = raw[:-1].split(b'\t', 1)
            need(actual.decode('utf-8') == rel, 'HISTORICAL_PATH_AMBIGUOUS')
            mode, kind, oid = meta.decode().split()
            if i < len(parts):
                need((mode, kind) == ('040000', 'tree'), 'HISTORICAL_SYMLINK_OR_NON_DIRECTORY')
            else:
                need(mode in ('100644', '100755') and kind == 'blob', 'HISTORICAL_NONREGULAR_SOURCE')
        size = int(self.git('cat-file', '-s', oid).stdout)
        need(size <= MAX_BLOB, 'SOURCE_BLOB_TOO_LARGE')
        raw = self.git('cat-file', 'blob', oid).stdout
        need(b'\x00' not in raw, 'NON_TEXT_SOURCE')
        raw.decode('utf-8')
        self.cache[name] = raw
        return raw


def tokens(source, *, strict_templates=True):
    """Bounded JS lexer: strings/comments/regex/templates cannot hide imports.

    Not a JS parser. Dependency words inside template literals are rejected;
    escaped identifiers and ambiguous regex forms are unsupported, not guessed.
    """
    need(not source.lstrip('\ufeff').startswith('#!'), 'UNSUPPORTED_HASHBANG')
    result = []
    module_word_offsets = set()
    i = 0
    expression_prefix = {'(', '[', '{', '=', ':', ',', ';', '!', '?', '=>', '&&', '||'}
    while i < len(source):
        c = source[i]
        if c.isspace():
            i += 1
            continue
        if source.startswith('//', i):
            end = re.search(r'[\r\n\u2028\u2029]', source[i + 2:])
            i = len(source) if end is None else i + 2 + end.end()
            continue
        if source.startswith('/*', i):
            j = source.find('*/', i + 2)
            need(j >= 0, 'UNTERMINATED_COMMENT')
            i = j + 2
            continue
        if c == '`' and strict_templates:
            # Accept literal text and a deliberately small interpolation subset.
            # Do not search for the next backtick: it may be inside a quoted
            # interpolation expression, leaving real code hidden in a string.
            i += 1
            while i < len(source) and source[i] != '`':
                need(source[i] != '\\', 'UNSUPPORTED_TEMPLATE_EXPRESSION')
                if source.startswith('${', i):
                    start = i = i + 2
                    quote = None
                    while i < len(source):
                        ch = source[i]
                        need(ch not in ('`', '\\', '{'), 'UNSUPPORTED_TEMPLATE_EXPRESSION')
                        if quote:
                            if ch == quote:
                                quote = None
                        elif ch in "'\"":
                            quote = ch
                        elif ch == '}':
                            break
                        else:
                            need(ch != '/', 'UNSUPPORTED_TEMPLATE_EXPRESSION')
                        i += 1
                    need(i < len(source) and quote is None, 'UNTERMINATED_TEMPLATE_EXPRESSION')
                    need(not re.search(r'\b(import|export|require|eval|Function)\b', source[start:i]),
                         'UNSUPPORTED_TEMPLATE_EXPRESSION')
                i += 1
            need(i < len(source), 'UNTERMINATED_LITERAL')
            result.append(('opaque', '`'))
            i += 1
            continue
        if c in "'\"`":
            quote, start = c, i
            i += 1
            escaped = False
            while i < len(source):
                if source[i] == '\\':
                    escaped = True
                    i += 2
                elif source[i] == quote:
                    break
                else:
                    i += 1
            need(i < len(source), 'UNTERMINATED_LITERAL')
            value = source[start + 1:i]
            if quote == '`':
                if strict_templates:
                    need(not re.search(r'\b(import|export|require|eval|Function)\b|\\', value), 'UNSUPPORTED_TEMPLATE_EXPRESSION')
                result.append(('opaque', '`'))
            else:
                result.append(('escaped-string' if escaped else 'string', value))
            i += 1
            continue
        if c == '/':
            prev = result[-1] if result else None
            property_word = len(result) >= 2 and result[-2] in (('punct', '.'), ('punct', '?.'))
            regex_prefix = (prev is None or
                            (prev[0] == 'punct' and prev[1] in expression_prefix) or
                            (prev == ('word', 'return') and not property_word))
            if regex_prefix:
                start = i
                i += 1
                in_class = False
                while i < len(source):
                    ch = source[i]
                    if ch == '\\':
                        i += 2
                        continue
                    if ch == '[':
                        in_class = True
                    elif ch == ']':
                        in_class = False
                    elif ch == '/' and not in_class:
                        break
                    need(ch not in '\r\n\u2028\u2029', 'UNSUPPORTED_REGEX')
                    i += 1
                need(i < len(source), 'UNTERMINATED_REGEX')
                # Regex/division disambiguation is intentionally conservative.
                # Never discard a regex-looking span containing dependency words.
                need(not re.search(r'\b(import|export|require|eval|Function)\b', source[start:i]),
                     'UNSUPPORTED_DEPENDENCY_REGEX')
                i += 1
                while i < len(source) and source[i].isalpha():
                    i += 1
                result.append(('opaque', 'regex'))
                continue
        need(c != '\\', 'ESCAPED_IDENTIFIER_UNSUPPORTED')
        m = re.match(r'[A-Za-z_$][A-Za-z0-9_$]*', source[i:])
        if m:
            if m.group() in ('import', 'export'):
                module_word_offsets.add(i)
            result.append(('word', m.group()))
            i += len(m.group())
        else:
            op = source[i:i + 2]
            if op in ('=>', '&&', '||', '?.'):
                result.append(('punct', op)); i += 2
            else:
                result.append(('punct', c)); i += 1
    if strict_templates:
        # Fail closed on every lexically visible module keyword that our small
        # lexer skipped. Offsets (not counts) prevent a different token from
        # compensating for a hidden declaration. Even harmless comments and
        # literals containing these words are outside this supported subset.
        raw_offsets = {m.start() for m in re.finditer(r'\b(?:import|export)\b', source)}
        need(raw_offsets <= module_word_offsets, 'UNSUPPORTED_HIDDEN_MODULE_WORD')
    return result


def specifiers(raw):
    ts = tokens(raw.decode('utf-8'))
    paths = []
    for i, (kind, value) in enumerate(ts):
        if kind == 'string':
            need(value not in ('eval', 'Function', 'require'), 'UNSUPPORTED_LITERAL_EVALUATOR_ACCESS')
        if kind != 'word':
            continue
        need(value not in ('require', 'eval', 'Function'), 'UNSUPPORTED_DEPENDENCY_EVALUATION')
        if value not in ('import', 'export'):
            continue
        rest = ts[i + 1:]
        need(bool(rest), 'INCOMPLETE_MODULE_DECLARATION')
        if value == 'import':
            need(rest[0][1] not in ('(', '.', '?.'), 'DYNAMIC_OR_META_IMPORT_UNSUPPORTED')
            if rest[0][0] == 'string':
                need(len(rest) == 1 or rest[1][1] == ';', 'UNSUPPORTED_IMPORT_SUFFIX')
                paths.append(rest[0][1]); continue
            need(rest[0][0] != 'escaped-string', 'ESCAPED_SPECIFIER_UNSUPPORTED')
        elif rest[0][1] not in ('*', '{'):
            continue  # ordinary export const/function/class/default has no source
        j = 0
        while j < len(rest) and rest[j][1] not in ('from', ';'):
            need(rest[j][0] == 'word' or rest[j][1] in ('*', '{', '}', ','), 'UNSUPPORTED_MODULE_DECLARATION')
            j += 1
        if j == len(rest) or rest[j][1] != 'from':
            need(value == 'export', 'IMPORT_SOURCE_MISSING')
            continue
        need(j + 1 < len(rest) and rest[j + 1][0] == 'string', 'NON_LITERAL_MODULE_SOURCE')
        need(j + 2 == len(rest) or rest[j + 2][1] == ';', 'UNSUPPORTED_IMPORT_SUFFIX')
        paths.append(rest[j + 1][1])
    return paths


def target(parent, spec):
    need(spec.startswith(('./', '../')), 'NON_LOCAL_DEPENDENCY_UNSUPPORTED')
    need(not any(c in spec for c in ('\\', ':', '%', '?', '#')), 'ENCODED_DEPENDENCY_UNSUPPORTED')
    return relative(posixpath.normpath(posixpath.join(posixpath.dirname(parent), spec)))


def closure(source, entry, seen=None):
    relative(entry)
    seen = set() if seen is None else seen
    if entry in seen:
        return seen
    need(len(seen) < 128, 'DEPENDENCY_LIMIT')
    raw = source.read(entry)
    seen.add(entry)
    for spec in specifiers(raw):
        need(not spec.startswith('node:'), 'RUNTIME_DEPENDENCY_UNSUPPORTED')
        closure(source, target(entry, spec), seen)
    return seen


def historical_catalog(source):
    data = json.loads(source.read('catalog.json'), object_pairs_hook=unique)
    need(isinstance(data, dict) and isinstance(data.get('assets'), list), 'HISTORICAL_CATALOG_INVALID')
    assets = data['assets']
    need(all(isinstance(a, dict) and isinstance(a.get('id'), str) and isinstance(a.get('entry'), str)
             for a in assets), 'HISTORICAL_CATALOG_INVALID')
    ids = [a['id'] for a in assets]
    need(all(isinstance(i, str) for i in ids) and len(ids) == len(set(ids)), 'HISTORICAL_CATALOG_DUPLICATE_ID')
    return assets


def verify_source(work, git_root):
    """Verify only one work's recorded design dependency identities; never execute.

    `work` is a work directory or its work.json. PASSED covers static source
    identities, not complete runtime restoration, render or acceptance.
    """
    p = Path(work)
    root = p.parent if p.name == 'work.json' else p
    result = {'id': root.name, 'status': 'FAILED', 'sourceVerification': 'FAILED',
              'recoveryAvailability': 'INVALID_SOURCE', 'checks': [], 'errors': [],
              'scope': 'Selected-work historical design source identities only; no restore or execution.',
              'limitations': ['Not runtime/font/resource recovery', 'Not rendering, visual review or new acceptance',
                              'Conservative static ESM subset; unsupported dependency syntax fails closed',
                              'Only lexically visible static ESM closure; does not prove runtime dependency completeness or detect reflection/string-generated dependencies',
                              'Not a general JavaScript execution-safety analysis or hostile-code sandbox']}
    try:
        d = read(local(root, 'work.json'))
        validate(d, root)
        result['id'] = d['id']
        usages = d.get('design', {}).get('assetUsage', [])
        if not usages:
            result.update(status='NOT_APPLICABLE', sourceVerification='NOT_APPLICABLE', recoveryAvailability='NOT_CHECKED')
            return result
        need(len({u['familyId'] for u in usages}) == len(usages), 'DUPLICATE_FAMILY_USAGE')
        providers = {}
        def provider(commit):
            if commit not in providers:
                providers[commit] = GitSource(git_root, commit)
            return providers[commit]
        for u in usages:
            src = provider(u['sourceCommit'])
            catalog = historical_catalog(src)
            matches = [a for a in catalog if a['id'] == u['familyId']]
            need(len(matches) == 1, 'HISTORICAL_FAMILY_MISSING_OR_DUPLICATE')
            entry = relative(matches[0]['entry'])
            need(u['modulePath'] == BASE + entry, 'HISTORICAL_FAMILY_PATH_MISMATCH')
            need(sha(src.read(entry)) == u['moduleSha256'], 'MODULE_HASH_MISMATCH')
            deps = closure(src, entry)
            code = local(root, u['callsite']).read_text()
            need(u['importToken'] == Path(entry).name and u['importToken'] in code, 'IMPORT_EVIDENCE_MISSING')
            # Lexical call evidence only, never an execution/reachability claim.
            ct = tokens(code, strict_templates=False)
            need(any(a == ('word', u['callToken']) and b[1] == '(' for a, b in zip(ct, ct[1:])), 'CALL_EVIDENCE_MISSING')
            if u['mode'] == 'vendored-snapshot':
                need(sha(local(root, u['snapshotPath']).read_bytes()) == u['moduleSha256'], 'SNAPSHOT_HASH_MISMATCH')
                snapshots = read(local(root, 'module-snapshots.json'))
                need(isinstance(snapshots, dict) and isinstance(snapshots.get('files'), list), 'SNAPSHOT_FIELDS')
                rows = snapshots['files']
                matched = {}
                entry_recorded = False
                for row in rows:
                    need(isinstance(row, dict) and all(isinstance(row.get(k), str) for k in ('path', 'sha256', 'source_url', 'mode')), 'SNAPSHOT_ROW_FIELDS')
                    need(re.fullmatch(r'[0-9a-f]{64}', row['sha256']), 'SNAPSHOT_ROW_HASH')
                    prefix = 'https://github.com/doomclouds/MotionStudio/blob/' + u['sourceCommit'] + '/' + BASE
                    need(row['source_url'].startswith(prefix), 'SNAPSHOT_PROVENANCE_MISMATCH')
                    name = relative(row['source_url'][len(prefix):])
                    raw = local(root, row['path']).read_bytes()
                    need(sha(raw) == row['sha256'] and raw == src.read(name), 'SNAPSHOT_SOURCE_MISMATCH')
                    if row['path'] == u['snapshotPath']:
                        need(name == entry, 'SNAPSHOT_ENTRY_MISMATCH')
                        entry_recorded = True
                    need(name not in matched, 'DUPLICATE_SNAPSHOT_SOURCE')
                    matched[name] = row['path']
                need(entry_recorded and entry in matched and deps <= matched.keys(), 'SNAPSHOT_CLOSURE_INCOMPLETE')
                for name in matched:
                    offset = posixpath.relpath(name, posixpath.dirname(entry) or '.')
                    expected = relative(posixpath.normpath(posixpath.join(posixpath.dirname(u['snapshotPath']), offset)))
                    need(matched[name] == expected, 'SNAPSHOT_DEPENDENCY_LAYOUT_MISMATCH')
            else:
                need(u['snapshotPath'] is None, 'RUNTIME_HAS_SNAPSHOT')
                lock_path = root / 'ui-dependencies.json'
                if lock_path.exists():
                    lock = read(local(root, 'ui-dependencies.json'))
                    fields = {'repository', 'root', 'files', 'dependency_commit', 'verification_status'} if d['lifecycle'] == 'candidate' else {'repository', 'root', 'files', 'tested_commit'}
                    need(isinstance(lock, dict) and set(lock) == fields, 'DEPENDENCY_LOCK_FIELDS')
                    need(isinstance(lock['files'], list) and all(isinstance(lock[k], str) for k in fields - {'files'}), 'DEPENDENCY_LOCK_TYPES')
                    need(lock['repository'] == 'MotionStudio', 'DEPENDENCY_LOCK_REPOSITORY')
                    commit = lock.get('dependency_commit', lock.get('tested_commit'))
                    need(commit == u['sourceCommit'] and lock['root'] == BASE[:-1], 'DEPENDENCY_LOCK_IDENTITY')
                    if d['lifecycle'] == 'candidate':
                        need(lock['verification_status'] == 'NOT_RUN', 'CANDIDATE_LOCK_STATUS')
                    names = []
                    for row in lock['files']:
                        need(isinstance(row, dict) and set(row) == {'path', 'sha256'} and all(isinstance(v, str) for v in row.values()), 'DEPENDENCY_ROW_FIELDS')
                        need(re.fullmatch(r'[0-9a-f]{64}', row['sha256']), 'DEPENDENCY_ROW_HASH')
                        name = relative(row['path']); names.append(name)
                        need(sha(src.read(name)) == row['sha256'], 'DEPENDENCY_HASH_MISMATCH')
                    need(len(names) == len(set(names)), 'DUPLICATE_DEPENDENCY')
                    need(deps <= set(names), 'DEPENDENCY_CLOSURE_INCOMPLETE')
                else:
                    need(u['moduleSha256'] in code, 'RUNTIME_HASH_EVIDENCE_MISSING')
                need(('MOTION_UI_ASSETS_ROOT' in code and 'import(' in code) or u['modulePath'] in code, 'RUNTIME_SOURCE_LOCATION_MISSING')
            result['checks'].append({'familyId': u['familyId'], 'sourceCommit': u['sourceCommit'],
                                     'modulePath': u['modulePath'], 'closure': sorted(deps), 'status': 'PASSED'})
        result.update(status='PASSED', sourceVerification='PASSED', recoveryAvailability='NOT_CHECKED')
    except Unavailable as e:
        result.update(status='BLOCKED', sourceVerification='BLOCKED', recoveryAvailability='BLOCKED_FOR_RESTORE')
        result['errors'].append(str(e))
    except (Invalid, ManifestError, OSError, ValueError, KeyError, TypeError, UnicodeError) as e:
        result['errors'].append(str(e))
    return result
