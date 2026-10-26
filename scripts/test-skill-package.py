"""Build from a disposable index and smoke the portable four-package Skill in /tmp.
Does not alter the canonical Git index, install dependencies, or retain media.
"""
import hashlib, json, os, shutil, subprocess, tempfile, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def run(args, **kwargs):
    return subprocess.run(args, cwd=ROOT, check=True, **kwargs)
def main():
    actual = Path(subprocess.check_output(['git', 'rev-parse', '--git-path', 'index'], cwd=ROOT).decode().strip())
    if not actual.is_absolute(): actual = ROOT / actual
    before = hashlib.sha256(actual.read_bytes()).hexdigest()
    with tempfile.TemporaryDirectory(prefix='motion-portable-smoke-') as temp:
        temp = Path(temp); index = temp / 'index'; shutil.copy2(actual, index)
        env = dict(os.environ, GIT_INDEX_FILE=str(index))
        # Only the explicitly authored source packages and synthetic wrapper test.
        sources = []
        for core in ('motion-timeline-core', 'motion-audio-core', 'motion-elements'):
            for path in (ROOT / 'engine' / core).rglob('*'):
                if path.is_file() and (path.suffix in {'.mjs', '.md', '.json', '.html'} or path.name == 'LICENSE'):
                    sources.append(str(path.relative_to(ROOT)))
        sources.extend(['skills/motion-film-director/references/motion-elements.md', 'skills/motion-film-director/scripts/test-audio-timeline.mjs', 'skills/motion-film-director/references/knowledge-decision-example/index.json', 'skills/motion-film-director/references/knowledge-decision-example/cases/plan.json'])
        sources.extend(subprocess.check_output(['git', 'diff', '--name-only'], cwd=ROOT).decode().splitlines())
        run(['git', 'add', '--', *sources], env=env)
        run(['python3', 'scripts/check-source-tree.py'], env=env)
        archive = temp / 'skill.zip'
        run(['python3', 'scripts/build-skill.py', '--output', str(archive)], env=env)
        with zipfile.ZipFile(archive) as z:
            names = z.namelist()
            for core in ('motion-render-core', 'motion-timeline-core', 'motion-audio-core', 'motion-elements'):
                assert any('/runtime/' + core + '/lib/' in n for n in names), core
            assert 'motion-film-director/LICENSE' in names
            for license_path in ('runtime/motion-elements/LICENSE', 'runtime/motion-audio-core/LICENSE', 'runtime/motion-timeline-core/LICENSE', 'runtime/motion-render-core/LICENSES/napi-rs-canvas-MIT.txt', 'LICENSES/huashu-motion-MIT.txt'):
                assert 'motion-film-director/' + license_path in names
            for name in names:
                rel = name.removeprefix('motion-film-director/')
                if rel in {'runtime-source.json', 'manifest.json'}: continue
                source = ROOT / ('engine/' + rel.removeprefix('runtime/') if rel.startswith('runtime/') else 'LICENSE' if rel == 'LICENSE' else 'skills/motion-film-director/' + rel)
                assert z.read(name) == source.read_bytes(), 'Stale packaged source: ' + name
            default_kb = json.loads(z.read('motion-film-director/research/video-knowledge/index.json'))
            assert all(default_kb[key] == [] for key in ('cases', 'techniques', 'legacy'))
            for rel in ('index.json', 'cases/plan.json'):
                assert 'motion-film-director/references/knowledge-decision-example/' + rel in names
            assert 'motion-film-director/runtime/motion-elements/catalog.json' in names
            assert 'motion-film-director/references/motion-elements.md' in names
            print('All packaged source bytes match current worktree; package licenses, elements catalog, synthetic KB example and empty default KB verified')
            assert not any(n.endswith(('.wav', '.mp4', '.mp3')) or '/node_modules/' in n for n in names)
            z.extractall(temp / 'fresh')
        skill = temp / 'fresh/motion-film-director'
        elements = skill / 'runtime/motion-elements'
        tests = sorted(elements.glob('test/*.test.mjs'))
        assert tests, 'Portable motion-elements tests missing'
        run(['node', '--test', *map(str, tests)])
        gallery = temp / 'fresh-gallery'
        run(['node', str(elements / 'scripts/render-gallery.mjs'), '--out', str(gallery)])
        movie = gallery / 'motion-elements-gallery.mp4'
        probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-count_frames', '-show_entries', 'stream=codec_type,width,height,r_frame_rate,nb_read_frames:format=duration', '-of', 'json', str(movie)]))
        videos = [s for s in probe['streams'] if s['codec_type'] == 'video']
        assert len(videos) == 1 and len(probe['streams']) == 1, 'Gallery must be silent video only'
        assert videos[0]['width'] == 1280 and videos[0]['height'] == 720
        assert videos[0]['r_frame_rate'] == '30/1' and int(videos[0]['nb_read_frames']) == 240
        assert abs(float(probe['format']['duration']) - 8) < 0.001
        run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(movie), '-f', 'null', '-'])
        reduced = temp / 'fresh-gallery-reduced'
        run(['node', str(elements / 'scripts/render-gallery.mjs'), '--out', str(reduced), '--frame', '43', '--reduced-motion'])
        assert (reduced / 'frame.png').read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
        print('Fresh portable gallery: 240 frames, 8 seconds, full decode passed; reduced-motion frame rendered (not an artistic review)')
        run(['node', '--test', str(skill / 'scripts/test-audio-timeline.mjs')])
        run(['node', str(skill / 'runtime/motion-audio-core/scripts/audio.mjs'), 'capabilities'], stdout=subprocess.DEVNULL)
    assert hashlib.sha256(actual.read_bytes()).hexdigest() == before, 'Canonical index changed'
    print('Portable four-package smoke passed; canonical index unchanged')
if __name__ == '__main__': main()
