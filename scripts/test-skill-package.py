"""Build from a disposable index and smoke the portable four-package Skill in /tmp.
Does not alter the canonical Git index, install dependencies, or retain media.
"""
import argparse, hashlib, importlib.util, json, os, shutil, subprocess, tempfile, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def run(args, **kwargs):
    return subprocess.run(args, cwd=ROOT, check=True, **kwargs)
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-video", action="store_true", help="Skip video-producing gallery and audio/video-wrapper smoke; report partial validation")
    args = parser.parse_args()
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
        sources.extend(['tools/reference-benchmark/' + name for name in ('event_correspondence.py', 'test_event_correspondence.py', 'example_event_correspondence.py', 'EVENT_CORRESPONDENCE.md')])
        sources.extend(['tools/reference-benchmark/stem_balance.py', 'tools/reference-benchmark/test_stem_balance.py', 'tools/reference-benchmark/STEM_BALANCE.md'])
        sources.extend(['skills/motion-film-director/references/motion-elements.md', 'skills/motion-film-director/scripts/test-audio-timeline.mjs', 'skills/motion-film-director/references/knowledge-decision-example/index.json', 'skills/motion-film-director/references/knowledge-decision-example/cases/plan.json'])
        sources.extend(['skills/motion-film-director/scripts/static_knowledge.py', 'skills/motion-film-director/scripts/test_static_knowledge.py', 'skills/motion-film-director/research/video-knowledge/STATIC-SCHEMA.md'])
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
            assert 'motion-film-director/.env.example' in names
            assert not any(n.rsplit('/', 1)[-1] == '.env' for n in names)
            for license_path in ('runtime/motion-elements/LICENSE', 'runtime/motion-audio-core/LICENSE', 'runtime/motion-timeline-core/LICENSE', 'runtime/motion-render-core/LICENSES/napi-rs-canvas-MIT.txt', 'LICENSES/huashu-motion-MIT.txt'):
                assert 'motion-film-director/' + license_path in names
            for name in names:
                rel = name.removeprefix('motion-film-director/')
                if rel in {'runtime-source.json', 'manifest.json'}: continue
                source = ROOT / (('scripts/' if rel.rsplit('/', 1)[1] in {'audio_review.py', 'audiovisual_review.py', 'test_audio_review.py', 'test_audiovisual_review.py', 'AUDIO-REVIEW.md'} else 'tools/reference-benchmark/') + rel.removeprefix('runtime/review-tools/') if rel.startswith('runtime/review-tools/') else 'engine/' + rel.removeprefix('runtime/') if rel.startswith('runtime/') else rel if rel in {'LICENSE', '.env.example'} else 'skills/motion-film-director/' + rel)
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
        for test in ('test_video_knowledge.py', 'test_static_knowledge.py', 'test_check_delivery.py', 'test_check_final_delivery.py', 'test_validate_delivery_report.py'):
            run(['python3', str(skill / 'scripts' / test)])
        kb_cli = skill / 'scripts/video_knowledge.py'
        empty_kb = json.loads(subprocess.check_output(['python3', str(kb_cli), 'validate']))
        assert empty_kb == {'valid': True, 'cases': 0, 'techniques': 0}
        no_match = json.loads(subprocess.check_output(['python3', str(kb_cli), 'decide', '--text', 'iris']))
        assert no_match['status'] == 'no-match' and no_match['recommendations'] == []
        assert (skill / 'research/video-knowledge/STATIC-SCHEMA.md').is_file()
        print('Extracted legacy/static knowledge tests and empty-default validate/decide passed')
        elements = skill / 'runtime/motion-elements'
        tests = sorted(elements.glob('test/*.test.mjs'))
        assert tests, 'Portable motion-elements tests missing'
        run(['node', '--test', *map(str, tests)])
        query_cli = elements / 'scripts/query-catalog.mjs'
        listed = json.loads(subprocess.check_output(['node', str(query_cli), 'list']))
        assert listed['total'] == 67 and len(listed['results']) == 20 and listed['truncated'] is True
        rasters = json.loads(subprocess.check_output(['node', str(query_cli), 'list', '--kind', 'raster']))
        assert rasters['total'] == 8 and {r['element']['id'] for r in rasters['results']} == {'raster.coverage-morphology', 'raster.matte', 'raster.displacement-map', 'raster.neighborhood-convolution', 'raster.projective-quad', 'raster.temporal-exposure', 'raster.euclidean-distance-transform', 'raster.palette-error-diffusion'}
        sticky = json.loads(subprocess.check_output(['node', str(query_cli), 'show', '--id', 'composition.sticky-interval']))
        assert sticky['total'] == 1 and sticky['results'][0]['element']['api'] == 'stickyIntervalLayout'
        parallax = json.loads(subprocess.check_output(['node', str(query_cli), 'show', '--id', 'composition.plane-parallax']))
        assert parallax['total'] == 1 and parallax['results'][0]['element']['api'] == 'planeParallaxLayout'
        flow = json.loads(subprocess.check_output(['node', str(query_cli), 'show', '--id', 'composition.flow-wrap']))
        assert flow['total'] == 1 and flow['results'][0]['element']['api'] == 'flowWrapLayout'
        assert flow['results'][0]['element']['evidence']['ownerArtisticAcceptance'] == 'PENDING_USER'
        hinge = json.loads(subprocess.check_output(['node', str(query_cli), 'show', '--id', 'geometry.hinged-panel']))
        assert hinge['total'] == 1 and hinge['results'][0]['element']['api'] == 'compileHingedPanel'
        assert hinge['results'][0]['element']['evidence']['audioListening'] == 'NOT_LISTENED'
        cubic = json.loads(subprocess.check_output(['node', str(query_cli), 'show', '--id', 'geometry.cubic-path']))
        glyph = json.loads(subprocess.check_output(['node', str(query_cli), 'show', '--id', 'composition.glyph-run-path']))
        assert cubic['total'] == 1 and cubic['results'][0]['element']['api'] == 'compileCubicPath'
        assert glyph['total'] == 1 and glyph['results'][0]['element']['api'] == 'layoutGlyphRunOnPath'
        assert 'path' in glyph['results'][0]['element']['exampleSetup']
        assert glyph['results'][0]['element']['evidence']['audioListening'] == 'NOT_LISTENED'
        ik = json.loads(subprocess.check_output(['node', str(query_cli), 'show', '--id', 'geometry.two-link-ik']))
        assert ik['total'] == 1 and ik['results'][0]['element']['api'] == 'solveTwoLinkIK'
        for new_id, new_api in [('geometry.catenary','compileCatenary'),('composition.interval-lanes','intervalLaneLayout'),('recipe.staged-layout-handoff','compileStagedLayoutHandoff')]:
            selected = json.loads(subprocess.check_output(['node', str(query_cli), 'show', '--id', new_id]))
            assert selected['total'] == 1 and selected['results'][0]['element']['api'] == new_api
            assert selected['results'][0]['element']['evidence']['audioListening'] == 'NOT_LISTENED'
            assert selected['results'][0]['element']['evidence']['ownerArtisticAcceptance'] == 'PENDING_USER'
        contour = json.loads(subprocess.check_output(['node', str(query_cli), 'show', '--id', 'geometry.iso-contour']))
        assert contour['total'] == 1 and contour['results'][0]['element']['api'] == 'compileContourGrid'
        assert contour['results'][0]['element']['evidence']['audioListening'] == 'NOT_LISTENED'
        assert contour['results'][0]['element']['evidence']['ownerArtisticAcceptance'] == 'PENDING_USER'
        for new_id, new_api in [('raster.neighborhood-convolution','compileConvolution'),('raster.projective-quad','compileProjectiveRaster'),('composition.masonry','masonryLayout'),('composition.anchored-labels','placeAnchoredLabels')]:
            selected = json.loads(subprocess.check_output(['node', str(query_cli), 'show', '--id', new_id]))
            assert selected['total'] == 1 and selected['results'][0]['element']['api'] == new_api
            assert selected['results'][0]['element']['evidence']['audioListening'] == 'NOT_LISTENED'
            assert selected['results'][0]['element']['evidence']['ownerArtisticAcceptance'] == 'PENDING_USER'
        recipes = json.loads(subprocess.check_output(['node', str(query_cli), 'list', '--kind', 'recipe']))
        assert recipes['total'] == 7 and len(recipes['results']) == 7
        empty = json.loads(subprocess.check_output(['node', str(query_cli), 'find', '--text', 'no-such-mechanism-29461']))
        assert empty['total'] == 0 and empty['results'] == []
        review = skill / 'runtime/review-tools'
        # Offline fixtures only: no provider calls or keys during package validation.
        run(['python3', str(review / 'test_audio_review.py')])
        run(['python3', str(review / 'test_audiovisual_review.py')])
        run(['python3', str(review / 'test_event_intervals.py')])
        run(['python3', str(review / 'test_event_interval_report.py')])
        # Optional sidecar only: no installer, decoder, listening or default review hook.
        methods = json.loads((skill / 'references/review-methods.json').read_text())['methods']
        stem_method = next(m for m in methods if m['id'] == 'stem-balance')
        assert stem_method['select'] == 'explicit' and stem_method['implementation'] == 'manual-local-sidecar'
        assert all((review / name).is_file() for name in ('stem_balance.py', 'test_stem_balance.py', 'STEM_BALANCE.md'))
        if importlib.util.find_spec('numpy') is not None:
            run(['python3', str(review / 'test_stem_balance.py')])
        else:
            print('Optional stem-balance tests NOT_RUN: NumPy unavailable; no automatic installation')
        correspondence_method = next(m for m in methods if m['id'] == 'event-correspondence')
        assert correspondence_method['select'] == 'explicit'
        assert correspondence_method['implementation'] == 'manual-local-sidecar'
        for name in ('event_correspondence.py', 'test_event_correspondence.py', 'example_event_correspondence.py', 'EVENT_CORRESPONDENCE.md'):
            assert (review / name).is_file()
        run(['python3', str(review / 'test_event_correspondence.py')])
        synthetic = temp / 'synthetic-correspondence'
        generator = ['python3', str(review / 'example_event_correspondence.py'), '--out', str(synthetic)]
        run(generator)
        before_example = {p.name: p.read_bytes() for p in synthetic.iterdir()}
        assert subprocess.run(generator, capture_output=True).returncode == 2
        assert before_example == {p.name: p.read_bytes() for p in synthetic.iterdir()}
        diagnostics = {}
        for case in ('bad', 'corrected', 'control'):
            output = synthetic / (case + '.result.json')
            command = ['python3', str(review / 'event_correspondence.py'), '--annotations', str(synthetic / (case + '.json')),
                       '--reference-media', str(synthetic / 'reference.txt'), '--candidate-media', str(synthetic / (case + '.txt')),
                       '--evidence-root', str(synthetic), '--synthetic', '--out', str(output)]
            run(command)
            diagnostics[case] = json.loads(output.read_text())
            assert diagnostics[case]['status'] == 'DIAGNOSTIC_NOT_APPROVAL'
            assert diagnostics[case]['dataset_kind'] == 'synthetic'
            assert diagnostics[case]['bindings']['reference'] == 'SYNTHETIC_BYTES_NOT_MEDIA'
            assert diagnostics[case]['annotation_truth'] == 'NOT_VERIFIED'
            assert diagnostics[case]['artistic_quality'] is None
            before_receipt = output.read_bytes()
            assert subprocess.run(command, capture_output=True).returncode == 2
            assert output.read_bytes() == before_receipt
        assert 'SEMANTIC_MISMATCH' in diagnostics['bad']['events'][0]['findings']
        assert 'DEFINITELY_LATE' in diagnostics['bad']['events'][0]['findings']
        for case in ('corrected', 'control'):
            assert diagnostics[case]['events'][0]['findings'] == ['WITHIN_DECLARED_TOLERANCE_NOT_APPROVAL']
        # Public examples contain no private media paths; contract rejects traversal and resource overflow.
        source_example = json.loads((synthetic / 'bad.json').read_text())
        mutations = []
        for path in ('../outside.txt', '/absolute/private-evidence.txt'):
            data = json.loads(json.dumps(source_example)); data['evidence'][0]['path'] = path; mutations.append(data)
        data = json.loads(json.dumps(source_example)); data['sequences']['reference']['events'] *= 101; mutations.append(data)
        data = json.loads(json.dumps(source_example)); data['sequences']['reference']['events'][0]['pts_samples'] = ['1'] * 101; mutations.append(data)
        for number, data in enumerate(mutations):
            annotation = synthetic / ('invalid-' + str(number) + '.json'); annotation.write_text(json.dumps(data))
            output = synthetic / ('invalid-' + str(number) + '.result.json')
            failed = subprocess.run(['python3', str(review / 'event_correspondence.py'), '--annotations', str(annotation),
                '--reference-media', str(synthetic / 'reference.txt'), '--candidate-media', str(synthetic / 'bad.txt'),
                '--evidence-root', str(synthetic), '--synthetic', '--out', str(output)], capture_output=True)
            assert failed.returncode == 2 and not output.exists()
        print('Portable correspondence synthetic bad/corrected/control and no-overwrite contracts passed; not film evidence')
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
        print('Catalog 67/default-limit20/recipe7/raster8/no-match and standalone interval CLI synthetic/unsupported/stale gates passed; no decoding or approval')
        if args.skip_video:
            print('NOT_RUN: gallery video encoding/full decode and standalone reduced still smoke (--skip-video); other tests continue')
        else:
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
            for demo in ('path', 'settle-reveal', 'tiles', 'focus-handoff', 'tile-signature', 'iris', 'registered-polygon-morph', 'field-slices'):
                width, height, frames, duration = (960, 640, 180, 6) if demo == 'field-slices' else (960, 640, 240, 8) if demo == 'registered-polygon-morph' else (1920, 1080, 210, 7) if demo == 'focus-handoff' else (1920, 1080, 240, 8) if demo == 'tile-signature' else (1280, 720, 240, 8)
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
        if args.skip_video:
            print('NOT_RUN: audio/video timeline wrapper integration (creates MP4 fixtures)')
        else:
            run(['node', '--test', str(skill / 'scripts/test-audio-timeline.mjs')])
        run(['node', str(skill / 'runtime/motion-audio-core/scripts/audio.mjs'), 'capabilities'], stdout=subprocess.DEVNULL)
    assert hashlib.sha256(actual.read_bytes()).hexdigest() == before, 'Canonical index changed'
    print('Portable four-package non-video checks passed; gallery media checks NOT_RUN; canonical index unchanged' if args.skip_video else 'Portable four-package smoke passed; canonical index unchanged')
if __name__ == '__main__': main()
