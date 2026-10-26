#!/usr/bin/env python3
"""Offline, standard-library-only discovery and structural validation of video knowledge."""
import argparse
import importlib.util
import json
import math
import re
from pathlib import Path

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
    return json.loads(path.read_text(encoding='utf-8'))

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
        obj(d, 'schema_version lifecycle problem options chosen_option_id rationale experiment bindings evidence_refs result applies_when counterexample not_verified permission_semantics', 'decision')
        check(type(d['schema_version']) is int and d['schema_version'] == 1, 'unsupported nested version')
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
    if not isinstance(d,dict): return reasons
    if d.get('lifecycle') != 'active' or d.get('result',{}).get('outcome')=='contradicts':
        reasons.append(f'{case_id}: unavailable decision lifecycle/result')
    for ref in d.get('evidence_refs',[]):
        reasons.extend(decision_unavailable_reasons(ref['case_id'],cards,seen))
    for ref in d.get('result',{}).get('owner_feedback_refs',[]):
        reasons.extend(decision_unavailable_reasons(ref['case_id'],cards,seen))
        feedback=cards.get(ref['case_id'],{}).get('feedback',[])
        index=ref['feedback_index']
        if type(index) is int and 0<=index<len(feedback):
            # Legacy result is free text; only these explicit markers are recognized.
            if str(feedback[index].get('result','')).strip().casefold() in {'withdrawn','retracted','superseded','stale'}:
                reasons.append(f'{ref["case_id"]}: feedback {index} explicitly unavailable')
    return sorted(set(reasons))


def decide(cards, tags=(), text='', limit=3):
    """Return bounded decision context. Never execute retrieved text or infer permission."""
    positive, negative = [], []
    terms=text.casefold().split()
    for cid,c in sorted(cards.items()):
        d=c.get('decision')
        if not d or not set(tags)<=set(c['tags']): continue
        if not all(t in json.dumps(c,ensure_ascii=False).casefold() for t in terms): continue
        if c.get('schema_version') == 2:
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
    root = Path(root).resolve()
    errors, cards = [], {}
    def check(ok, msg):
        if not ok: errors.append(msg)
    if not root.is_dir(): return ['knowledge root missing'], {}
    for p in root.rglob('*'):
        if p.is_symlink(): errors.append(f'symlink forbidden: {p.relative_to(root)}'); continue
        if not p.is_file(): continue
        check(p.suffix in {'.json', '.md'}, f'non-source knowledge file: {p.relative_to(root)}')
        try: raw = p.read_text(encoding='utf-8')
        except UnicodeError: errors.append(f'binary/non-UTF8 file: {p.relative_to(root)}'); continue
        check(not re.search(r'libfile_[0-9a-f]+|CalpicoFile_|/workspace/|/home/|[?&](?:sig|token|X-Amz-Signature)=',raw,re.I), f'private/ephemeral locator: {p.relative_to(root)}')
    try: index = load(root/'index.json')
    except (OSError, ValueError) as e: return errors+[f'index invalid: {e}'], {}
    if not isinstance(index, dict): return errors+['index must be an object'], {}
    if index.get('schema_version') == 2:
        static_errors,cards=static_module().validate_library(root,index)
        return errors+static_errors,cards
    check(index.get('schema_version') == 1, 'index schema_version must be 1')
    indexed = set()
    for group, kind in [('cases','case'),('techniques','technique')]:
        for entry in index.get(group, []):
            try:
                rel = entry['path']; p = (root/rel).resolve()
                if root not in p.parents or p.suffix != '.json': raise ValueError('path escapes knowledge root or not JSON')
                check(rel not in indexed, f'duplicate indexed path: {rel}'); indexed.add(rel)
                c = load(p); cid=c.get('id','')
                check(re.fullmatch(r'(case|tech)-[a-z0-9]+(?:-[a-z0-9]+)*',cid) is not None, f'invalid ID: {cid}')
                check(cid == entry['id'], f'index/card ID mismatch: {rel}')
                check(cid not in cards, f'duplicate ID: {cid}')
                check(c.get('kind') == kind, f'wrong kind: {cid}')
                check(c.get('schema_version') == 1 and type(c.get('revision')) is int and c['revision'] > 0, f'version/revision invalid: {cid}')
                check(isinstance(c.get('tags'),list) and all(isinstance(x,str) and x for x in c['tags']) and c.get('tags') == entry.get('tags'), f'tags mismatch: {cid}')
                for key in ('title','revision_note'): check(bool(c.get(key)), f'missing {key}: {cid}')
                check(isinstance(c.get('supersedes'),list), f'supersedes missing: {cid}')
                cards[cid] = c
            except (OSError, ValueError, KeyError, TypeError) as e: errors.append(f'bad indexed card: {entry}: {e}')
    actual={str(p.relative_to(root)) for d in ('cases','techniques') for p in (root/d).glob('*.json')}
    check(actual == indexed, f'unindexed/missing cards: {sorted(actual ^ indexed)}')
    for entry in index.get('legacy',[]):
        try:
            p=(root/entry['path']).resolve(); skill=root.parent.parent
            check(skill in p.parents and p.is_file(), f'legacy target missing/escaped: {entry["id"]}')
        except (KeyError,TypeError): errors.append('invalid legacy entry')
    for cid,c in cards.items():
        try:
            for old in c['supersedes']: check(old in cards and old != cid, f'broken supersedes: {cid}->{old}')
            if c['kind']=='case':
                for related in c.get('related_case_ids',[]): check(related != cid and cards.get(related,{}).get('kind')=='case', f'broken related case: {cid}->{related}')
                check(c['status'] in CASE_STATES, f'invalid case status: {cid}')
                src=c['source']; ins=c['inspection']; obs=c['observations']
                for key in ('creator','title','rights','access'): check(bool(src.get(key)), f'missing source {key}: {cid}')
                origin=src.get('origin','external-reference')
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
                    check(cards.get(r['case_id'],{}).get('kind')=='case' and cards.get(r['case_id'],{}).get('schema_version')==1 and cards.get(r['case_id'],{}).get('source',{}).get('origin')=='original-production', f'validation must reference actual transfer case: {cid}')
                    check(r['outcome'] in {'supports','contradicts','inconclusive'} and bool(r['scope']) and bool(r['methods']) and set(r['methods'])<=METHODS and type(r['unresolved_contradiction']) is bool, f'invalid validation result: {cid}')
                    if r['outcome']=='supports':
                        supported.add(r['case_id'])
                        transfer=cards.get(r['case_id'],{})
                        decision=transfer.get('decision')
                        if level!='candidate' and decision is not None:
                            check(isinstance(decision,dict) and decision.get('lifecycle')=='active'
                                  and decision.get('result',{}).get('outcome')=='supports'
                                  and decision.get('experiment',{}).get('control_validity')=='valid'
                                  and not decision_unavailable_reasons(r['case_id'],cards),
                                  f'promotion contradicts linked decision or unavailable dependencies: {cid}->{r["case_id"]}')
                if level!='candidate': check(bool(results) and c['validation']['state']=='tested-with-limits', f'unsupported promotion: {cid}')
                if level=='reusable-in-scope': check(len(supported)>=2 and not any(r['unresolved_contradiction'] for r in results), f'insufficient/conflicting promotion: {cid}')
        except (KeyError,TypeError,ValueError,AttributeError) as e: errors.append(f'schema failure {cid}: {e}')
    for c in cards.values():
        if "decision" in c:
            if c.get("kind") != "case": errors.append("decision extension is case-only")
            else: errors.extend(validate_decision(c, cards))
    return errors,cards

def query(cards, tags=(), text='', kind=None, status=None, limit=3, method=None, rule_level=None):
    terms=text.casefold().split()
    selected=[]
    for cid,c in sorted(cards.items()):
        if kind and c['kind']!=kind: continue
        if status and c['status']!=status: continue
        if not status and c['status'] in {'superseded','withdrawn'}: continue
        if rule_level and c.get('rule_level') != rule_level: continue
        evidence_cases=[c] if c['kind']=='case' else [cards[e['case_id']] for e in c['evidence']]
        if not status and any(ec.get('schema_version') == 2 for ec in evidence_cases) and static_module().unavailable_reasons(cid, cards): continue
        if method and not any(method in (ec.get('inspection',{}).get('methods',[]) if ec.get('schema_version') == 1 else [o['method'] for o in ec.get('observations',[])]) for ec in evidence_cases): continue
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
        if not any(c.get('schema_version')==2 and c.get('kind')=='case' for c in cards.values()): p.error('verify-artifacts requires typed static Cases')
        if a.max_file_bytes<=0 or a.max_total_bytes<=0: p.error('byte budgets must be positive')
        result=static_module().verify_artifacts(cards,a.artifact_root,a.max_file_bytes,a.max_total_bytes)
        print(json.dumps(result,ensure_ascii=False,indent=2)); return 0 if result['status']=='checked' else 1
    if not 1<=a.limit<=10: p.error('--limit must be 1..10')
    if a.command=='decide':
        print(json.dumps(decide(cards,a.tag,a.text,a.limit),ensure_ascii=False,indent=2)); return 0
    print(json.dumps(query(cards,a.tag,a.text,a.kind,a.status,a.limit,a.method,a.rule_level),ensure_ascii=False,indent=2));return 0
if __name__=='__main__': raise SystemExit(main())
