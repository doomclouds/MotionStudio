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
TEA_VOICE_COVER = 'portfolio/works/tea-voice-study/cover.jpg'
HANZI_POSTER_STUDY_COVER = 'portfolio/works/hanzi-poster-study/cover.jpg'
SLOW_ROAST_STUDY_COVER = 'portfolio/works/slow-roast-study/cover.jpg'
TEA_CONVERSATION_MAP_COVER = 'portfolio/works/tea-conversation-map/cover.jpg'
THEATRE_NARRATIVE_WAVE_COVER = 'portfolio/works/theatre-narrative-wave/cover.jpg'
LIQUID_GLASS_STUDY_COVER = 'portfolio/works/liquid-glass-study/cover.jpg'
MUQI_STUDY_COVER = 'portfolio/works/muqi-study/cover.jpg'
CYCLING_YEAR_REPORT_COVER = 'portfolio/works/cycling-year-report/cover.jpg'
HARDWARE_SAMPLER_STUDY_COVER = 'portfolio/works/hardware-sampler-study/cover.jpg'
SHANGHAI_DECO_STUDY_COVER = 'portfolio/works/shanghai-deco-study/cover.jpg'
COSMIC_OBSERVATORY_STUDY_COVER = 'portfolio/works/cosmic-observatory-study/cover.jpg'
PRO_CAMERA_STUDY_COVER = 'portfolio/works/pro-camera-study/cover.jpg'
BUS_MORNING_STUDY_COVER = 'portfolio/works/bus-morning-study/cover.jpg'
WAVE_WEATHER_STUDY_COVER = 'portfolio/works/wave-weather-study/cover.jpg'
MERIDIAN_STUDY_COVER = 'portfolio/works/meridian-study/cover.jpg'
HK_STREET_SIGNS_STUDY_COVER = 'portfolio/works/hk-street-signs-study/cover.jpg'
PIXEL_HIKING_STUDY_COVER = 'portfolio/works/pixel-hiking-study/cover.jpg'
MARKET_SECTION_STUDY_COVER = 'portfolio/works/market-section-study/cover.jpg'
PLAYFUL_ROAST_TIMER_STUDY_COVER = 'portfolio/works/playful-roast-timer-study/cover.jpg'
MARKET_METHOD_STUDY_COVER = 'portfolio/works/market-method-study/cover.jpg'
SONG_BLOCK_PRINT_STUDY_COVER = 'portfolio/works/song-block-print-study/cover.jpg'
BAUHAUS_THEATRE_STUDY_COVER = 'portfolio/works/bauhaus-theatre-study/cover.jpg'
OCEAN_PLASTIC_TREEMAP_STUDY_COVER = 'portfolio/works/ocean-plastic-treemap-study/cover.jpg'
HEALTH_COLOR_CODE_STUDY_COVER = 'portfolio/works/health-color-code-study/cover.jpg'
IRREVERENT_POP_STUDY_COVER = 'portfolio/works/irreverent-pop-study/cover.jpg'
FILM_FESTIVAL_STUDY_COVER = 'portfolio/works/film-festival-study/cover.jpg'
NANYUAN_CARTOGRAPHIC_STUDY_COVER = 'portfolio/works/nanyuan-cartographic-study/cover.jpg'
OCEAN_LETTER_STUDY_COVER = 'portfolio/works/ocean-letter-study/cover.jpg'
SOLAR_TERMS_STUDY_COVER = 'portfolio/works/solar-terms-study/cover.jpg'
TRAIL_PICTOGRAM_STUDY_COVER = 'portfolio/works/trail-pictogram-study/cover.jpg'
MANDALA_OBSERVATORY_STUDY_COVER = 'portfolio/works/mandala-observatory-study/cover.jpg'
RECURSION_LECTURE_STUDY_COVER = 'portfolio/works/recursion-lecture-study/cover.jpg'
SALARY_UNIT_STACK_STUDY_COVER = 'portfolio/works/salary-unit-stack-study/cover.jpg'
TOPO_OUTDOOR_STUDY_COVER = 'portfolio/works/topo-outdoor-study/cover.jpg'
WEATHER_ART_STUDY_COVER = 'portfolio/works/weather-art-study/cover.jpg'
EDITORIAL_WEEKLY_STUDY_COVER = 'portfolio/works/editorial-weekly-study/cover.jpg'
FRIENDLY_FINTECH_STUDY_COVER = 'portfolio/works/friendly-fintech-study/cover.jpg'
MOUNTAIN_BOOK_JACKET_STUDY_COVER = 'portfolio/works/mountain-book-jacket-study/cover.jpg'
SCIENTIFIC_FIGURE_STUDY_COVER = 'portfolio/works/scientific-figure-study/cover.jpg'
THEATRE_MANIFESTO_STUDY_COVER = 'portfolio/works/theatre-manifesto-study/cover.jpg'
BOOKCRAFT_VINYL_ANNUAL_STUDY_COVER = 'portfolio/works/bookcraft-vinyl-annual-study/cover.jpg'
COMMAND_PALETTE_STUDY_COVER = 'portfolio/works/command-palette-study/cover.jpg'
MARKET_LIVINGROOM_STUDY_COVER = 'portfolio/works/market-livingroom-study/cover.jpg'
VINYL_ISOTYPE_STUDY_COVER = 'portfolio/works/vinyl-isotype-study/cover.jpg'
XIE_SYMBOL_STUDY_COVER = 'portfolio/works/xie-symbol-study/cover.jpg'
CYCLING_MAGAZINE_STUDY_COVER = 'portfolio/works/cycling-magazine-study/cover.jpg'
GENTLE_ACTIVITY_STUDY_COVER = 'portfolio/works/gentle-activity-study/cover.jpg'
MEMORY_CASE_STUDY_COVER = 'portfolio/works/memory-case-study/cover.jpg'
NIGHT_OBSERVATORY_STUDY_COVER = 'portfolio/works/night-observatory-study/cover.jpg'
HOKUSAI_COVER = 'portfolio/works/hokusai-exhibition-study/cover.jpg'
ROLLCALL_DOCS_STUDY_COVER = 'portfolio/works/rollcall-docs-study/cover.jpg'
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
            if name in {TESSEL_COVER, FAVORITE52_COVER, VINYL_COVER, TEA_VOICE_COVER, MUQI_STUDY_COVER, CYCLING_YEAR_REPORT_COVER, HARDWARE_SAMPLER_STUDY_COVER, SHANGHAI_DECO_STUDY_COVER, HANZI_POSTER_STUDY_COVER, SLOW_ROAST_STUDY_COVER, TEA_CONVERSATION_MAP_COVER, THEATRE_NARRATIVE_WAVE_COVER, LIQUID_GLASS_STUDY_COVER, COSMIC_OBSERVATORY_STUDY_COVER, PRO_CAMERA_STUDY_COVER, BUS_MORNING_STUDY_COVER, WAVE_WEATHER_STUDY_COVER, MERIDIAN_STUDY_COVER, HK_STREET_SIGNS_STUDY_COVER, PIXEL_HIKING_STUDY_COVER, MARKET_SECTION_STUDY_COVER, PLAYFUL_ROAST_TIMER_STUDY_COVER, MARKET_METHOD_STUDY_COVER, SONG_BLOCK_PRINT_STUDY_COVER, BAUHAUS_THEATRE_STUDY_COVER, OCEAN_PLASTIC_TREEMAP_STUDY_COVER, HEALTH_COLOR_CODE_STUDY_COVER, IRREVERENT_POP_STUDY_COVER, FILM_FESTIVAL_STUDY_COVER, NANYUAN_CARTOGRAPHIC_STUDY_COVER, OCEAN_LETTER_STUDY_COVER, SOLAR_TERMS_STUDY_COVER, TRAIL_PICTOGRAM_STUDY_COVER, MANDALA_OBSERVATORY_STUDY_COVER, RECURSION_LECTURE_STUDY_COVER, SALARY_UNIT_STACK_STUDY_COVER, TOPO_OUTDOOR_STUDY_COVER, WEATHER_ART_STUDY_COVER, EDITORIAL_WEEKLY_STUDY_COVER, FRIENDLY_FINTECH_STUDY_COVER, MOUNTAIN_BOOK_JACKET_STUDY_COVER, SCIENTIFIC_FIGURE_STUDY_COVER, THEATRE_MANIFESTO_STUDY_COVER, BOOKCRAFT_VINYL_ANNUAL_STUDY_COVER, COMMAND_PALETTE_STUDY_COVER, MARKET_LIVINGROOM_STUDY_COVER, VINYL_ISOTYPE_STUDY_COVER, XIE_SYMBOL_STUDY_COVER, CYCLING_MAGAZINE_STUDY_COVER, GENTLE_ACTIVITY_STUDY_COVER, MEMORY_CASE_STUDY_COVER, NIGHT_OBSERVATORY_STUDY_COVER, ROLLCALL_DOCS_STUDY_COVER, HOKUSAI_COVER} and (kind != 'JPEG' or size > PORTFOLIO_COVER_MAX_BYTES):
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
