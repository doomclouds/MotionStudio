#!/usr/bin/env python3
"""Compare bound, manually observed event annotations. Never infer art approval."""
import argparse
from bisect import bisect_left
from decimal import Decimal
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

SCHEMA = 'motionstudio.event-correspondence/0.2'
TIME_BASIS = 'RELATIVE_TO_EACH_FIRST_VIDEO_PTS_NO_ALIGNMENT'
LIMITATIONS = ['Annotations are manual claims, not independently recognized events.',
              'No time warping, audio listening, normal-speed playback or aesthetic score.',
              'Agreement only means no declared discrepancy in this bounded annotation set.',
              'Image hashes bind supplied evidence bytes, not decoded origin or semantic truth.',
              'Sampled states cannot establish event onset, cycle counts or continuous motion equivalence.']
class Error(ValueError): pass

def need(ok, message):
    if not ok: raise Error(message)
def fields(x, names):
    need(isinstance(x, dict) and set(x) == set(names.split()), 'Unexpected or missing fields')
def sec(x):
    need(isinstance(x,str) and re.fullmatch(r'(0|[1-9][0-9]{0,4})(\.[0-9]{1,9})?',x), 'Invalid finite decimal seconds')
    d=Decimal(x); need(d <= 3600, 'Seconds limit'); return d
def st(x): return format(x,'f')
def interval(x):
    need(isinstance(x,list) and len(x)==2, 'Invalid interval')
    a,b=map(sec,x); need(a<=b,'Reversed interval'); return a,b
def ident(x): need(isinstance(x,str) and re.fullmatch(r'[A-Za-z][A-Za-z0-9_.-]{0,99}',x),'Invalid identifier')
def sha(x): need(isinstance(x,str) and re.fullmatch(r'[0-9a-f]{64}',x),'Invalid SHA256')
def strict_json(path):
    need(Path(path).stat().st_size<=1024*1024,'Annotation size limit')
    raw=Path(path).read_bytes(); need(len(raw)<=1024*1024,'Annotation size limit')
    depth=0; quoted=False; escaped=False
    try: decoded=raw.decode('utf8')
    except UnicodeDecodeError as e: raise Error('Invalid UTF8') from e
    for ch in decoded:
        if quoted:
            if escaped: escaped=False
            elif ch=='\\': escaped=True
            elif ch=='"': quoted=False
        elif ch=='"': quoted=True
        elif ch in '[{':
            depth+=1; need(depth<=20,'JSON depth limit')
        elif ch in ']}': depth-=1
    def pairs(items):
        d={}
        for k,v in items:
            need(k not in d,'Duplicate JSON key'); d[k]=v
        return d
    def bad(_): raise Error('Nonfinite JSON')
    try:return json.loads(raw,object_pairs_hook=pairs,parse_constant=bad)
    except (ValueError,RecursionError) as e: raise Error(str(e))
def hash_file(path):
    path=Path(path); need(path.is_file() and not path.is_symlink(),'Input must be regular non-symlink file')
    need(path.stat().st_size<=2*1024**3,'File size limit')
    before=path.stat(); h=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    after=path.stat(); need((before.st_ino,before.st_size,before.st_mtime_ns)==(after.st_ino,after.st_size,after.st_mtime_ns),'Input changed while hashing')
    return h.hexdigest()
def bind(path, expected):
    sha(expected); need(hash_file(path)==expected,'STALE media/evidence SHA256')
def probe_pts(path):
    # FFprobe best-effort decoded timestamps; never reconstruct from frame index/FPS.
    # These can differ from raw PTS on malformed media; no universal raw-PTS guarantee.
    with tempfile.TemporaryFile() as f:
        try:
            r=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries',
              'frame=best_effort_timestamp_time','-of','json',str(path)],stdout=f,stderr=subprocess.PIPE,timeout=45)
        except (OSError,subprocess.TimeoutExpired) as e: raise Error('BLOCKED ffprobe: '+str(e))
        need(r.returncode==0,'Cannot probe actual video PTS'); need(f.tell()<=16*1024*1024,'PTS output limit')
        f.seek(0); obj=json.load(f)
    vals=[Decimal(x['best_effort_timestamp_time']) for x in obj.get('frames',[]) if 'best_effort_timestamp_time' in x]
    need(vals and len(vals)<=216001,'No video PTS or frame limit')
    need(all(v.is_finite() for v in vals),'Invalid media PTS')
    need(all(b>a for a,b in zip(vals,vals[1:])),'Non-increasing video PTS')
    origin=vals[0]; pts=[x-origin for x in vals]
    need(pts[-1]<=3600,'Media duration limit'); return origin,pts

def validate(data):
    fields(data,'schema dataset_kind time_basis coverage evidence sequences correspondences')
    need(data['schema']==SCHEMA and data['time_basis']==TIME_BASIS,'Schema/time basis mismatch')
    need(data['dataset_kind'] in ('real','synthetic'),'Invalid dataset kind')
    fields(data['sequences'],'reference candidate'); fields(data['coverage'],'reference candidate')
    need(isinstance(data['evidence'],list) and len(data['evidence'])<=100,'Evidence limit')
    eids=set()
    for e in data['evidence']:
        fields(e,'id path sha256'); ident(e['id']); sha(e['sha256'])
        need(e['id'] not in eids,'Duplicate evidence'); eids.add(e['id'])
        need(isinstance(e['path'],str) and 0<len(e['path'])<=1000,'Invalid evidence path')
        p=Path(e['path']); need(not p.is_absolute() and '..' not in p.parts,'Evidence path traversal')
    indexes={}
    for role in ('reference','candidate'):
        cov=interval(data['coverage'][role]); sq=data['sequences'][role]
        fields(sq,'media_sha256 first_video_pts_s events'); sha(sq['media_sha256'])
        sec(sq['first_video_pts_s'])
        need(isinstance(sq['events'],list) and len(sq['events'])<=100,'Event limit')
        indexes[role]={}; previous=None
        for e in sq['events']:
            fields(e,'id actor action target kind status interval_s pts_samples evidence_id note')
            for k in ('id','actor','action','target'): ident(e[k])
            need(e['id'] not in indexes[role],'Duplicate event ID'); indexes[role][e['id']]=e
            need(e['kind'] in ('point','state','sampled_state'),'Invalid kind')
            need(e['status'] in ('observed','unknown','not_observed'),'Invalid observation status')
            ident(e['evidence_id']); need(e['evidence_id'] in eids,'Missing evidence reference')
            need(isinstance(e['note'],str) and len(e['note'])<=2000,'Invalid note')
            need(isinstance(e['pts_samples'],list) and len(e['pts_samples'])<=100,'PTS sample limit')
            samples=[sec(p) for p in e['pts_samples']]
            need(samples==sorted(set(samples)),'Duplicate/unordered samples')
            need(all(cov[0]<=p<=cov[1] for p in samples),'Sample outside inspected coverage')
            if e['status']=='observed':
                a,b=interval(e['interval_s']); need(cov[0]<=a<=b<=cov[1],'Event outside inspected coverage')
                need(samples and all(a<=p<=b for p in samples),'Observed observation needs original PTS within interval')
                if e['kind']=='state':need(a<b,'Occupied state requires positive duration; use sampled_state for snapshots')
                if e['kind']=='sampled_state':need(a==b and samples==[a],'Sampled state requires one exact sample, not event duration or onset bracket')
                need(previous is None or a>=previous,'Declared event order not chronological')
                previous=a
            else: need(e['interval_s'] is None,'Unknown/absent event must not have measured interval')
    need(isinstance(data['correspondences'],list) and len(data['correspondences'])<=100,'Correspondence limit')
    used_r=set();used_c=set()
    for m in data['correspondences']:
        fields(m,'reference_id candidate_ids tolerance_s rationale')
        r=m['reference_id']; ident(r); need(r in indexes['reference'] and r not in used_r,'Unknown/duplicate reference map');used_r.add(r)
        need(isinstance(m['candidate_ids'],list) and len(m['candidate_ids'])<=4,'Invalid candidate alternatives')
        for c in m['candidate_ids']:ident(c)
        need(len(set(m['candidate_ids']))==len(m['candidate_ids']),'Duplicate alternative')
        for c in m['candidate_ids']:
            need(c in indexes['candidate'] and c not in used_c,'Unknown/reused candidate mapping');used_c.add(c)
        sec(m['tolerance_s']);need(isinstance(m['rationale'],str) and 0<len(m['rationale'])<=2000,'Mapping rationale required')
    return indexes

def signature(e):return e['actor'],e['action'],e['target'],e['kind']
def sequence_diagnostic(a,b):
    """Exact signature edit count. No nearest-time alignment and no inferred truth."""
    sample_a=sum(e['kind']=='sampled_state' for e in a)
    sample_b=sum(e['kind']=='sampled_state' for e in b)
    excluded_a=sum(e['status']!='observed' or 'unknown' in signature(e)[:3] for e in a)
    excluded_b=sum(e['status']!='observed' or 'unknown' in signature(e)[:3] for e in b)
    a=[e for e in a if e['kind']!='sampled_state' and e['status']=='observed' and 'unknown' not in signature(e)[:3]]
    b=[e for e in b if e['kind']!='sampled_state' and e['status']=='observed' and 'unknown' not in signature(e)[:3]]
    n,m=len(a),len(b);d=[[0]*(m+1) for _ in range(n+1)];ways=[[1]*(m+1) for _ in range(n+1)]
    for i in range(n+1):d[i][0]=i
    for j in range(m+1):d[0][j]=j
    for i in range(1,n+1):
        for j in range(1,m+1):
            opts=[(d[i-1][j]+1,ways[i-1][j]),(d[i][j-1]+1,ways[i][j-1])]
            if signature(a[i-1])==signature(b[j-1]):opts.append((d[i-1][j-1],ways[i-1][j-1]))
            best=min(v for v,w in opts);d[i][j]=best;ways[i][j]=min(2,sum(w for v,w in opts if v==best))
    return {'minimum_insert_delete_operations':d[n][m] if n or m else None,
      'optimal_alignment':('AMBIGUOUS' if ways[n][m]>1 else 'UNIQUE') if n or m else 'NOT_APPLICABLE',
      'alignment_used_for_timing':False,'status':('NO_EVENT_OBSERVATIONS' if not n and not m else 'INCOMPLETE_ANNOTATIONS' if excluded_a or excluded_b else 'PARTIAL_EVENT_EVIDENCE' if sample_a or sample_b else 'ANNOTATED_SEQUENCE_ONLY'),
      'excluded_sampled_state_reference_count':sample_a,'excluded_sampled_state_candidate_count':sample_b,
      'excluded_unestablished_reference_count':excluded_a,'excluded_unestablished_candidate_count':excluded_b,
      'reference_observed_count':n,'candidate_observed_count':m}

def compare(data):
    idx=validate(data);results=[]; source_rank={e['id']:i for i,e in enumerate(data['sequences']['reference']['events'])}
    cand_rank={e['id']:i for i,e in enumerate(data['sequences']['candidate']['events'])}; paired=[]
    for mapping in data['correspondences']:
        r=idx['reference'][mapping['reference_id']]; cs=[idx['candidate'][c] for c in mapping['candidate_ids']]
        row={'reference_id':r['id'],'candidate_ids':mapping['candidate_ids'],'findings':[],
             'lag_interval_s':None,'duration_difference_s':None,'sample_clocks_s':None,'tolerance_applied':False,'timing_scope':'EXPLICIT_MAP_ONLY_NOT_SEMANTIC_APPROVAL','tolerance_s':mapping['tolerance_s']}
        if r['kind']=='sampled_state':row['timing_scope']='SAMPLED_STATE_ONLY_NO_EVENT_TIMING';row['tolerance_s']=None
        findings=row['findings']
        if r['status']!='observed':findings.append('REFERENCE_NOT_ESTABLISHED')
        elif not cs:findings.append('MISSING_FROM_ANNOTATED_CANDIDATE_SEQUENCE')
        elif len(cs)>1:findings.append('AMBIGUOUS_CORRESPONDENCE')
        elif cs[0]['status']!='observed':findings.append('CANDIDATE_'+cs[0]['status'].upper())
        elif any(v=='unknown' for v in signature(r)[:3]+signature(cs[0])[:3]):findings.append('SEMANTICS_NOT_ESTABLISHED')
        else:
            c=cs[0]
            if r['kind']==c['kind'] and r['kind']!='sampled_state':paired.append((source_rank[r['id']],cand_rank[c['id']],r['id']))
            if signature(r)!=signature(c): findings.append('SEMANTIC_MISMATCH')
            if r['kind']!=c['kind']:findings.append('EVENT_KIND_MISMATCH_NO_TIMING')
            elif r['kind']=='sampled_state':
                row['timing_scope']='SAMPLED_STATE_ONLY_NO_EVENT_TIMING'
                row['tolerance_s']=None
                row['sample_clocks_s']={'reference':r['pts_samples'][0],'candidate':c['pts_samples'][0]}
                findings.append('SAMPLED_LABEL_AGREEMENT_NOT_APPEARANCE_APPROVAL' if signature(r)==signature(c) else 'SAMPLED_LABEL_DIFFERENCE')
                if sec(r['pts_samples'][0])!=sec(c['pts_samples'][0]):findings.append('DIFFERENT_SAMPLE_CLOCKS_NO_ONSET_INFERENCE')
            else:
                ra,rb=interval(r['interval_s']);ca,cb=interval(c['interval_s']);tol=sec(mapping['tolerance_s'])
                if r['kind']=='point':
                    row['tolerance_applied']=True
                    lo,hi=ca-rb,cb-ra;row['lag_interval_s']=[st(lo),st(hi)]
                    if hi < -tol:findings.append('DEFINITELY_EARLY')
                    elif lo > tol:findings.append('DEFINITELY_LATE')
                    elif lo>=-tol and hi<=tol:findings.append('WITHIN_DECLARED_TOLERANCE_NOT_APPROVAL')
                    else:findings.append('TIMING_INCONCLUSIVE')
                else:
                    row['lag_interval_s']={'start':[st(ca-ra),st(ca-ra)],'end':[st(cb-rb),st(cb-rb)]}
                    row['duration_difference_s']=st((cb-ca)-(rb-ra))
                    findings.append('STATE_BOUNDARIES_RECORDED_NO_POINT_IOU_SCORE')
        results.append(row)
    paired.sort()
    inversions=[(a[2],b[2]) for i,a in enumerate(paired) for b in paired[i+1:] if a[1]>b[1]]
    mapped_r={m['reference_id'] for m in data['correspondences']};mapped_c={c for m in data['correspondences'] for c in m['candidate_ids']}
    return {'schema':SCHEMA+'/result','status':'DIAGNOSTIC_NOT_APPROVAL','limitations':LIMITATIONS,
      'dataset_kind':data['dataset_kind'],'time_basis':TIME_BASIS,'events':results,
      'order_inversions':inversions,'unmapped_reference_ids':sorted(set(idx['reference'])-mapped_r),
      'unmapped_candidate_ids':sorted(set(idx['candidate'])-mapped_c),
      'sequence':sequence_diagnostic(data['sequences']['reference']['events'],data['sequences']['candidate']['events']),
      'artistic_quality':None,'audio_review':'NOT_PERFORMED','annotation_truth':'NOT_VERIFIED'}

def pts_contains(sorted_pts, sample, tolerance=Decimal('0.000001')):
    """At most log2(N)+2 indexed reads after one sorted-PTS validation."""
    i=bisect_left(sorted_pts,sample)
    return ((i<len(sorted_pts) and abs(sorted_pts[i]-sample)<=tolerance) or
            (i>0 and abs(sorted_pts[i-1]-sample)<=tolerance))

def evaluate(data,reference,candidate,evidence_root,synthetic=False):
    validate(data);need((data['dataset_kind']=='synthetic')==synthetic,'Synthetic flag mismatch')
    root=Path(evidence_root).resolve()
    for e in data['evidence']:
        p=root/e['path'];need(p.resolve().is_relative_to(root),'Evidence escapes root')
        need(not any(q.is_symlink() for q in [p,*p.parents] if q!=root.parent),'Symlink evidence')
        bind(p,e['sha256'])
    bindings={}
    for role,path in [('reference',reference),('candidate',candidate)]:
        sq=data['sequences'][role];bind(path,sq['media_sha256'])
        if synthetic:bindings[role]='SYNTHETIC_BYTES_NOT_MEDIA';continue
        before=Path(path).stat(); origin,pts=probe_pts(path); after=Path(path).stat()
        need((before.st_ino,before.st_size,before.st_mtime_ns)==(after.st_ino,after.st_size,after.st_mtime_ns),'Media changed during probe')
        bind(path,sq['media_sha256'])
        need(abs(origin-Decimal(sq['first_video_pts_s']))<=Decimal('0.000001'),'STALE first video PTS')
        cov=interval(data['coverage'][role]);need(cov[1]<=pts[-1]+Decimal('0.000001'),'Coverage beyond last frame PTS')
        for e in sq['events']:
            for sample in e['pts_samples']:
                p=sec(sample);need(pts_contains(pts,p),'Declared PTS not present in media')
        bindings[role]={'status':'HASH_AND_ACTUAL_PTS_BOUND','frame_count':len(pts),'first_video_pts_s':st(origin)}
    result=compare(data);result['bindings']=bindings
    result['annotation_content_sha256']=hashlib.sha256(json.dumps(data,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    result['implementation_sha256']=hash_file(__file__)
    result['bound_media_sha256']={r:data['sequences'][r]['media_sha256'] for r in ('reference','candidate')}
    result['bound_evidence']=[dict(id=e['id'],sha256=e['sha256']) for e in data['evidence']]
    return result

def check_receipt_annotation(result, data):
    """Narrow freshness check only. Does not recheck media or establish truth."""
    validate(data)
    expected=hashlib.sha256(json.dumps(data,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    need(result.get('annotation_content_sha256')==expected,'STALE annotation content; re-evaluate')
    need(result.get('implementation_sha256')==hash_file(__file__),'STALE implementation; re-evaluate')
    return 'ANNOTATION_AND_IMPLEMENTATION_CURRENT_ONLY'

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--annotations',required=True);p.add_argument('--reference-media',required=True);p.add_argument('--candidate-media',required=True);p.add_argument('--evidence-root',required=True);p.add_argument('--out',required=True);p.add_argument('--synthetic',action='store_true');a=p.parse_args()
    try:
        data=strict_json(a.annotations);out=Path(a.out);need(not out.exists() and out.parent.is_dir(),'Output must be new in existing directory')
        result=evaluate(data,a.reference_media,a.candidate_media,a.evidence_root,a.synthetic)
        tmp=None
        try:
            with tempfile.NamedTemporaryFile('w',dir=out.parent,encoding='utf8',delete=False) as f:
                tmp=f.name;json.dump(result,f,ensure_ascii=False,indent=2);f.write('\n');f.flush();os.fsync(f.fileno())
            os.link(tmp,out)
        finally:
            if tmp is not None:os.unlink(tmp)
        return 0
    except (Error,OSError) as e: print(str(e),file=sys.stderr);return 2
if __name__=='__main__':sys.exit(main())
