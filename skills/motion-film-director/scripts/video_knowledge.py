#!/usr/bin/env python3
"""Offline, standard-library-only discovery and structural validation of video knowledge."""
import argparse
import json
import math
import re
from pathlib import Path

DEFAULT_ROOT = Path(__file__).resolve().parents[1] / 'research/video-knowledge'
CASE_STATES = {'unverified', 'observed-with-limits', 'tested-with-limits', 'superseded', 'withdrawn'}
TECH_STATES = {'hypothesis', 'tested-with-limits', 'superseded', 'withdrawn'}
METHODS = {'sampled-frames', 'dense-frames', 'continuous-muted', 'actual-listening', 'metadata-probe', 'source-text'}

def load(path):
    return json.loads(path.read_text(encoding='utf-8'))

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
                check(origin in {'external-reference','original-production'}, f'invalid origin: {cid}')
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
                    check(cards.get(r['case_id'],{}).get('kind')=='case' and cards.get(r['case_id'],{}).get('source',{}).get('origin')=='original-production', f'validation must reference actual transfer case: {cid}')
                    check(r['outcome'] in {'supports','contradicts','inconclusive'} and bool(r['scope']) and bool(r['methods']) and set(r['methods'])<=METHODS and type(r['unresolved_contradiction']) is bool, f'invalid validation result: {cid}')
                    if r['outcome']=='supports': supported.add(r['case_id'])
                if level!='candidate': check(bool(results) and c['validation']['state']=='tested-with-limits', f'unsupported promotion: {cid}')
                if level=='reusable-in-scope': check(len(supported)>=2 and not any(r['unresolved_contradiction'] for r in results), f'insufficient/conflicting promotion: {cid}')
        except (KeyError,TypeError,ValueError) as e: errors.append(f'schema failure {cid}: {e}')
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
        if method and not any(method in ec['inspection']['methods'] for ec in evidence_cases): continue
        if not set(tags)<=set(c['tags']): continue
        hay=json.dumps(c,ensure_ascii=False).casefold()
        if not all(t in hay for t in terms): continue
        selected.append(c)
    return selected[:limit]

def main():
    p=argparse.ArgumentParser(description=__doc__); p.add_argument('--root',type=Path,default=DEFAULT_ROOT)
    s=p.add_subparsers(dest='command',required=True); s.add_parser('validate')
    q=s.add_parser('query'); q.add_argument('--tag',action='append',default=[]);q.add_argument('--text',default='');q.add_argument('--kind',choices=['case','technique']);q.add_argument('--status');q.add_argument('--method',choices=sorted(METHODS));q.add_argument('--rule-level',choices=['candidate','tested-in-scope','reusable-in-scope']);q.add_argument('--limit',type=int,default=3)
    a=p.parse_args();errors,cards=validate(a.root)
    if errors: print(json.dumps({'valid':False,'errors':errors},ensure_ascii=False,indent=2));return 1
    if a.command=='validate': print(json.dumps({'valid':True,'cases':sum(c['kind']=='case' for c in cards.values()),'techniques':sum(c['kind']=='technique' for c in cards.values())}));return 0
    if not 1<=a.limit<=10: p.error('--limit must be 1..10')
    print(json.dumps(query(cards,a.tag,a.text,a.kind,a.status,a.limit,a.method,a.rule_level),ensure_ascii=False,indent=2));return 0
if __name__=='__main__': raise SystemExit(main())
