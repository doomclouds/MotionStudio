#!/usr/bin/env python3
"""Local video-duration gate only; never viewing, listening or artistic approval."""
import argparse
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import subprocess
import sys

MIN_SAMPLE_SECONDS = Fraction(7)
ROLES = ('internal-test', 'user-sample', 'final')


def digest(path):
    value = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def video_duration(probe):
    """Use video stream timing, never format/audio duration or rounded display."""
    if not isinstance(probe, dict):
        raise ValueError('Expected ffprobe JSON object')
    streams = probe.get('streams')
    if not isinstance(streams, list) or len(streams) != 1:
        raise ValueError('Expected exactly one video stream')
    stream = streams[0]
    if not isinstance(stream, dict) or stream.get('codec_type') != 'video':
        raise ValueError('Expected video stream timing')
    ticks, base = stream.get('duration_ts'), stream.get('time_base')
    if ticks is not None and base is not None and ticks != 'N/A' and base != 'N/A':
        if isinstance(ticks, bool) or not str(ticks).lstrip('-').isdigit():
            raise ValueError('Invalid integer video duration_ts')
        duration = Fraction(int(ticks)) * Fraction(str(base))
        if int(ticks) <= 0 or Fraction(str(base)) <= 0:
            raise ValueError('Video timing must be positive')
    else:
        duration = Fraction(str(stream.get('duration')))
    if duration <= 0:
        raise ValueError('Video duration must be positive')
    return duration


def inspect(path, ffprobe='ffprobe'):
    path = Path(path).resolve(strict=True)
    if not path.is_file() or not path.stat().st_size:
        raise ValueError('Expected nonempty local movie')
    before = digest(path)
    result = subprocess.run([
        ffprobe, '-v', 'error', '-protocol_whitelist', 'file,pipe',
        '-select_streams', 'v', '-show_entries',
        'stream=codec_type,duration_ts,time_base,duration', '-of', 'json', str(path)
    ], check=True, capture_output=True, text=True, timeout=30)
    duration = video_duration(json.loads(result.stdout))
    if digest(path) != before:
        raise ValueError('Movie changed during duration inspection')
    return {'path': str(path), 'sha256': before, 'duration_seconds_exact': str(duration),
            'measurement': 'ffprobe_video_stream_metadata_not_full_decode'}


def evaluate(role, movie, original=None, exception=None):
    if role not in ROLES:
        raise ValueError('Unknown delivery role')
    if (original is None) != (exception is None):
        raise ValueError('Short original and exception record must be supplied together')
    duration = Fraction(movie['duration_seconds_exact'])
    if duration <= 0:
        raise ValueError('Video duration must be positive')
    result = {'schema': 1, 'role': role, 'movie': movie, 'minimum_sample_seconds': 7,
              'status': 'not_applicable' if role != 'user-sample' else
                        'passed' if duration >= MIN_SAMPLE_SECONDS else 'failed',
              'visual_review': 'not_checked', 'audio_listening': 'not_checked',
              'owner_artistic_approval': 'not_checked',
              'note': 'Duration gate only; declared role, content completeness, padding, listening and approval are not verified.'}
    if exception is not None:
        if role != 'user-sample' or duration >= MIN_SAMPLE_SECONDS:
            raise ValueError('Exception is only for a user sample shorter than 7 seconds')
        fields = {'kind', 'sample_sha256', 'original_sha256', 'user_quote', 'approval_reference'}
        if not isinstance(exception, dict) or set(exception) != fields:
            raise ValueError('Invalid short-original exception fields')
        if exception['kind'] != 'short-original-user-exception':
            raise ValueError('Invalid exception kind')
        for key in ('user_quote', 'approval_reference'):
            if not isinstance(exception[key], str) or not exception[key].strip():
                raise ValueError('Exception requires actual user quote and approval reference')
        if exception['sample_sha256'] != movie['sha256'] or exception['original_sha256'] != original['sha256']:
            raise ValueError('Exception media identity mismatch')
        if not 0 < Fraction(original['duration_seconds_exact']) < MIN_SAMPLE_SECONDS:
            raise ValueError('Short-original exception requires an original shorter than 7 seconds')
        result.update(status='exception_recorded', original=original,
                      authorization='declared_not_verified')
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('video', type=Path)
    parser.add_argument('--role', required=True, choices=ROLES)
    parser.add_argument('--ffprobe', default='ffprobe', help='Existing local executable; no installation')
    parser.add_argument('--short-original', type=Path)
    parser.add_argument('--exception-record', type=Path)
    args = parser.parse_args(argv)
    try:
        if bool(args.short_original) != bool(args.exception_record):
            raise ValueError('Short original and exception record must be supplied together')
        if args.short_original and args.role != 'user-sample':
            raise ValueError('Exception is only for user-sample')
        movie = inspect(args.video, args.ffprobe)
        original = inspect(args.short_original, args.ffprobe) if args.short_original else None
        exception_bytes = args.exception_record.read_bytes() if args.exception_record else None
        exception = json.loads(exception_bytes) if exception_bytes is not None else None
        result = evaluate(args.role, movie, original, exception)
        if exception is not None:
            exception_hash = hashlib.sha256(exception_bytes).hexdigest()
            if digest(args.exception_record) != exception_hash:
                raise ValueError('Exception record changed during inspection')
            result['exception_record_sha256'] = exception_hash
            result['exception_record_path'] = str(args.exception_record.resolve())
        # A second input might be inspected after the first; bind the final outcome too.
        if any(digest(Path(item['path'])) != item['sha256'] for item in (movie, original) if item):
            raise ValueError('Movie changed before result')
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 1 if result['status'] == 'failed' else 0
    except (OSError, ValueError, TypeError, KeyError, ZeroDivisionError,
            subprocess.SubprocessError) as error:
        print(json.dumps({'status': 'error', 'error': str(error),
                          'note': 'No delivery or artistic approval inferred.'}), file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
