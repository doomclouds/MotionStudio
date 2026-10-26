#!/usr/bin/env python3
"""Bound, offline interval arithmetic. No decoding, event detection or approval."""
from __future__ import annotations
import argparse
from decimal import Decimal, InvalidOperation
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import subprocess
import sys
import tempfile

SCHEMA = 'motionstudio.event-intervals/1.0'
PROFILE_SCHEMA = 'motionstudio.reference-profile/1.0'
TIME_BASIS = 'RELATIVE_TO_EACH_FIRST_VIDEO_PTS_NO_ALIGNMENT'
ROLES = ('reference', 'candidate')
SLOTS = ('reference_visual', 'reference_audio', 'candidate_visual', 'candidate_audio')
LIMITS = {'annotation': 1024**2, 'profile': 64*1024**2, 'media': 2*1024**3,
          'evidence': 64*1024**2, 'total': 8*1024**3}
ID = re.compile(r'[A-Za-z][A-Za-z0-9_-]{0,63}\Z')
SHA = re.compile(r'[0-9a-f]{64}\Z')
SECONDS = re.compile(r'-?(0|[1-9][0-9]{0,6})(\.[0-9]{1,9})?\Z')

class ContractError(ValueError):
    pass

class BindingError(Exception):
    def __init__(self, status, field, reason):
        self.status, self.field, self.reason = status, field, reason
        super().__init__(f'{status}: {field}: {reason}')


def require(condition, message):
    if not condition:
        raise ContractError(message)


def keys(obj, fields):
    require(isinstance(obj, dict) and set(obj) == set(fields.split()), 'Invalid object fields')


def text(value, limit=1000, nonempty=False):
    require(isinstance(value, str) and len(value) <= limit and (not nonempty or value.strip()), 'Invalid text')
    require(not any(0xD800 <= ord(c) <= 0xDFFF for c in value), 'Invalid Unicode surrogate')


def identifier(value):
    require(isinstance(value, str) and ID.fullmatch(value), 'Invalid ID')


def sha(value):
    require(isinstance(value, str) and SHA.fullmatch(value), 'Invalid SHA-256')


def parse_seconds(value):
    require(isinstance(value, str) and SECONDS.fullmatch(value), 'Seconds must be bounded decimal strings')
    number = Decimal(value)
    require(not (number == 0 and value.startswith('-')), 'Negative zero is not allowed')
    return number


def decimal_text(value):
    if value == 0:
        return '0'
    return format(value, 'f').rstrip('0').rstrip('.') if '.' in format(value, 'f') else format(value, 'f')


def interval(value):
    require(isinstance(value, list) and len(value) == 2, 'Invalid interval')
    lo, hi = map(parse_seconds, value)
    require(lo <= hi, 'Reversed interval')
    return lo, hi


def subtract_interval(a, b):
    return a[0]-b[1], a[1]-b[0]


def parse_strict_json(raw):
    if isinstance(raw, bytes):
        try:
            raw = raw.decode('utf-8')
        except UnicodeDecodeError as exc:
            raise ContractError('Invalid UTF-8') from exc
    depth, quoted, escaped = 0, False, False
    for c in raw:
        if quoted:
            if escaped: escaped = False
            elif c == '\\': escaped = True
            elif c == '"': quoted = False
        elif c == '"': quoted = True
        elif c in '[{':
            depth += 1
            require(depth <= 20, 'JSON nesting exceeds 20')
        elif c in ']}': depth -= 1
    def pairs(items):
        result = {}
        for k, v in items:
            require(k not in result, 'Duplicate JSON key')
            result[k] = v
        return result
    def bad_constant(_):
        raise ContractError('Non-finite JSON number')
    try:
        return json.loads(raw, object_pairs_hook=pairs, parse_float=Decimal, parse_constant=bad_constant)
    except (ValueError, RecursionError) as exc:
        if isinstance(exc, ContractError): raise
        raise ContractError('Invalid JSON') from exc


def validate_contract(data):
    keys(data, 'schema_version dataset_kind inputs time_basis evidence observations events')
    require(data['schema_version'] == SCHEMA, 'Unknown sidecar schema')
    require(data['dataset_kind'] in ('synthetic', 'real'), 'Invalid dataset kind')
    require(data['time_basis'] == TIME_BASIS, 'Unsupported time basis')
    keys(data['inputs'], 'reference candidate')
    for role in ROLES:
        keys(data['inputs'][role], 'media_sha256 profile_sha256')
        for value in data['inputs'][role].values(): sha(value)
    indexes = {}
    for name, maximum in [('evidence', 200), ('observations', 800), ('events', 100)]:
        rows = data[name]
        require(isinstance(rows, list) and len(rows) <= maximum, f'Too many/invalid {name}')
        indexes[name] = {}
        for row in rows:
            require(isinstance(row, dict), 'Row must be object')
            identifier(row.get('id'))
            require(row['id'] not in indexes[name], 'Duplicate ID')
            indexes[name][row['id']] = row
    for row in data['evidence']:
        keys(row, 'id relative_path sha256 kind')
        text(row['relative_path'], nonempty=True)
        relative_parts(row['relative_path'])
        sha(row['sha256'])
        require(row['kind'] in ('manual_record', 'measurement_profile', 'plan_record'), 'Invalid evidence kind')
    for row in data['observations']:
        keys(row, 'id role modality layer state interval_s interval_kind evidence_id locator note')
        require(row['role'] in ROLES and row['modality'] in ('visual', 'audio'), 'Invalid observation role/modality')
        layer, state = row['layer'], row['state']
        require(layer in ('manual', 'measured', 'planned', 'unknown'), 'Invalid layer')
        require(state in ('candidate', 'unknown', 'not_observed', 'intentional_silence'), 'Invalid observation state')
        allowed = {'manual': ('event_boundary_bracket','reviewer_event_range','none'),
                   'measured': ('analysis_support','none'), 'planned': ('planned_window','none'), 'unknown': ('none',)}
        require(row['interval_kind'] in allowed[layer], 'Interval kind does not match layer')
        text(row['locator'], nonempty=state != 'unknown'); text(row['note'])
        if state == 'candidate':
            interval(row['interval_s'])
            require(layer != 'unknown' and row['interval_kind'] != 'none', 'Candidate requires known layer and interval kind')
        else:
            require(row['interval_s'] is None and row['interval_kind'] == 'none', 'Non-candidate must have null interval')
        if state == 'intentional_silence':
            require(row['modality'] == 'audio' and layer in ('manual','planned'), 'Silence intent is not measured')
        if layer == 'unknown': require(state == 'unknown', 'Unknown layer cannot assert observation')
        eid = row['evidence_id']
        if eid is None:
            require(state == 'unknown', 'Observation requires evidence')
        else:
            require(isinstance(eid, str) and eid in indexes['evidence'], 'Unknown evidence ID')
            expected = {'manual':'manual_record','measured':'measurement_profile','planned':'plan_record'}
            if layer in expected:
                require(indexes['evidence'][eid]['kind'] == expected[layer], 'Evidence kind does not match layer')
    used = set()
    for row in data['events']:
        keys(row, 'id label purpose layer mapping mapping_note slots review_note')
        text(row['label'],120,True); text(row['purpose'],120,True); text(row['review_note'])
        require(row['layer'] in ('manual','measured','planned','unknown'), 'Invalid event layer')
        require(row['mapping'] in ('explicit','unresolved'), 'Invalid mapping')
        text(row['mapping_note'], nonempty=row['mapping']=='explicit')
        keys(row['slots'], ' '.join(SLOTS))
        for slot, ids in row['slots'].items():
            require(isinstance(ids,list) and len(ids)<=4 and all(isinstance(i,str) for i in ids), 'Invalid candidate list')
            require(len(ids)==len(set(ids)), 'Duplicate slot candidate')
            for oid in ids:
                require(oid in indexes['observations'], 'Unknown observation ID')
                ob = indexes['observations'][oid]
                require(f"{ob['role']}_{ob['modality']}"==slot and ob['layer']==row['layer'], 'Mixed role/modality/layer')
                used.add(oid)
    require(used == set(indexes['observations']), 'Unreferenced observation')
    require({o['evidence_id'] for o in data['observations'] if o['evidence_id']} == set(indexes['evidence']), 'Unreferenced evidence')
    return indexes


def profile_number(value):
    require(type(value) in (int, Decimal), 'Profile numeric field invalid')
    require(len(str(value)) <= 40, 'Profile numeric field too large')
    d = Decimal(value)
    require(d.is_finite() and d.copy_abs() <= Decimal('10000000'), 'Profile numeric field out of bounds')
    require(d.as_tuple().exponent >= -12, 'Profile precision unsupported')
    return d


def extract_bound_timing(profile, media_sha):
    require(isinstance(profile,dict) and profile.get('schema_version') == PROFILE_SCHEMA, 'Unsupported profile schema')
    try:
        require(profile['input']['sha256'] == media_sha, 'Profile media binding mismatch')
        first = profile_number(profile['input']['video']['first_pts_s'])
        duration = profile_number(profile['timeline']['duration_s'])
        require(0 < duration <= 3600, 'Video duration outside limit')
        audio = profile['audio']
        require(audio['status'] in ('ABSENT','OBSERVED'), 'Unknown audio timing state')
        domain = None
        if audio['status'] == 'OBSERVED':
            start, length = profile_number(audio['origin_s']), profile_number(audio['duration_s'])
            require(0 < length <= 3600, 'Audio duration outside limit')
            domain = (start, start+length)
        return {'first_video_pts_s':first, 'visual':(Decimal(0),duration), 'audio':domain}
    except (KeyError, TypeError) as exc:
        raise ContractError('Missing profile timing fields') from exc


def validate_domains(data, timings):
    for row in data['observations']:
        if row['interval_s'] is not None:
            domain = timings[row['role']][row['modality']]
            require(domain is not None, 'Interval has no available media domain')
            lo, hi = interval(row['interval_s'])
            require(domain[0] <= lo <= hi <= domain[1], 'Interval outside media domain; no automatic clipping')


def evaluate_event(event, observations, timings):
    values = {}
    def calculate(name, required, formula):
        reasons = []
        selected = {}
        if event['layer'] in ('planned','unknown'):
            status = 'PLANNED_ONLY' if event['layer']=='planned' else 'MISSING'
            reasons.append('Layer is not observed evidence')
        elif event['mapping'] == 'unresolved':
            status = 'UNRESOLVED_MAPPING'; reasons.append('Event correspondence is unresolved')
        else:
            statuses = []
            for slot in required:
                ids = event['slots'][slot]
                if len(ids)>1: statuses.append('AMBIGUOUS'); reasons.append(slot+': multiple candidates')
                elif not ids: statuses.append('MISSING'); reasons.append(slot+': no observation')
                else:
                    ob = observations[ids[0]]
                    if ob['state']=='candidate': selected[slot]=interval(ob['interval_s'])
                    else:
                        statuses.append('MISSING' if ob['state']=='unknown' else 'NOT_APPLICABLE')
                        reasons.append(slot+': '+ob['state'])
            status = next((s for s in ('AMBIGUOUS','MISSING','NOT_APPLICABLE') if s in statuses),'ARITHMETIC_ENVELOPE')
        result = {'status':status,'interval_s':None,'required_slots':list(required),'unavailable_reasons':reasons}
        if status == 'ARITHMETIC_ENVELOPE':
            bounds = formula(selected)
            result['interval_s'] = list(map(decimal_text,bounds))
            result['zero_relation'] = 'entirely_negative' if bounds[1]<0 else 'entirely_positive' if bounds[0]>0 else 'contains_zero'
        values[name] = result
    rv,ra,cv,ca = SLOTS
    calculate('reference_lag',(rv,ra),lambda x:subtract_interval(x[ra],x[rv]))
    calculate('candidate_lag',(cv,ca),lambda x:subtract_interval(x[ca],x[cv]))
    calculate('visual_shift',(rv,cv),lambda x:subtract_interval(x[cv],x[rv]))
    calculate('audio_shift',(ra,ca),lambda x:subtract_interval(x[ca],x[ra]))
    calculate('lag_error',SLOTS,lambda x:subtract_interval(subtract_interval(x[ca],x[cv]),subtract_interval(x[ra],x[rv])))
    windows = {}
    for slot, ids in event['slots'].items():
        windows[slot] = []
        for oid in ids:
            ob = observations[oid]
            item = {k:ob[k] for k in ('id','state','interval_s','interval_kind','evidence_id','locator')}
            item['context_s'] = None
            if ob['interval_s'] is not None:
                lo,hi = interval(ob['interval_s']); domain=timings[ob['role']][ob['modality']]
                item['context_s'] = list(map(decimal_text,(max(domain[0],lo-Decimal('.25')),min(domain[1],hi+Decimal('.25')))))
            windows[slot].append(item)
    actions=[]
    statuses={v['status'] for v in values.values()}
    if 'AMBIGUOUS' in statuses: actions.append('DISAMBIGUATE_EVENT')
    if 'MISSING' in statuses: actions.append('COLLECT_MISSING_OBSERVATION')
    if 'UNRESOLVED_MAPPING' in statuses: actions.append('DECLARE_EVENT_CORRESPONDENCE')
    if 'PLANNED_ONLY' in statuses: actions.append('COLLECT_OBSERVATIONS_SEPARATELY_FROM_PLAN')
    if any(v.get('zero_relation') in ('entirely_negative','entirely_positive') for v in values.values()): actions.append('INSPECT_DECLARED_DIFFERENCE')
    if not actions: actions.append('NO_RESOLVED_DIRECTION_AT_GIVEN_BOUNDS')
    return {'id':event['id'],'label':event['label'],'layer':event['layer'],
            'mapping':event['mapping'],'mapping_note':event['mapping_note'],'review_note':event['review_note'],
            'review_actions':actions,'review_windows':windows,'measurements':values}


def relative_parts(value):
    require(isinstance(value,str) and '\\' not in value and ':' not in value and '\0' not in value, 'Invalid evidence path')
    parts=value.split('/')
    require(all(p and p not in ('.','..') for p in parts) and not PurePosixPath(value).is_absolute(), 'Evidence path must be contained relative path')
    return parts


def regular_path(path, field):
    path=Path(path).absolute()
    try:
        for component in (path, *path.parents):
            if component.is_symlink(): raise BindingError('BLOCKED',field,'SYMLINK_NOT_ALLOWED')
        if not stat.S_ISREG(path.stat().st_mode): raise BindingError('BLOCKED',field,'NOT_REGULAR_FILE')
        return path
    except FileNotFoundError as exc: raise BindingError('MISSING',field,'FILE_MISSING') from exc
    except OSError as exc: raise BindingError('BLOCKED',field,'FILE_ACCESS_FAILED') from exc


class Reader:
    def __init__(self): self.total=0; self.bindings=[]
    def read(self,path,field,limit,expected=None,keep=False):
        path=regular_path(path,field)
        try:
            before=path.stat()
            require(before.st_size <= limit,'File size limit exceeded: '+field)
            require(self.total+before.st_size <= LIMITS['total'],'Total input size limit exceeded')
            self.total+=before.st_size
            digest=hashlib.sha256(); chunks=[]; count=0
            with path.open('rb') as stream:
                while chunk:=stream.read(1024**2):
                    count+=len(chunk)
                    if count>before.st_size or count>limit:
                        raise BindingError('STALE',field,'CHANGED_DURING_READ')
                    digest.update(chunk)
                    if keep: chunks.append(chunk)
            after=path.stat()
            identity=lambda st:(st.st_dev,st.st_ino,st.st_size,st.st_mtime_ns)
            if identity(before)!=identity(after) or count!=before.st_size: raise BindingError('STALE',field,'CHANGED_DURING_READ')
            actual=digest.hexdigest()
            if expected is not None and actual!=expected: raise BindingError('STALE',field,'HASH_MISMATCH')
            self.bindings.append({'field':field,'sha256':actual,'bytes':count})
            return b''.join(chunks) if keep else actual
        except OSError as exc: raise BindingError('BLOCKED',field,'FILE_ACCESS_FAILED') from exc


def evaluate_files(annotations,reference_media,candidate_media,reference_profile,candidate_profile,evidence_root,output_path=None):
    reader=Reader()
    raw=reader.read(annotations,'annotations',LIMITS['annotation'],keep=True)
    data=parse_strict_json(raw); indexes=validate_contract(data)
    if output_path is not None:
        forbidden = [annotations,reference_media,candidate_media,reference_profile,candidate_profile]
        forbidden += [Path(evidence_root).joinpath(*relative_parts(e['relative_path'])) for e in data['evidence']]
        require(all(Path(output_path).resolve()!=Path(p).resolve() for p in forbidden),'Output must not equal any input')
    timings={}
    for role,media,profile_path in zip(ROLES,(reference_media,candidate_media),(reference_profile,candidate_profile)):
        binding=data['inputs'][role]
        reader.read(media,role+'_media',LIMITS['media'],binding['media_sha256'])
        profile=parse_strict_json(reader.read(profile_path,role+'_profile',LIMITS['profile'],binding['profile_sha256'],True))
        require(isinstance(profile,dict) and isinstance(profile.get('input'),dict),'Invalid profile object')
        if profile['input'].get('sha256')!=binding['media_sha256']:
            raise BindingError('STALE',role+'_profile','PROFILE_MEDIA_HASH_MISMATCH')
        timings[role]=extract_bound_timing(profile,binding['media_sha256'])
    root=Path(evidence_root).absolute()
    for ev in data['evidence']:
        path=root.joinpath(*relative_parts(ev['relative_path']))
        # Sanitized relative components plus regular_path's ancestor symlink rejection
        # keep evidence beneath the explicit root without following hostile links.
        reader.read(path,'evidence:'+ev['id'],LIMITS['evidence'],ev['sha256'])
    validate_domains(data,timings)
    source_hash=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    return {'schema_version':SCHEMA,'collection_status':'COLLECTED_NOT_APPROVED',
            'dataset_kind':data['dataset_kind'],'synthetic_notice':'SYNTHETIC_NOT_FILM_EVIDENCE' if data['dataset_kind']=='synthetic' else None,
            'inputs':data['inputs'],'bindings':reader.bindings,'tool_sha256':source_hash,
            'provenance_validation':'OPERATOR_DECLARED_NOT_INDEPENDENTLY_VERIFIED',
            'verified_scope':'FILE_BYTES_AND_CONTRACT_ONLY_NOT_WATCHING_OR_LISTENING',
            'time_basis':TIME_BASIS,'timing_validation':'BOUND_PROFILE_NOT_REDECODED',
            'timing':{r:{'first_video_pts_s':decimal_text(t['first_video_pts_s']),
                         'visual_domain_s':list(map(decimal_text,t['visual'])),
                         'audio_domain_s':list(map(decimal_text,t['audio'])) if t['audio'] else None} for r,t in timings.items()},
            'events':[evaluate_event(e,indexes['observations'],timings) for e in data['events']],
            'limitations':['Arithmetic envelopes, not statistical confidence intervals or guarantees of true event bounds.',
                          'Profile timing is hash-bound, not re-decoded; source timestamp quantization remains.',
                          'No automatic pairing, alignment, listening, semantic validation or artistic approval.',
                          'Manual records and event identity are operator assertions, not certified by this tool.']}




def git_environment():
    # Do not let an unrelated caller-selected repository redirect discovery/checks.
    env=os.environ.copy()
    for key in ('GIT_DIR','GIT_WORK_TREE','GIT_COMMON_DIR','GIT_INDEX_FILE','GIT_CEILING_DIRECTORIES'):
        env.pop(key,None)
    return env


def detect_repository(script_path):
    """Validate worktree identity; an empty host .git placeholder is not a repo."""
    for parent in Path(script_path).resolve().parents:
        marker=parent/'.git'
        if not marker.exists() and not marker.is_symlink():
            continue
        require(not marker.is_symlink(),'Repository marker symlink unsupported')
        # Only a truly empty host marker is ignorable. A damaged repository
        # (for example missing HEAD) must not silently disable output policy.
        plausible=False
        if marker.is_dir():
            plausible=next(marker.iterdir(),None) is not None
        elif marker.is_file():
            plausible=marker.stat().st_size>0
        else:
            raise ContractError('Repository marker must be a regular file or directory')
        if not plausible:
            continue
        try:
            probe=subprocess.run(['git','-C',str(parent),'rev-parse','--show-toplevel','--is-inside-work-tree'],
                                 env=git_environment(),stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,
                                 timeout=10,text=True)
        except OSError as exc:
            raise ContractError('Git required to validate repository output policy') from exc
        lines=probe.stdout.splitlines()
        require(probe.returncode==0 and len(lines)==2 and lines[1]=='true',
                'Repository marker could not be validated; output policy fails closed')
        require(Path(lines[0]).resolve()==parent,'Repository root identity mismatch')
        return parent
    return None


def validate_output_policy(out, script_path=__file__):
    repo=detect_repository(script_path)
    if repo is not None and out.resolve().is_relative_to(repo):
        check=subprocess.run(['git','check-ignore','--no-index','--',str(out.resolve())],cwd=repo,
                             env=git_environment(),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=10)
        require(check.returncode==0,'Inside-repository output must already be Git-ignored')


def write_fresh_text(out, payload):
    """Complete/fsync text in a sibling temp; atomically publish without overwrite."""
    require(isinstance(payload,str),'Text payload required')
    fd,name=tempfile.mkstemp(prefix='.event-interval-',suffix='.tmp',dir=out.parent)
    try:
        with os.fdopen(fd,'w',encoding='utf-8') as stream:
            stream.write(payload); stream.flush(); os.fsync(stream.fileno())
        # link is atomic and fails if a concurrent writer already created out.
        # No rename/replace fallback: unsupported filesystems fail closed.
        os.link(name,out)
    finally:
        os.unlink(name)


def write_fresh_json(out, result):
    write_fresh_text(out,json.dumps(result,ensure_ascii=True,indent=2,allow_nan=False)+'\n')


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['evaluate'])
    for name in ('annotations','reference-media','candidate-media','reference-profile','candidate-profile','evidence-root','out'):
        parser.add_argument('--'+name,required=True)
    args=vars(parser.parse_args(argv)); args.pop('command'); out=Path(args.pop('out'))
    try:
        require(not out.exists() and not out.is_symlink(),'Output must be fresh')
        # Existing parent only: never create directory trees or follow output symlinks.
        require(out.parent.is_dir(),'Output parent must exist')
        require(not any(p.is_symlink() for p in (out.parent,*out.parent.parents)),'Output parent symlink forbidden')
        require(all(out.resolve()!=Path(v).resolve() for k,v in args.items() if k!='evidence_root'),'Output must not equal explicit input')
        validate_output_policy(out)
        try:
            result=evaluate_files(**args,output_path=out); code=0
        except BindingError as exc:
            result={'schema_version':SCHEMA,'collection_status':exc.status,'field':exc.field,'reason':exc.reason,'events':[]}; code=1
        write_fresh_json(out,result)
        print(result['collection_status']); return code
    except (ContractError,OSError,InvalidOperation,subprocess.TimeoutExpired,RuntimeError) as exc:
        print('INPUT_ERROR: '+(str(exc) if isinstance(exc,ContractError) else type(exc).__name__),file=sys.stderr)
        return 2

if __name__=='__main__':
    raise SystemExit(main())
