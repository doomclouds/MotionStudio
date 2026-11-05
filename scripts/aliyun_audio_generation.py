#!/usr/bin/env python3
"""Bounded, opt-in synchronous Beijing TTS/instrumental generation.

Default is an offline plan: no config read, output writes, or network. This is
not a billing enforcement service or a listening/rights/quality approval.
"""
import argparse
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
import hashlib
import io
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
import wave

from audio_review import NoRedirect, ReviewError, load_project_key, project_root

PRICE_DATE = date(2026, 11, 5)
TTS_RATE = Decimal('0.00008')  # CNY per character
MUSIC_RATE = Decimal('0.002')  # CNY per output second
MAX_AUDIO_BYTES = 50 * 1024 * 1024
RESULT_HOST = 'dashscope-result-bj.oss-cn-beijing.aliyuncs.com'
VOICES = ('Cherry', 'Serena', 'Ethan', 'Chelsie')
LANGUAGES = ('Auto', 'Chinese', 'English', 'German', 'Italian', 'Portuguese',
             'Spanish', 'Japanese', 'Korean', 'French', 'Russian')


class GenerationError(Exception):
    """Controlled messages only: never expose remote bodies, prompts, or URLs."""


class IncompleteResponse(GenerationError):
    """Nonterminal response carrying only already-validated billing fields."""
    def __init__(self, request_id, usage, cost):
        super().__init__('Provider did not confirm terminal completion')
        self.safe_metadata = {'request_id': request_id, 'usage': usage, 'actual_cost_cny': cost}


def endpoint(kind, workspace_id=None):
    if workspace_id is not None and not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9-]{0,62}', workspace_id):
        raise GenerationError('Invalid workspace ID')
    if kind not in ('tts', 'music'):
        raise GenerationError('Unsupported generation kind')
    if kind == 'music' and not workspace_id:
        raise GenerationError('Music requires a Beijing workspace ID and invite-only access')
    host = f'{workspace_id}.cn-beijing.maas.aliyuncs.com' if workspace_id else 'dashscope.aliyuncs.com'
    route = 'aigc/multimodal-generation/generation' if kind == 'tts' else 'audio/music/generation'
    return f'https://{host}/api/v1/services/{route}'


def payload(kind, text, voice='Cherry', language='Chinese'):
    limit = 600 if kind == 'tts' else 2000
    if kind not in ('tts', 'music') or not isinstance(text, str) or not text.strip() or not 1 <= len(text) <= limit:
        raise GenerationError('Input is empty or outside the model character limit')
    try:
        text.encode('utf-8')
    except UnicodeError:
        raise GenerationError('Invalid input encoding') from None
    if kind == 'tts':
        if voice not in VOICES or language not in LANGUAGES:
            raise GenerationError('Unsupported voice or language')
        return {'model': 'qwen3-tts-flash', 'input': {'text': text, 'voice': voice, 'language_type': language}}
    return {'model': 'fun-music-v1', 'input': {'prompt': text, 'is_instrumental': True, 'format': 'wav'}}


def plan(kind, text, workspace_id=None, voice='Cherry', language='Chinese'):
    body = payload(kind, text, voice, language)
    api_endpoint = endpoint(kind, workspace_id)
    # UTF-8 byte count deliberately overcounts non-ASCII characters, allowing
    # for character-accounting differences. It is a quote, not a provider cap.
    quote = Decimal(len(text.encode('utf-8'))) * TTS_RATE if kind == 'tts' else None
    return {'status': 'DRY_RUN', 'kind': kind, 'model': body['model'],
            'region': 'cn-beijing', 'endpoint': api_endpoint,
            'input_sha256': hashlib.sha256(json.dumps(body, sort_keys=True, ensure_ascii=False).encode()).hexdigest(),
            'input_characters': len(text), 'pricing_snapshot': PRICE_DATE.isoformat(),
            'currency': 'CNY', 'conservative_quote_cny': str(quote) if quote is not None else None,
            'cost_upper_bound_cny': str(quote) if quote is not None else None,
            'rate_cny': str(TTS_RATE if kind == 'tts' else MUSIC_RATE),
            'rate_unit': 'character' if kind == 'tts' else 'output_second',
            'provider_enforced_spend_cap': False,
            'music_limitation': 'Invite-only; no verified duration input or enforceable total cost bound' if kind == 'music' else None,
            'human_listening': False, 'delivery_approved': False}


def current_pricing(confirmed, today=None):
    today = today or datetime.now(timezone.utc).date()
    if confirmed != today.isoformat() or not 0 <= (today - PRICE_DATE).days <= 7:
        raise GenerationError('Reverify official pricing; acknowledge today. Snapshot expires after 7 days')


def cost_limit(value):
    try:
        result = Decimal(str(value))
    except InvalidOperation:
        raise GenerationError('Invalid CNY limit') from None
    if not result.is_finite() or result <= 0:
        raise GenerationError('CNY limit must be finite and positive')
    return result


def download_url(value):
    if not isinstance(value, str) or len(value) > 16384 or any(ord(c) < 33 or ord(c) > 126 for c in value):
        raise GenerationError('Invalid audio download location')
    try:
        p = urllib.parse.urlsplit(value)
        if p.scheme not in ('http', 'https') or p.netloc != RESULT_HOST or not p.path.startswith('/') or p.fragment:
            raise ValueError()
    except ValueError:
        raise GenerationError('Audio download host or URL refused') from None
    # The documented host sometimes returns HTTP. Upgrade only this exact host;
    # never fall back to HTTP, follow redirects, or persist the signed query.
    return urllib.parse.urlunsplit(('https', p.netloc, p.path, p.query, ''))


def transport(request, limit):
    opener = urllib.request.build_opener(urllib.request.ProxyHandler(), NoRedirect())
    with opener.open(request, timeout=120) as response:
        if response.status != 200:
            raise GenerationError('Provider request did not succeed')
        raw = response.read(limit + 1)
        if len(raw) > limit:
            raise GenerationError('Response exceeds size limit')
        return raw


def validate_wav(raw):
    if not isinstance(raw, bytes) or not 44 <= len(raw) <= MAX_AUDIO_BYTES:
        raise GenerationError('Invalid output size')
    if raw[:4] != b'RIFF' or raw[8:12] != b'WAVE' or int.from_bytes(raw[4:8], 'little') + 8 != len(raw):
        raise GenerationError('Invalid WAV container')
    try:
        with wave.open(io.BytesIO(raw), 'rb') as w:
            channels, width, rate, frames = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
            if w.getcomptype() != 'NONE' or channels not in (1, 2) or width not in (1, 2, 3, 4) or not 8000 <= rate <= 192000:
                raise GenerationError('Unsupported WAV format')
            duration = frames / rate
            if duration < .01 or len(w.readframes(frames)) != frames * channels * width:
                raise GenerationError('Empty or truncated WAV')
    except (wave.Error, EOFError, ZeroDivisionError):
        raise GenerationError('Invalid WAV') from None
    return {'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw), 'duration_s': duration,
            'sample_rate': rate, 'channels': channels, 'sample_width': width}


def write_private(path, raw):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as f:
        f.write(raw)
        f.flush()
        os.fsync(f.fileno())


def write_json(path, value):
    write_private(path, (json.dumps(value, indent=2, sort_keys=True) + '\n').encode())


def response_fields(raw, kind, *, forbidden_secret=None):
    if not isinstance(raw, bytes) or len(raw) > 1_000_000:
        raise GenerationError('Invalid provider response size')
    try:
        obj = json.loads(raw)
        if not isinstance(obj, dict) or 'error' in obj:
            raise ValueError()
        # The official Qwen-TTS return-object example includes these SDK-like
        # fields. Direct HTTP responses may omit them; transport already checks
        # HTTP 200. Present fields must unambiguously describe success.
        if ('status_code' in obj and (type(obj['status_code']) is not int or obj['status_code'] != 200)
                or obj.get('code', '') != '' or obj.get('message', '') != ''):
            raise ValueError()
        request_id = obj['request_id']
        if not isinstance(request_id, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,128}', request_id):
            raise ValueError()
        # Request IDs are remote text, despite their restricted syntax. A
        # provider/proxy echo must not copy credentials into receipts or GETs.
        if forbidden_secret and forbidden_secret in request_id:
            raise ValueError()
        field = 'characters' if kind == 'tts' else 'duration'
        amount = obj['usage'][field]
        if type(amount) not in (int, float) or not math.isfinite(amount) or amount <= 0 or (kind == 'tts' and type(amount) is not int):
            raise ValueError()
        usage = {field: amount}
        cost = Decimal(str(amount)) * (TTS_RATE if kind == 'tts' else MUSIC_RATE)
        output = obj['output']
        if not isinstance(output, dict):
            raise ValueError()
        if output.get('finish_reason') != 'stop':
            raise IncompleteResponse(request_id, usage, str(cost))
        url = download_url(output['audio']['url'])
        if forbidden_secret and forbidden_secret in urllib.parse.unquote(url):
            raise ValueError()
        extra = obj['output'].get('extra_info', {})
        if kind == 'music':
            if not isinstance(extra, dict):
                raise ValueError()
            sample_rate = extra.get('sample_rate')
            # Official prose permits a string; example uses a number. Coerce
            # ASCII digits only, never signs, spaces, decimals or arbitrary text.
            if isinstance(sample_rate, str) and re.fullmatch(r'[0-9]{1,6}', sample_rate):
                sample_rate = int(sample_rate)
            channels = extra.get('channels')
            if type(channels) is not int or channels not in (1, 2) or type(sample_rate) is not int or not 8000 <= sample_rate <= 192000:
                raise ValueError()
            extra = {'channels': channels, 'sample_rate': sample_rate}
        else:
            extra = {}
        return url, request_id, usage, str(cost), extra
    except (KeyError, TypeError, ValueError, OverflowError):
        raise GenerationError('Malformed provider response or missing usage') from None


def generate(args, *, send=transport, key_loader=load_project_key, today=None):
    # The file is read locally and never echoed or saved. No input-text CLI flag:
    # sensitive narration should not be stored in shell history/process arguments.
    path = Path(args.input_file)
    if not path.is_file() or path.stat().st_size > 16000:
        raise GenerationError('Input must be a local UTF-8 text file below 16 KB')
    try:
        with path.open('rb') as source:
            text = source.read(16001)
        if len(text) > 16000:
            raise GenerationError('Input exceeds size limit')
        text = text.decode('utf-8')
    except UnicodeError:
        raise GenerationError('Input must be UTF-8') from None
    result = plan(args.kind, text, args.workspace_id, args.voice, args.language)
    if not args.live:
        return result
    if not args.consent_transmit:
        raise GenerationError('Explicit consent to transmit input to Aliyun is required')
    current_pricing(args.pricing_confirmed_on, today)
    if args.kind == 'music':
        if args.max_cost_cny is not None:
            raise GenerationError('Hard spend cap cannot be enforced for music; blocked before POST')
        if not args.operator_accept_unbounded_cost:
            raise GenerationError('Music needs a manual operator accepting unknown total cost, with no hard cap')
    else:
        if args.max_cost_cny is None or cost_limit(args.max_cost_cny) < Decimal(result['conservative_quote_cny']):
            raise GenerationError('TTS quote exceeds or lacks approved CNY limit')
    if not args.output:
        raise GenerationError('Live generation requires a new private output directory')
    output = Path(args.output).resolve()
    root = project_root(__file__).resolve()
    if output == root or root in output.parents:
        raise GenerationError('Generated output must be outside the repository or portable installation root')
    key = key_loader()
    if not key:
        return {**result, 'status': 'SKIPPED_NOT_CONFIGURED'}
    # Atomic exclusive directory reservation is the session's retry lock. Never
    # remove on failure: timeout/interrupt may already have incurred a charge.
    output.mkdir(mode=0o700, parents=False, exist_ok=False)
    os.chmod(output, 0o700)
    result.update(status='RESERVED_DO_NOT_RESUBMIT', created_at=datetime.now(timezone.utc).isoformat())
    write_json(output / 'reservation.json', result)
    directory_fd = os.open(output, os.O_RDONLY)
    try:
        os.fsync(directory_fd)
    finally:
        os.close(directory_fd)
    try:
        body = payload(args.kind, text, args.voice, args.language)
        req = urllib.request.Request(endpoint(args.kind, args.workspace_id),
            data=json.dumps(body).encode(), method='POST',
            headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
        raw = send(req, 1_000_000)
        url, request_id, usage, cost, extra = response_fields(raw, args.kind, forbidden_secret=key)
        result.update(request_id=request_id, usage=usage, actual_cost_cny=cost)
        # Authorization is confined to the API request. Downloads have no key.
        audio = send(urllib.request.Request(url, method='GET'), MAX_AUDIO_BYTES)
        metadata = validate_wav(audio)
        if extra and any(extra[k] != metadata[k] for k in extra):
            raise GenerationError('Provider audio metadata does not match output')
        write_private(output / 'output.wav', audio)
        decoder = shutil.which('ffmpeg')
        if decoder:
            check = subprocess.run([decoder, '-nostdin', '-v', 'error', '-xerror', '-i', str(output / 'output.wav'),
                                    '-f', 'null', '-'], capture_output=True, timeout=120)
            if check.returncode:
                raise GenerationError('Full WAV decode failed')
        result.update(status='GENERATED_UNREVIEWED', output=metadata,
                      full_decode='passed' if decoder else 'not_run_ffmpeg_unavailable')
        if args.kind == 'tts' and Decimal(cost) > cost_limit(args.max_cost_cny):
            result.update(status='GENERATED_COST_EXCEEDED_UNREVIEWED', billing_warning='Reported charge exceeded approved estimate; no automatic retry')
        write_json(output / 'receipt.json', result)
        return result
    except BaseException as exc:
        # Preserve uncertainty, including KeyboardInterrupt. Do not log remote
        # text, exception strings, credential values or signed download URLs.
        if isinstance(exc, IncompleteResponse):
            result.update(exc.safe_metadata)
        result.update(status='FAILED_OR_UNCERTAIN_DO_NOT_RESUBMIT', reason='Generation or output validation did not complete; billing may have occurred')
        try:
            write_json(output / 'failure.json', result)
        except OSError:
            pass
        raise GenerationError('Generation incomplete; inspect private session. Do not resubmit an uncertain request') from None


def parser():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('kind', choices=('tts', 'music'))
    p.add_argument('--input-file', required=True, help='Local UTF-8 narration or instrumental brief; never echoed')
    p.add_argument('--workspace-id')
    p.add_argument('--voice', choices=VOICES, default='Cherry')
    p.add_argument('--language', choices=LANGUAGES, default='Chinese')
    p.add_argument('--live', action='store_true')
    p.add_argument('--consent-transmit', action='store_true')
    p.add_argument('--pricing-confirmed-on')
    p.add_argument('--max-cost-cny', help='TTS approved conservative quote limit; music hard caps block POST')
    p.add_argument('--operator-accept-unbounded-cost', action='store_true', help='Music only: explicit manual operator acceptance of unknown total price')
    p.add_argument('--output', help='New exclusive private session directory; never reuse or overwrite')
    return p


def main(argv=None):
    try:
        result = generate(parser().parse_args(argv))
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except (GenerationError, ReviewError) as exc:
        # Both local exception classes contain controlled messages only.
        print(json.dumps({'status': 'BLOCKED', 'reason': str(exc)}))
        return 2
    except Exception:
        print(json.dumps({'status': 'BLOCKED', 'reason': 'Local setup or request failed; no automatic retry'}))
        return 2


if __name__ == '__main__':
    sys.exit(main())
