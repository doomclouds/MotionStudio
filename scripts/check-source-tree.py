"""Audit staged and reachable historical blobs; reject generated paths and unapproved media."""
from pathlib import Path, PurePosixPath
import subprocess
import argparse
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
GENERATED = {'tmp', 'output', 'node_modules', '__pycache__', '.cache', 'frames', 'renders'}
PROJECT_DIRS = {'verification', 'validation', 'evidence', 'research', 'review', 'debug'}
README_PREVIEW = 'docs/assets/report-overview.png'
README_PREVIEW_MAX_BYTES = 2 * 1024 * 1024
TESSEL_COVER = 'portfolio/works/tessel/cover.jpg'
FAVORITE52_COVER = 'portfolio/works/favorite52/cover.jpg'
VINYL_COVER = 'portfolio/works/vinyl-study/cover.jpg'
PORTFOLIO_COVER_MAX_BYTES = 1024 * 1024
RECEIPTS = {'DIFFERENCES.md', 'NATIVE_PRODUCTION.json', 'FEEDBACK.json', 'MIGRATION.md', 'NATIVE-MIGRATION.md', 'review.html'}

def safe_env_template(content):
    """Distribution template: comments/blanks plus one empty/obvious placeholder key only."""
    found = 0
    for line in bytes(content).splitlines():
        line = line.strip()
        if not line or line.startswith(b'#'): continue
        name, sep, value = line.partition(b'=')
        if not sep or name.strip() != b'DASHSCOPE_API_KEY': return False
        value = value.strip().strip(b'"\'')
        if value not in (b'', b'YOUR_API_KEY', b'REPLACE_ME'): return False
        found += 1
    return found == 1


def forbidden(name):
    if name.startswith('portfolio/works/favorite52/') and PurePosixPath(name).suffix.lower() == '.svg': return True
    if name == 'projects/favorite52-engine-rebuild/assets/claude-duet-official.svg' or name.startswith('projects/kinetic-type-recreation/'): return True
    if name == 'projects/favorite52-engine-rebuild/assets/fonts/Carousel-NotoSansCJKsc-Bold.otf': return True
    if name.startswith(('projects/', 'production/', 'skills/motion-film-director/research/records/', 'skills/motion-film-director/research/script-to-screen/', 'skills/motion-film-director/research/video-knowledge/cases/', 'skills/motion-film-director/research/video-knowledge/techniques/', 'skills/motion-film-director/production-cases/')): return True
    if PurePosixPath(name).name in {'source-index.json', 'evidence-bindings.json'}: return True
    p = PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or GENERATED.intersection(p.parts): return True
    if p.name.startswith('.env') and p.name != '.env.example': return True
    if p.suffix in {'.pyc', '.log', '.bundle', '.zip'}: return True
    if name.startswith(('migration/', 'projects/migration-smoke/', 'assets/references/x-motion-acceptance/')): return True
    if name.startswith('projects/'):
        if PROJECT_DIRS.intersection(p.parts[2:]) or p.name in RECEIPTS or p.name.startswith('VALIDATION.'): return True
        if '/docs/historical/' in name: return True
    prefix = 'skills/motion-film-director/'
    if name.startswith(prefix):
        tail = name[len(prefix):]
        if tail.startswith(('validation/', 'examples/', 'runtime/')): return True
        if tail in {'manifest.json', 'build-provenance.json', 'integration-provenance.json', 'production-cases/evidence.json'}: return True
    return False

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])

def paths(raw):
    return [x.decode() for x in raw.split(b'\0') if x]

MEDIA_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tif', '.tiff',
    '.mp4', '.m4v', '.mov', '.avi', '.webm', '.mkv', '.mpeg', '.mpg', '.m2ts',
    '.m4a', '.mp3', '.aac', '.wav', '.ogg', '.flac', '.opus', '.ttf', '.otf', '.woff', '.woff2', '.ttc'}

def media_kind(head):
    if head.startswith(b'\x89PNG\r\n\x1a\n'): return 'PNG'
    if head.startswith(b'\xff\xd8\xff'): return 'JPEG'
    if head.startswith((b'GIF87a', b'GIF89a', b'BM', b'II*\0', b'MM\0*')): return 'raster-image'
    if head[:4] == b'RIFF' and head[8:12] in {b'WEBP', b'AVI ', b'WAVE'}: return 'RIFF-media'
    if head[4:8] in {b'ftyp', b'moov', b'mdat', b'wide', b'free', b'skip'}: return 'ISO/QuickTime-media'
    if head.startswith((b'\x1a\x45\xdf\xa3', b'OggS', b'fLaC', b'ID3')): return 'audio/video'
    if len(head) > 1 and head[0] == 255 and head[1] & 0xe0 == 0xe0: return 'MPEG/ADTS-audio'
    if head.startswith((b'\x00\x01\x00\x00', b'OTTO', b'ttcf', b'wOFF', b'wOF2')): return 'font'
    return None

def validate_allowlist(document):
    """Normalize only explicitly reviewed path/digest entries; never derive approvals from Git."""
    assets = document.get('assets') if isinstance(document, dict) else None
    if not isinstance(assets, dict): raise ValueError('Invalid source asset allowlist: assets must be an object')
    normalized = {}
    for name, value in assets.items():
        if not isinstance(name, str) or not name or PurePosixPath(name).is_absolute() or '..' in PurePosixPath(name).parts:
            raise ValueError('Invalid source asset allowlist path')
        values = [value] if isinstance(value, str) else value
        if not isinstance(values, list) or not values or any(not isinstance(v, str) or re.fullmatch(r'[0-9a-fA-F]{64}', v) is None for v in values):
            raise ValueError('Invalid source asset allowlist SHA256 for ' + name)
        normalized[name] = frozenset(v.lower() for v in values)
    return normalized

def private_metadata(data):
    """Reject actual acquisition/private-review records, not rights warnings in prose."""
    if isinstance(data, dict):
        for key, value in data.items():
            if key in {'download_url', 'master_url', 'variant_url', 'remux_arguments'} and value not in (None, '', [], {}): return True
            if key in {'rights', 'reuse_rights', 'status'} and isinstance(value, str) and 'private-review-only' in value: return True
            if private_metadata(value): return True
    elif isinstance(data, list):
        return any(private_metadata(item) for item in data)
    elif isinstance(data, str):
        return data.startswith(('/workspace/', '/home/agent/'))
    return False

def inspect_repo(repo):
    def run(*args): return subprocess.check_output(['git', '-C', str(repo), *args])
    allow = validate_allowlist(json.loads((ROOT / 'scripts/source-assets-allowlist.json').read_text()))
    entries = []
    # Include every staged blob, including unresolved merge stages; never inspect worktree bytes.
    for row in run('ls-files', '--stage', '-z').split(b'\0'):
        if not row: continue
        meta, name = row.split(b'\t', 1)
        mode, oid, stage = meta.decode().split()
        entries.append(('index-stage-' + stage, name.decode(), mode, oid))
    revisions = run('rev-list', '--all').decode().splitlines()
    for rev in revisions:
        for row in run('ls-tree', '-rz', rev).split(b'\0'):
            if not row: continue
            meta, name = row.split(b'\t', 1)
            mode, kind, oid = meta.decode().split()
            entries.append((rev, name.decode(), mode, oid))
    errors, seen_errors, blobs = [], set(), {}
    def error(ref, name, reason):
        key = (ref, name, reason)
        if key not in seen_errors: errors.append(key); seen_errors.add(key)
    # One cat-file process, streamed bytes; each unique object is inspected and hashed once.
    with subprocess.Popen(['git', '-C', str(repo), 'cat-file', '--batch'], stdin=subprocess.PIPE, stdout=subprocess.PIPE) as proc:
        for ref, name, mode, oid in entries:
            if forbidden(name): error(ref, name, 'forbidden-path')
            if mode not in {'100644', '100755'}:
                error(ref, name, 'non-regular-file-mode'); continue
            if oid not in blobs:
                proc.stdin.write((oid + '\n').encode()); proc.stdin.flush()
                header = proc.stdout.readline().decode().strip().split()
                if len(header) != 3 or header[1] != 'blob': raise RuntimeError('Expected blob ' + oid)
                size = remaining = int(header[2]); digest = hashlib.sha256(); head = b''; content = bytearray()
                while remaining:
                    chunk = proc.stdout.read(min(remaining, 1024 * 1024))
                    if not chunk: raise RuntimeError('Truncated blob ' + oid)
                    if len(head) < 64: head += chunk[:64-len(head)]
                    digest.update(chunk); remaining -= len(chunk)
                    if len(content) < 4 * 1024 * 1024: content.extend(chunk)
                if proc.stdout.read(1) != b'\n': raise RuntimeError('Invalid cat-file separator')
                try: private = private_metadata(json.loads(content))
                except (ValueError, UnicodeDecodeError): private = False
                secret = bool(re.search(rb'\bsk-[A-Za-z0-9_-]{24,}', content))
                template_unsafe = not safe_env_template(content)
                blobs[oid] = (media_kind(head), digest.hexdigest(), private, secret, template_unsafe, size)
            kind, sha, private, secret, template_unsafe, size = blobs[oid]
            if secret: error(ref, name, 'possible-api-secret')
            if PurePosixPath(name).name == '.env.example' and template_unsafe: error(ref, name, 'non-placeholder-env-template')
            if private: error(ref, name, 'private-production-metadata')
            if name == README_PREVIEW and (kind != 'PNG' or size > README_PREVIEW_MAX_BYTES):
                error(ref, name, 'invalid-readme-preview-format-or-size')
            if name in {TESSEL_COVER, FAVORITE52_COVER, VINYL_COVER} and (kind != 'JPEG' or size > PORTFOLIO_COVER_MAX_BYTES):
                error(ref, name, 'invalid-portfolio-cover-format-or-size')
            if name in allow:
                if sha not in allow[name]: error(ref, name, 'approved-source-asset-hash-mismatch')
            elif kind or PurePosixPath(name).suffix.lower() in MEDIA_EXTENSIONS:
                error(ref, name, 'unapproved-media:' + (kind or 'extension'))
        proc.stdin.close()
        if proc.wait() != 0: raise RuntimeError('cat-file failed')
    return errors, len(revisions), len(blobs)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=ROOT, help="Git repository to audit (policy remains this script's reviewed policy)")
    args = parser.parse_args()
    errors, revisions, blobs = inspect_repo(args.repo.resolve())
    for ref, name, reason in errors: print(f'FORBIDDEN {ref} {name} {reason}')
    if errors: raise SystemExit(1)
    print(f'Source-only path/blob check passed: index + {revisions} commits; {blobs} unique blobs')

if __name__ == '__main__': main()
