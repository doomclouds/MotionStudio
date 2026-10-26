#!/usr/bin/env python3
"""Typed synthetic static records. Declarations are not proof of execution.

No networking, subprocesses, probe execution or implicit artifact reads.
"""
import hashlib
import json
import math
import os
import re
import stat
from datetime import datetime
from pathlib import Path, PurePosixPath

CAPABILITY = 'synthetic-static-probe-v1'
HASH = re.compile(r'[0-9a-f]{64}')
ID = re.compile(r'[a-zA-Z0-9][a-zA-Z0-9._-]*')
UNAVAILABLE = {'stale', 'withdrawn', 'superseded', 'falsified'}
METRIC_UNITS = {'8bit-channel', 'normalized-channel', 'ratio', 'count', 'pixels', 'boolean'}


def require(ok, message):
    if not ok:
        raise ValueError(message)


def exact(value, fields, label):
    require(isinstance(value, dict) and set(value) == set(fields.split()),
            f'{label}: exact fields required: {fields}')


def string(value):
    return isinstance(value, str) and bool(value.strip())


def strings(value, nonempty=False):
    return (isinstance(value, list) and (bool(value) or not nonempty)
            and all(string(x) for x in value) and len(value) == len(set(value)))


def identifier(value):
    return isinstance(value, str) and ID.fullmatch(value) is not None


def number(value):
    if type(value) not in (int, float):
        return False
    try:
        return math.isfinite(value)
    except OverflowError:
        return False


def safe_relative(value):
    if not string(value) or '\\' in value or '\x00' in value or ':' in value:
        return False
    p = PurePosixPath(value)
    return (not p.is_absolute() and all(x not in ('', '.', '..') for x in value.split('/'))
            and p.as_posix() == value)


def json_data(value, depth=0):
    """Bounded data only; never instructions to execute."""
    require(depth <= 12, 'parameter nesting exceeds limit')
    if value is None or type(value) in (str, bool):
        return
    if number(value):
        return
    if isinstance(value, list):
        require(len(value) <= 1000, 'parameter array exceeds limit')
        for x in value:
            json_data(x, depth + 1)
        return
    if isinstance(value, dict):
        require(len(value) <= 1000 and all(string(k) for k in value), 'invalid parameter keys')
        for x in value.values():
            json_data(x, depth + 1)
        return
    raise ValueError('parameters must be finite JSON data')


def json_equal(left, right):
    """JSON equality: booleans never impersonate numbers, including nested data."""
    if number(left) and number(right):
        return left == right
    if type(left) is not type(right):
        return False
    if isinstance(left, dict):
        return left.keys() == right.keys() and all(json_equal(left[k], right[k]) for k in left)
    if isinstance(left, list):
        return len(left) == len(right) and all(json_equal(a, b) for a, b in zip(left, right))
    return left == right


def validate_case(c):
    exact(c, 'schema_version kind id revision title status tags revision_note supersedes source artifact run artifacts observations technique_ids feedback decision', 'static Case')
    require(type(c['schema_version']) is int and c['schema_version'] == 2 and c['kind'] == 'case', 'static Case version/kind')
    require(isinstance(c['id'], str) and re.fullmatch(r'case-[a-z0-9]+(?:-[a-z0-9]+)*', c['id']), 'invalid case ID')
    require(type(c['revision']) is int and c['revision'] > 0, 'invalid revision')
    require(all(string(c[k]) for k in ('title', 'revision_note')), 'missing case text')
    require(c['status'] in {'recorded-with-limits', 'planned', 'failed', 'inconclusive'} | UNAVAILABLE, 'invalid static status')
    for key in ('tags', 'supersedes', 'technique_ids'):
        require(strings(c[key]), f'invalid {key}')
    require(c['feedback'] == [], 'synthetic static records cannot assert owner feedback')
    exact(c['source'], 'origin creator title rights access', 'static source')
    require(c['source']['origin'] == 'synthetic', 'static source must remain synthetic')
    require(all(string(v) for v in c['source'].values()), 'missing source text')
    exact(c['artifact'], 'kind', 'artifact type')
    require(c['artifact']['kind'] == 'static-probe', 'unsupported artifact type')
    require(isinstance(c['artifacts'], list) and 1 <= len(c['artifacts']) <= 128, 'artifact count must be 1..128')
    artifacts = {}
    filenames = set()
    for a in c['artifacts']:
        exact(a, 'id role filename sha256 media_type origin width height', 'artifact')
        require(identifier(a['id']) and a['id'] not in artifacts, 'invalid/duplicate artifact ID')
        require(a['role'] in {'script', 'input', 'output', 'result', 'contract'}, 'invalid artifact role')
        require(safe_relative(a['filename']), 'artifact filename must be normalized safe relative path')
        require(a['filename'] not in filenames, 'artifact filename cannot impersonate multiple identities')
        filenames.add(a['filename'])
        require(isinstance(a['sha256'], str) and HASH.fullmatch(a['sha256']), 'invalid artifact hash')
        require(string(a['media_type']) and a['origin'] in {'synthetic', 'source'}, 'invalid artifact provenance/type')
        if a['role'] == 'output':
            require(a['origin'] == 'synthetic', 'probe output must be synthetic')
        if a['media_type'].startswith('image/'):
            require(all(type(a[k]) is int and 0 < a[k] <= 32768 for k in ('width', 'height')), 'image dimensions required')
        else:
            require(a['width'] is None and a['height'] is None, 'non-image dimensions must be null')
        artifacts[a['id']] = a
    run = c['run']
    exact(run, 'id execution_state execution_evidence recorded_at executed_at executed_at_unknown_reason exit_code exit_code_unknown_reason script_artifact_id result_artifact_id input_artifact_ids environment parameters variants', 'run')
    require(identifier(run['id']), 'invalid run ID')
    require(run['execution_state'] in {'recorded-executed', 'planned', 'failed', 'inconclusive'}, 'invalid execution state')
    require(run['execution_evidence'] in {'recorded-receipt', 'rerun-receipt', 'none'}, 'invalid execution evidence')
    require(string(run['recorded_at']), 'recorded_at required')
    require(datetime.fromisoformat(run['recorded_at'].replace('Z', '+00:00')).tzinfo is not None, 'recorded_at needs timezone')
    for key, reason in [('executed_at', 'executed_at_unknown_reason'), ('exit_code', 'exit_code_unknown_reason')]:
        if run[key] is None:
            require(string(run[reason]), f'unknown {key} needs reason')
        else:
            require((string(run[key]) if key == 'executed_at' else type(run[key]) is int), f'invalid {key}')
            require(run[reason] is None, f'known {key} must not carry unknown reason')
    if run['executed_at'] is not None:
        require(datetime.fromisoformat(run['executed_at'].replace('Z', '+00:00')).tzinfo is not None, 'executed_at needs timezone')
    if run['execution_state'] == 'recorded-executed':
        require(run['exit_code'] in (None, 0), 'recorded-executed conflicts with nonzero exit')
    require(artifacts.get(run['script_artifact_id'], {}).get('role') == 'script', 'missing script artifact')
    if run['execution_state'] != 'planned':
        require(run['execution_evidence'] != 'none', 'execution needs receipt declaration')
        require(artifacts.get(run['result_artifact_id'], {}).get('role') == 'result', 'execution needs result artifact')
    else:
        require(run['execution_evidence'] == 'none' and run['result_artifact_id'] is None
                and run['executed_at'] is None and run['exit_code'] is None, 'planned run cannot claim execution receipt')
    require(strings(run['input_artifact_ids']), 'invalid input IDs')
    require(all(artifacts.get(i, {}).get('role') == 'input' for i in run['input_artifact_ids']), 'missing input artifact')
    exact(run['environment'], 'runtime runtime_version backend backend_version os arch', 'environment')
    require(all(string(v) for v in run['environment'].values()), 'missing environment identity')
    require(isinstance(run['parameters'], dict), 'run parameters must be object')
    json_data(run['parameters'])
    require(isinstance(run['variants'], list) and 1 <= len(run['variants']) <= 64, 'variant count must be 1..64')
    variants = {}
    output_owner = {}
    for v in run['variants']:
        exact(v, 'id parameters output_artifact_ids reference_semantics', 'variant')
        require(identifier(v['id']) and v['id'] not in variants, 'invalid/duplicate variant')
        require(isinstance(v['parameters'], dict), 'variant parameters must be object')
        json_data(v['parameters'])
        require(strings(v['output_artifact_ids']) and string(v['reference_semantics']), 'invalid variant outputs/semantics')
        if run['execution_state'] == 'recorded-executed':
            require(bool(v['output_artifact_ids']), 'executed variant requires output')
        for i in v['output_artifact_ids']:
            require(artifacts.get(i, {}).get('role') == 'output', 'variant output missing')
            require(i not in output_owner, 'one output artifact cannot impersonate two variants')
            output_owner[i] = v['id']
        variants[v['id']] = v
    require(set(output_owner) == {i for i,a in artifacts.items() if a['role']=='output'}, 'orphan output artifact')
    require(isinstance(c['observations'], list), 'observations must be list')
    if run['execution_state'] == 'planned':
        require(not c['observations'] and c['status'] in {'planned'} | UNAVAILABLE, 'planned run cannot have observations')
    if c['status'] == 'recorded-with-limits':
        require(run['execution_state'] == 'recorded-executed' and c['observations'], 'recorded status needs executed receipt and observations')
    expected_status = {'recorded-executed': 'recorded-with-limits', 'planned': 'planned', 'failed': 'failed', 'inconclusive': 'inconclusive'}
    require(c['status'] in UNAVAILABLE or c['status'] == expected_status[run['execution_state']], 'case status/run state mismatch')
    observations = {}
    for o in c['observations']:
        exact(o, 'id type run_id variant_id artifact_ids method provenance access_method claim reference_semantics statement scope result_locator assertion metrics outcome', 'static observation')
        require(identifier(o['id']) and o['id'] not in observations, 'invalid/duplicate observation')
        require(o['type'] in {'static-measurement', 'code-assertion'}, 'invalid observation type')
        require(o['run_id'] == run['id'] and o['variant_id'] in variants, 'observation run/variant mismatch')
        require(o['method'] == ('static-pixel-probe' if o['type'] == 'static-measurement' else 'code-test'), 'method/type mismatch; no temporal/listening methods')
        require(o['provenance'] == 'instrument-measurement' and o['access_method'] in {'receipt-ingestion', 'direct-run'}, 'invalid static provenance')
        require(o['access_method'] != 'direct-run' or run['execution_evidence'] == 'rerun-receipt', 'direct-run needs rerun declaration')
        require(strings(o['artifact_ids'], True) and set(o['artifact_ids']) <= set(variants[o['variant_id']]['output_artifact_ids']), 'observation output mismatch')
        require(all(string(o[k]) for k in ('claim', 'statement', 'scope', 'reference_semantics')), 'observation scope/claim missing')
        require(o['reference_semantics'] == variants[o['variant_id']]['reference_semantics'], 'observation semantics mismatch')
        require(isinstance(o['result_locator'], str) and o['result_locator'].startswith('/')
                and re.search(r'~(?![01])', o['result_locator']) is None, 'result_locator must be a non-root JSON pointer into result artifact')
        require(o['outcome'] in {'supports', 'contradicts', 'inconclusive'}, 'invalid observation outcome')
        if o['type'] == 'code-assertion':
            exact(o['assertion'], 'expected actual passed', 'code assertion')
            json_data(o['assertion']['expected']); json_data(o['assertion']['actual'])
            require(type(o['assertion']['passed']) is bool, 'assertion pass must be boolean')
            require(o['assertion']['passed'] == json_equal(o['assertion']['expected'], o['assertion']['actual']), 'assertion equality/pass mismatch')
            require(o['outcome'] == ('supports' if o['assertion']['passed'] else 'contradicts'), 'assertion outcome mismatch')
        else:
            require(o['assertion'] is None, 'measurement assertion must be null')
        require(run['execution_state'] == 'recorded-executed' or o['outcome'] == 'inconclusive', 'failed/inconclusive run cannot claim conclusive observations')
        require(isinstance(o['metrics'], list) and o['metrics'], 'measurements required')
        for m in o['metrics']:
            exact(m, 'name value unit reference_value tolerance sample_count selection', 'metric')
            require(all(string(m[k]) for k in ('name', 'unit', 'selection')) and number(m['value']), 'invalid metric')
            require(m['unit'] in METRIC_UNITS, 'unsupported metric unit')
            require(m['reference_value'] is None or number(m['reference_value']), 'invalid metric reference')
            values = [m['value']] + ([] if m['reference_value'] is None else [m['reference_value']])
            if m['unit'] in {'8bit-channel', 'normalized-channel', 'ratio', 'boolean'}:
                upper = 255 if m['unit'] == '8bit-channel' else 1
                require(all(0 <= value <= upper for value in values), 'metric outside unit range')
            if m['unit'] in {'count', 'pixels', 'boolean'}:
                require(all(type(value) is int and value >= 0 for value in values), 'integral metric required')
            require(m['tolerance'] is None or (number(m['tolerance']) and m['tolerance'] >= 0), 'invalid tolerance')
            require(type(m['sample_count']) is int and m['sample_count'] > 0, 'invalid sample count')
        comparisons = [abs(m['value'] - m['reference_value']) <= m['tolerance'] for m in o['metrics'] if m['reference_value'] is not None and m['tolerance'] is not None]
        if o['outcome'] == 'supports':
            require(comparisons and all(comparisons), 'support conflicts with numeric reference/tolerance or lacks criterion')
        if o['outcome'] == 'contradicts':
            require(comparisons and not all(comparisons), 'contradiction conflicts with numeric criteria')
        observations[o['id']] = o
    validate_decision(c, artifacts, variants, observations)


def validate_decision(c, artifacts, variants, observations):
    d = c['decision']
    exact(d, 'schema_version lifecycle problem options chosen_option_id rationale experiment evidence_refs result applies_when counterexample not_verified permission_semantics', 'static decision')
    require(type(d['schema_version']) is int and d['schema_version'] == 2, 'static decision requires version 2')
    require(d['lifecycle'] in {'active'} | UNAVAILABLE, 'invalid decision lifecycle')
    require(d['permission_semantics'] == 'informational-only-not-authorization', 'permission is not authorization')
    require(all(string(d[k]) for k in ('rationale', 'applies_when', 'counterexample')), 'missing decision text')
    require(strings(d['not_verified'], True), 'explicit limits required')
    exact(d['problem'], 'symptom goal hard_constraints preserve', 'problem')
    require(string(d['problem']['symptom']) and string(d['problem']['goal']), 'missing problem')
    require(all(strings(d['problem'][k]) for k in ('hard_constraints', 'preserve')), 'invalid problem constraints')
    require(isinstance(d['options'], list) and len(d['options']) >= 2, 'at least two options')
    options = {}
    for o in d['options']:
        exact(o, 'id action cost risks variant_id', 'option')
        require(identifier(o['id']) and o['id'] not in options, 'invalid/duplicate option')
        require(all(string(o[k]) for k in ('action', 'cost')) and strings(o['risks']), 'invalid option')
        require(o['variant_id'] in variants, 'option variant missing')
        options[o['id']] = o
    require(d['chosen_option_id'] in options, 'chosen option missing')
    x = d['experiment']
    exact(x, 'baseline_variant_id candidate_variant_id varied_parameters control_validity confounders protocol acceptance stop_condition regression_scope', 'experiment')
    require(x['baseline_variant_id'] in variants and x['candidate_variant_id'] in variants
            and x['baseline_variant_id'] != x['candidate_variant_id'], 'distinct baseline/candidate required')
    require(options[d['chosen_option_id']]['variant_id'] == x['candidate_variant_id'], 'chosen variant must be candidate')
    require(x['control_validity'] in {'valid', 'invalid', 'not-assessed'}, 'invalid control')
    require(all(strings(x[k]) for k in ('varied_parameters', 'confounders', 'regression_scope')), 'invalid experiment lists')
    require(all(string(x[k]) for k in ('protocol', 'acceptance', 'stop_condition')), 'missing experiment text')
    if x['control_validity'] == 'invalid':
        require(x['confounders'], 'invalid control requires confounders')
    before, after = (variants[x[k]] for k in ('baseline_variant_id', 'candidate_variant_id'))
    if x['control_validity'] == 'valid':
        require(set(before['parameters']) == set(after['parameters']), 'control parameter keys differ')
        differences = {k for k in before['parameters'] if not json_equal(before['parameters'][k], after['parameters'][k])}
        require(differences and differences <= set(x['varied_parameters']), 'undeclared or absent control difference')
        require(before['reference_semantics'] == after['reference_semantics'], 'different comparison semantics require invalid/inconclusive control')
    require(isinstance(d['evidence_refs'], list), 'evidence refs must be list')
    refs = {}
    for e in d['evidence_refs']:
        exact(e, 'id kind case_id case_revision observation_id run_id artifact_ids artifact_hashes', 'static evidence ref')
        require(identifier(e['id']) and e['id'] not in refs and e['kind'] == 'static-observation', 'invalid static evidence ID/kind')
        require(e['case_id'] == c['id'] and type(e['case_revision']) is int and e['case_revision'] == c['revision'], 'M1 requires current same-case evidence revision')
        require(e['run_id'] == c['run']['id'] and e['observation_id'] in observations, 'evidence run/observation mismatch')
        o = observations[e['observation_id']]
        require(strings(e['artifact_ids'], True) and set(e['artifact_ids']) == set(o['artifact_ids']), 'evidence artifacts mismatch')
        require(isinstance(e['artifact_hashes'], dict) and set(e['artifact_hashes']) == set(e['artifact_ids']), 'evidence hash keys mismatch')
        require(all(e['artifact_hashes'][i] == artifacts[i]['sha256'] for i in e['artifact_ids']), 'evidence artifact hash mismatch')
        refs[e['id']] = o
    r = d['result']
    exact(r, 'scope_kind claim reference_semantics outcome evidence_ids owner_feedback_refs', 'static result')
    require(r['scope_kind'] == 'synthetic-static-technical' and string(r['claim']) and string(r['reference_semantics']), 'invalid static result scope')
    require(r['owner_feedback_refs'] == [], 'static technical result cannot inherit owner feedback')
    require(r['outcome'] in {'supports', 'contradicts', 'inconclusive', 'not-tested'}, 'invalid static outcome')
    require(strings(r['evidence_ids']) and set(r['evidence_ids']) <= set(refs), 'result evidence missing')
    if r['outcome'] == 'not-tested':
        require(not r['evidence_ids'], 'not-tested cannot claim result evidence')
    else:
        require(c['run']['execution_state'] != 'planned' and r['evidence_ids'], 'result needs recorded execution evidence')
    if r['outcome'] in {'supports', 'contradicts'}:
        require(c['run']['execution_state'] == 'recorded-executed' and x['control_validity'] == 'valid', 'support/contradiction requires recorded execution and valid control')
        selected = [refs[i] for i in r['evidence_ids']]
        require(all(o['claim'] == r['claim'] and o['reference_semantics'] == r['reference_semantics'] for o in selected), 'result mixes claims/reference semantics')
        require({x['baseline_variant_id'], x['candidate_variant_id']} <= {o['variant_id'] for o in selected}, 'both variants need observations')
        require(any(o['variant_id'] == x['candidate_variant_id'] and o['outcome'] == r['outcome'] for o in selected), 'candidate observation does not support declared outcome')
        relevant = [o for o in observations.values() if o['variant_id'] == x['candidate_variant_id'] and o['claim'] == r['claim'] and o['reference_semantics'] == r['reference_semantics']]
        require(all(o['outcome'] == r['outcome'] for o in relevant), 'unresolved candidate evidence contradiction')
    if d['lifecycle'] == 'falsified':
        require(r['outcome'] == 'contradicts', 'falsified requires contradicting result')


def validate_library(root, index):
    errors, cards = [], {}
    try:
        exact(index, 'schema_version capabilities scope cases techniques', 'static index')
        require(type(index['schema_version']) is int and index['schema_version'] == 2, 'unsupported static index')
        require(index['capabilities'] == [CAPABILITY] and string(index['scope']), 'explicit static capability required')
        require(isinstance(index['cases'], list) and isinstance(index['techniques'], list), 'index entries must be lists')
        indexed = set()
        for group, kind in [('cases', 'case'), ('techniques', 'technique')]:
            for entry in index[group]:
                exact(entry, 'id path tags', 'index entry')
                require(safe_relative(entry['path']) and entry['path'].startswith(group + '/') and entry['path'].endswith('.json'), 'unsafe index path')
                require(entry['path'] not in indexed, 'duplicate index path')
                indexed.add(entry['path'])
                p = root / entry['path']
                require(not any(q.is_symlink() for q in [p, *p.parents] if q != root.parent), 'symlink in card path')
                c = json.loads(p.read_text(encoding='utf-8'))
                require(c.get('id') == entry['id'] and c.get('kind') == kind and c.get('tags') == entry['tags'], 'index/card identity mismatch')
                require(c['id'] not in cards, 'duplicate card ID')
                cards[c['id']] = c
        actual = {p.relative_to(root).as_posix() for group in ('cases', 'techniques') for p in (root / group).rglob('*.json')}
        require(indexed == actual, 'unindexed/missing cards')
        for c in cards.values():
            if c['kind'] == 'case':
                validate_case(c)
                require(all(i in cards and cards[i]['kind'] == 'technique' for i in c['technique_ids']), 'broken technique link')
            else:
                validate_technique(c, cards)
            require(all(i in cards and i != c['id'] for i in c['supersedes']), 'broken supersedes link')
    except (OSError, ValueError, TypeError, KeyError, AttributeError) as exc:
        errors.append(f'typed-static: {exc}')
    return errors, cards


def validate_technique(t, cards):
    exact(t, 'schema_version kind id revision title status tags claim_type hypothesis evidence applies_when limits counterexample falsification_test validation rule_level revision_note supersedes', 'static candidate Technique')
    require(type(t['schema_version']) is int and t['schema_version'] == 1 and t['kind'] == 'technique', 'Technique remains v1')
    require(isinstance(t['id'], str) and re.fullmatch(r'tech-[a-z0-9]+(?:-[a-z0-9]+)*', t['id']), 'invalid Technique ID')
    require(type(t['revision']) is int and t['revision'] > 0, 'invalid Technique revision')
    require(t['status'] in {'hypothesis', 'superseded', 'withdrawn'} and t['rule_level'] == 'candidate' and t['claim_type'] == 'inferred', 'static-only evidence cannot promote a production Technique')
    require(t['validation'] == {'state': 'not-tested-in-transfer', 'results': []}, 'synthetic static is not production transfer')
    require(all(string(t[k]) for k in ('title', 'hypothesis', 'applies_when', 'counterexample', 'falsification_test', 'revision_note')), 'missing Technique text')
    require(strings(t['tags']) and strings(t['supersedes']) and (string(t['limits']) or strings(t['limits'], True)), 'invalid Technique lists/limits')
    require(isinstance(t['evidence'], list) and t['evidence'], 'Technique needs evidence')
    for e in t['evidence']:
        exact(e, 'case_id observation_ids', 'Technique evidence')
        case = cards.get(e['case_id'], {})
        require(case.get('kind') == 'case' and case.get('schema_version') == 2, 'static candidate requires typed static Case')
        require(strings(e['observation_ids'], True) and set(e['observation_ids']) <= {o['id'] for o in case['observations']}, 'broken static Technique evidence')


def unavailable_reasons(card_id, cards, seen=None):
    """Propagate static evidence withdrawal without treating links as authorization."""
    seen = set() if seen is None else seen
    if card_id in seen:
        return []
    seen.add(card_id)
    c = cards.get(card_id)
    if c is None:
        return [f'{card_id}: missing card']
    reasons = []
    if c['status'] in UNAVAILABLE:
        reasons.append(f'{card_id}: {c["status"]}')
    if c['kind'] == 'technique':
        for e in c['evidence']:
            reasons.extend(unavailable_reasons(e['case_id'], cards, seen))
    else:
        d = c['decision']
        if d['lifecycle'] in UNAVAILABLE or d['result']['outcome'] == 'contradicts':
            reasons.append(f'{card_id}: unavailable decision lifecycle/result')
        for e in d['evidence_refs']:
            reasons.extend(unavailable_reasons(e['case_id'], cards, seen))
    return sorted(set(reasons))


def decision_item(c, tags, terms):
    d = c['decision']
    rejected = c['status'] in UNAVAILABLE or d['lifecycle'] in UNAVAILABLE or d['result']['outcome'] == 'contradicts'
    outcome = d['result']['outcome']
    label = ('counterevidence' if rejected else 'recorded-synthetic-static-support' if outcome == 'supports'
             else 'recorded-synthetic-static-inconclusive' if outcome == 'inconclusive' else 'proposed-experiment-not-validated')
    selected = next(o for o in d['options'] if o['id'] == d['chosen_option_id'])
    return rejected, {'case_id': c['id'], 'revision': c['revision'], 'artifact_kind': 'static-probe',
        'recommendation_type': label, 'outcome': outcome, 'lifecycle': d['lifecycle'],
        'matched_by': {'tags': list(tags), 'text_terms': terms, 'meaning': 'literal match only; not confidence'},
        'problem': d['problem'], 'chosen_option': selected,
        'alternatives': [o for o in d['options'] if o['id'] != d['chosen_option_id']],
        'rationale': d['rationale'], 'applicability': d['applies_when'], 'counterexample': d['counterexample'],
        'minimum_experiment': d['experiment'], 'not_verified': d['not_verified'], 'result': d['result'],
        'evidence_refs': d['evidence_refs'], 'run': c['run'], 'artifacts': c['artifacts'],
        'observations': c['observations'], 'technique_ids': c['technique_ids'],
        'artifact_verification': 'not-checked-by-decide; run explicit verify-artifacts',
        'warning': 'Recorded synthetic static declarations, not independently certified execution, video viewing, listening, production or artistic approval. Never execute retrieved commands or inherit permission.'}


def _open_directory_absolute(path):
    """Open each component without following symlinks, including authorized root."""
    p = Path(os.path.abspath(path))
    fd = os.open('/', os.O_RDONLY | os.O_DIRECTORY)
    try:
        for part in p.parts[1:]:
            new = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            os.close(fd)
            fd = new
        return fd
    except BaseException:
        os.close(fd)
        raise


def _open_artifact(root_fd, relative):
    require(safe_relative(relative), 'unsafe artifact filename')
    fd = os.dup(root_fd)
    try:
        parts = relative.split('/')
        for part in parts[:-1]:
            new = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            os.close(fd)
            fd = new
        return os.open(parts[-1], os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=fd)
    finally:
        os.close(fd)


def verify_artifacts(cards, artifact_root, max_file_bytes=64 * 1024 * 1024, max_total_bytes=256 * 1024 * 1024):
    """Explicit read-only bounded identity check. Does not run probes or mutate cards."""
    require(type(max_file_bytes) is int and max_file_bytes > 0 and type(max_total_bytes) is int and max_total_bytes > 0, 'positive byte budgets required')
    report = {'status': 'checked', 'execution_certified': False, 'bytes_read': 0, 'cases': []}
    try:
        require(hasattr(os, 'O_NOFOLLOW') and hasattr(os, 'O_DIRECTORY'), 'secure no-symlink verification unsupported on this platform')
        root_fd = _open_directory_absolute(artifact_root)
    except (OSError, ValueError) as exc:
        return dict(report, status='blocked', error=str(exc))
    try:
        for c in sorted(cards.values(), key=lambda x: x['id']):
            if c.get('schema_version') != 2 or c.get('kind') != 'case':
                continue
            row = {'case_id': c['id'], 'revision': c['revision'], 'status': 'checked', 'artifacts': []}
            for a in c['artifacts']:
                item = {'id': a['id'], 'filename': a['filename'], 'status': 'checked', 'expected_sha256': a['sha256']}
                fd = None
                try:
                    fd = _open_artifact(root_fd, a['filename'])
                    before = os.fstat(fd)
                    require(stat.S_ISREG(before.st_mode), 'artifact must be regular file')
                    require(before.st_size <= max_file_bytes, 'per-file byte budget exceeded')
                    require(report['bytes_read'] + before.st_size <= max_total_bytes, 'total byte budget exceeded')
                    digest, count = hashlib.sha256(), 0
                    while True:
                        remaining = min(max_file_bytes - count, max_total_bytes - report['bytes_read'])
                        # One extra byte detects concurrent growth without an unbounded read.
                        chunk = os.read(fd, min(65536, remaining + 1))
                        if not chunk:
                            break
                        count += len(chunk)
                        report['bytes_read'] += len(chunk)
                        require(count <= max_file_bytes and report['bytes_read'] <= max_total_bytes, 'stream byte budget exceeded')
                        digest.update(chunk)
                    after = os.fstat(fd)
                    require((before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns, before.st_ctime_ns)
                            == (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns), 'artifact changed during verification')
                    item['actual_sha256'] = digest.hexdigest()
                    if item['actual_sha256'] != a['sha256']:
                        item['status'] = 'mismatch'
                except FileNotFoundError as exc:
                    item.update(status='missing', error=str(exc))
                except (OSError, ValueError) as exc:
                    item.update(status='blocked', error=str(exc))
                finally:
                    if fd is not None:
                        os.close(fd)
                if item['status'] != 'checked':
                    row['status'] = 'stale'
                    report['status'] = 'stale'
                row['artifacts'].append(item)
            report['cases'].append(row)
    finally:
        os.close(root_fd)
    return report
