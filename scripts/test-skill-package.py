"""Build from a disposable index and smoke the portable four-package Skill in /tmp.
Does not alter the canonical Git index, install dependencies, or retain media.
"""
import hashlib, importlib.util, json, os, shutil, subprocess, tempfile, zipfile
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
        sources.extend(['tools/reference-benchmark/event_intervals.py', 'tools/reference-benchmark/test_event_intervals.py', 'tools/reference-benchmark/event-intervals.example.synthetic.json', 'tools/reference-benchmark/EVENT_INTERVALS.md', 'tools/reference-benchmark/event_interval_report.py', 'tools/reference-benchmark/test_event_interval_report.py', 'tools/reference-benchmark/EVENT_INTERVAL_REPORT.md'])
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
                source = ROOT / ('tools/reference-benchmark/' + rel.removeprefix('runtime/review-tools/') if rel.startswith('runtime/review-tools/') else 'engine/' + rel.removeprefix('runtime/') if rel.startswith('runtime/') else 'LICENSE' if rel == 'LICENSE' else 'skills/motion-film-director/' + rel)
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
        query_cli = elements / 'scripts/query-catalog.mjs'
        listed = json.loads(subprocess.check_output(['node', str(query_cli), 'list']))
        assert listed['total'] == 16 and len(listed['results']) == 16
        recipes = json.loads(subprocess.check_output(['node', str(query_cli), 'list', '--kind', 'recipe']))
        assert recipes['total'] == 3 and len(recipes['results']) == 3
        empty = json.loads(subprocess.check_output(['node', str(query_cli), 'find', '--text', 'no-such-mechanism-29461']))
        assert empty['total'] == 0 and empty['results'] == []
        review = skill / 'runtime/review-tools'
        run(['python3', str(review / 'test_event_intervals.py')])
        run(['python3', str(review / 'test_event_interval_report.py')])
        fixture_spec = importlib.util.spec_from_file_location('portable_interval_fixture', review / 'test_event_intervals.py')
        fixture_module = importlib.util.module_from_spec(fixture_spec); fixture_spec.loader.exec_module(fixture_module)
        fixture_args, fixture_data = fixture_module.make_fixture(temp / 'synthetic-interval-inputs')
        cli_args = ['python3', str(review / 'event_intervals.py'), 'evaluate']
        for key, value in fixture_args.items(): cli_args += ['--' + key.replace('_', '-'), str(value)]
        result_path = temp / 'synthetic-interval-result.json'
        run([*cli_args, '--out', str(result_path)])
        receipt = json.loads(result_path.read_text())
        assert receipt['collection_status'] == 'COLLECTED_NOT_APPROVED'
        assert receipt['synthetic_notice'] == 'SYNTHETIC_NOT_FILM_EVIDENCE'
        assert receipt['timing_validation'] == 'BOUND_PROFILE_NOT_REDECODED'
        html_path = temp / 'synthetic-interval-report.html'
        run(['python3', str(review / 'event_interval_report.py'), 'render', '--receipt', str(result_path), '--out', str(html_path)])
        html = html_path.read_text()
        assert '<svg' in html and '<html' in html and '<script' not in html
        bad = subprocess.run([*cli_args, '--unsupported', '--out', str(temp / 'bad-output.json')], capture_output=True)
        assert bad.returncode == 2 and not (temp / 'bad-output.json').exists()
        fixture_args['reference_media'].write_bytes(b'changed synthetic identity')
        stale_path = temp / 'synthetic-stale.json'
        stale = subprocess.run([*cli_args, '--out', str(stale_path)], capture_output=True)
        assert stale.returncode == 1 and json.loads(stale_path.read_text())['collection_status'] == 'STALE'
        assert json.loads(stale_path.read_text())['events'] == []
        print('Catalog 16/recipe3/no-match and standalone interval CLI synthetic/unsupported/stale gates passed; no decoding or approval')
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
        # Separate synthetic demos; no production footage or artistic gate claims.
        for demo in ('path', 'settle-reveal', 'tiles', 'focus-handoff', 'tile-signature', 'iris'):
            width, height, frames, duration = (1920, 1080, 210, 7) if demo == 'focus-handoff' else (1920, 1080, 240, 8) if demo == 'tile-signature' else (1280, 720, 240, 8)
            path_gallery = temp / ('fresh-' + demo)
            run(['node', str(elements / 'scripts/render-gallery.mjs'), '--out', str(path_gallery), '--demo', demo])
            path_movie = path_gallery / 'motion-elements-gallery.mp4'
            path_probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-count_frames', '-show_entries', 'stream=codec_type,width,height,r_frame_rate,nb_read_frames:format=duration', '-of', 'json', str(path_movie)]))
            assert len(path_probe['streams']) == 1
            stream = path_probe['streams'][0]
            assert stream['codec_type'] == 'video' and stream['width'] == width and stream['height'] == height
            assert stream['r_frame_rate'] == '30/1' and int(stream['nb_read_frames']) == frames
            assert abs(float(path_probe['format']['duration']) - duration) < 0.001
            run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(path_movie), '-f', 'null', '-'])
            path_reduced = temp / ('fresh-' + demo + '-reduced')
            run(['node', str(elements / 'scripts/render-gallery.mjs'), '--out', str(path_reduced), '--demo', demo, '--frame', '43', '--reduced-motion'])
            assert (path_reduced / 'frame.png').read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
            print('Fresh portable ' + demo + ': ' + str(frames) + ' frames, full decode and reduced frame passed; technical only')
        run(['node', '--test', str(skill / 'scripts/test-audio-timeline.mjs')])
        run(['node', str(skill / 'runtime/motion-audio-core/scripts/audio.mjs'), 'capabilities'], stdout=subprocess.DEVNULL)
    assert hashlib.sha256(actual.read_bytes()).hexdigest() == before, 'Canonical index changed'
    print('Portable four-package smoke passed; canonical index unchanged')
if __name__ == '__main__': main()
