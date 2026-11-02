#!/usr/bin/env python3
"""Offline, standard-library-only discovery and structural validation of video knowledge."""
import argparse
import importlib.util
import json
import math
import re
from pathlib import Path

SCHEMA_VERSION = 3

DEFAULT_ROOT = Path(__file__).resolve().parents[1] / 'research/video-knowledge'
CASE_STATES = {'unverified', 'observed-with-limits', 'tested-with-limits', 'superseded', 'withdrawn'}
TECH_STATES = {'hypothesis', 'tested-with-limits', 'superseded', 'withdrawn'}
METHODS = {'sampled-frames', 'dense-frames', 'continuous-muted', 'actual-listening', 'metadata-probe', 'source-text'}

_STATIC = None

def static_module():
    global _STATIC
    if _STATIC is None:
        spec = importlib.util.spec_from_file_location('motion_static_knowledge', Path(__file__).with_name('static_knowledge.py'))
        _STATIC = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(_STATIC)
    return _STATIC

def load(path):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result: raise ValueError(f'duplicate JSON key: {key}')
            result[key] = value
        return result
    def nonfinite(value): raise ValueError(f'nonfinite JSON value: {value}')
    return json.loads(path.read_text(encoding='utf-8'), object_pairs_hook=unique, parse_constant=nonfinite)

def validate_decision(c, cards):
    """Validate declarations, not perception, causal truth or current permission."""
    d = c['decision']
    errors = []
    def check(ok, message):
        if not ok: errors.append(f'decision {c["id"]}: {message}')
    def obj(value, keys, label):
        if not isinstance(value, dict) or set(value) != set(keys.split()):
            raise ValueError(f'{label}: exact fields required: {keys}')
    def string(value): return isinstance(value, str) and bool(value.strip())
    def strings(value): return isinstance(value, list) and all(string(x) for x in value)
    try:
        if not static_module().decision_recorded(d): return errors
        obj(d, 'schema_version record_state lifecycle problem options chosen_option_id rationale experiment bindings evidence_refs result applies_when counterexample not_verified permission_semantics', 'decision')
        check(type(d['schema_version']) is int and d['schema_version'] == SCHEMA_VERSION, 'unsupported nested version')
        check(d['lifecycle'] in {'active','stale','falsified','withdrawn'}, 'unknown lifecycle')
        check(d['permission_semantics'] == 'informational-only-not-authorization', 'permission cannot authorize actions')
        for key in ('rationale','applies_when','counterexample'): check(string(d[key]), f'missing {key}')
        check(strings(d['not_verified']), 'invalid not_verified')
        p=d['problem']; obj(p, 'symptom goal hard_constraints preserve', 'problem')
        check(string(p['symptom']) and string(p['goal']), 'missing symptom/goal')
        for key in ('hard_constraints','preserve'): check(strings(p[key]), f'invalid {key}')
        check(isinstance(d['options'],list) and len(d['options']) >= 2, 'at least two options required')
        option_ids=set()
        for option in d['options']:
            obj(option, 'id action cost risks', 'option')
            check(all(string(option[k]) for k in ('id','action','cost')) and strings(option['risks']), 'invalid option')
            check(option['id'] not in option_ids, 'duplicate option'); option_ids.add(option['id'])
        check(d['chosen_option_id'] in option_ids, 'chosen option missing')
        x=d['experiment']; obj(x, 'baseline_binding candidate_binding variables control_validity confounders protocol acceptance stop_condition regression_scope', 'experiment')
        for key in ('protocol','acceptance','stop_condition'): check(string(x[key]), f'missing {key}')
        for key in ('variables','confounders','regression_scope'): check(strings(x[key]), f'invalid {key}')
        check(x['control_validity'] in {'not-assessed','valid','invalid'}, 'invalid control validity')
        check(x['control_validity'] != 'invalid' or bool(x['confounders']), 'invalid control requires confounders')
        check(isinstance(d['bindings'],list), 'bindings must be a list')
        bindings={}
        for b in d['bindings']:
            obj(b, 'id role sha256 version origin', 'binding')
            check(string(b['id']) and b['id'] not in bindings, 'invalid/duplicate binding ID')
            check(b['role'] in {'baseline','candidate','source','review','timeline','audio'}, 'invalid binding role')
            check(isinstance(b['sha256'],str) and re.fullmatch('[0-9a-f]{64}',b['sha256']) is not None and string(b['version']), 'binding needs hash and version')
            check(b['origin'] in {'original-source','original-production','reconstruction','synthetic'}, 'invalid artifact origin')
            bindings[b['id']]=b
        for field,role in [('baseline_binding','baseline'),('candidate_binding','candidate')]:
            ref=x[field]
            check(ref is None or (isinstance(ref,str) and bindings.get(ref,{}).get('role')==role), f'bad {field}')
        check(isinstance(d['evidence_refs'],list), 'evidence_refs must be list')
        refs={}
        for e in d['evidence_refs']:
            obj(e, 'id kind case_id case_revision record_id binding_id method provenance', 'evidence ref')
            check(string(e['id']) and e['id'] not in refs, 'duplicate/invalid evidence ID'); refs[e['id']]=e
            check(e['kind'] in {'case-observation','content-review'}, 'unsupported evidence reference')
            check(e['method'] in METHODS, 'unknown evidence method')
            check(e['provenance'] in {'human-observation','instrument-measurement','source-text','model-inference'}, 'unknown provenance')
            check(e['method'] != 'actual-listening' or e['provenance']=='human-observation', 'actual listening requires human observation declaration')
            check(e['method'] != 'metadata-probe' or e['provenance']=='instrument-measurement', 'probe requires measurement provenance')
            check(e['method'] != 'source-text' or e['provenance']=='source-text', 'source text requires source-text provenance')
            check(string(e['record_id']) and e['binding_id'] in bindings, 'missing record/binding')
            case=cards.get(e['case_id'],{})
            check(case.get('kind')=='case' and type(e['case_revision']) is int and case.get('revision')==e['case_revision'], 'stale/missing evidence case revision')
            if e['kind']=='case-observation':
                check(e['record_id'] in {o['id'] for o in case.get('observations',[])}, 'missing observation')
                check(e['method'] in case.get('inspection',{}).get('methods',[]), 'method absent from referenced case')
                check(bindings.get(e['binding_id'],{}).get('sha256')==case.get('source',{}).get('sha256'), 'evidence media hash mismatch')
            else:
                check(bindings.get(e['binding_id'],{}).get('role')=='review', 'content-review needs review artifact binding')
                # External record existence/content is deliberately NOT certified here.
        r=d['result']; obj(r, 'outcome evidence_ids owner_feedback_refs', 'result')
        check(r['outcome'] in {'not-tested','supports','contradicts','inconclusive'}, 'invalid outcome')
        check(strings(r['evidence_ids']) and set(r['evidence_ids'])<=set(refs), 'broken result evidence')
        check(isinstance(r['owner_feedback_refs'],list), 'feedback references must be list')
        for f in r['owner_feedback_refs']:
            obj(f,'case_id case_revision feedback_index','feedback reference')
            case=cards.get(f['case_id'],{})
            check(case.get('kind')=='case' and type(f['case_revision']) is int and case.get('revision')==f['case_revision'] and type(f['feedback_index']) is int and 0<=f['feedback_index']<len(case.get('feedback',[])), 'stale/missing feedback reference')
        if r['outcome']=='not-tested':
            check(not r['evidence_ids'] and not r['owner_feedback_refs'], 'unexecuted test cannot claim results/feedback')
            check(bool(d['not_verified']), 'unexecuted test requires explicit limits')
        else:
            check(bool(r['evidence_ids']) and x['baseline_binding'] is not None and x['candidate_binding'] is not None, 'tested outcome needs evidence and baseline/candidate')
            check(x['control_validity']=='valid' or r['outcome']=='inconclusive', 'invalid/unassessed control cannot support or contradict')
            check(any(refs.get(i,{}).get('kind')=='case-observation' for i in r['evidence_ids']), 'external references alone cannot establish tested outcome')
            if r['outcome'] in {'supports','contradicts'}:
                observed_bindings={refs[i]['binding_id'] for i in r['evidence_ids'] if i in refs and refs[i]['kind']=='case-observation'}
                check({x['baseline_binding'],x['candidate_binding']} <= observed_bindings, 'comparative outcome requires baseline and candidate observation references')
        if d['lifecycle']=='falsified': check(r['outcome']=='contradicts', 'falsified requires contradicting result')
    except (KeyError,TypeError,ValueError,AttributeError) as exc:
        errors.append(f'decision {c["id"]}: {exc}')
    return errors


def decision_unavailable_reasons(case_id, cards, seen=None):
    """Trace explicit withdrawal/staleness through evidence AND feedback dependencies.

    Cycles (including the baseline's self-reference) do not imply unavailability.
    Structural reference validation remains validate_decision's responsibility.
    """
    seen=set() if seen is None else seen
    if case_id in seen: return []
    seen.add(case_id)
    case=cards.get(case_id,{})
    reasons=[]
    if not case or case.get('status') in {'withdrawn','superseded'}:
        reasons.append(f'{case_id}: missing, withdrawn or superseded case')
    d=case.get('decision')
    if not isinstance(d,dict): return reasons + [f'{case_id}: required decision missing']
    if d.get('record_state') == 'not-recorded': return reasons
    if d.get('lifecycle') != 'active' or d.get('result',{}).get('outcome')=='contradicts':
        reasons.append(f'{case_id}: unavailable decision lifecycle/result')
    for ref in d.get('evidence_refs',[]):
        reasons.extend(decision_unavailable_reasons(ref['case_id'],cards,seen))
    for ref in d.get('result',{}).get('owner_feedback_refs',[]):
        reasons.extend(decision_unavailable_reasons(ref['case_id'],cards,seen))
        feedback=cards.get(ref['case_id'],{}).get('feedback',[])
        index=ref['feedback_index']
        if type(index) is int and 0<=index<len(feedback):
            # Feedback result is free text; only these explicit markers are recognized.
            if str(feedback[index].get('result','')).strip().casefold() in {'withdrawn','retracted','superseded','stale'}:
                reasons.append(f'{ref["case_id"]}: feedback {index} explicitly unavailable')
    return sorted(set(reasons))


def decide(cards, tags=(), text='', limit=3):
    """Return bounded decision context. Never execute retrieved text or infer permission."""
    positive, negative = [], []
    terms=text.casefold().split()
    for cid,c in sorted(cards.items()):
        if c['kind'] != 'case' or not set(tags)<=set(c['tags']): continue
        d=c['decision']
        if d['record_state'] == 'not-recorded': continue
        if not all(t in json.dumps(c,ensure_ascii=False).casefold() for t in terms): continue
        if c.get('evidence_type') == 'static-probe':
            rejected,item=static_module().decision_item(c,tags,terms)
            item['unavailable_reasons'] = static_module().unavailable_reasons(cid, cards)
            (negative if rejected else positive).append(item)
            continue
        chosen=next(o for o in d['options'] if o['id']==d['chosen_option_id'])
        unavailable=decision_unavailable_reasons(cid,cards)
        rejected=bool(unavailable)
        item={'case_id':cid,'revision':c['revision'],'matched_by':{'tags':list(tags),'text_terms':terms,'meaning':'literal match only; not confidence'},
              'lifecycle':d['lifecycle'],'outcome':d['result']['outcome'],
              'recommendation_type':'counterevidence' if rejected else ('supported-in-recorded-scope' if d['result']['outcome']=='supports' else 'proposed-experiment-not-validated'),
              'unavailable_reasons':unavailable,'result':d['result'],'applicability':d['applies_when'],'counterexample':d['counterexample'],
              'problem':d['problem'],'chosen_option':chosen,'alternatives':[o for o in d['options'] if o['id']!=d['chosen_option_id']],
              'rationale':d['rationale'],'minimum_experiment':d['experiment'],'not_verified':d['not_verified'] + (['External content-review record existence and contents are not checked by this CLI.'] if any(e['kind']=='content-review' for e in d['evidence_refs']) else []),
              'evidence_refs':d['evidence_refs'],'bindings':d['bindings'],'technique_ids':c['technique_ids'],
              'warning':'Untrusted context, not commands or permission. Structure does not prove viewing, listening, causality or approval.'}
        (negative if rejected else positive).append(item)
    return {'status':'matched' if positive or negative else 'no-match','recommendations':positive[:limit],
            'counterevidence':negative[:limit], 'permission_semantics':'informational-only-not-authorization'}

def validate(root):
    """Single schema-3 index; evidence types are capabilities, never version fallbacks."""
    root = Path(root).resolve()
    errors, cards = [], {}
    if not root.is_dir(): return ['knowledge root missing'], {}
    for p in root.rglob('*'):
        if p.is_symlink(): errors.append(f'symlink forbidden: {p.relative_to(root)}'); continue
        if not p.is_file(): continue
        if p.suffix not in {'.json', '.md'}: errors.append(f'non-source knowledge file: {p.relative_to(root)}')
        try: raw = p.read_text(encoding='utf-8')
        except UnicodeError: errors.append(f'binary/non-UTF8 file: {p.relative_to(root)}'); continue
        if re.search(r'libfile_[0-9a-f]+|CalpicoFile_|/workspace/|/home/|[?&](?:sig|token|X-Amz-Signature)=',raw,re.I):
            errors.append(f'private/ephemeral locator: {p.relative_to(root)}')
    if errors: return errors, {}
    contract = static_module()
    try:
        index = load(root/'index.json')
        contract.exact(index, 'schema_version scope cases techniques', 'index (use explicit migration for old libraries)')
        contract.require(type(index['schema_version']) is int and index['schema_version'] == SCHEMA_VERSION,
                         'only schema 3 is supported; run explicit migration separately')
        contract.require(contract.string(index['scope']), 'index scope required')
        indexed = set()
        for group, kind in [('cases', 'case'), ('techniques', 'technique')]:
            contract.require(isinstance(index[group], list), 'index entries must be lists')
            for entry in index[group]:
                contract.exact(entry, 'id path tags', 'index entry')
                rel = entry['path']
                contract.require(contract.safe_relative(rel) and rel.startswith(group + '/') and rel.endswith('.json'), 'unsafe index path')
                contract.require(rel not in indexed, 'duplicate indexed path')
                indexed.add(rel)
                c = load(root / rel)
                contract.require(isinstance(c, dict), 'card must be object')
                contract.require(c.get('id') == entry['id'] and c.get('kind') == kind and c.get('tags') == entry['tags'], 'index/card identity mismatch')
                contract.require(isinstance(c['id'], str) and c['id'] not in cards, 'duplicate/invalid card ID')
                contract.require(type(c.get('schema_version')) is int and c['schema_version'] == SCHEMA_VERSION, 'card requires schema 3')
                contract.require(c.get('evidence_type') in {'video', 'static-probe'}, 'card requires explicit evidence_type')
                cards[c['id']] = c
        actual = {p.relative_to(root).as_posix() for group in ('cases','techniques') for p in (root/group).rglob('*.json')}
        contract.require(actual == indexed, 'unindexed/missing cards')
    except (OSError, ValueError, TypeError, KeyError, AttributeError) as exc:
        return errors + [f'knowledge index: {exc}'], {}
    video = {cid:c for cid,c in cards.items() if c['evidence_type'] == 'video'}
    static = {cid:c for cid,c in cards.items() if c['evidence_type'] == 'static-probe'}
    errors.extend(validate_video_cards(video))
    errors.extend(contract.validate_cards(static))
    return errors, cards


def validate_video_shape(c):
    """Reject unknown structured fields rather than silently forgetting knowledge."""
    def fields(value, required, optional='', label='video record'):
        if not isinstance(value, dict) or not set(required.split()) <= set(value) or set(value) - set((required+' '+optional).split()):
            raise ValueError(f'{label}: missing/unknown fields')
    def texts(value, keys):
        for key in keys.split():
            if key in value and not isinstance(value[key], str): raise ValueError(f'{key} must be text')
    def text_lists(value, keys):
        for key in keys.split():
            if key in value and (not isinstance(value[key], list) or not all(isinstance(v, str) for v in value[key])):
                raise ValueError(f'{key} must be a string list')
    texts(c, 'evidence_type kind id title status revision_note')
    text_lists(c, 'tags supersedes technique_ids')
    common = 'schema_version evidence_type kind id revision title status tags revision_note supersedes'
    if c['kind'] == 'case':
        fields(c, common + ' source inspection observations interpretations technique_ids feedback decision',
               'related_case_ids transfer_boundary unverified_questions author_claims')
        fields(c['source'], 'origin creator title url media_url sha256 duration_seconds rights access', 'artifact_filename', 'source')
        fields(c['inspection'], 'methods coverage not_verified', 'date time_precision', 'inspection')
        text_lists(c['inspection'], 'methods not_verified')
        for o in c['observations']:
            fields(o, 'id range_seconds claim_type statement', label='observation')
            texts(o, 'id claim_type statement')
        for h in c['interpretations']:
            fields(h, 'claim_type alternative evidence', 'id statement', 'interpretation')
            texts(h, 'claim_type alternative id statement')
            text_lists(h, 'evidence')
        for f in c['feedback']:
            fields(f, 'claim_type scope result statement', label='feedback')
            texts(f, 'claim_type scope result statement')
        for key in ('author_claims', 'related_case_ids', 'unverified_questions'):
            if key in c and (not isinstance(c[key], list) or not all(isinstance(v, str) for v in c[key])):
                raise ValueError(f'{key} must be a string list')
        if 'transfer_boundary' in c and not isinstance(c['transfer_boundary'], str):
            raise ValueError('transfer_boundary must be text')
        for key, value in c['source'].items():
            if key == 'duration_seconds':
                if value is not None and type(value) not in (int, float): raise ValueError('duration_seconds must be numeric or null')
            elif value is not None and not isinstance(value, str): raise ValueError(f'source {key} must be text or null')
        for key in ('coverage', 'date', 'time_precision'):
            if key in c['inspection'] and not isinstance(c['inspection'][key], str): raise ValueError(f'inspection {key} must be text')
    else:
        fields(c, common + ' claim_type hypothesis evidence applies_when limits counterexample falsification_test validation rule_level')
        texts(c, 'claim_type hypothesis applies_when counterexample falsification_test rule_level')
        if not isinstance(c['limits'], str): text_lists(c, 'limits')
        for e in c['evidence']:
            fields(e, 'case_id observation_ids', label='technique evidence')
            texts(e, 'case_id')
            text_lists(e, 'observation_ids')
        fields(c['validation'], 'state results', label='validation')
        for result in c['validation']['results']:
            fields(result, 'case_id outcome methods scope unresolved_contradiction', label='transfer result')
            texts(result, 'case_id outcome scope')
            text_lists(result, 'methods')


def validate_video_cards(cards):
    errors = []
    def check(ok, msg):
        if not ok: errors.append(msg)
    for cid,c in cards.items():
        try:
            validate_video_shape(c)
            check(re.fullmatch(r'(case|tech)-[a-z0-9]+(?:-[a-z0-9]+)*',cid) is not None, f'invalid ID: {cid}')
            check(type(c['revision']) is int and c['revision'] > 0, f'version/revision invalid: {cid}')
            check(isinstance(c['tags'],list) and all(isinstance(x,str) and x for x in c['tags']), f'tags invalid: {cid}')
            for key in ('title','revision_note'): check(bool(c.get(key)), f'missing {key}: {cid}')
            check(isinstance(c['supersedes'],list), f'supersedes missing: {cid}')
            for old in c['supersedes']: check(old in cards and old != cid, f'broken supersedes: {cid}->{old}')
            if c['kind']=='case':
                for related in c.get('related_case_ids',[]): check(related != cid and cards.get(related,{}).get('kind')=='case', f'broken related case: {cid}->{related}')
                check(c['status'] in CASE_STATES, f'invalid case status: {cid}')
                src=c['source']; ins=c['inspection']; obs=c['observations']
                for key in ('creator','title','rights','access'): check(bool(src.get(key)), f'missing source {key}: {cid}')
                origin=src['origin']
                check(origin in {'external-reference','original-production','synthetic'}, f'invalid origin: {cid}')
                if origin=='external-reference':
                    for key in ('url','media_url'): check(isinstance(src.get(key),str) and src[key].startswith('https://'), f'non-HTTPS source: {cid}')
                else:
                    check(src.get('url') is None and src.get('media_url') is None and bool(src.get('artifact_filename')), f'invalid original artifact locator: {cid}')
                check(set(ins['methods']) <= METHODS, f'unknown inspection method: {cid}')
                check(bool(ins.get('coverage')) and isinstance(ins.get('not_verified'),list), f'inspection limits missing: {cid}')
                unverified = c['status']=='unverified'
                if unverified: check(not obs, f'unverified case has observations: {cid}')
                else:
                    check(bool(re.fullmatch('[0-9a-f]{64}',src.get('sha256') or '')), f'missing media hash: {cid}')
                    check(isinstance(src['duration_seconds'],(int,float)) and math.isfinite(src['duration_seconds']) and src['duration_seconds']>0, f'invalid duration: {cid}')
                    check(bool(ins['methods']), f'no inspection evidence: {cid}')
                ids=set()
                for o in obs:
                    check(o['id'] not in ids, f'duplicate observation: {cid}/{o["id"]}'); ids.add(o['id'])
                    a,b=o['range_seconds']
                    check(all(type(n) in (int,float) and math.isfinite(n) for n in (a,b)) and 0<=a<b<=src['duration_seconds'], f'out-of-range time: {cid}/{o["id"]}')
                    check(o['claim_type']=='observed' and bool(o['statement']), f'invalid observation: {cid}')
                for h in c['interpretations']:
                    check(h['claim_type']=='inferred' and bool(h['alternative']) and bool(h['evidence']) and set(h['evidence'])<=ids, f'invalid inference/evidence: {cid}')
                for tid in c['technique_ids']: check(tid in cards and cards[tid]['kind']=='technique', f'broken technique ref: {cid}->{tid}')
                for f in c['feedback']: check(f['claim_type']=='user-feedback' and all(f.get(k) for k in ('scope','result','statement')), f'unscoped feedback: {cid}')
            else:
                check(c['status'] in TECH_STATES and c['claim_type']=='inferred', f'invalid technique claim/state: {cid}')
                for key in ('hypothesis','applies_when','limits','counterexample','falsification_test'): check(bool(c.get(key)), f'missing {key}: {cid}')
                check(bool(c['evidence']), f'technique without evidence: {cid}')
                for e in c['evidence']:
                    case=cards.get(e['case_id'],{})
                    ids={o['id'] for o in case.get('observations',[])}
                    check(case.get('kind')=='case' and bool(e['observation_ids']) and set(e['observation_ids'])<=ids, f'broken evidence: {cid}')
                level=c['rule_level']; results=c['validation']['results']
                check(level in {'candidate','tested-in-scope','reusable-in-scope'}, f'invalid rule level: {cid}')
                check(c['validation']['state'] in {'not-tested-in-transfer','tested-with-limits'}, f'invalid validation state: {cid}')
                supported=set()
                for r in results:
                    check(cards.get(r['case_id'],{}).get('kind')=='case' and cards.get(r['case_id'],{}).get('evidence_type')=='video' and cards.get(r['case_id'],{}).get('source',{}).get('origin')=='original-production', f'validation must reference actual transfer case: {cid}')
                    check(r['outcome'] in {'supports','contradicts','inconclusive'} and bool(r['scope']) and bool(r['methods']) and set(r['methods'])<=METHODS and type(r['unresolved_contradiction']) is bool, f'invalid validation result: {cid}')
                    if r['outcome']=='supports':
                        supported.add(r['case_id'])
                        transfer=cards.get(r['case_id'],{})
                        decision=transfer.get('decision')
                        if level!='candidate':
                            check(isinstance(decision,dict) and decision.get('record_state')=='recorded' and decision.get('lifecycle')=='active'
                                  and decision.get('result',{}).get('outcome')=='supports'
                                  and decision.get('experiment',{}).get('control_validity')=='valid'
                                  and not decision_unavailable_reasons(r['case_id'],cards),
                                  f'promotion contradicts linked decision or unavailable dependencies: {cid}->{r["case_id"]}')
                if level!='candidate': check(bool(results) and c['validation']['state']=='tested-with-limits', f'unsupported promotion: {cid}')
                if level=='reusable-in-scope': check(len(supported)>=2 and not any(r['unresolved_contradiction'] for r in results), f'insufficient/conflicting promotion: {cid}')
        except (KeyError,TypeError,ValueError,AttributeError) as e: errors.append(f'schema failure {cid}: {e}')
    for c in cards.values():
        if c.get('kind') == 'case':
            if 'decision' not in c: errors.append(f'required decision missing: {c.get("id")}')
            else: errors.extend(validate_decision(c, cards))
        elif 'decision' in c: errors.append('decision is case-only')
    return errors

def query(cards, tags=(), text='', kind=None, status=None, limit=3, method=None, rule_level=None):
    terms=text.casefold().split()
    selected=[]
    for cid,c in sorted(cards.items()):
        if kind and c['kind']!=kind: continue
        if status and c['status']!=status: continue
        if not status and c['status'] in {'superseded','withdrawn'}: continue
        if rule_level and c.get('rule_level') != rule_level: continue
        evidence_cases=[c] if c['kind']=='case' else [cards[e['case_id']] for e in c['evidence']]
        if not status and any(ec.get('evidence_type') == 'static-probe' for ec in evidence_cases) and static_module().unavailable_reasons(cid, cards): continue
        if method and not any(method in (ec.get('inspection',{}).get('methods',[]) if ec.get('evidence_type') == 'video' else [o['method'] for o in ec.get('observations',[])]) for ec in evidence_cases): continue
        if not set(tags)<=set(c['tags']): continue
        hay=json.dumps(c,ensure_ascii=False).casefold()
        if not all(t in hay for t in terms): continue
        selected.append(c)
    return selected[:limit]

def main():
    p=argparse.ArgumentParser(description=__doc__); p.add_argument('--root',type=Path,default=DEFAULT_ROOT)
    s=p.add_subparsers(dest='command',required=True); s.add_parser('validate')
    q=s.add_parser('query'); q.add_argument('--tag',action='append',default=[]);q.add_argument('--text',default='');q.add_argument('--kind',choices=['case','technique']);q.add_argument('--status');q.add_argument('--method',choices=sorted(METHODS | {'static-pixel-probe','code-test'}));q.add_argument('--rule-level',choices=['candidate','tested-in-scope','reusable-in-scope']);q.add_argument('--limit',type=int,default=3)
    q=s.add_parser('decide'); q.add_argument('--tag',action='append',default=[]); q.add_argument('--text',default=''); q.add_argument('--limit',type=int,default=3)
    v=s.add_parser('verify-artifacts'); v.add_argument('--artifact-root',type=Path,required=True); v.add_argument('--max-file-bytes',type=int,default=64*1024*1024); v.add_argument('--max-total-bytes',type=int,default=256*1024*1024)
    a=p.parse_args();errors,cards=validate(a.root)
    if errors: print(json.dumps({'valid':False,'errors':errors},ensure_ascii=False,indent=2));return 1
    if a.command=='validate': print(json.dumps({'valid':True,'cases':sum(c['kind']=='case' for c in cards.values()),'techniques':sum(c['kind']=='technique' for c in cards.values())}));return 0
    if a.command=='verify-artifacts':
        if not any(c.get('evidence_type')=='static-probe' and c.get('kind')=='case' for c in cards.values()): p.error('verify-artifacts requires typed static Cases')
        if a.max_file_bytes<=0 or a.max_total_bytes<=0: p.error('byte budgets must be positive')
        result=static_module().verify_artifacts(cards,a.artifact_root,a.max_file_bytes,a.max_total_bytes)
        print(json.dumps(result,ensure_ascii=False,indent=2)); return 0 if result['status']=='checked' else 1
    if not 1<=a.limit<=10: p.error('--limit must be 1..10')
    if a.command=='decide':
        print(json.dumps(decide(cards,a.tag,a.text,a.limit),ensure_ascii=False,indent=2)); return 0
    print(json.dumps(query(cards,a.tag,a.text,a.kind,a.status,a.limit,a.method,a.rule_level),ensure_ascii=False,indent=2));return 0
if __name__=='__main__': raise SystemExit(main())
