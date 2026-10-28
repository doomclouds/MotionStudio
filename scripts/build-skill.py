"""Build a portable Skill from tracked source; never writes into the repository."""
import argparse, hashlib, importlib.util, json, subprocess, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('source_policy', ROOT / 'scripts/check-source-tree.py')
policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(policy)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    out = args.output.expanduser().resolve()
    if out == ROOT or ROOT in out.parents: parser.error('Output must be outside repository')
    if out.exists(): parser.error('Refusing to overwrite existing output')
    names = policy.paths(policy.git('ls-files', '-z'))
    bad = [name for name in names if policy.forbidden(name)]
    if bad: raise SystemExit('Generated paths tracked: ' + ', '.join(bad))
    payload = {}
    for name in names:
        if name.startswith('skills/motion-film-director/'):
            rel = name.removeprefix('skills/motion-film-director/')
        elif any(name.startswith('engine/' + core + '/') for core in ('motion-render-core', 'motion-timeline-core', 'motion-audio-core', 'motion-elements')):
            rel = 'runtime/' + name.removeprefix('engine/')
        elif name in ('tools/reference-benchmark/event_intervals.py', 'tools/reference-benchmark/test_event_intervals.py', 'tools/reference-benchmark/event-intervals.example.synthetic.json', 'tools/reference-benchmark/EVENT_INTERVALS.md', 'tools/reference-benchmark/event_interval_report.py', 'tools/reference-benchmark/test_event_interval_report.py', 'tools/reference-benchmark/EVENT_INTERVAL_REPORT.md', 'tools/reference-benchmark/stem_balance.py', 'tools/reference-benchmark/test_stem_balance.py', 'tools/reference-benchmark/STEM_BALANCE.md', 'tools/reference-benchmark/event_correspondence.py', 'tools/reference-benchmark/test_event_correspondence.py', 'tools/reference-benchmark/example_event_correspondence.py', 'tools/reference-benchmark/EVENT_CORRESPONDENCE.md'):
            rel = 'runtime/review-tools/' + name.rsplit('/', 1)[1]
        elif name in ('scripts/audio_review.py', 'scripts/audiovisual_review.py', 'scripts/test_audio_review.py', 'scripts/test_audiovisual_review.py', 'scripts/AUDIO-REVIEW.md'):
            rel = 'runtime/review-tools/' + name.rsplit('/', 1)[1]
        elif name in ('LICENSE', '.env.example'):
            rel = name
        else: continue
        source = ROOT / name
        if source.is_symlink() or not source.is_file(): raise SystemExit('Missing or symlink source: ' + name)
        data = source.read_bytes()
        if name == '.env.example' and not policy.safe_env_template(data):
            raise SystemExit('Only a key-free .env.example may be packaged')
        payload[rel] = data
    required = ['SKILL.md', 'NOTICE.md', 'LICENSES/huashu-motion-MIT.txt', 'runtime/motion-render-core/lib/native.mjs', 'runtime/motion-render-core/LICENSES/napi-rs-canvas-MIT.txt', 'LICENSE', 'runtime/motion-timeline-core/lib/timeline.mjs', 'runtime/motion-timeline-core/LICENSE', 'runtime/motion-audio-core/LICENSE', 'runtime/motion-audio-core/lib/audio.mjs', 'runtime/motion-audio-core/scripts/audio.mjs', 'runtime/motion-elements/LICENSE', 'runtime/motion-elements/lib/index.mjs', 'runtime/motion-elements/catalog.json', 'runtime/motion-elements/lib/path.mjs', 'runtime/motion-elements/lib/iris.mjs', 'runtime/motion-elements/adapters/iris.mjs', 'runtime/motion-elements/examples/iris-scene.mjs', 'runtime/motion-elements/test/iris.test.mjs', 'runtime/motion-elements/lib/recipes/tile-signature.mjs', 'runtime/motion-elements/examples/tile-signature-scene.mjs', 'runtime/motion-elements/test/tile-signature.test.mjs', 'runtime/motion-elements/lib/recipes/focus-handoff.mjs', 'runtime/motion-elements/examples/focus-handoff-scene.mjs', 'runtime/motion-elements/test/focus-handoff.test.mjs', 'runtime/motion-elements/lib/tiles.mjs', 'runtime/motion-elements/adapters/tiles.mjs', 'runtime/motion-elements/examples/tiles-scene.mjs', 'runtime/motion-elements/lib/settle.mjs', 'runtime/motion-elements/adapters/local-reveal.mjs', 'runtime/motion-elements/examples/settle-reveal-scene.mjs', 'runtime/motion-elements/examples/path-scene.mjs', 'runtime/motion-elements/test/path.test.mjs', 'runtime/motion-elements/examples/gallery-scene.mjs', 'runtime/motion-elements/scripts/render-gallery.mjs', 'references/motion-elements.md', 'runtime/motion-elements/scripts/query-catalog.mjs', 'runtime/motion-elements/lib/catalog-query.mjs', 'runtime/review-tools/event_intervals.py', 'runtime/review-tools/test_event_intervals.py', 'runtime/review-tools/event-intervals.example.synthetic.json', 'runtime/review-tools/EVENT_INTERVALS.md', 'runtime/review-tools/event_interval_report.py', 'runtime/review-tools/test_event_interval_report.py', 'runtime/review-tools/EVENT_INTERVAL_REPORT.md']
    required += ['scripts/video_knowledge.py', 'scripts/static_knowledge.py', 'scripts/test_video_knowledge.py', 'scripts/test_static_knowledge.py', 'research/video-knowledge/STATIC-SCHEMA.md']
    required += ['runtime/review-tools/' + name for name in ('audio_review.py', 'audiovisual_review.py', 'test_audio_review.py', 'test_audiovisual_review.py', 'AUDIO-REVIEW.md')]
    required += ['references/audiovisual-review-sop.md', '.env.example',
                 'references/audiovisual-report-standard.md', 'references/report-schema.json',
                 'references/review-calibration-lessons.md', 'scripts/validate_delivery_report.py',
                 'scripts/test_validate_delivery_report.py']
    required += ['references/delivery-workflow.md', 'scripts/check_delivery.py', 'scripts/test_check_delivery.py',
                 'references/final-delivery-evidence.md', 'scripts/check_final_delivery.py', 'scripts/test_check_final_delivery.py']
    required += ['runtime/motion-elements/lib/registered-polygon-morph.mjs', 'runtime/motion-elements/adapters/registered-polygon-morph.mjs', 'runtime/motion-elements/examples/registered-polygon-morph-scene.mjs', 'runtime/motion-elements/test/registered-polygon-morph.test.mjs']
    required += ['runtime/motion-elements/' + name for name in ('lib/attractor-field.mjs', 'lib/slice-displacement.mjs', 'adapters/slice-displacement.mjs', 'examples/field-slices-scene.mjs', 'test/field-slices.test.mjs')]
    required += ['runtime/motion-elements/' + name for name in ('lib/linear-mask.mjs', 'adapters/linear-mask.mjs', 'examples/linear-mask-study.mjs', 'test/linear-mask.test.mjs')]
    if any(name not in payload for name in required): raise SystemExit('Required source/license missing')
    required_stem = ['runtime/review-tools/' + name for name in ('stem_balance.py', 'test_stem_balance.py', 'STEM_BALANCE.md')]
    if any(name not in payload for name in required_stem): raise SystemExit('Optional stem-balance source/documentation missing')
    required_correspondence = ['runtime/review-tools/' + name for name in ('event_correspondence.py', 'test_event_correspondence.py', 'example_event_correspondence.py', 'EVENT_CORRESPONDENCE.md')]
    if any(name not in payload for name in required_correspondence): raise SystemExit('Event-correspondence source/documentation missing')
    payload['runtime-source.json'] = (json.dumps({'schema': 1, 'mode': 'bundled', 'relativePath': 'runtime/motion-render-core', 'policy': 'Generated snapshot; edit canonical MotionStudio source and rebuild.'}, indent=2)+'\n').encode()
    manifest = {'schema': 1, 'files': [{'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()} for name, data in sorted(payload.items())]}
    payload['manifest.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2)+'\n').encode()
    out.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(payload.items()):
            info = zipfile.ZipInfo('motion-film-director/' + name, (2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    print(json.dumps({'output': str(out), 'files': len(payload), 'sha256': hashlib.sha256(out.read_bytes()).hexdigest()}))

if __name__ == '__main__': main()
