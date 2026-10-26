#!/usr/bin/env python3
"""Static receipt snapshot: no media reads, evidence-link execution, JS or approval."""
from __future__ import annotations
import argparse
from decimal import Decimal, InvalidOperation
import hashlib
from html import escape
from pathlib import Path
import re
import subprocess
import sys

import event_intervals as core

MAX_RECEIPT_BYTES = 4 * 1024**2
REPORT_STATUS = 'COLLECTED_NOT_APPROVED'
FAILURE_STATES = ('STALE', 'MISSING', 'BLOCKED')
DECIMAL = re.compile(r'-?(0|[1-9][0-9]{0,7})(\.[0-9]{1,12})?\Z')
MEASUREMENTS = ('reference_lag', 'candidate_lag', 'visual_shift', 'audio_shift', 'lag_error')
LABELS = {'reference_visual':'Reference · visual', 'reference_audio':'Reference · audio',
          'candidate_visual':'Candidate · visual', 'candidate_audio':'Candidate · audio'}
ACTION_TEXT = {
    'DISAMBIGUATE_EVENT':'Resolve the listed candidates against the actual event; no nearest-peak choice was made.',
    'COLLECT_MISSING_OBSERVATION':'Collect the missing observation. Unknown is not a timestamp of zero.',
    'DECLARE_EVENT_CORRESPONDENCE':'Establish whether these are the same event before interpreting differences.',
    'COLLECT_OBSERVATIONS_SEPARATELY_FROM_PLAN':'These are planned times only. Record actual observations separately.',
    'INSPECT_DECLARED_DIFFERENCE':'Review the declared intervals and event identity; a numerical difference is not an artistic failure.',
    'NO_RESOLVED_DIRECTION_AT_GIVEN_BOUNDS':'No resolved direction at these bounds; this does not establish equality or acceptable sync.'}

require = core.require
keys = core.keys



def safe_text(value, limit=1000, nonempty=False):
    core.text(value,limit,nonempty)
    require(all((ord(c)>=32 or c in '\t\n\r') and ord(c) not in (0xFFFE,0xFFFF) for c in value),
            'Text contains unsupported XML control characters')


def seconds(value):
    require(isinstance(value,str) and DECIMAL.fullmatch(value), 'Invalid receipt decimal seconds')
    number=Decimal(value)
    require(number.copy_abs() <= 40000000 and not (number==0 and value.startswith('-')), 'Receipt seconds out of range')
    return number


def bounds(value):
    require(isinstance(value,list) and len(value)==2,'Invalid receipt interval')
    lo,hi=map(seconds,value)
    require(lo<=hi,'Reversed receipt interval')
    return lo,hi


def string_list(value, maximum=20):
    require(isinstance(value,list) and len(value)<=maximum,'Invalid string list')
    for item in value: safe_text(item)


def validate_receipt(data):
    """Closed shape and arithmetic checks; never verify the alleged observations."""
    require(isinstance(data,dict),'Receipt must be an object')
    require(data.get('schema_version')==core.SCHEMA,'Unsupported receipt schema')
    status=data.get('collection_status')
    if status in FAILURE_STATES:
        keys(data,'schema_version collection_status field reason events')
        safe_text(data['field'],nonempty=True); safe_text(data['reason'],nonempty=True)
        require(data['events']==[],'Failed receipt must not contain timing evidence')
        return data
    require(status==REPORT_STATUS,'Unsupported receipt status; approval cannot be supplied')
    keys(data,'schema_version collection_status dataset_kind synthetic_notice inputs bindings tool_sha256 provenance_validation verified_scope time_basis timing_validation timing events limitations')
    require(data['dataset_kind'] in ('synthetic','real'),'Invalid dataset kind')
    require(data['synthetic_notice']==('SYNTHETIC_NOT_FILM_EVIDENCE' if data['dataset_kind']=='synthetic' else None),'Invalid synthetic declaration')
    require(data['provenance_validation']=='OPERATOR_DECLARED_NOT_INDEPENDENTLY_VERIFIED','Unsupported provenance declaration')
    require(data['verified_scope']=='FILE_BYTES_AND_CONTRACT_ONLY_NOT_WATCHING_OR_LISTENING','Unsupported verification scope')
    require(data['time_basis']==core.TIME_BASIS and data['timing_validation']=='BOUND_PROFILE_NOT_REDECODED','Unsupported time basis or timing declaration')
    core.sha(data['tool_sha256']); string_list(data['limitations'])
    keys(data['inputs'],'reference candidate'); keys(data['timing'],'reference candidate')
    timings={}
    for role in core.ROLES:
        keys(data['inputs'][role],'media_sha256 profile_sha256')
        for value in data['inputs'][role].values(): core.sha(value)
        timing=data['timing'][role]
        keys(timing,'first_video_pts_s visual_domain_s audio_domain_s')
        first=seconds(timing['first_video_pts_s']); require(first.copy_abs()<=10000000,'Invalid source video origin')
        visual=bounds(timing['visual_domain_s'])
        require(visual[0]==0 and 0<visual[1]<=3600,'Invalid visual domain')
        audio=None if timing['audio_domain_s'] is None else bounds(timing['audio_domain_s'])
        if audio:
            require(audio[0].copy_abs()<=10000000 and 0<audio[1]-audio[0]<=3600,'Invalid audio domain')
        timings[role]={'first_video_pts_s':first,'visual':visual,'audio':audio}
    bindings=data['bindings']
    require(isinstance(bindings,list) and 5<=len(bindings)<=205,'Invalid binding count')
    binding_map={}; total_bytes=0
    for binding in bindings:
        keys(binding,'field sha256 bytes'); core.sha(binding['sha256'])
        field=binding['field']; safe_text(field,120,True)
        require(field not in binding_map,'Duplicate binding field')
        if field.startswith('evidence:'): core.identifier(field[len('evidence:'):])
        else: require(field in ('annotations','reference_media','candidate_media','reference_profile','candidate_profile'),'Unknown binding field')
        require(type(binding['bytes']) is int and 0<=binding['bytes']<=core.LIMITS['media'],'Invalid binding byte count')
        limit=core.LIMITS['annotation'] if field=='annotations' else core.LIMITS['media'] if field.endswith('_media') else core.LIMITS['profile']
        require(binding['bytes']<=limit,'Declared binding exceeds source file limit')
        total_bytes+=binding['bytes']; binding_map[field]=binding
    require(total_bytes<=core.LIMITS['total'],'Declared binding bytes exceed limit')
    require('annotations' in binding_map,'Missing annotation binding')
    for role in core.ROLES:
        for kind in ('media','profile'):
            field=role+'_'+kind
            require(field in binding_map and binding_map[field]['sha256']==data['inputs'][role][kind+'_sha256'],'Input binding mismatch inside receipt')
    events=data['events']
    require(isinstance(events,list) and len(events)<=100,'Invalid event count')
    event_ids=set(); all_observations={}; used_evidence=set(); evidence_layers={}
    for event in events:
        keys(event,'id label layer mapping mapping_note review_note review_actions review_windows measurements')
        core.identifier(event['id']); require(event['id'] not in event_ids,'Duplicate event ID'); event_ids.add(event['id'])
        safe_text(event['label'],120,True); safe_text(event['mapping_note']); safe_text(event['review_note'])
        layer=event['layer']; require(layer in ('manual','measured','planned','unknown'),'Invalid event layer')
        require(event['mapping'] in ('explicit','unresolved'),'Invalid event mapping')
        if event['mapping']=='explicit': safe_text(event['mapping_note'],nonempty=True)
        keys(event['review_windows'],' '.join(core.SLOTS)); keys(event['measurements'],' '.join(MEASUREMENTS))
        string_list(event['review_actions'],6)
        require(len(event['review_actions'])==len(set(event['review_actions'])) and all(a in ACTION_TEXT for a in event['review_actions']),'Invalid review actions')
        observations={}; slots={}
        for slot in core.SLOTS:
            windows=event['review_windows'][slot]
            require(isinstance(windows,list) and len(windows)<=4,'Too many slot candidates')
            role,modality=slot.split('_'); slots[slot]=[]
            for window in windows:
                keys(window,'id state interval_s interval_kind evidence_id locator context_s')
                core.identifier(window['id']); require(window['id'] not in observations,'Duplicate event observation ID')
                safe_text(window['locator'])
                state=window['state']; require(state in ('candidate','unknown','not_observed','intentional_silence'),'Invalid observation state')
                kinds={'manual':('event_boundary_bracket','reviewer_event_range','none'),
                       'measured':('analysis_support','none'),'planned':('planned_window','none'),'unknown':('none',)}
                require(window['interval_kind'] in kinds[layer],'Interval kind conflicts with provenance layer')
                if state=='candidate':
                    require(layer!='unknown' and window['interval_kind']!='none','Candidate has no evidence layer')
                    actual=core.interval(window['interval_s']); context=bounds(window['context_s'])
                    domain=timings[role][modality]
                    require(domain is not None and domain[0]<=actual[0]<=actual[1]<=domain[1],'Candidate outside declared domain')
                    require(context[0]<=actual[0]<=actual[1]<=context[1],'Invalid review context')
                else:
                    require(window['interval_s'] is None and window['context_s'] is None and window['interval_kind']=='none','Unknown/non-event cannot have a timestamp')
                if layer=='unknown': require(state=='unknown','Unknown layer asserts an event')
                if state=='intentional_silence': require(modality=='audio' and layer in ('manual','planned'),'Silence intent is not measured')
                eid=window['evidence_id']
                if eid is None: require(state=='unknown','Missing declared evidence ID')
                else:
                    core.identifier(eid); require('evidence:'+eid in binding_map,'Unknown evidence binding')
                    used_evidence.add(eid)
                    if layer!='unknown':
                        require(eid not in evidence_layers or evidence_layers[eid]==layer,'Evidence ID used across incompatible layers')
                        evidence_layers[eid]=layer
                if state!='unknown': safe_text(window['locator'],nonempty=True)
                ob={**window,'role':role,'modality':modality,'layer':layer}
                require(window['id'] not in all_observations or all_observations[window['id']]==ob,'Observation ID changes across events')
                all_observations[window['id']]=ob; observations[window['id']]=ob; slots[slot].append(window['id'])
        require(len(all_observations)<=800,'Too many observations')
        # Reproduce only the already-declared arithmetic and context. This is not
        # media analysis, provenance authentication, or evidence-link traversal.
        expected=core.evaluate_event({**event,'slots':slots},observations,timings)
        require(expected==event,'Receipt measurements/actions/context disagree with declared intervals')
    require(used_evidence=={f[len('evidence:'):] for f in binding_map if f.startswith('evidence:')},'Unreferenced receipt evidence binding')
    return data


def esc(value):
    return escape(str(value),quote=True)


def pretty_interval(value):
    return '—' if value is None else '['+', '.join(value)+'] s'


def event_svg(event):
    """A local window on one unchanged raw-time axis shared by all four lanes."""
    windows=event['review_windows']
    intervals=[bounds(w['context_s']) for slot in core.SLOTS for w in windows[slot] if w['context_s'] is not None]
    if intervals:
        lo=min(i[0] for i in intervals); hi=max(i[1] for i in intervals)
        if lo==hi: lo-=Decimal('.25'); hi+=Decimal('.25')
    else: lo=hi=None
    left,right=222,894; width=right-left
    def x(t): return left+float((t-lo)/(hi-lo))*width
    def num(v): return f'{v:.3f}'
    def svg_text(xpos,y,value,fill='#475569',size=13,weight='400',anchor='start'):
        return f'<text x="{num(xpos)}" y="{num(y)}" fill="{fill}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}">{esc(value)}</text>'
    rows=[]; y=88
    for slot in core.SLOTS:
        observations=windows[slot]; n=max(1,len(observations)); lane_height=40+n*27
        rows.append((slot,observations,y,lane_height)); y+=lane_height+10
    height=y+38
    parts=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1220 {height}" role="img" aria-label="Four lanes on a shared raw-time axis" font-family="Arial, sans-serif">',
           '<title>Declared event intervals; no alignment or approval</title>',
           f'<rect width="1220" height="{height}" rx="12" fill="#f8fafc"/>',
           svg_text(20,28,'RAW TIME · seconds relative to each first video PTS',size=14,weight='700'),
           svg_text(20,49,'One shared scale · local view only · no offset or time warping',size=12),
           svg_text(918,73,'Declared interval · s',size=12,weight='700')]
    if intervals:
        for index in range(6):
            tick=lo+(hi-lo)*Decimal(index)/5; pos=x(tick)
            parts.append(f'<line x1="{num(pos)}" y1="83" x2="{num(pos)}" y2="{height-30}" stroke="#dbe2ea" stroke-width="1"/>')
            # Display more precision for a narrow window; exact values remain in the table.
            tick_label=f'{tick:.4f}'.rstrip('0').rstrip('.') or '0'
            parts.append(svg_text(pos,73,tick_label,size=11,anchor='middle'))
        if lo<=0<=hi:
            parts.append(f'<line x1="{num(x(Decimal(0)))}" y1="83" x2="{num(x(Decimal(0)))}" y2="{height-30}" stroke="#64748b" stroke-dasharray="3 4"/>')
    else:
        parts.append(svg_text(left,73,'NO TIMED EVIDENCE — unknown is not zero',size=12,weight='700'))
    for slot,observations,top,lane_height in rows:
        candidate_count=sum(w['state']=='candidate' for w in observations)
        parts.append(svg_text(20,top+19,LABELS[slot],size=13,weight='700'))
        parts.append(svg_text(20,top+38,f'{candidate_count} candidate(s) · {len(observations)} record(s)',size=11))
        if len(observations)>1: parts.append(svg_text(left,top+17,'MULTIPLE RECORDS · no candidate selected',fill='#92400e',size=11,weight='700'))
        if not observations:
            parts.append(svg_text(left,top+44,'NO OBSERVATION',fill='#92400e',size=12))
        for index,window in enumerate(observations):
            row_y=top+39+index*27
            if window['interval_s'] is None:
                parts.append(svg_text(left,row_y+5,window['state'].upper()+' · no timestamp',fill='#92400e',size=12))
                parts.append(svg_text(918,row_y+5,'—',size=12))
                continue
            start,end=bounds(window['interval_s']); start_x,end_x=x(start),x(end)
            fill='#375a8c' if slot.startswith('reference') else '#9b5c26'
            planned=event['layer']=='planned'
            attrs=f'fill="{fill if not planned else "none"}" stroke="{fill}" stroke-width="2"'+(' stroke-dasharray="5 3"' if planned else '')
            title=esc(window['id']+' '+pretty_interval(window['interval_s'])+' · '+event['layer'])
            if start==end:
                parts.append(f'<line class="interval-point" x1="{num(start_x)}" y1="{row_y-8}" x2="{num(start_x)}" y2="{row_y+8}" stroke="{fill}" stroke-width="3"><title>{title}</title></line>')
            else:
                parts.append(f'<rect class="interval-bar" x="{num(start_x)}" y="{row_y-7}" width="{num(max(end_x-start_x,0.001))}" height="14" rx="2" {attrs}><title>{title}</title></rect>')
            label=pretty_interval(window['interval_s'])+(' · PLAN' if planned else '')
            # SVG keeps a compact number label; HTML below retains full precision.
            if len(label)>34: label='See exact values below'+(' · PLAN' if planned else '')
            parts.append(svg_text(918,row_y+5,label,size=12))
        parts.append(f'<line x1="20" y1="{top+lane_height}" x2="1200" y2="{top+lane_height}" stroke="#e2e8f0"/>')
    parts.append(svg_text(20,height-11,'Ticks are rounded; stored interval precision is retained in the table. Ranges are not confidence or certified event bounds.',size=11))
    parts.append('</svg>')
    return ''.join(parts)


CSS='''
:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#edf1f5;color:#17243a;font:15px/1.55 system-ui,-apple-system,Arial,sans-serif}main{max-width:1280px;margin:0 auto;padding:40px 28px 64px}h1{font-size:32px;letter-spacing:-.6px;margin:8px 0 10px}h2{font-size:22px;margin:0}h3{font-size:15px;margin:24px 0 8px}p{margin:8px 0}code{font-family:ui-monospace,monospace;font-size:.86em;overflow-wrap:anywhere}header{padding-bottom:24px}.eyebrow{color:#586c83;font-size:12px;letter-spacing:1.8px;font-weight:750}.badge{display:inline-block;border:1px solid #aebac9;border-radius:5px;padding:4px 8px;font-size:11px;font-weight:750;letter-spacing:.5px;background:#f8fafc}.warning{border-left:4px solid #b87932;background:#fff8ed;padding:14px 18px;border-radius:5px;color:#714615}.failure{border-left-color:#9a3543;background:#fff1f2;color:#7f2537}.panel{background:white;border:1px solid #dce3ec;border-radius:14px;padding:26px;margin:20px 0;box-shadow:0 2px 5px #15274208}.meta{font-size:13px;color:#526278}.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:18px 0}.meta-grid>div{border:1px solid #e2e8f0;border-radius:8px;padding:12px 15px;min-width:0}.event-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.event-head .badge{white-space:nowrap}.chart{margin-top:20px;overflow-x:auto}.chart svg{display:block;width:100%;min-width:850px;height:auto}.actions{padding:14px 18px;background:#f4f6fa;border-radius:8px;margin-top:18px}.actions ul{padding-left:20px;margin:8px 0}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:13px;text-align:left}th{color:#526278;font-size:11px;text-transform:uppercase;letter-spacing:.5px;background:#f8fafc}td,th{padding:11px 12px;border-bottom:1px solid #e4eaf1;vertical-align:top}td{overflow-wrap:anywhere}td code{font-size:11px}.subtle{color:#64748b}.reason{display:block;margin-top:4px;color:#64748b}.footnote{font-size:12px;color:#64748b;margin-top:20px}details{margin:14px 0}summary{cursor:pointer;font-weight:650}a{color:inherit}@media(max-width:650px){main{padding:24px 14px}.panel{padding:18px}.meta-grid{grid-template-columns:1fr}h1{font-size:27px}.event-head{display:block}.event-head .badge{margin-top:8px}}@media print{body{background:white}main{max-width:none;padding:0}.panel{break-inside:avoid;box-shadow:none}.chart svg{min-width:0}details{display:block}}
'''


def render_html(receipt, receipt_sha256):
    validate_receipt(receipt); core.sha(receipt_sha256)
    parts=['<!doctype html><html lang="en"><head><meta charset="utf-8">',
           '<meta name="viewport" content="width=device-width,initial-scale=1">',
           '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'">',
           '<title>Event interval review — evidence snapshot</title><style>'+CSS+'</style></head><body><main>',
           '<header><div class="eyebrow">MOTIONSTUDIO / REVIEW EVIDENCE</div><h1>Event intervals, not a quality score</h1>',
           '<span class="badge">'+REPORT_STATUS+'</span>',
           '<p class="meta">Static receipt snapshot · no media read · no listening · no automatic alignment</p></header>',
           '<div class="warning"><strong>Declared ranges are arithmetic envelopes, not statistical confidence intervals.</strong><br>Manual means operator-declared provenance. This renderer does not establish that anyone watched or heard the film. No sync pass or artistic approval is inferred.</div>',
           '<p class="meta">Receipt SHA-256: <code>'+esc(receipt_sha256)+'</code><br>Hash identifies these receipt bytes only; current media, evidence and evaluator code are not rechecked.</p>']
    if receipt['collection_status'] in FAILURE_STATES:
        parts.append('<section class="panel failure"><h2>Source receipt: '+esc(receipt['collection_status'])+'</h2><p>No timing lanes or numerical findings are available.</p><p>Field: <code>'+esc(receipt['field'])+'</code><br>Reason: <code>'+esc(receipt['reason'])+'</code></p></section>')
    else:
        if receipt['dataset_kind']=='synthetic':
            parts.append('<p class="warning"><strong>SYNTHETIC_NOT_FILM_EVIDENCE</strong> — demonstration only; no real viewing or listening claim.</p>')
        else:
            parts.append('<p class="meta">Source declares dataset_kind=real; the renderer does not authenticate that declaration.</p>')
        parts.append('<div class="meta-grid">')
        for role in core.ROLES:
            timing=receipt['timing'][role]
            parts.append('<div><strong>'+esc(role.title())+'</strong><p class="meta">First native video PTS: <code>'+esc(timing['first_video_pts_s'])+' s</code><br>Video domain: '+esc(pretty_interval(timing['visual_domain_s']))+'<br>Audio domain: '+esc(pretty_interval(timing['audio_domain_s']))+'</p><code>'+esc(receipt['inputs'][role]['media_sha256'])+'</code></div>')
        parts.append('</div><p class="meta">Raw times are relative to each file’s first video PTS; origins are not subtracted across files. All four lanes share the same scale within an event. Local zoom never moves or retimes an individual lane.</p>')
        if not receipt['events']: parts.append('<section class="panel"><h2>No declared events</h2><p>No event review has been performed by this renderer.</p></section>')
        for event in receipt['events']:
            parts.append('<section class="panel"><div class="event-head"><div><div class="eyebrow">'+esc(event['id'])+'</div><h2>'+esc(event['label'])+'</h2></div><span class="badge">'+esc(event['layer'].upper())+' · DECLARED</span></div>')
            parts.append('<p class="meta">Correspondence: <code>'+esc(event['mapping'])+'</code> — '+esc(event['mapping_note'])+'</p>')
            if event['review_note']: parts.append('<p>'+esc(event['review_note'])+'</p>')
            parts.append('<div class="chart">'+event_svg(event)+'</div><div class="actions"><strong>What to review next</strong><ul>')
            for action in event['review_actions']: parts.append('<li><code>'+esc(action)+'</code><br>'+esc(ACTION_TEXT[action])+'</li>')
            parts.append('</ul></div><h3>Declared differences</h3><div class="table-wrap"><table><thead><tr><th>Measure</th><th>Interval (seconds)</th><th>Status / review reason</th></tr></thead><tbody>')
            for name in MEASUREMENTS:
                m=event['measurements'][name]
                reasons='; '.join(m['unavailable_reasons'])
                if m['status']=='ARITHMETIC_ENVELOPE':
                    reasons={'contains_zero':'Contains zero; equality and perceptual sync remain unverified.', 'entirely_positive':'Positive range; review the event identity, phase and measurement boundaries.', 'entirely_negative':'Negative range; review the event identity, phase and measurement boundaries.'}[m['zero_relation']]
                parts.append('<tr><td><code>'+esc(name)+'</code></td><td>'+esc(pretty_interval(m['interval_s']))+'</td><td><code>'+esc(m['status'])+'</code><span class="reason">'+esc(reasons)+'</span></td></tr>')
            parts.append('</tbody></table></div><h3>Full stored evidence windows — locators are text, not links</h3><div class="table-wrap"><table><thead><tr><th>Lane / record</th><th>Declared interval / context</th><th>Evidence locator</th></tr></thead><tbody>')
            for slot in core.SLOTS:
                windows=event['review_windows'][slot]
                if not windows: parts.append('<tr><td>'+esc(LABELS[slot])+'</td><td>— / NO OBSERVATION</td><td>—</td></tr>')
                for window in windows:
                    parts.append('<tr><td>'+esc(LABELS[slot])+'<br><code>'+esc(window['id'])+' · '+esc(window['state'])+'</code></td><td>'+esc(pretty_interval(window['interval_s']))+'<span class="reason">Review context only: '+esc(pretty_interval(window['context_s']))+'</span><code>'+esc(window['interval_kind'])+'</code></td><td><code>'+esc(window['evidence_id'] or 'No evidence ID')+'</code><br>'+esc(window['locator'])+'</td></tr>')
            parts.append('</tbody></table></div></section>')
        parts.append('<section class="panel"><h2>Snapshot boundaries</h2><p class="meta">Evaluator source SHA-256 declared by receipt: <code>'+esc(receipt['tool_sha256'])+'</code></p><ul>')
        for limitation in receipt['limitations']: parts.append('<li>'+esc(limitation)+'</li>')
        parts.append('</ul><details><summary>Declared file bindings (not re-opened)</summary><div class="table-wrap"><table><thead><tr><th>Field</th><th>SHA-256</th><th>Bytes</th></tr></thead><tbody>')
        for binding in receipt['bindings']:
            parts.append('<tr><td><code>'+esc(binding['field'])+'</code></td><td><code>'+esc(binding['sha256'])+'</code></td><td>'+str(binding['bytes'])+'</td></tr>')
        parts.append('</tbody></table></div></details></section>')
    parts.append('<p class="footnote">Renderer status: '+REPORT_STATUS+'. No total score, media revalidation, semantic assessment, listening certificate or owner approval.</p></main></body></html>')
    return ''.join(parts)


def render_file(receipt_path, out):
    out=Path(out)
    require(not out.exists() and not out.is_symlink(),'Output must be fresh')
    require(out.parent.is_dir(),'Output parent must exist')
    require(not any(p.is_symlink() for p in (out.parent,*out.parent.parents)),'Output parent symlink forbidden')
    require(out.resolve()!=Path(receipt_path).resolve(),'Output must not equal receipt')
    core.validate_output_policy(out,script_path=__file__)
    raw=core.Reader().read(receipt_path,'receipt',MAX_RECEIPT_BYTES,keep=True)
    digest=hashlib.sha256(raw).hexdigest()
    data=core.parse_strict_json(raw)
    html=render_html(data,digest)
    core.write_fresh_text(out,html+'\n')
    return {'report_status':REPORT_STATUS,'receipt_sha256':digest,'source_status':data['collection_status']}


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['render']); parser.add_argument('--receipt',required=True); parser.add_argument('--out',required=True)
    args=parser.parse_args(argv)
    try:
        result=render_file(args.receipt,args.out)
        print(REPORT_STATUS+' · receipt snapshot '+result['receipt_sha256'])
        return 0
    except core.BindingError as exc:
        print(exc.status+': '+exc.field+': '+exc.reason,file=sys.stderr); return 1
    except (core.ContractError,OSError,InvalidOperation,subprocess.TimeoutExpired,RuntimeError) as exc:
        print('INPUT_ERROR: '+(str(exc) if isinstance(exc,core.ContractError) else type(exc).__name__),file=sys.stderr); return 2

if __name__=='__main__':
    raise SystemExit(main())
