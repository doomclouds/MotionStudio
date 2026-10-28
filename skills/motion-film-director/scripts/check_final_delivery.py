#!/usr/bin/env python3
"""Fail-closed audiovisual review package gate; no automatic artistic approval."""
import argparse
import base64
from datetime import datetime, timezone
from fractions import Fraction
import hashlib
import html
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

from check_delivery import digest, inspect
from validate_delivery_report import validate_report

METHODS = {'visual': {'normal_speed_visual'},
           'audio': {'perceptual_audio_human', 'perceptual_audio_model'},
           'av_sync': {'normal_speed_av'}}


def number(value):
    if isinstance(value, bool):
        raise ValueError('Boolean is not a time')
    return Fraction(str(value))


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def load_json(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError('Duplicate JSON key: ' + key)
            result[key] = value
        return result
    return json.loads(raw, object_pairs_hook=pairs)


class Inputs:
    def __init__(self, root):
        self.root = root.resolve()
        self.bindings = {}

    def read(self, path, expected=None, relative=False):
        path = Path(path)
        if relative:
            if path.is_absolute() or '..' in path.parts:
                raise ValueError('Evidence paths must stay within packet directory')
            path = self.root / path
        path = path.resolve(strict=True)
        if relative and not path.is_relative_to(self.root):
            raise ValueError('Evidence symlink escapes packet directory')
        if not path.is_file():
            raise ValueError('Expected regular input file')
        raw = path.read_bytes()
        actual = hashlib.sha256(raw).hexdigest()
        if expected is not None and actual != expected:
            raise ValueError('Evidence hash mismatch: ' + path.name)
        if path in self.bindings and self.bindings[path] != actual:
            raise ValueError('Input changed: ' + path.name)
        self.bindings[path] = actual
        return raw

    def artifact(self, spec):
        if not isinstance(spec, dict) or not nonempty(spec.get('path')) or not nonempty(spec.get('sha256')):
            raise ValueError('Artifact requires path and SHA256')
        return self.read(spec['path'], spec['sha256'], relative=True)

    def recheck(self):
        if any(digest(path) != expected for path, expected in self.bindings.items()):
            raise ValueError('Input changed before delivery report')


def authenticate(raw, signature, keys):
    # Verify immutable snapshots, not filenames which could change during verification.
    with tempfile.TemporaryDirectory(prefix='motion-review-verify-') as directory:
        root = Path(directory)
        (root / 'record').write_bytes(raw)
        (root / 'signature').write_bytes(signature)
        for key in keys:
            (root / 'public.pem').write_bytes(key)
            result = subprocess.run(['openssl', 'pkeyutl', '-verify', '-pubin',
                '-inkey', str(root / 'public.pem'), '-rawin', '-in', str(root / 'record'),
                '-sigfile', str(root / 'signature')], capture_output=True, timeout=30)
            if result.returncode == 0:
                return hashlib.sha256(key).hexdigest()
    return None


def source_evidence(raw, kind, method, movie, duration):
    """Reject known source contradictions; hashes alone do not establish perception.

    Plain human session notes remain declared evidence. Known machine receipts
    receive stricter checks; a wrapper cannot upgrade their modality or status.
    """
    stripped = raw.lstrip()
    if not stripped.startswith((b'{', b'[')):
        return [], False
    source = load_json(raw)
    if not isinstance(source, dict):
        return [], False
    blocked = []
    status = source.get('status')
    if isinstance(status, str) and status.lower() in {
            'not_listened', 'blocked', 'failed', 'pending', 'unverified',
            'uncertain', 'error', 'review_candidate', 'not_run', 'not_reviewed', 'not_checked', 'skipped_not_configured', 'optional_not_run'}:
        blocked.append('Source evidence is not completed: ' + status)
    if method == 'perceptual_audio_human' and source.get('human_listening') is False:
        blocked.append('Source explicitly says no human listening')
    if kind == 'av_sync' and source.get('audiovisual_sync') in ('unverified', 'NOT_RUN', 'not_checked', False):
        blocked.append('Source explicitly leaves audiovisual sync unverified')
    if 'movie_sha256' in source and source['movie_sha256'] != movie['sha256']:
        blocked.append('Source evidence belongs to different media')
    sparse = source.get('coverage_kind') == 'full_audio_plus_sparse_frames'
    known_model = sparse or 'native_audio_review' in source
    if not known_model:
        return blocked, False
    if kind in ('visual', 'av_sync'):
        blocked.append('Audio/sparse-frame source cannot establish normal-speed visual or AV review')
    if method == 'perceptual_audio_human':
        blocked.append('Model source cannot establish human listening')
    if not sparse:
        # Legacy clip receipts lack final encoded movie identity/time mapping.
        blocked.append('Clip-only model receipt lacks verified full-movie extraction binding')
        return blocked, False
    if status != 'model_assisted_review_completed':
        blocked.append('Model source review did not complete')
    binding = source.get('input', {})
    bound_movie = binding.get('movie', {}) if isinstance(binding, dict) else {}
    if not isinstance(bound_movie, dict) or bound_movie.get('sha256') != movie['sha256']:
        blocked.append('Model source belongs to different media')
    audio = binding.get('audio', {}) if isinstance(binding, dict) else {}
    if not isinstance(audio, dict):
        audio = {}
    coverage = audio.get('coverage_s')
    if (not isinstance(coverage, list) or len(coverage) != 2
            or number(coverage[0]) != 0 or number(coverage[1]) < duration):
        blocked.append('Model source does not cover full encoded movie')
    receipt = source.get('provider_receipt')
    if not isinstance(receipt, dict) or not all(nonempty(receipt.get(k))
            for k in ('request_id', 'model', 'response_text')):
        blocked.append('Model source lacks actual provider receipt')
    elif receipt['model'] != source.get('model'):
        blocked.append('Model source receipt model mismatch')
    critique = source.get('review')
    if not isinstance(critique, dict) or not isinstance(critique.get('observations'), list) or not critique['observations']:
        blocked.append('Model source lacks actual time-coded perceptual observations')
    if isinstance(receipt, dict) and nonempty(receipt.get('response_text')):
        try:
            if load_json(receipt['response_text']) != critique:
                blocked.append('Model source critique differs from actual provider response')
        except (ValueError, TypeError):
            blocked.append('Model source provider response is not valid review JSON')
    return blocked, not blocked


def review(kind, spec, inputs, keys, movie, duration):
    if spec is None:
        return {'status': 'missing', 'blockers': ['Missing ' + kind + ' review']}
    raw = inputs.artifact(spec)
    record = load_json(raw)
    if not isinstance(record, dict):
        raise ValueError('Review must be an object')
    result = {'status': record.get('status', 'missing'), 'record': record,
              'record_sha256': hashlib.sha256(raw).hexdigest(), 'blockers': []}
    blocked = result['blockers']
    if type(record.get('schema')) is not int or record.get('schema') != 1 or record.get('kind') != kind:
        blocked.append('Wrong review schema/kind')
    if record.get('movie_sha256') != movie['sha256']:
        blocked.append('Review belongs to different media')
    if record.get('status') != 'passed':
        blocked.append('Review not passed: ' + str(record.get('status', 'missing')))
    if record.get('method') not in METHODS[kind]:
        blocked.append('Missing actual perceptual review method; measurements/booleans do not qualify')
    for key in ('reviewer', 'reviewed_at'):
        if not nonempty(record.get(key)):
            blocked.append('Missing ' + key)
    coverage = record.get('coverage')
    cursor = Fraction(0)
    if not isinstance(coverage, list) or not coverage:
        blocked.append('Missing full-length coverage')
    else:
        intervals = []
        for span in coverage:
            if not isinstance(span, list) or len(span) != 2:
                raise ValueError('Invalid review coverage')
            start, end = map(number, span)
            if not 0 <= start < end <= duration:
                raise ValueError('Coverage outside movie')
            intervals.append((start, end))
        for start, end in sorted(intervals):
            if start > cursor:
                break
            cursor = max(cursor, end)
        if cursor != duration:
            blocked.append('Review does not cover full encoded movie')
    observations = record.get('observations')
    if not isinstance(observations, list) or not observations:
        blocked.append('Missing time-coded perceptual findings')
    else:
        for item in observations:
            if not isinstance(item, dict) or not nonempty(item.get('finding')):
                raise ValueError('Invalid review observation')
            if not 0 <= number(item.get('start_s')) < number(item.get('end_s')) <= duration:
                raise ValueError('Observation outside movie')
    if not isinstance(record.get('limitations'), list) or any(not nonempty(x) for x in record['limitations']):
        blocked.append('Explicit limitations list required (may be empty)')
    issues = record.get('issues')
    if not isinstance(issues, list):
        blocked.append('Explicit issues list required (may be empty)')
    else:
        for issue in issues:
            if not isinstance(issue, dict) or not nonempty(issue.get('finding')):
                raise ValueError('Invalid review issue')
            if issue.get('disposition') not in ('resolved', 'accepted'):
                blocked.append('Unresolved review issue: ' + issue['finding'])
            if not nonempty(issue.get('rationale')):
                blocked.append('Issue disposition requires rationale: ' + issue['finding'])
    evidence = record.get('evidence')
    if not isinstance(evidence, list) or not evidence:
        blocked.append('Missing source review evidence (not a checkbox)')
    else:
        model_source = False
        for artifact in evidence:
            source_blockers, qualifies = source_evidence(
                inputs.artifact(artifact), kind, record.get('method'), movie, duration)
            blocked.extend(source_blockers)
            model_source = model_source or qualifies
        if record.get('method') == 'perceptual_audio_model' and not model_source:
            blocked.append('Model listening requires a bound completed model source receipt')
    signer = None
    if spec.get('signature'):
        signature = inputs.read(spec['signature'], relative=True)
        signer = authenticate(raw, signature, keys)
    if spec.get('signature') and signer is None:
        blocked.append('Supplied signature not verified against independently supplied trusted review key')
    result['signer_key_sha256'] = signer
    result['authentication'] = ('signed_attestation_not_proof_of_perception' if signer else
                                'unverified' if spec.get('signature') else 'declared_not_authenticated')
    return result


def technical(video, ffprobe, ffmpeg, inputs):
    movie = inspect(video, ffprobe)
    inputs.bindings[Path(movie['path'])] = movie['sha256']
    result = subprocess.run([ffprobe, '-v', 'error', '-protocol_whitelist', 'file,pipe',
        '-count_frames', '-show_streams', '-of', 'json', movie['path']],
        capture_output=True, text=True, check=True, timeout=600)
    streams = load_json(result.stdout)['streams']
    videos = [s for s in streams if s.get('codec_type') == 'video']
    audios = [s for s in streams if s.get('codec_type') == 'audio']
    if len(videos) != 1 or len(audios) != 1:
        raise ValueError('Delivery requires one unambiguous video and one audio stream')
    frames = int(videos[0]['nb_read_frames'])
    if frames <= 0:
        raise ValueError('No decoded video frames')
    # No shell, remote protocols, paid services, installs, or producer-provided success flags.
    subprocess.run([ffmpeg, '-nostdin', '-v', 'error', '-xerror', '-protocol_whitelist',
        'file,pipe', '-i', movie['path'], '-map', '0:v:0', '-map', '0:a:0',
        '-f', 'null', '-'], capture_output=True, check=True, timeout=600)
    return movie, {'status': 'passed', 'decoded_frames': frames,
                   'full_av_decode': 'passed', 'stream_count': {'video': 1, 'audio': 1},
                   'note': 'Decode and frame census only; not visual, listening, sync or loudness approval.'}


def standardize(result, packet, inputs):
    """Normalize presentation without upgrading missing evidence or review claims."""
    issues, limits, evidence = [], [], {}
    for kind, review_result in result['reviews'].items():
        record = review_result.get('record', {})
        limits.extend(kind + ': ' + value for value in record.get('limitations', []))
        spec = packet.get('reviews', {}).get(kind)
        if isinstance(spec, dict):
            evidence[(spec['path'], spec['sha256'])] = {'path': spec['path'], 'sha256': spec['sha256'], 'kind': kind + '_record'}
        for item in record.get('evidence', []):
            evidence[(item['path'], item['sha256'])] = dict(item, kind=kind + '_source')
        for index, item in enumerate(record.get('issues') or [], 1):
            start, end = item.get('start_s'), item.get('end_s')
            scope = 'window' if start is not None and end is not None else 'unspecified'
            severity = item.get('severity', 'unclassified')
            if scope == 'unspecified' or severity == 'unclassified':
                limits.append(kind + ': issue metadata lacks explicit time window or severity; not inferred.')
            issues.append({'id': item.get('id') or kind.upper() + '-' + str(index).zfill(3), 'kind': kind,
                'scope': scope, 'start_s': start if scope == 'window' else None,
                'end_s': end if scope == 'window' else None, 'severity': severity,
                'finding': item['finding'], 'disposition': item.get('disposition') if item.get('disposition') in ('resolved', 'accepted') and nonempty(item.get('rationale')) else 'pending',
                'rationale': item.get('rationale') or 'No disposition rationale recorded in source review.'})
    before_after = packet.get('before_after', {'status': 'not_applicable',
        'reason': 'No comparison requested in packet; this does not assert that no revisions occurred.', 'pairs': []})
    if packet.get('revision_kind') == 'repair' and (before_after.get('status') != 'included' or not before_after.get('pairs')):
        result['blockers'].append('Repair delivery requires before/after visual comparison or remains a candidate')
    for pair in before_after.get('pairs', []):
        if pair.get('after_movie_sha256') != result['movie']['sha256']:
            raise ValueError('Before/after comparison belongs to different current movie')
        for side in ('before', 'after'):
            inputs.artifact(pair[side])
            evidence[(pair[side]['path'], pair[side]['sha256'])] = dict(pair[side], kind='comparison_' + side)
    if result['blockers']:
        result['status'] = 'review_candidate'
    result.update(report_standard='motionstudio.delivery-report', report_standard_version=1,
        generated_at=datetime.now(timezone.utc).isoformat(),
        summary=('Review candidate: required evidence or review remains incomplete.' if result['blockers'] else
                 'Review process evidence is complete for owner review; artistic acceptance is not inferred.'),
        issues=issues, known_limits=limits + ['Statements and source hashes do not authenticate perception; owner acceptance remains separate.'],
        before_after=before_after, evidence_index=list(evidence.values()))
    return result


def render_report(result, pictures, comparison_pictures=()):
    escape = html.escape
    def section(title, value):
        return '<section><h2>' + escape(title) + '</h2><pre>' + escape(json.dumps(value, ensure_ascii=False, indent=2)) + '</pre></section>'
    images = ''.join('<figure><img alt="Bound visual review artifact" src="data:' + mime +
        ';base64,' + base64.b64encode(raw).decode() + '"><figcaption>SHA256 ' + sha +
        '</figcaption></figure>' for mime, raw, sha in pictures)
    sections = section('1 · Identity, scope and decision', {
        'report_standard': result['report_standard'], 'version': result['report_standard_version'],
        'generated_at': result['generated_at'], 'summary': result['summary'],
        'movie': result['movie'], 'target_duration_seconds': result['target_duration_seconds'],
        'status': result['status'], 'owner_approval': result['owner_approval'], 'blockers': result['blockers']})
    sections += section('2 · Technical checks (not perception)', result['technical'])
    sections += '<section><h2>3 · Visual evidence</h2>' + images + '</section>'
    for index, (kind, review_result) in enumerate(result['reviews'].items(), 4):
        sections += section(str(index) + ' · ' + kind + ' review — method, coverage and findings', review_result)
    sections += section('7 · Issue register and resolution', result['issues'])
    sections += section('8 · Before / after comparison', result['before_after'])
    for label, mime, raw, sha in comparison_pictures:
        sections += '<figure><figcaption>' + escape(label) + ' · SHA256 ' + sha + '</figcaption><img alt="Before or after comparison" src="data:' + mime + ';base64,' + base64.b64encode(raw).decode() + '"></figure>'
    sections += section('9 · Known limits and provenance', {'known_limits': result['known_limits'],
        'trust_boundary': result['trust_boundary'], 'evidence_index': result['evidence_index'],
        'packet_sha256': result['packet_sha256']})
    return ('<!doctype html><html lang="en"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width">'
        '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'">'
        '<title>Audiovisual delivery review</title><style>body{max-width:1100px;margin:2rem auto;padding:1rem;font:16px system-ui;background:#101820;color:#edf4fa}pre{white-space:pre-wrap;overflow-wrap:anywhere}img{max-width:100%}section,figure{padding:1rem;border:1px solid #617383}h1{color:#ffd780}</style>'
        '<h1>' + escape(result['status']) + '</h1><p>Not owner acceptance. Statements authenticate neither actual hearing nor artistic quality.</p>' + sections + '</html>')


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('video', type=Path)
    parser.add_argument('--packet', type=Path, required=True)
    parser.add_argument('--trusted-review-key', type=Path, action='append', default=[])
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--ffprobe', default='ffprobe')
    parser.add_argument('--ffmpeg', default='ffmpeg')
    args = parser.parse_args(argv)
    try:
        inputs = Inputs(args.packet.parent)
        packet = load_json(inputs.read(args.packet))
        if not isinstance(packet, dict) or type(packet.get('schema')) is not int or packet.get('schema') != 1:
            raise ValueError('Expected delivery packet schema 1')
        keys = [inputs.read(key) for key in args.trusted_review_key]
        movie, tech = technical(args.video, args.ffprobe, args.ffmpeg, inputs)
        duration = number(movie['duration_seconds_exact'])
        if packet.get('movie_sha256') != movie['sha256']:
            raise ValueError('Packet media hash mismatch')
        target = number(packet['target_duration_seconds'])
        if target <= 0:
            raise ValueError('Target duration must be positive')
        blockers = []
        if abs(duration - target) > Fraction(1, 20):
            blockers.append('Encoded duration differs from agreed full-film target by >50ms')
        specs = packet.get('reviews', {})
        if not isinstance(specs, dict):
            raise ValueError('reviews must be an object')
        reviews = {kind: review(kind, specs.get(kind), inputs, keys, movie, duration) for kind in METHODS}
        for kind, item in reviews.items():
            blockers.extend(kind + ': ' + reason for reason in item['blockers'])
        pictures = []
        for spec in packet.get('visual_artifacts', []):
            raw = inputs.artifact(spec)
            mime = 'image/png' if raw.startswith(b'\x89PNG\r\n\x1a\n') else 'image/jpeg' if raw.startswith(b'\xff\xd8\xff') else None
            if mime is None:
                raise ValueError('Visual artifacts must be PNG/JPEG, never executable HTML/SVG')
            subprocess.run([args.ffmpeg, '-nostdin', '-v', 'error', '-xerror',
                '-protocol_whitelist', 'file,pipe', '-i', str((inputs.root / spec['path']).resolve()),
                '-f', 'null', '-'], capture_output=True, check=True, timeout=60)
            pictures.append((mime, raw, spec['sha256']))
            signed_evidence = reviews['visual'].get('record', {}).get('evidence', [])
            if not isinstance(signed_evidence, list) or not any(
                    isinstance(item, dict) and item.get('sha256') == spec['sha256']
                    and item.get('path') == spec['path'] for item in signed_evidence):
                blockers.append('Visual artifact not bound by visual reviewer attestation')
        if not pictures:
            blockers.append('Missing bound visual report artifacts')
        result = {'schema': 1, 'status': 'review_candidate' if blockers else 'ready_for_owner_review',
            'owner_approval': 'not_checked', 'movie': movie, 'technical': tech,
            'target_duration_seconds': str(target), 'reviews': reviews, 'blockers': blockers,
            'packet_sha256': inputs.bindings[args.packet.resolve()],
            'visual_artifacts': packet.get('visual_artifacts', []),
            'trust_boundary': 'Unsigned reviews are declared, not authenticated. Optional external trust keys authenticate attestations, never prove perception. Verify actual review provenance; no inferred human listening.'}
        standardize(result, packet, inputs)
        errors = validate_report(result, finalized=False)
        if errors:
            raise ValueError('Report standard validation: ' + '; '.join(errors))
        comparison_pictures = []
        for pair in result['before_after']['pairs']:
            for side in ('before', 'after'):
                spec = pair[side]
                raw = inputs.artifact(spec)
                mime = 'image/png' if raw.startswith(b'\x89PNG\r\n\x1a\n') else 'image/jpeg' if raw.startswith(b'\xff\xd8\xff') else None
                if mime is None:
                    raise ValueError('Before/after artifacts must be PNG/JPEG')
                subprocess.run([args.ffmpeg, '-nostdin', '-v', 'error', '-xerror',
                    '-protocol_whitelist', 'file,pipe', '-i', str((inputs.root / spec['path']).resolve()),
                    '-f', 'null', '-'], capture_output=True, check=True, timeout=60)
                comparison_pictures.append((pair['issue_id'] + ' / ' + side, mime, raw, spec['sha256']))
        report = render_report(result, pictures, comparison_pictures).encode('utf-8')
        inputs.recheck()
        result['report'] = {'path': str(args.report.resolve()), 'sha256': hashlib.sha256(report).hexdigest()}
        errors = validate_report(result)
        if errors:
            raise ValueError('Report standard validation: ' + '; '.join(errors))
        # Atomic no-overwrite publication; incomplete temporary files never become reports.
        published = False
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(dir=args.report.parent, prefix='.delivery-report-', delete=False) as output:
                temporary = Path(output.name)
                output.write(report)
                output.flush()
                os.fsync(output.fileno())
            inputs.recheck()
            os.link(temporary, args.report)
            published = True
            inputs.recheck()
        except BaseException:
            if published:
                args.report.unlink(missing_ok=True)
            raise
        finally:
            if temporary is not None:
                temporary.unlink(missing_ok=True)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 1 if blockers else 0
    except (OSError, ValueError, TypeError, KeyError, ZeroDivisionError, subprocess.SubprocessError) as error:
        print(json.dumps({'status': 'error', 'error': str(error), 'approval': 'not_granted'}), file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
