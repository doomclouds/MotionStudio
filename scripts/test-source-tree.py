"""Run isolated temporary Git fixtures against the real source-only policy."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
GUARD = ROOT / 'scripts/check-source-tree.py'
PNG = b'\x89PNG\r\n\x1a\n' + b'fixture-only-not-a-valid-image'
MP4 = b'\x00\x00\x00\x18ftypisom' + b'\0' * 20
JPEG = 'projects/favorite52-engine-rebuild/assets/dario-techcrunch-2023.jpg'

class SourceTreeFixtures(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='motion-source-policy-')
        self.repo = Path(self.temp.name)
        self.guard = GUARD
        self.git('init', '-q')
        self.git('config', 'user.name', 'Source Policy Test')
        self.git('config', 'user.email', 'fixture@localhost')
    def tearDown(self): self.temp.cleanup()
    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.repo), *args], stderr=subprocess.STDOUT)
    def add(self, name, data):
        p = self.repo / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)
        self.git('add', '--', name)
    def audit(self, good, contains=None):
        result = subprocess.run([sys.executable, str(self.guard), '--repo', str(self.repo)], capture_output=True, text=True)
        self.assertEqual(result.returncode == 0, good, result.stdout + result.stderr)
        if contains: self.assertIn(contains, result.stdout)
    def test_env_file_forbidden(self):
        self.add('.env', b'DASHSCOPE_API_KEY=fixture-value')
        self.audit(False, 'forbidden-path')
    def test_env_example_placeholder_allowed(self):
        self.add('.env.example', b'DASHSCOPE_API_KEY=\n')
        self.audit(True)
    def test_env_example_value_rejected(self):
        self.add('.env.example', b'DASHSCOPE_API_KEY=fixture-value\n')
        self.audit(False, 'non-placeholder-env-template')
    def test_env_example_spaced_assignment_rejected(self):
        self.add('.env.example', b'DASHSCOPE_API_KEY = fixture-value\n')
        self.audit(False, 'non-placeholder-env-template')
    def test_env_example_unrecognized_variable_rejected(self):
        self.add('.env.example', b'OTHER_KEY=fixture-value\nDASHSCOPE_API_KEY=\n')
        self.audit(False, 'non-placeholder-env-template')
    def test_api_secret_in_arbitrary_file_rejected_without_echo(self):
        self.add('innocent.txt', b'sk-' + b'z'*32)
        self.audit(False, 'possible-api-secret')
    def test_external_large_font_is_forbidden(self):
        self.add('projects/favorite52-engine-rebuild/assets/fonts/Carousel-NotoSansCJKsc-Bold.otf', b'font fixture')
        self.audit(False, 'forbidden-path')
    def test_private_brand_svg_is_forbidden(self):
        self.add('projects/favorite52-engine-rebuild/assets/claude-duet-official.svg', b'<svg/>')
        self.audit(False, 'forbidden-path')
    def test_private_study_is_forbidden(self):
        self.add('projects/kinetic-type-recreation/scene.mjs', b'export {};')
        self.audit(False, 'forbidden-path')
    def test_private_production_source_and_receipt_are_forbidden(self):
        self.add('production/validation-example/scene.mjs', b'export {};')
        self.add('production/validation-example/manifest.json', b'{"status":"candidate"}')
        self.audit(False, 'forbidden-path')
    def test_normal_source_and_typescript(self):
        self.add('src/main.ts', b'export const answer = 42;\n')
        self.git('commit', '-qm', 'source')
        self.audit(True)
    def test_audio_timeline_source_only(self):
        self.add('engine/motion-timeline-core/lib/timeline.mjs', b'export const version = 1;\n')
        self.add('engine/motion-audio-core/lib/audio.mjs', b'export {};\n')
        self.audit(True)
    def test_motion_elements_synthetic_source_allowed(self):
        self.add('engine/motion-elements/lib/index.mjs', b'export {};\n')
        self.add('engine/motion-elements/catalog/elements.json', b'{"schemaVersion":1,"elements":[]}')
        self.add('engine/motion-elements/examples/gallery.html', b'<html><body>Synthetic gallery source</body></html>')
        self.audit(True)
    def test_motion_elements_generated_preview_rejected(self):
        self.add('engine/motion-elements/output/gallery.mp4', MP4)
        self.audit(False, 'forbidden-path')
    def test_motion_elements_media_outside_output_rejected(self):
        self.add('engine/motion-elements/examples/preview.png', PNG)
        self.audit(False, 'unapproved-media:PNG')
    def test_motion_elements_private_case_rejected(self):
        self.add('engine/motion-elements/catalog/case.json', b'{"path":"/workspace/private/example.mp4"}')
        self.audit(False, 'private-production-metadata')
    def test_audio_core_media_still_rejected(self):
        self.add('engine/motion-audio-core/test/sample.wav', b'RIFF' + b'\0' * 4 + b'WAVE')
        self.audit(False, 'unapproved-media')
    def test_audio_core_private_metadata_still_rejected(self):
        self.add('engine/motion-audio-core/private.json', b'{"path":"/workspace/private/project.wav"}')
        self.audit(False, 'private-production-metadata')
    def test_misnamed_video(self):
        self.add('foo.mp4.bin', MP4)
        self.audit(False, 'ISO/QuickTime-media')
    def test_extension_rejects_unrecognized_video(self):
        self.add('foo.MOV', b'no recognized header')
        self.audit(False, 'unapproved-media:extension')
    def test_arbitrary_png_location(self):
        self.add('innocent/nested/value.bin', PNG)
        self.audit(False, 'unapproved-media:PNG')
    def test_old_bad_blob_removed_from_head(self):
        self.add('root.bin', PNG)
        self.git('commit', '-qm', 'bad historical blob')
        self.git('rm', '-q', 'root.bin')
        self.add('source.py', b'print(42)\n')
        self.git('commit', '-qm', 'remove bad current file')
        self.audit(False, 'unapproved-media:PNG')
    def test_other_reachable_branch(self):
        self.add('source.py', b'print(42)\n')
        self.git('commit', '-qm', 'base')
        self.git('checkout', '-qb', 'bad-history')
        self.add('hidden.bin', MP4)
        self.git('commit', '-qm', 'bad branch')
        self.git('checkout', '-q', '-')
        self.audit(False, 'ISO/QuickTime-media')
    def test_index_bytes_not_worktree(self):
        self.add('apparently-safe.txt', PNG)
        (self.repo / 'apparently-safe.txt').write_text('safe worktree replacement')
        self.audit(False, 'unapproved-media:PNG')
    def test_public_policy_only_allows_twentynine_exact_reviewed_images(self):
        allow = json.loads((ROOT / 'scripts/source-assets-allowlist.json').read_text())['assets']
        self.assertEqual(allow, {
            'portfolio/works/song-block-print-study/cover.jpg': '6223f4018b87f59c3cd4613450e216250a5687f96973640d01302d59da5151a3',
            'portfolio/works/bauhaus-theatre-study/cover.jpg': '131a46b5fb87e7012c7c66343812a1715cc39ecb43b943c03d433a145539a28a',
            'portfolio/works/ocean-plastic-treemap-study/cover.jpg': 'a29e8e88bbf480f08814ca2a6359ced3eb03244afdcc287b6208887b0b575488',
            'portfolio/works/health-color-code-study/cover.jpg': '224b2740ccb52dab46f5ef7fd8c67fd7c6d650f4d03a927d4c7057c2c557d982',
            'portfolio/works/film-festival-study/cover.jpg': 'f97635fde456907014bd3711307301381b0070f27960cca46437658a4d1aa0fb',
            'portfolio/works/nanyuan-cartographic-study/cover.jpg': 'cf130c02fa97f29e200df7f092dbd99dd6921c35c754548e935973bafb29dff9',
            'portfolio/works/ocean-letter-study/cover.jpg': '7cfa0901c6fed9bef76975cd73817dfd9ac9d3292e58d4024d168af4d7bf8d20',
            'portfolio/works/solar-terms-study/cover.jpg': '42b5e88e2e60a87c2406b01a2d5323e4578421155cf2efbd094a479f132cd81d',
            'portfolio/works/trail-pictogram-study/cover.jpg': '9d536ff3f96812e4dcb473883be09cbeaf9f159c24f4f912de5d3e43265d8461',
            'portfolio/works/mandala-observatory-study/cover.jpg': '940e922906ba722bdba20e62062e0b634cb05326a7842cd7d28dfa55f34c2e1f',
            'portfolio/works/recursion-lecture-study/cover.jpg': 'abae41e0704b87e56c88bf9e5da552ec149ef13a1805fd128c5a0e9af751bf4c',
            'portfolio/works/salary-unit-stack-study/cover.jpg': '348c4bcc4ad087a3d568e8fb5d4d5cf665aa6acf8a26aa95f1e59e38c181ecb0',
            'portfolio/works/topo-outdoor-study/cover.jpg': '829b73f016c879ca4f5735f73a2a7fff07fb66abe695f583642431548aa9bec9',
            'portfolio/works/weather-art-study/cover.jpg': '6d9f45c310d3bbbb37a819afebc983ac52a4e2177f0badedddac760eea5a1099',
            'portfolio/works/editorial-weekly-study/cover.jpg': '011a4aae22f89e50b227c4d4e66b26154655b5e56b15cccc9dde366675b5e39c',
            'portfolio/works/friendly-fintech-study/cover.jpg': 'd19435c87f4c6d25a19265cc830c6b44a70ef9111217febc7e5e03bf3fbbef1d',
            'portfolio/works/mountain-book-jacket-study/cover.jpg': 'f90472b7510634a7a855e3bfab20c0e4f91c16bf6a0b49b1377ee4c780bd2144',
            'portfolio/works/scientific-figure-study/cover.jpg': 'cf0f57eef7b5a588912f92b7b9a5fa1f7d46d4aec494c9ce42414842c14b07ca',
            'portfolio/works/theatre-manifesto-study/cover.jpg': '186ebadd944bbdbef3eb1dfc86034029d11c7b6652ab363cc13a4102a7a0ddd0',
            'portfolio/works/bookcraft-vinyl-annual-study/cover.jpg': 'e75311525d8cf18afce8c89872dd8677e72ca198e0bbfc90d0894cb9921e3dac',
            'portfolio/works/command-palette-study/cover.jpg': '2a4b676ad49db5bdd097e10ab7ae35c2f4f5a1d0962989c76f5341b169bdb3d8',
            'portfolio/works/market-livingroom-study/cover.jpg': '38c4cdf514c1150df39da015cae5d135290e918dc40cb3c75f39a286e170726a',
            'portfolio/works/vinyl-isotype-study/cover.jpg': '17b9b7282aafd6d089050b8dd1c303968579b28075bcb34aa11af65a18e40412',
            'portfolio/works/xie-symbol-study/cover.jpg': '3857723b400db96dadb7fec8e274751eaa671364cfd8fce9d990e476ae094834',
            'portfolio/works/irreverent-pop-study/cover.jpg': 'df8f621e07865727a8d2a99fe66d9ce23e7b5747861732a14a503152dff72f35',
            'portfolio/works/hk-street-signs-study/cover.jpg': '6d83409c6444e4ea6bd903075b7652300f6be7a066c15aa4bb0f06131aae4223',
            'portfolio/works/pixel-hiking-study/cover.jpg': '3e520725c9ca504d5b1e6cf45880f29bec31ce8bd3f1b03ffbd77af4d79eb82b',
            'portfolio/works/market-section-study/cover.jpg': '8c2aee6ce836fac4610270451202731430a2fd897b035366b4e73c0018c21a5b',
            'portfolio/works/playful-roast-timer-study/cover.jpg': '9eacecbbdad38c57c037c3b2bbd2ace1d1f24566218598e4a04cfd4ec59379c4',
            'portfolio/works/market-method-study/cover.jpg': 'cba9bdf156b79022d86c51dcc6371b537ca2de95bb29e86c61724f24d63255b9',
            'portfolio/works/cosmic-observatory-study/cover.jpg': 'e4ff31cfb20c7fe3c815ce867e91ab3c556152a09816265613135faeddd3e03b',
            'portfolio/works/pro-camera-study/cover.jpg': '486a229cd763d088a6724a3d047c0f5dba0a37f8aa5fa6b77848daea23f86433',
            'portfolio/works/bus-morning-study/cover.jpg': '568e310c946778081e8e402f3f1dc57899a9570829acdd082737d79c8665436c',
            'portfolio/works/wave-weather-study/cover.jpg': '40be54ada883fd596aaabf9072ef5489fcc13375323fbe51b320296000b60c48',
            'portfolio/works/meridian-study/cover.jpg': '4ba747751f084e0f9420bc09435b4b218b4aded8f3844c8a455460a350b422ce',
            'docs/assets/report-overview.png': 'bbf9e87737e3f84dfb9a998ee0c973081418631b76a745b017b012d76b95e7c1',
            'portfolio/works/tessel/cover.jpg': 'ebfaf532643c1ac096ac44a05da0c81dede735e1703e2c3230ab3073857133f8',
            'portfolio/works/favorite52/cover.jpg': '86a8a0c0a08c06ddab3dac47da45078dce055746c5dfd0c15ddb99079f6cab5d',
            'portfolio/works/vinyl-study/cover.jpg': 'e18140fe112408b2b8bc254f1a76e007989eefd31617b7935fd11d476cb178b0',
            'portfolio/works/tea-voice-study/cover.jpg': '73c6d71dd8f6463641672cefae8077f26ac769892dda22027fd59648723aa343',
            'portfolio/works/hanzi-poster-study/cover.jpg': 'cfdea6b1874b3b88bb363044cf556ca06f4ce665aa7e07e47adb2da669441ee4',
            'portfolio/works/slow-roast-study/cover.jpg': '35f604bb0dd4e83bfeae7c4e8c72a539d0d6ca35c8acd5d68b6e837ab01c2707',
            'portfolio/works/tea-conversation-map/cover.jpg': '25836584db11ca8ec85dd0266fb5a9eec7afb050da6809d1950c5596b14dff2b',
            'portfolio/works/theatre-narrative-wave/cover.jpg': '8c5e96fba95b2e572387ebcc5ff7c7a8131f1df85a4b307af87fb4d9ee63e5b1',
            'portfolio/works/liquid-glass-study/cover.jpg': 'dafc85a12ef859aadc0de540cba83c7fd2b8bdcf68e64a6211bd15f346ec7026',
            'portfolio/works/muqi-study/cover.jpg': '59b793b814eb157d24e16dc585500f47c1d3175c77a31470fda5c2b7853d0d3a',
            'portfolio/works/cycling-year-report/cover.jpg': 'cfe7778644708495e5937cd1bec1323fd80c3072ac82d56a6ead396976c88044',
            'portfolio/works/hardware-sampler-study/cover.jpg': '98f00db4ebf08339a2e55975ce0133cf65ce5a029460db108deaef557852b766',
            'portfolio/works/shanghai-deco-study/cover.jpg': 'ec6f76cea9a55360a5c7cc0c82543735335e5dc194fbc8b23d9ed5561431d251',
        })
    def test_exact_muqi_study_cover_allowed(self):
        name='portfolio/works/muqi-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_muqi_study_cover_tamper_rejected(self):
        name='portfolio/works/muqi-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_muqi_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/muqi-study/other.jpg',(ROOT/'portfolio/works/muqi-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_cycling_year_report_cover_allowed(self):
        name='portfolio/works/cycling-year-report/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_cycling_year_report_cover_tamper_rejected(self):
        name='portfolio/works/cycling-year-report/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_cycling_year_report_cover_wrong_path_rejected(self):
        self.add('portfolio/works/cycling-year-report/other.jpg',(ROOT/'portfolio/works/cycling-year-report/cover.jpg').read_bytes());self.audit(False)
    def test_exact_hardware_sampler_study_cover_allowed(self):
        name='portfolio/works/hardware-sampler-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_hardware_sampler_study_cover_tamper_rejected(self):
        name='portfolio/works/hardware-sampler-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_hardware_sampler_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/hardware-sampler-study/other.jpg',(ROOT/'portfolio/works/hardware-sampler-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_shanghai_deco_study_cover_allowed(self):
        name='portfolio/works/shanghai-deco-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_shanghai_deco_study_cover_tamper_rejected(self):
        name='portfolio/works/shanghai-deco-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_shanghai_deco_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/shanghai-deco-study/other.jpg',(ROOT/'portfolio/works/shanghai-deco-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_hanzi_poster_study_cover_allowed(self):
        name='portfolio/works/hanzi-poster-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_hanzi_poster_study_cover_tamper_rejected(self):
        name='portfolio/works/hanzi-poster-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_hanzi_poster_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/hanzi-poster-study/other.jpg',(ROOT/'portfolio/works/hanzi-poster-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_slow_roast_study_cover_allowed(self):
        name='portfolio/works/slow-roast-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_slow_roast_study_cover_tamper_rejected(self):
        name='portfolio/works/slow-roast-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_slow_roast_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/slow-roast-study/other.jpg',(ROOT/'portfolio/works/slow-roast-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_tea_conversation_map_cover_allowed(self):
        name='portfolio/works/tea-conversation-map/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_tea_conversation_map_cover_tamper_rejected(self):
        name='portfolio/works/tea-conversation-map/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_tea_conversation_map_cover_wrong_path_rejected(self):
        self.add('portfolio/works/tea-conversation-map/other.jpg',(ROOT/'portfolio/works/tea-conversation-map/cover.jpg').read_bytes());self.audit(False)
    def test_exact_theatre_narrative_wave_cover_allowed(self):
        name='portfolio/works/theatre-narrative-wave/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_theatre_narrative_wave_cover_tamper_rejected(self):
        name='portfolio/works/theatre-narrative-wave/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_theatre_narrative_wave_cover_wrong_path_rejected(self):
        self.add('portfolio/works/theatre-narrative-wave/other.jpg',(ROOT/'portfolio/works/theatre-narrative-wave/cover.jpg').read_bytes());self.audit(False)
    def test_exact_cosmic_observatory_study_cover_allowed(self):
        name='portfolio/works/cosmic-observatory-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_cosmic_observatory_study_cover_tamper_rejected(self):
        name='portfolio/works/cosmic-observatory-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_cosmic_observatory_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/cosmic-observatory-study/other.jpg',(ROOT/'portfolio/works/cosmic-observatory-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_pro_camera_study_cover_allowed(self):
        name='portfolio/works/pro-camera-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_pro_camera_study_cover_tamper_rejected(self):
        name='portfolio/works/pro-camera-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_pro_camera_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/pro-camera-study/other.jpg',(ROOT/'portfolio/works/pro-camera-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_bus_morning_study_cover_allowed(self):
        name='portfolio/works/bus-morning-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_bus_morning_study_cover_tamper_rejected(self):
        name='portfolio/works/bus-morning-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_bus_morning_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/bus-morning-study/other.jpg',(ROOT/'portfolio/works/bus-morning-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_wave_weather_study_cover_allowed(self):
        name='portfolio/works/wave-weather-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_wave_weather_study_cover_tamper_rejected(self):
        name='portfolio/works/wave-weather-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_wave_weather_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/wave-weather-study/other.jpg',(ROOT/'portfolio/works/wave-weather-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_meridian_study_cover_allowed(self):
        name='portfolio/works/meridian-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_meridian_study_cover_tamper_rejected(self):
        name='portfolio/works/meridian-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_meridian_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/meridian-study/other.jpg',(ROOT/'portfolio/works/meridian-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_hk_street_signs_study_cover_allowed(self):
        name='portfolio/works/hk-street-signs-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_hk_street_signs_study_cover_tamper_rejected(self):
        name='portfolio/works/hk-street-signs-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_hk_street_signs_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/hk-street-signs-study/other.jpg',(ROOT/'portfolio/works/hk-street-signs-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_pixel_hiking_study_cover_allowed(self):
        name='portfolio/works/pixel-hiking-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_pixel_hiking_study_cover_tamper_rejected(self):
        name='portfolio/works/pixel-hiking-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_pixel_hiking_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/pixel-hiking-study/other.jpg',(ROOT/'portfolio/works/pixel-hiking-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_market_section_study_cover_allowed(self):
        name='portfolio/works/market-section-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_market_section_study_cover_tamper_rejected(self):
        name='portfolio/works/market-section-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_market_section_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/market-section-study/other.jpg',(ROOT/'portfolio/works/market-section-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_playful_roast_timer_study_cover_allowed(self):
        name='portfolio/works/playful-roast-timer-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_playful_roast_timer_study_cover_tamper_rejected(self):
        name='portfolio/works/playful-roast-timer-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_playful_roast_timer_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/playful-roast-timer-study/other.jpg',(ROOT/'portfolio/works/playful-roast-timer-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_market_method_study_cover_allowed(self):
        name='portfolio/works/market-method-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_market_method_study_cover_tamper_rejected(self):
        name='portfolio/works/market-method-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_market_method_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/market-method-study/other.jpg',(ROOT/'portfolio/works/market-method-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_song_block_print_study_cover_allowed(self):
        name='portfolio/works/song-block-print-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_song_block_print_study_cover_tamper_rejected(self):
        name='portfolio/works/song-block-print-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_song_block_print_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/song-block-print-study/other.jpg',(ROOT/'portfolio/works/song-block-print-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_bauhaus_theatre_study_cover_allowed(self):
        name='portfolio/works/bauhaus-theatre-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_bauhaus_theatre_study_cover_tamper_rejected(self):
        name='portfolio/works/bauhaus-theatre-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_bauhaus_theatre_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/bauhaus-theatre-study/other.jpg',(ROOT/'portfolio/works/bauhaus-theatre-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_ocean_plastic_treemap_study_cover_allowed(self):
        name='portfolio/works/ocean-plastic-treemap-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_ocean_plastic_treemap_study_cover_tamper_rejected(self):
        name='portfolio/works/ocean-plastic-treemap-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_ocean_plastic_treemap_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/ocean-plastic-treemap-study/other.jpg',(ROOT/'portfolio/works/ocean-plastic-treemap-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_health_color_code_study_cover_allowed(self):
        name='portfolio/works/health-color-code-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_health_color_code_study_cover_tamper_rejected(self):
        name='portfolio/works/health-color-code-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_health_color_code_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/health-color-code-study/other.jpg',(ROOT/'portfolio/works/health-color-code-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_film_festival_study_cover_allowed(self):
        name='portfolio/works/film-festival-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_film_festival_study_cover_tamper_rejected(self):
        name='portfolio/works/film-festival-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_film_festival_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/film-festival-study/other.jpg',(ROOT/'portfolio/works/film-festival-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_nanyuan_cartographic_study_cover_allowed(self):
        name='portfolio/works/nanyuan-cartographic-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_nanyuan_cartographic_study_cover_tamper_rejected(self):
        name='portfolio/works/nanyuan-cartographic-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_nanyuan_cartographic_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/nanyuan-cartographic-study/other.jpg',(ROOT/'portfolio/works/nanyuan-cartographic-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_ocean_letter_study_cover_allowed(self):
        name='portfolio/works/ocean-letter-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_ocean_letter_study_cover_tamper_rejected(self):
        name='portfolio/works/ocean-letter-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_ocean_letter_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/ocean-letter-study/other.jpg',(ROOT/'portfolio/works/ocean-letter-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_solar_terms_study_cover_allowed(self):
        name='portfolio/works/solar-terms-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_solar_terms_study_cover_tamper_rejected(self):
        name='portfolio/works/solar-terms-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_solar_terms_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/solar-terms-study/other.jpg',(ROOT/'portfolio/works/solar-terms-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_trail_pictogram_study_cover_allowed(self):
        name='portfolio/works/trail-pictogram-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_trail_pictogram_study_cover_tamper_rejected(self):
        name='portfolio/works/trail-pictogram-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_trail_pictogram_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/trail-pictogram-study/other.jpg',(ROOT/'portfolio/works/trail-pictogram-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_mandala_observatory_study_cover_allowed(self):
        name='portfolio/works/mandala-observatory-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_mandala_observatory_study_cover_tamper_rejected(self):
        name='portfolio/works/mandala-observatory-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_mandala_observatory_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/mandala-observatory-study/other.jpg',(ROOT/'portfolio/works/mandala-observatory-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_recursion_lecture_study_cover_allowed(self):
        name='portfolio/works/recursion-lecture-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_recursion_lecture_study_cover_tamper_rejected(self):
        name='portfolio/works/recursion-lecture-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_recursion_lecture_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/recursion-lecture-study/other.jpg',(ROOT/'portfolio/works/recursion-lecture-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_salary_unit_stack_study_cover_allowed(self):
        name='portfolio/works/salary-unit-stack-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_salary_unit_stack_study_cover_tamper_rejected(self):
        name='portfolio/works/salary-unit-stack-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_salary_unit_stack_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/salary-unit-stack-study/other.jpg',(ROOT/'portfolio/works/salary-unit-stack-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_topo_outdoor_study_cover_allowed(self):
        name='portfolio/works/topo-outdoor-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_topo_outdoor_study_cover_tamper_rejected(self):
        name='portfolio/works/topo-outdoor-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_topo_outdoor_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/topo-outdoor-study/other.jpg',(ROOT/'portfolio/works/topo-outdoor-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_weather_art_study_cover_allowed(self):
        name='portfolio/works/weather-art-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_weather_art_study_cover_tamper_rejected(self):
        name='portfolio/works/weather-art-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_weather_art_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/weather-art-study/other.jpg',(ROOT/'portfolio/works/weather-art-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_editorial_weekly_study_cover_allowed(self):
        name='portfolio/works/editorial-weekly-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_editorial_weekly_study_cover_tamper_rejected(self):
        name='portfolio/works/editorial-weekly-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_editorial_weekly_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/editorial-weekly-study/other.jpg',(ROOT/'portfolio/works/editorial-weekly-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_friendly_fintech_study_cover_allowed(self):
        name='portfolio/works/friendly-fintech-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_friendly_fintech_study_cover_tamper_rejected(self):
        name='portfolio/works/friendly-fintech-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_friendly_fintech_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/friendly-fintech-study/other.jpg',(ROOT/'portfolio/works/friendly-fintech-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_mountain_book_jacket_study_cover_allowed(self):
        name='portfolio/works/mountain-book-jacket-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_mountain_book_jacket_study_cover_tamper_rejected(self):
        name='portfolio/works/mountain-book-jacket-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_mountain_book_jacket_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/mountain-book-jacket-study/other.jpg',(ROOT/'portfolio/works/mountain-book-jacket-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_scientific_figure_study_cover_allowed(self):
        name='portfolio/works/scientific-figure-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_scientific_figure_study_cover_tamper_rejected(self):
        name='portfolio/works/scientific-figure-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_scientific_figure_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/scientific-figure-study/other.jpg',(ROOT/'portfolio/works/scientific-figure-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_theatre_manifesto_study_cover_allowed(self):
        name='portfolio/works/theatre-manifesto-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_theatre_manifesto_study_cover_tamper_rejected(self):
        name='portfolio/works/theatre-manifesto-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_theatre_manifesto_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/theatre-manifesto-study/other.jpg',(ROOT/'portfolio/works/theatre-manifesto-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_bookcraft_vinyl_annual_study_cover_allowed(self):
        name='portfolio/works/bookcraft-vinyl-annual-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_bookcraft_vinyl_annual_study_cover_tamper_rejected(self):
        name='portfolio/works/bookcraft-vinyl-annual-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_bookcraft_vinyl_annual_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/bookcraft-vinyl-annual-study/other.jpg',(ROOT/'portfolio/works/bookcraft-vinyl-annual-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_command_palette_study_cover_allowed(self):
        name='portfolio/works/command-palette-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_command_palette_study_cover_tamper_rejected(self):
        name='portfolio/works/command-palette-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_command_palette_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/command-palette-study/other.jpg',(ROOT/'portfolio/works/command-palette-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_market_livingroom_study_cover_allowed(self):
        name='portfolio/works/market-livingroom-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_market_livingroom_study_cover_tamper_rejected(self):
        name='portfolio/works/market-livingroom-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_market_livingroom_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/market-livingroom-study/other.jpg',(ROOT/'portfolio/works/market-livingroom-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_vinyl_isotype_study_cover_allowed(self):
        name='portfolio/works/vinyl-isotype-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_vinyl_isotype_study_cover_tamper_rejected(self):
        name='portfolio/works/vinyl-isotype-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_vinyl_isotype_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/vinyl-isotype-study/other.jpg',(ROOT/'portfolio/works/vinyl-isotype-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_xie_symbol_study_cover_allowed(self):
        name='portfolio/works/xie-symbol-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_xie_symbol_study_cover_tamper_rejected(self):
        name='portfolio/works/xie-symbol-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_xie_symbol_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/xie-symbol-study/other.jpg',(ROOT/'portfolio/works/xie-symbol-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_irreverent_pop_study_cover_allowed(self):
        name='portfolio/works/irreverent-pop-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_irreverent_pop_study_cover_tamper_rejected(self):
        name='portfolio/works/irreverent-pop-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_irreverent_pop_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/irreverent-pop-study/other.jpg',(ROOT/'portfolio/works/irreverent-pop-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_liquid_glass_study_cover_allowed(self):
        name='portfolio/works/liquid-glass-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_liquid_glass_study_cover_tamper_rejected(self):
        name='portfolio/works/liquid-glass-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_liquid_glass_study_cover_wrong_path_rejected(self):
        self.add('portfolio/works/liquid-glass-study/other.jpg',(ROOT/'portfolio/works/liquid-glass-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_tea_voice_cover_allowed(self):
        name='portfolio/works/tea-voice-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_tea_voice_cover_tamper_rejected(self):
        name='portfolio/works/tea-voice-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_tea_voice_cover_wrong_path_rejected(self):
        self.add('portfolio/works/tea-voice-study/other.jpg',(ROOT/'portfolio/works/tea-voice-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_vinyl_cover_allowed(self):
        name='portfolio/works/vinyl-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes());self.audit(True)
    def test_vinyl_cover_tamper_rejected(self):
        name='portfolio/works/vinyl-study/cover.jpg'
        self.add(name,(ROOT/name).read_bytes()+b'tamper');self.audit(False)
    def test_vinyl_cover_wrong_path_rejected(self):
        self.add('portfolio/works/vinyl-study/other.jpg',(ROOT/'portfolio/works/vinyl-study/cover.jpg').read_bytes());self.audit(False)
    def test_exact_tessel_cover_allowed(self):
        name = 'portfolio/works/tessel/cover.jpg'
        self.add(name, (ROOT / name).read_bytes())
        self.audit(True)
    def test_tessel_cover_modified_rejected(self):
        name = 'portfolio/works/tessel/cover.jpg'
        self.add(name, (ROOT / name).read_bytes() + b'changed')
        self.audit(False, 'approved-source-asset-hash-mismatch')
    def test_cover_copied_to_another_work_rejected(self):
        self.add('portfolio/works/another/cover.jpg', (ROOT / 'portfolio/works/tessel/cover.jpg').read_bytes())
        self.audit(False, 'unapproved-media:JPEG')
    def test_extra_tessel_image_rejected(self):
        self.add('portfolio/works/tessel/another.jpg', (ROOT / 'portfolio/works/tessel/cover.jpg').read_bytes())
        self.audit(False, 'unapproved-media:JPEG')
    def test_tessel_cover_size_cap(self):
        name = 'portfolio/works/tessel/cover.jpg'; data = b'\xff\xd8\xff' + b'x' * (1024 * 1024)
        self.reviewed_policy({name: hashlib.sha256(data).hexdigest()})
        self.add(name, data)
        self.audit(False, 'invalid-portfolio-cover-format-or-size')
    def test_tessel_cover_must_be_jpeg(self):
        name = 'portfolio/works/tessel/cover.jpg'
        self.reviewed_policy({name: hashlib.sha256(PNG).hexdigest()})
        self.add(name, PNG)
        self.audit(False, 'invalid-portfolio-cover-format-or-size')
    def test_exact_favorite52_cover_allowed(self):
        name = 'portfolio/works/favorite52/cover.jpg'
        self.add(name, (ROOT / name).read_bytes())
        self.audit(True)
    def test_favorite52_cover_modified_rejected(self):
        name = 'portfolio/works/favorite52/cover.jpg'
        self.add(name, (ROOT / name).read_bytes() + b'changed')
        self.audit(False, 'approved-source-asset-hash-mismatch')
    def test_favorite52_cover_copied_to_another_work_rejected(self):
        self.add('portfolio/works/another/cover.jpg', (ROOT / 'portfolio/works/favorite52/cover.jpg').read_bytes())
        self.audit(False, 'unapproved-media:JPEG')
    def test_extra_favorite52_image_rejected(self):
        self.add('portfolio/works/favorite52/another.jpg', (ROOT / 'portfolio/works/favorite52/cover.jpg').read_bytes())
        self.audit(False, 'unapproved-media:JPEG')
    def test_favorite52_cover_size_cap(self):
        name = 'portfolio/works/favorite52/cover.jpg'; data = b'\xff\xd8\xff' + b'x' * (1024 * 1024)
        self.reviewed_policy({name: hashlib.sha256(data).hexdigest()})
        self.add(name, data)
        self.audit(False, 'invalid-portfolio-cover-format-or-size')
    def test_favorite52_cover_must_be_jpeg(self):
        name = 'portfolio/works/favorite52/cover.jpg'
        self.reviewed_policy({name: hashlib.sha256(PNG).hexdigest()})
        self.add(name, PNG)
        self.audit(False, 'invalid-portfolio-cover-format-or-size')
    def test_favorite52_external_icon_not_bundled(self):
        self.add('portfolio/works/favorite52/claude-duet-official.svg', b'<svg/>')
        self.audit(False, 'forbidden-path')
    def test_favorite52_mixed_audio_not_bundled(self):
        self.add('portfolio/works/favorite52/original-v4-audio.m4a', MP4)
        self.audit(False, 'unapproved-media')
    def test_portfolio_movie_still_rejected(self):
        self.add('portfolio/works/tessel/film.mp4', MP4)
        self.audit(False, 'unapproved-media')
    def test_portfolio_font_still_rejected(self):
        self.add('portfolio/works/tessel/font.woff2', b'wOF2synthetic-font')
        self.audit(False, 'unapproved-media:font')
    def test_exact_readme_preview_allowed(self):
        self.add('docs/assets/report-overview.png', (ROOT / 'docs/assets/report-overview.png').read_bytes())
        self.audit(True)
    def test_readme_preview_modified_rejected(self):
        self.add('docs/assets/report-overview.png', (ROOT / 'docs/assets/report-overview.png').read_bytes() + b'changed')
        self.audit(False, 'approved-source-asset-hash-mismatch')
    def test_readme_preview_renamed_rejected(self):
        self.add('docs/assets/another-preview.png', (ROOT / 'docs/assets/report-overview.png').read_bytes())
        self.audit(False, 'unapproved-media:PNG')
    def test_readme_preview_size_cap(self):
        name = 'docs/assets/report-overview.png'
        data = PNG + b'x' * (2 * 1024 * 1024)
        self.reviewed_policy({name: hashlib.sha256(data).hexdigest()})
        self.add(name, data)
        self.audit(False, 'invalid-readme-preview-format-or-size')
    def test_readme_preview_must_be_png(self):
        name = 'docs/assets/report-overview.png'
        self.reviewed_policy({name: hashlib.sha256(MP4).hexdigest()})
        self.add(name, MP4)
        self.audit(False, 'invalid-readme-preview-format-or-size')
    def test_approved_asset_tampered(self):
        name='assets/fixture.jpg'; data=b'\xff\xd8\xffsynthetic fixture'
        self.reviewed_policy({name: hashlib.sha256(data).hexdigest()})
        self.add(name, data+b'changed')
        self.audit(False, 'approved-source-asset-hash-mismatch')
    def test_approved_asset_wrong_path(self):
        self.add('assets/renamed.jpg', b'\xff\xd8\xffsynthetic fixture')
        self.audit(False, 'unapproved-media:JPEG')
    def test_private_project_metadata_is_forbidden(self):
        self.add('projects/private-study/assets/source-index.json', b'{}')
        self.audit(False, 'forbidden-path')
    def test_private_research_is_forbidden(self):
        self.add('skills/motion-film-director/research/records/private.json', b'{}')
        self.audit(False, 'forbidden-path')
    def test_private_index_outside_project_is_forbidden(self):
        self.add('elsewhere/source-index.json', b'{}')
        self.audit(False, 'forbidden-path')
    def test_renamed_private_metadata_is_rejected(self):
        self.add('innocent/data.json', json.dumps({'rights': 'private-review-only', 'local': '/workspace/'+'shared/private/movie.mp4'}).encode())
        self.audit(False, 'private-production-metadata')
    def test_acquisition_record_is_rejected(self):
        self.add('innocent/data.json', json.dumps({'download_url': 'https://example.invalid/private/movie.mp4'}).encode())
        self.audit(False, 'private-production-metadata')
    def test_general_rights_warning_is_preserved(self):
        self.add('RIGHTS.md', b'Media rights and publication permissions must be checked independently. Private reviews are not publication permission.')
        self.audit(True)
    def reviewed_policy(self, assets):
        # Isolated policy beside a copied guard, never change the production allowlist.
        policy = self.repo / 'fixture-policy/scripts'
        policy.mkdir(parents=True, exist_ok=True)
        self.guard = policy / 'check-source-tree.py'
        self.guard.write_bytes(GUARD.read_bytes())
        (policy / 'source-assets-allowlist.json').write_text(json.dumps({'assets': assets}))
    def test_two_reviewed_versions_in_history(self):
        name = 'assets/reviewed-font.otf'
        first, second = b'OTTOreviewed version one', b'OTTOreviewed version two'
        self.reviewed_policy({name: [hashlib.sha256(first).hexdigest(), hashlib.sha256(second).hexdigest()]})
        self.add(name, first); self.git('commit', '-qm', 'first approved version')
        self.add(name, second); self.git('commit', '-qm', 'second approved version')
        self.audit(True)
    def test_third_unreviewed_version_rejected(self):
        name = 'assets/reviewed-font.otf'
        first, second = b'OTTOreviewed version one', b'OTTOreviewed version two'
        self.reviewed_policy({name: [hashlib.sha256(first).hexdigest(), hashlib.sha256(second).hexdigest()]})
        self.add(name, first); self.git('commit', '-qm', 'approved')
        self.add(name, b'OTTOunknown third version')
        self.audit(False, 'approved-source-asset-hash-mismatch')
    def test_empty_or_malformed_reviewed_digests_rejected(self):
        for value in [[], '', 'a'*63, 'g'*64, ['a'*64, 'bad'], [None], 42]:
            with self.subTest(value=value):
                self.reviewed_policy({'assets/reviewed-font.otf': value})
                result = subprocess.run([sys.executable, str(self.guard), '--repo', str(self.repo)], capture_output=True, text=True)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('Invalid source asset allowlist SHA256', result.stderr)

    def test_all_index_merge_stages(self):
        self.add('merge.txt', b'safe\n')
        bad = subprocess.check_output(['git', '-C', str(self.repo), 'hash-object', '-w', '--stdin'], input=PNG).strip().decode()
        normal = subprocess.check_output(['git', '-C', str(self.repo), 'hash-object', '-w', '--stdin'], input=b'safe\n').strip().decode()
        self.git('update-index', '--force-remove', 'merge.txt')
        entries = f'100644 {bad} 2\tmerge.txt\n100644 {normal} 3\tmerge.txt\n'
        subprocess.run(['git', '-C', str(self.repo), 'update-index', '--index-info'], input=entries.encode(), check=True)
        self.audit(False, 'index-stage-2')

if __name__ == '__main__': unittest.main(verbosity=2)
