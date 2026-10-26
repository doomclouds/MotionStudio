#!/usr/bin/env python3
"""Local, read-only film review planner. No network, installs, or model calls."""
import argparse
from bisect import bisect_right
from fractions import Fraction
import hashlib
import html
import json
import math
from pathlib import Path
import shutil
import subprocess
import sys
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / 'skills/motion-film-director/references/review-methods.json'
CHECK = ROOT / 'skills/motion-film-director/scripts/motion-check/motion_check.py'


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args]).decode().strip()


def snapshot(source_root):
    root = Path(source_root).resolve()
    relative = root.relative_to(ROOT)
    names = git('ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', str(relative)).split('\0')
    files = {}
    for name in sorted(set(filter(None, names))):
        path = ROOT / name
        if path.is_symlink() or not path.is_file():
            raise ValueError('Missing or symlink source: ' + name)
        files[name] = digest(path)
    if not files:
        raise ValueError('Source root has no nonignored files')
    return {'root': str(root), 'files': files,
            'sha256': hashlib.sha256(json.dumps(files, sort_keys=True).encode()).hexdigest(),
            'binding': 'review-time source snapshot; not proof this source rendered the movie'}


def identity(video, source_root):
    video = Path(video).resolve(strict=True)
    if not video.is_file() or not video.stat().st_size:
        raise ValueError('Expected nonempty local movie')
    return {'movie': {'path': str(video), 'sha256': digest(video), 'bytes': video.stat().st_size},
            'source': snapshot(source_root), 'git_head': git('rev-parse', 'HEAD'),
            'review_tool_sha256': digest(__file__), 'registry_sha256': digest(REGISTRY),
            'motion_check_sha256': digest(CHECK)}


def local_movie(path):
    path = Path(path).resolve(strict=True)
    if not path.is_file() or not path.stat().st_size:
        raise ValueError('Expected nonempty local movie')
    return {'path': str(path), 'sha256': digest(path), 'bytes': path.stat().st_size}


def select_methods(brief='', reference=False, claims=False, audio='unknown', requested=()):
    registry = json.loads(REGISTRY.read_text())['methods']
    selected = []
    for m in registry:
        when = m['select']
        if (when == 'always' or when == 'reference' and reference or when == 'claims' and claims
                or when == 'audio' and audio != 'none' or m['id'] in requested):
            selected.append(dict(m, status='unsupported' if m['implementation'] == 'unsupported' else 'not_run'))
    unknown = set(requested) - {m['id'] for m in registry}
    if unknown:
        raise ValueError('Unknown methods: ' + ', '.join(sorted(unknown)))
    return selected


def plan(args):
    return {'schema': 1, 'created_utc': datetime.now(timezone.utc).isoformat(),
            'identity': identity(args.video, args.source_root),
            'brief': args.brief, 'audio_intent': args.audio,
            'methods': select_methods(args.brief, args.reference, args.claims, args.audio, args.method),
            'gates': {'technical': 'not_run', 'visual': 'not_reviewed',
                      'native_audio': 'not_reviewed', 'owner_artistic_approval': 'not_requested'},
            'note': 'No overall quality score. Plan is not evidence. Manual and paid methods never run automatically.'}


def safe_output(path):
    out = Path(path).resolve()
    out.relative_to(ROOT)
    if out.exists():
        raise ValueError('Output must not exist (including empty directories)')
    # A receipt-only ignore rule must not let private PNGs/logs enter source control.
    if subprocess.run(['git', '-C', str(ROOT), 'check-ignore', '-q', str(out) + '/']).returncode:
        raise ValueError('Output must be inside an already Git-ignored directory, e.g. project/tmp/review/new-run')
    out.mkdir(parents=True)
    return out


def finite_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def positive(value):
    return finite_number(value) and value > 0


def inspect_motion(report_path, movie_hash):
    """Fail closed on partial reports; completed is not an aesthetic pass."""
    p = Path(report_path).resolve(strict=True)
    r = json.loads(p.read_text())
    if r.get('source', {}).get('sha256') != movie_hash:
        return 'stale', {}, 'Motion report input hash mismatch'
    if r.get('versions', {}).get('tool_sha256') != digest(CHECK):
        return 'stale', {}, 'Motion-check source version changed'
    c, d, s = (r.get(k, {}) for k in ('frame_census', 'full_decode', 'sampling'))
    complete = (r.get('findings') == [] and c.get('returncode') == 0
                and positive(c.get('decoded_video_frames')) and c.get('errors_present') is False
                and c.get('missing_timestamp_frames') == 0 and c.get('timestamp_regressions') == 0
                and positive(c.get('observed_span_including_last_frame_s'))
                and d.get('ok') is True and d.get('returncode') == 0
                and positive(s.get('sample_count')) and s.get('sample_count') > 1 and s.get('sampling_errors_present') is False
                and isinstance(r.get('media', {}).get('has_audio'), bool))
    required = ['report.json', 'versions.json', 'index.html', 'motion-energy.csv',
                'motion-and-change-heatmap.png', 'spatial-mean-change.png', 'sampling-errors.txt', c.get('log'), d.get('log')]
    contacts = s.get('contact_sheets', [])
    complete = complete and bool(contacts)
    required += [x.get('file') for x in contacts]
    audio = r.get('audio_measurements', [])
    if r.get('media', {}).get('has_audio'):
        streams = r.get('media', {}).get('audio_streams', [])
        expected = {x.get('index') for x in streams}
        measured = {x.get('stream_index') for x in audio}
        complete = (complete and bool(expected) and None not in expected and measured == expected
                    and len(audio) == len(expected) and all(
                        x.get('measured') is True and x.get('returncode') == 0
                        and all((finite_number(x.get(k)) or x.get(k) == '-inf') for k in
                                ('integrated_loudness_lufs', 'loudness_range_lu', 'true_peak_dbtp'))
                        for x in audio))
        required += [x.get('log') for x in audio]
    artifacts = {str(p): digest(p)}
    for name in required:
        if not name or Path(name).name != name or not (p.parent / name).is_file() or (p.parent / name).is_symlink():
            return 'missing', {}, 'Missing/unsafe report artifact: ' + str(name)
        artifact = p.parent / name
        artifacts[str(artifact)] = digest(artifact)
    for name in (c.get('log'), d.get('log'), 'sampling-errors.txt'):
        if name and (p.parent / name).read_text().strip():
            complete = False
    return ('passed' if complete else 'failed'), artifacts, 'Local technical checks only; loudness is measured, not taste-certified'


def run_review(args):
    result = plan(args)
    out = safe_output(args.out)
    try:
        report = args.reuse_motion_report
        if not report:
            if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):
                raise RuntimeError('ffmpeg/ffprobe unavailable; not installed automatically')
            proc = subprocess.run([sys.executable, str(CHECK), args.video, '--out', str(out / 'motion-check'),
                                   '--timeout', str(args.timeout)], capture_output=True, text=True,
                                  timeout=args.timeout * 8)
            (out / 'motion-check-run.txt').write_text(proc.stdout + proc.stderr)
            report = out / 'motion-check/report.json'
            if proc.returncode != 0:
                raise RuntimeError('motion-check failed; see motion-check-run.txt')
        status, artifacts, note = inspect_motion(report, result['identity']['movie']['sha256'])
        result['motion_report'] = str(Path(report).resolve())
        result['artifacts'] = artifacts
        result['gates']['technical'] = status
        for method in result['methods']:
            if method['implementation'] == 'motion-check':
                method['status'] = 'measured' if status == 'passed' and method['id'] == 'audio-engineering' else status
                if method['id'] == 'audio-engineering' and status == 'passed':
                    actual = json.loads(Path(report).read_text())
                    if not actual['media']['has_audio']:
                        method['status'] = 'no_audio'
                        if args.audio == 'present':
                            result['gates']['technical'] = 'failed'
                            result['blocker'] = 'Brief expects audio but inspected movie has no audio track'
                method['evidence'] = str(Path(report).resolve())
                method['note'] = note
        result['reuse'] = bool(args.reuse_motion_report)
    except (OSError, ValueError, TypeError, AttributeError, KeyError, RuntimeError, subprocess.TimeoutExpired) as e:
        result['gates']['technical'] = 'blocked'
        result['blocker'] = str(e)
        for method in result['methods']:
            if method['implementation'] == 'motion-check':
                method['status'] = 'blocked'
    # Rehash after subprocesses: never bind an input changed during the run.
    if identity(args.video, args.source_root) != result['identity']:
        result['gates']['technical'] = 'stale'
        result['blocker'] = 'Movie/source/tool changed during review'
        for method in result['methods']:
            if method['status'] in ('passed', 'measured', 'no_audio'):
                method['status'] = 'stale'
    (out / 'receipt.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    return result


def report_receipt(path):
    result = json.loads(Path(path).read_text())
    if result.get('kind') == 'matched-time-comparison':
        return report_comparison(result)
    old = result['identity']
    # Receipts are editable files, never an authority for manual/artistic gates.
    result['gates'].update(visual='not_reviewed', native_audio='not_reviewed',
                           owner_artistic_approval='not_requested')
    registry = {m['id']: m for m in json.loads(REGISTRY.read_text())['methods']}
    for method in result['methods']:
        canonical = registry.get(method.get('id'))
        if canonical is None:
            raise ValueError('Unknown method in receipt')
        method['implementation'] = canonical['implementation']
        if canonical['implementation'] != 'motion-check':
            method['status'] = 'unsupported' if canonical['implementation'] == 'unsupported' else 'not_run'
    try:
        fresh = identity(old['movie']['path'], old['source']['root'])
        # A commit unrelated to these source bytes does not invalidate evidence.
        changed = any(fresh.get(k) != old.get(k) for k in ('movie', 'source', 'review_tool_sha256', 'registry_sha256', 'motion_check_sha256'))
        if any(not Path(p).is_file() for p in result.get('artifacts', {})):
            raise FileNotFoundError('Referenced evidence artifact missing')
        changed |= any(digest(p) != h for p, h in result.get('artifacts', {}).items())
        if result['gates']['technical'] == 'passed' and not result.get('artifacts'):
            changed = True
        if not changed and result['gates']['technical'] == 'passed':
            if not result.get('motion_report'):
                result['gates']['technical'] = 'missing'
            else:
                status, required, _ = inspect_motion(result['motion_report'], old['movie']['sha256'])
                if any(result.get('artifacts', {}).get(p) != h for p, h in required.items()):
                    status = 'stale'
                result['gates']['technical'] = status
        if changed:
            result['gates']['technical'] = 'stale'
            for m in result['methods']:
                if m['status'] in ('passed', 'measured'):
                    m['status'] = 'stale'
    except (OSError, ValueError, TypeError, AttributeError, KeyError, subprocess.CalledProcessError):
        result['gates']['technical'] = 'missing'
        for m in result['methods']:
            if m['status'] in ('passed', 'measured'):
                m['status'] = 'missing'
    # Rebuild machine statuses from validated technical result, not editable labels.
    for method in result['methods']:
        if method['implementation'] == 'motion-check':
            method['status'] = result['gates']['technical']
            if method['id'] == 'audio-engineering' and method['status'] == 'passed':
                actual = json.loads(Path(result['motion_report']).read_text())
                method['status'] = 'measured' if actual['media']['has_audio'] else 'no_audio'
                if not actual['media']['has_audio'] and result.get('audio_intent') == 'present':
                    result['gates']['technical'] = 'failed'
    return result


def timestamp(value):
    """Exact seconds (decimal or fraction), never NaN/Infinity or negative."""
    try:
        result = Fraction(str(value))
    except (ValueError, ZeroDivisionError) as e:
        raise ValueError('Timestamp must be finite seconds or a fraction: ' + str(value)) from e
    if result < 0:
        raise ValueError('Timestamp must not be negative')
    return result


def time_pairs(values):
    if not values or len(values) > 256:
        raise ValueError('Provide 1–256 explicit --pair reference_seconds=candidate_seconds')
    pairs = []
    for value in values:
        parts = value.split('=')
        if len(parts) != 2:
            raise ValueError('Pair must be reference_seconds=candidate_seconds')
        pairs.append(tuple(timestamp(p) for p in parts))
    return pairs


def media_command(command, timeout, log):
    """No shell or remote protocols; retain tool errors beside private evidence."""
    proc = subprocess.run(command, capture_output=True, timeout=timeout)
    log.write_bytes(proc.stderr)
    if proc.returncode or proc.stderr.strip():
        raise RuntimeError('Media command failed or reported errors; see ' + log.name)
    return proc.stdout


def probe_timing(path, out, label, timeout):
    base = ['ffprobe', '-v', 'error', '-protocol_whitelist', 'file,pipe']
    metadata = json.loads(media_command(base + ['-show_streams', '-of', 'json', str(path)], timeout,
                                        out / (label + '-probe-errors.txt')))
    streams = metadata.get('streams', [])
    video = next((s for s in streams if s.get('codec_type') == 'video'
                  and not s.get('disposition', {}).get('attached_pic')), None)
    if video is None:
        raise ValueError(label + ': no non-cover video stream')
    frames = json.loads(media_command(base + ['-select_streams', str(video['index']), '-show_frames',
        '-show_entries', 'frame=media_type,best_effort_timestamp,duration,pkt_duration',
        '-of', 'json', str(path)], timeout, out / (label + '-timing-errors.txt'))).get('frames', [])
    timing = {'stream': video, 'audio_stream_indices': [s['index'] for s in streams if s.get('codec_type') == 'audio'],
              'frames': [f for f in frames if f.get('media_type') == 'video']}
    validate_timing(timing)
    (out / (label + '-timing.json')).write_text(json.dumps(timing, indent=2) + '\n')
    return timing


def validate_timing(timing):
    try:
        base = Fraction(timing['stream']['time_base'])
        frames = timing['frames']
        pts = [f['best_effort_timestamp'] for f in frames]
        if (base <= 0 or not pts or any(type(p) is not int for p in pts)
                or any(b <= a for a, b in zip(pts, pts[1:]))):
            raise ValueError('Missing, duplicate, or regressing presentation timestamps')
        duration = frames[-1].get('duration', frames[-1].get('pkt_duration'))
        if type(duration) is not int or duration <= 0:
            raise ValueError('Last decoded frame duration is unavailable; do not infer it from fps')
        return base, pts, duration
    except (KeyError, TypeError, ZeroDivisionError) as e:
        raise ValueError('Incomplete decoded-frame timing') from e


def match_frame(timing, seconds):
    base, pts, duration = validate_timing(timing)
    target = seconds / base + pts[0]
    if seconds < 0 or target >= pts[-1] + duration:
        raise ValueError('Requested time lies outside the decoded presentation span: ' + str(seconds))
    index = bisect_right(pts, target) - 1
    end = pts[index + 1] if index + 1 < len(pts) else pts[-1] + duration
    return {'requested_seconds': str(seconds), 'decoded_frame_index': index,
            'pts_ticks': pts[index], 'pts_seconds': str(pts[index] * base),
            'relative_seconds': str((pts[index] - pts[0]) * base),
            'interval_end_relative_seconds': str((end - pts[0]) * base),
            'request_after_frame_start_seconds': str((target - pts[index]) * base)}


def extract_comparison_frames(path, timing, matches, out, label, timeout):
    indices = sorted({m['decoded_frame_index'] for m in matches})
    expression = '+'.join('eq(n\\,%d)' % i for i in indices)
    media_command(['ffmpeg', '-nostdin', '-hide_banner', '-v', 'error', '-protocol_whitelist', 'file,pipe',
        '-noautorotate', '-i', str(path), '-map', '0:' + str(timing['stream']['index']), '-an', '-sn', '-dn',
        '-vf', 'select=' + expression, '-fps_mode', 'passthrough', '-frames:v', str(len(indices)),
        '-start_number', '0', str(out / (label + '-%06d.png'))], timeout, out / (label + '-extract-errors.txt'))
    for match in matches:
        name = '%s-%06d.png' % (label, indices.index(match['decoded_frame_index']))
        if not (out / name).is_file():
            raise RuntimeError('Requested decoded frame was not extracted: ' + name)
        match['image'] = name


def comparison_page(result, out):
    esc = html.escape
    rows = []
    for pair in result['pairs']:
        cells = []
        for side in ('reference', 'candidate'):
            m = pair[side]
            caption = f"{side}: requested {m['requested_seconds']}s; frame {m['decoded_frame_index']}; PTS {m['pts_seconds']}s"
            cells.append('<div><p>' + esc(caption) + '</p><img src="' + esc(m['image']) + '"></div>')
        rows.append('<section>' + ''.join(cells) + '</section>')
    (out / 'comparison.html').write_text('<!doctype html><meta charset="utf-8"><title>Matched-time evidence</title>'
        '<style>body{font:16px sans-serif;margin:24px;background:#222;color:#eee}section{display:flex;gap:20px;margin:30px 0}'
        'section div{width:50%}img{width:100%;height:auto}</style><h1>Matched-time evidence — not a quality score</h1><p>'
        + esc(result['text_font_differences']) + '</p><p>' + esc(result['reference_capture_caveats'])
        + '</p><p>Native raster dimensions; no autorotation. CSS scales only the viewer. Still frames are not normal-speed viewing or listening.</p>'
        + ''.join(rows), encoding='utf-8')


def compare_review(args):
    pairs = time_pairs(args.pair)
    if any(not x.strip() for x in (args.text_font_differences, args.reference_caveats, args.alignment_note)):
        raise ValueError('Declare text/font differences, capture caveats, and alignment; use explicit none/unknown if applicable')
    result = {'schema': 1, 'kind': 'matched-time-comparison', 'created_utc': datetime.now(timezone.utc).isoformat(),
        'identity': identity(args.video, args.source_root), 'reference': local_movie(args.reference_video),
        'brief': args.brief, 'audio_intent': args.audio, 'text_font_differences': args.text_font_differences,
        'reference_capture_caveats': args.reference_caveats, 'alignment_note': args.alignment_note,
        'matching_rule': 'Explicit paired times relative to each first decoded PTS; select frame at/before time, ending at next PTS. No fps-derived frame numbers or approximate seek. Pairs do not prove semantic correspondence.',
        'status': 'blocked', 'gates': {'technical': 'not_run', 'visual': 'not_reviewed',
            'native_audio': 'not_reviewed', 'owner_artistic_approval': 'not_requested'},
        'note': 'Local evidence collection only. No comparison score, realtime viewing, listening, licensing or artistic approval is inferred.'}
    out = safe_output(args.out)
    try:
        if not shutil.which('ffprobe') or (args.extract_frames and not shutil.which('ffmpeg')):
            raise RuntimeError('Required local ffprobe/ffmpeg unavailable; not installed automatically')
        result['versions'] = {tool: subprocess.check_output([tool, '-version'], timeout=15).decode().splitlines()[0]
                              for tool in (('ffprobe', 'ffmpeg') if args.extract_frames else ('ffprobe',))}
        timings = {side: probe_timing(media['path'], out, side, args.timeout)
                   for side, media in (('reference', result['reference']), ('candidate', result['identity']['movie']))}
        result['pairs'] = [{side: match_frame(timings[side], t) for side, t in zip(('reference', 'candidate'), pair)} for pair in pairs]
        result['media'] = {side: {'stream': t['stream'], 'audio_stream_indices': t['audio_stream_indices'],
            'decoded_frames': len(t['frames']), 'first_pts_ticks': t['frames'][0]['best_effort_timestamp']}
            for side, t in timings.items()}
        has_audio = bool(timings['candidate']['audio_stream_indices'])
        result['audio_intent_check'] = ('not_declared' if args.audio == 'unknown' else
            'track_presence_consistent_not_listened' if has_audio == (args.audio == 'present') else 'track_presence_contradicts_intent')
        if args.extract_frames:
            for side, media in (('reference', result['reference']), ('candidate', result['identity']['movie'])):
                extract_comparison_frames(media['path'], timings[side], [p[side] for p in result['pairs']], out, side, args.timeout)
            comparison_page(result, out)
        result['status'] = 'collected'
    except (OSError, ValueError, TypeError, KeyError, RuntimeError, subprocess.SubprocessError) as e:
        result['blocker'] = str(e)
    result['artifacts'] = {str(p): digest(p) for p in sorted(out.iterdir()) if p.is_file()}
    result['evidence_directory'] = str(out)
    result['extracted_frames'] = args.extract_frames
    result = report_comparison(result)
    (out / 'receipt.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    return result


def report_comparison(result):
    # Editable receipts cannot promote collected stills to any review/approval gate.
    result['gates'] = {'technical': 'not_run', 'visual': 'not_reviewed',
                       'native_audio': 'not_reviewed', 'owner_artistic_approval': 'not_requested'}
    try:
        old = result['identity']
        fresh = identity(old['movie']['path'], old['source']['root'])
        changed = any(fresh.get(k) != old.get(k) for k in ('movie', 'source', 'review_tool_sha256', 'registry_sha256', 'motion_check_sha256'))
        changed |= local_movie(result['reference']['path']) != result['reference']
        for p, sha in result.get('artifacts', {}).items():
            if not Path(p).is_file() or Path(p).is_symlink():
                raise FileNotFoundError('Missing/unsafe comparison artifact')
            changed |= digest(p) != sha
        if result['status'] == 'collected' and not changed:
            out = Path(result['evidence_directory'])
            required = [out / (side + suffix) for side in ('reference', 'candidate')
                        for suffix in ('-timing.json', '-probe-errors.txt', '-timing-errors.txt')]
            if result.get('extracted_frames'):
                required += [out / 'comparison.html']
                required += [out / (side + '-extract-errors.txt') for side in ('reference', 'candidate')]
                for pair in result['pairs']:
                    for side in ('reference', 'candidate'):
                        name = pair[side].get('image')
                        if not name or Path(name).name != name:
                            raise ValueError('Missing/unsafe extracted frame')
                        required.append(out / name)
            if any(result.get('artifacts', {}).get(str(p)) != digest(p) for p in required):
                result['status'] = 'missing'
            else:
                for side in ('reference', 'candidate'):
                    timing = json.loads((out / (side + '-timing.json')).read_text())
                    expected_matches = [match_frame(timing, timestamp(pair[side]['requested_seconds'])) for pair in result['pairs']]
                    indices = sorted({m['decoded_frame_index'] for m in expected_matches})
                    for pair, expected in zip(result['pairs'], expected_matches):
                        actual = pair[side]
                        if any(actual.get(k) != v for k, v in expected.items()):
                            result['status'] = 'stale'
                        if result.get('extracted_frames'):
                            expected_image = '%s-%06d.png' % (side, indices.index(expected['decoded_frame_index']))
                            if actual.get('image') != expected_image:
                                result['status'] = 'stale'
        if changed:
            result['status'] = 'stale'
        elif result['status'] == 'collected' and (not result.get('pairs') or not result.get('artifacts')):
            result['status'] = 'missing'
        elif result['status'] not in ('collected', 'blocked', 'stale', 'missing'):
            result['status'] = 'blocked'
    except (OSError, ValueError, TypeError, KeyError, subprocess.SubprocessError):
        result['status'] = 'missing'
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    for name in ('plan', 'run'):
        p = commands.add_parser(name)
        p.add_argument('video')
        p.add_argument('--source-root', required=True, help='Project source directory inside repository')
        p.add_argument('--brief', required=True, help='Audience, intended claim/effect, constraints')
        p.add_argument('--reference', action='store_true', help='Reference/source material requires comparison')
        p.add_argument('--claims', action='store_true', help='Factual/chart/product claims require proof')
        p.add_argument('--audio', choices=['present', 'none', 'unknown'], default='unknown')
        p.add_argument('--method', action='append', default=[])
        if name == 'run':
            p.add_argument('--out', required=True)
            p.add_argument('--reuse-motion-report')
            p.add_argument('--timeout', type=int, default=600)
    commands.add_parser('report').add_argument('receipt')
    p = commands.add_parser('compare', help='Collect explicit matched-time reference/candidate evidence; never an artistic pass')
    p.add_argument('video')
    p.add_argument('--source-root', required=True)
    p.add_argument('--reference-video', required=True)
    p.add_argument('--brief', required=True)
    p.add_argument('--pair', action='append', required=True, help='reference_seconds=candidate_seconds; decimals or fractions, relative to first decoded PTS')
    p.add_argument('--alignment-note', required=True, help='Why these times correspond; scaling/cropping/retiming or unknown')
    p.add_argument('--text-font-differences', required=True, help='Declared copy, glyph, font/license substitutions, or explicitly none/unknown')
    p.add_argument('--reference-caveats', required=True, help='Capture stalls, uncertain origin/timebase, or explicitly none/unknown')
    p.add_argument('--audio', choices=['present', 'none', 'unknown'], default='unknown')
    p.add_argument('--extract-frames', action='store_true', help='Optional native PNGs and local HTML; no video/audio upload')
    p.add_argument('--out', required=True)
    p.add_argument('--timeout', type=int, default=600)
    args = parser.parse_args(argv)
    try:
        result = (report_receipt(args.receipt) if args.command == 'report' else compare_review(args) if args.command == 'compare'
                  else run_review(args) if args.command == 'run' else plan(args))
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 1 if result.get('status', result['gates']['technical']) in ('blocked', 'failed', 'stale', 'missing') else 0
    except (OSError, ValueError, TypeError, AttributeError, KeyError, subprocess.CalledProcessError) as e:
        parser.exit(2, str(e) + '\n')


if __name__ == '__main__':
    sys.exit(main())
