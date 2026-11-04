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
    layout_spec = importlib.util.spec_from_file_location('skill_layout', ROOT / 'scripts/skill-layout.py')
    layout = importlib.util.module_from_spec(layout_spec)
    layout_spec.loader.exec_module(layout)
    payload = {}
    for name in names:
        # Portfolio is a repository-only work/1 registry, never a portable payload.
        # Recipe manifests under engine remain their own contracts, not work metadata.
        if name.startswith('portfolio/'):
            continue
        if name.startswith('skills/motion-film-director/'):
            rel = name.removeprefix('skills/motion-film-director/')
        elif name.startswith(('knowledge/design/', 'knowledge/sound/')) or name in ('scripts/design_knowledge.py', 'scripts/test_design_knowledge.py'):
            rel = name
        elif any(name.startswith('engine/' + core + '/') for core in ('motion-render-core', 'motion-timeline-core', 'motion-audio-core', 'motion-elements', 'design-elements', 'sound-elements')):
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
        data = layout.source_bytes(ROOT, name)
        if name == '.env.example' and not policy.safe_env_template(data):
            raise SystemExit('Only a key-free .env.example may be packaged')
        payload[rel] = data
    required = ['SKILL.md', 'NOTICE.md', 'LICENSES/huashu-motion-MIT.txt', 'runtime/motion-render-core/lib/native.mjs', 'runtime/motion-render-core/LICENSES/napi-rs-canvas-MIT.txt', 'LICENSE', 'runtime/motion-timeline-core/lib/timeline.mjs', 'runtime/motion-timeline-core/LICENSE', 'runtime/motion-audio-core/LICENSE', 'runtime/motion-audio-core/lib/audio.mjs', 'runtime/motion-audio-core/scripts/audio.mjs', 'runtime/motion-elements/LICENSE', 'runtime/motion-elements/lib/index.mjs', 'runtime/motion-elements/catalog.json', 'runtime/motion-elements/lib/foundations/geometry/polyline-trail/index.mjs', 'runtime/motion-elements/lib/foundations/transition/iris-reveal/index.mjs', 'runtime/motion-elements/adapters/iris.mjs', 'runtime/motion-elements/lib/foundations/transition/iris-reveal/examples/iris-scene.mjs', 'runtime/motion-elements/lib/foundations/transition/iris-reveal/test/iris-reveal.test.mjs', 'runtime/motion-elements/lib/recipes/tile-signature/index.mjs', 'runtime/motion-elements/lib/recipes/tile-signature/examples/tile-signature-scene.mjs', 'runtime/motion-elements/lib/recipes/tile-signature/test/tile-signature.test.mjs', 'runtime/motion-elements/lib/recipes/focus-handoff/index.mjs', 'runtime/motion-elements/lib/recipes/focus-handoff/examples/focus-handoff-scene.mjs', 'runtime/motion-elements/lib/recipes/focus-handoff/test/focus-handoff.test.mjs', 'runtime/motion-elements/lib/foundations/fragment/fixed-tiles/index.mjs', 'runtime/motion-elements/adapters/tiles.mjs', 'runtime/motion-elements/lib/foundations/fragment/fixed-tiles/examples/tiles-scene.mjs', 'runtime/motion-elements/lib/settle.mjs', 'runtime/motion-elements/lib/foundations/reveal/local-geometry/index.mjs', 'runtime/motion-elements/examples/settle-reveal-scene.mjs', 'runtime/motion-elements/lib/foundations/geometry/polyline-trail/examples/path-scene.mjs', 'runtime/motion-elements/lib/foundations/geometry/polyline-trail/test/polyline-trail.test.mjs', 'runtime/motion-elements/examples/gallery-scene.mjs', 'runtime/motion-elements/scripts/render-gallery.mjs', 'references/motion-elements.md', 'runtime/motion-elements/scripts/query-catalog.mjs', 'runtime/motion-elements/lib/catalog-query.mjs', 'runtime/review-tools/event_intervals.py', 'runtime/review-tools/test_event_intervals.py', 'runtime/review-tools/event-intervals.example.synthetic.json', 'runtime/review-tools/EVENT_INTERVALS.md', 'runtime/review-tools/event_interval_report.py', 'runtime/review-tools/test_event_interval_report.py', 'runtime/review-tools/EVENT_INTERVAL_REPORT.md']
    required += ['knowledge/design/INDEX.md', 'knowledge/design/index.json', 'knowledge/design/static-ui-reference-study.md', 'knowledge/design/NOTICE.md', 'scripts/design_knowledge.py', 'scripts/test_design_knowledge.py', 'references/design-to-motion.md']
    required += ['runtime/motion-elements/' + name for name in ('lib/foundations/geometry/voronoi-cells/index.mjs', 'lib/foundations/geometry/rectangle-obstacle-route/index.mjs', 'lib/foundations/geometry/radial-landmark-warp/index.mjs', 'lib/foundations/layout/minimum-cost-assignment/index.mjs', 'lib/foundations/raster/distance-transform/index.mjs', 'lib/foundations/raster/palette-diffusion/index.mjs', 'lib/foundations/field/arrival-field/index.mjs', 'lib/foundations/field/reaction-diffusion/index.mjs', 'lib/support/polyline-sections.mjs', 'lib/support/event-bindings.mjs', 'lib/internal/geometry-validation.mjs', 'lib/internal/grid-validation.mjs', 'lib/internal/arrival-validation.mjs')]
    required += ['runtime/motion-elements/lib/foundations/motion/finite-particles/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/finite-particles.test.mjs', 'test/asset-directory.test.mjs')]
    for asset, test_name in [('motion/fixed-string-wave', 'fixed-string-wave'), ('motion/hard-disc-events', 'hard-disc-events'), ('layout/poisson-disc', 'poisson-disc')]:
        required += ['runtime/motion-elements/lib/foundations/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + test_name + '.test.mjs', 'test/asset-directory.test.mjs')]
    for asset, test_name in [('layout/weighted-hierarchy', 'weighted-hierarchy'), ('geometry/visibility-fan', 'visibility-fan'), ('field/grid-transport', 'grid-transport'), ('geometry/ray-chain', 'ray-chain')]:
        required += ['runtime/motion-elements/lib/foundations/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + test_name + '.test.mjs', 'test/asset-directory.test.mjs')]
    for asset, test_name in [('geometry/two-link-ik', 'two-link-ik'), ('layout/plane-parallax', 'plane-parallax'), ('layout/sticky-interval', 'sticky-interval')]:
        required += ['runtime/motion-elements/lib/foundations/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + test_name + '.test.mjs', 'test/asset-directory.test.mjs')]
    for asset, test_name in [('geometry/catenary', 'catenary'), ('layout/interval-lanes', 'interval-lanes'), ('raster/temporal-exposure', 'temporal')]:
        required += ['runtime/motion-elements/lib/foundations/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + test_name + '.test.mjs', 'test/asset-directory.test.mjs')]
    for asset in ('flow-wrap', 'masonry', 'anchored-labels'):
        required += ['runtime/motion-elements/lib/foundations/layout/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + asset + '.test.mjs', 'test/asset-directory.test.mjs')]
    for role, asset in (('geometry', 'cubic-path'), ('typography', 'glyph-run-path'), ('geometry', 'hinged-panel')):
        required += ['runtime/motion-elements/lib/foundations/' + role + '/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + asset + '.test.mjs', 'test/asset-directory.test.mjs')]
    for role, asset in (('geometry', 'iso-contour'), ('raster', 'convolution'), ('raster', 'projective-raster')):
        required += ['runtime/motion-elements/lib/foundations/' + role + '/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + asset + '.test.mjs', 'test/asset-directory.test.mjs')]
    for role, asset in (('geometry', 'affine-skin'), ('motion', 'damped-response')):
        required += ['runtime/motion-elements/lib/foundations/' + role + '/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + asset + '.test.mjs', 'test/asset-directory.test.mjs')]
    required += ['runtime/motion-elements/lib/recipes/staged-layout-handoff/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/staged-layout-handoff.test.mjs', 'test/asset-directory.test.mjs')]
    required += ['runtime/motion-elements/lib/foundations/motion/damped-response/test/' + name for name in ('damped-response-oracle.test.mjs', 'fixtures/damped-response-oracle.json')]
    for asset in ('focus-handoff', 'tile-signature', 'light-echo-field'):
        required += ['runtime/motion-elements/lib/recipes/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'examples/' + asset + '-scene.mjs', 'test/' + asset + '.test.mjs', 'test/asset-directory.test.mjs')]
    required += ['runtime/motion-elements/lib/recipes/light-echo-field/canvas.mjs']
    for role, asset in (('layout', 'ordered-bands'), ('geometry', 'halftone-screen'), ('raster', 'morphology-coverage')):
        required += ['runtime/motion-elements/lib/foundations/' + role + '/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + asset + '.test.mjs', 'test/asset-directory.test.mjs')]
    required += ['runtime/motion-elements/lib/foundations/layout/ordered-bands/' + name for name in ('examples/ordered-bands.mjs', 'examples/ordered-bands-studies.mjs', 'test/ordered-bands-studies.test.mjs', 'test/ordered-bands-integration.test.mjs')]
    for role, asset in (('geometry', 'voronoi-cells'), ('geometry', 'rectangle-obstacle-route'), ('geometry', 'radial-landmark-warp'), ('layout', 'minimum-cost-assignment')):
        required += ['runtime/motion-elements/lib/foundations/' + role + '/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + asset + '.test.mjs', 'test/asset-directory.test.mjs')]
    for role, asset in (('raster', 'distance-transform'), ('raster', 'palette-diffusion'), ('field', 'reaction-diffusion')):
        required += ['runtime/motion-elements/lib/foundations/' + role + '/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + asset + '.test.mjs', 'test/asset-directory.test.mjs')]
    for role, asset in (('layout', 'layered-dag'), ('layout', 'weighted-flow')):
        required += ['runtime/motion-elements/lib/foundations/' + role + '/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + asset + '.test.mjs', 'test/asset-directory.test.mjs')]
    required += ['runtime/motion-elements/lib/recipes/flow-handoff/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/flow-handoff.test.mjs', 'test/asset-directory.test.mjs')]
    for role, asset in (('motion', 'keyframe-track'), ('field', 'arrival-field')):
        required += ['runtime/motion-elements/lib/foundations/' + role + '/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + asset + '.test.mjs', 'test/asset-directory.test.mjs')]
    required += ['runtime/motion-elements/lib/recipes/layout-handoff/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/layout-handoff.test.mjs', 'test/asset-directory.test.mjs')]
    for role, asset in (('transition', 'iris-reveal'), ('transition', 'linear-mask'), ('fragment', 'fixed-tiles')):
        required += ['runtime/motion-elements/lib/foundations/' + role + '/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + asset + '.test.mjs', 'test/asset-directory.test.mjs')]
    required += ['runtime/motion-elements/lib/foundations/' + role + '/' + asset + '/examples/' + scene + '.mjs' for role, asset, scene in (('transition', 'iris-reveal', 'iris-scene'), ('transition', 'linear-mask', 'linear-mask-study'), ('fragment', 'fixed-tiles', 'tiles-scene'))]
    for role, asset in (('geometry', 'polyline-trail'), ('geometry', 'registered-polygon-morph'), ('geometry', 'sampled-band')):
        required += ['runtime/motion-elements/lib/foundations/' + role + '/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + asset + '.test.mjs', 'test/asset-directory.test.mjs')]
    required += ['runtime/motion-elements/lib/foundations/geometry/' + asset + '/examples/' + scene + '.mjs' for asset, scene in (('polyline-trail', 'path-scene'), ('registered-polygon-morph', 'registered-polygon-morph-scene'), ('sampled-band', 'sampled-band-study'))]
    for role, asset in (('field', 'attractor-orientation'), ('transition', 'masked-slice-displacement'), ('reveal', 'local-geometry')):
        required += ['runtime/motion-elements/lib/foundations/' + role + '/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + asset + '.test.mjs', 'test/asset-directory.test.mjs')]
    required += ['runtime/motion-elements/lib/foundations/transition/masked-slice-displacement/canvas.mjs']
    for role, asset in (('motion', 'stagger'), ('layout', 'grid'), ('layout', 'constraint-stack')):
        required += ['runtime/motion-elements/lib/foundations/' + role + '/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + asset + '.test.mjs', 'test/asset-directory.test.mjs')]
    required += ['runtime/motion-elements/lib/internal/structured-layout-support.mjs']
    required += ['runtime/motion-elements/lib/recipes/offset-reassembly/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/offset-reassembly.test.mjs', 'test/asset-directory.test.mjs')]
    for role, asset in (('layout', 'offset-cards'), ('layout', 'split-panels'), ('raster', 'matte'), ('raster', 'displacement-map')):
        required += ['runtime/motion-elements/lib/foundations/' + role + '/' + asset + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/contract.mjs', 'test/' + asset + '.test.mjs', 'test/asset-directory.test.mjs')]
    required += ['runtime/motion-elements/lib/internal/' + name for name in ('layout-input.mjs', 'raster-snapshot.mjs')]
    required += ['runtime/sound-elements/README.md', 'runtime/sound-elements/LICENSE', 'runtime/sound-elements/INDEX.md', 'runtime/sound-elements/sound.py', 'runtime/sound-elements/synth.py', 'runtime/sound-elements/test_sound.py', 'knowledge/sound/INDEX.md']
    required += ['runtime/sound-elements/assets/' + ('bgm/' if ident == 'quiet-pulse-bed' else 'sfx/') + ident + '/' + name for name in ('asset.json', 'design.md') for ident in ('soft-tick', 'settle-chime', 'air-pass', 'low-land', 'quiet-pulse-bed')]
    required += ['runtime/motion-render-core/scripts/render.mjs']
    required += ['scripts/video_knowledge.py', 'scripts/static_knowledge.py', 'scripts/test_video_knowledge.py', 'scripts/test_static_knowledge.py', 'research/video-knowledge/STATIC-SCHEMA.md']
    required += ['runtime/review-tools/' + name for name in ('audio_review.py', 'audiovisual_review.py', 'test_audio_review.py', 'test_audiovisual_review.py', 'AUDIO-REVIEW.md')]
    required += ['references/audiovisual-review-sop.md', '.env.example',
                 'references/audiovisual-report-standard.md', 'references/report-schema.json',
                 'references/review-calibration-lessons.md', 'scripts/validate_delivery_report.py',
                 'scripts/test_validate_delivery_report.py']
    required += ['scripts/migrate_video_knowledge.py', 'scripts/test_migrate_video_knowledge.py', 'research/video-knowledge/MIGRATION.md']
    required += ['references/delivery-workflow.md', 'scripts/check_delivery.py', 'scripts/test_check_delivery.py',
                 'references/final-delivery-evidence.md', 'scripts/check_final_delivery.py', 'scripts/test_check_final_delivery.py']
    required += ['runtime/motion-elements/lib/foundations/geometry/registered-polygon-morph/index.mjs', 'runtime/motion-elements/adapters/registered-polygon-morph.mjs', 'runtime/motion-elements/lib/foundations/geometry/registered-polygon-morph/examples/registered-polygon-morph-scene.mjs', 'runtime/motion-elements/lib/foundations/geometry/registered-polygon-morph/test/registered-polygon-morph.test.mjs']
    required += ['runtime/motion-elements/' + name for name in ('lib/foundations/field/attractor-orientation/index.mjs', 'lib/foundations/transition/masked-slice-displacement/index.mjs', 'lib/foundations/transition/masked-slice-displacement/canvas.mjs', 'examples/field-slices-scene.mjs', 'test/field-slices.test.mjs')]
    required += ['runtime/motion-elements/' + name for name in ('lib/foundations/transition/linear-mask/index.mjs', 'adapters/linear-mask.mjs', 'lib/foundations/transition/linear-mask/examples/linear-mask-study.mjs', 'lib/foundations/transition/linear-mask/test/linear-mask.test.mjs')]
    required += ['runtime/motion-elements/' + name for name in ('lib/foundations/geometry/sampled-band/index.mjs', 'adapters/sampled-band.mjs', 'lib/foundations/geometry/sampled-band/examples/sampled-band-study.mjs', 'lib/foundations/geometry/sampled-band/test/sampled-band.test.mjs')]
    required += ['runtime/design-elements/recipes/reviewed/b06/' + name for name in ['README.md', 'asset-lock.json', 'build-report.py', 'docs/B06-COVERAGE.md', 'docs/editorial-evidence.md', 'docs/ordered-focus.md', 'examples/briefs.mjs', 'font-lock.json', 'licenses/OFL.txt', 'prepare-font.py', 'recipe-manifest.json', 'recipes/common.mjs', 'recipes/editorial-evidence.mjs', 'recipes/ordered-focus.mjs', 'runtime.mjs', 'source-recipes/editorial-columns.mjs', 'source-recipes/provenance.json', 'source-recipes/seasonal-strip.mjs', 'source-recipes/shared.mjs', 'test-runtime.mjs', 'verify-font.py', 'verify.mjs']]
    required += ['runtime/design-elements/recipes/reviewed/b08/' + name for name in ['README.md', 'build-report.py', 'composition.mjs', 'docs/CASE-COVERAGE.md', 'docs/manifesto-stack.md', 'docs/partition-donut.md', 'examples/briefs.mjs', 'examples/manifesto-stack.json', 'examples/partition-donut-a.json', 'examples/partition-donut-b.json', 'font-lock.json', 'licenses/Anton-OFL.txt', 'licenses/DejaVu-copyright.txt', 'licenses/huashu-MIT-LICENSE.txt', 'recipe-manifest.json', 'recipes/manifesto-stack.mjs', 'recipes/partition-donut.mjs', 'runtime.mjs', 'source-provenance.json', 'test-manifesto.mjs', 'test-partition.mjs', 'test-runtime.mjs', 'verify.mjs']]
    required += ['runtime/design-elements/recipes/reviewed/b09/' + name for name in ['README.md', 'build-report.py', 'composition.mjs', 'docs/CASE-COVERAGE.md', 'docs/emphasis-tile.md', 'docs/unit-pictogram.md', 'examples/briefs.mjs', 'font-lock.json', 'licenses/Anton-OFL.txt', 'licenses/DejaVu-copyright.txt', 'licenses/huashu-MIT-LICENSE.txt', 'recipe-manifest.json', 'recipes/emphasis-tile.mjs', 'recipes/unit-pictogram.mjs', 'runtime.mjs', 'source-provenance.json', 'test-runtime.mjs', 'verify.mjs']]
    required += ['runtime/design-elements/recipes/reviewed/b10/' + name for name in ['README.md', 'build-report.py', 'composition.mjs', 'docs/CASE-COVERAGE.md', 'docs/code-spans.md', 'docs/value-grid.md', 'examples/briefs.mjs', 'font-lock.json', 'licenses/Anton-OFL.txt', 'licenses/DejaVu-copyright.txt', 'licenses/huashu-MIT-LICENSE.txt', 'recipe-manifest.json', 'recipes/code-spans.mjs', 'recipes/common.mjs', 'recipes/value-grid.mjs', 'runtime.mjs', 'source-provenance.json', 'test-runtime.mjs', 'verify.mjs']]
    required += ['runtime/design-elements/' + name for name in ('index.mjs', 'catalog.json', 'Index.md', 'README.md', 'CASE-COVERAGE.md', 'families/print-poster/README.md', 'families/print-poster/design.md', 'families/print-poster/index.mjs', 'families/print-poster/examples/render.mjs', 'families/print-poster/examples/runtime.mjs', 'families/print-poster/test/contract.mjs', 'shared.mjs', 'test/verify.mjs', 'examples/compositions.mjs', 'examples/specialist-compositions.mjs', 'examples/render.mjs', 'families/vertical-imprint/test/verify-font.py', 'examples/b05-compositions.mjs')]
    required += ['runtime/design-elements/families/parameter-controls/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/cases.mjs', 'examples/render.mjs', 'examples/runtime.mjs', 'test/contract.mjs')]
    for family in ('radial-scale', 'diagonal-field', 'authored-paths', 'typographic-focus', 'semantic-data', 'expressive-type', 'geometric-marks', 'proportional-partition', 'ratio-rings'):
        required += ['runtime/design-elements/families/' + family + '/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/cases.mjs', 'examples/render.mjs', 'examples/runtime.mjs', 'test/contract.mjs')]
    required += ['runtime/design-elements/families/vertical-imprint/' + name for name in ('README.md', 'design.md', 'index.mjs', 'examples/cases.mjs', 'examples/render.mjs', 'examples/runtime.mjs', 'test/contract.mjs', 'test/verify-font.py')]
    for family in ('color-sections', 'material-surfaces'):
        required += ['runtime/design-elements/' + family + '.mjs', 'runtime/design-elements/docs/' + family + '.md', 'runtime/design-elements/examples/' + family + '.mjs']
    required += ['runtime/design-elements/recipes/candidates/xhs08/' + name for name in ['CREDITS.md', 'DESIGN-RETENTION.md', 'LICENSE', 'README.md', 'design/area-plan.mjs', 'entry.json', 'font-lock.json', 'licenses/Figtree-OFL.txt', 'package-lock.json', 'package.json', 'prepare-fonts.py', 'recipe-manifest.json', 'render.mjs', 'retention.json', 'runtime.mjs', 'test-runtime.mjs', 'test.mjs']]
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
