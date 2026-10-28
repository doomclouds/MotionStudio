"""Synthetic presentation contract tests: no private media, services or approvals."""
import json
from pathlib import Path
import tempfile
import subprocess
import sys
import unittest
from unittest.mock import patch
from PIL import Image
import report


class PresentationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.out = self.root/'benchmark'; self.out.mkdir()
        self.dest = self.root/'review'
        for name in ['reference', 'candidate']:
            p = {'timeline': {'duration_s': 8}, 'input': {'sha256': 'a'*64},
                 'visual': {}, 'audio': {'samples': [{'t_s': 0, 'peak_min_l': -.1,
                   'peak_max_l': .2, 'peak_min_r': -.2, 'peak_max_r': .1}]}}
            (self.out/(name+'.profile.json')).write_text(json.dumps(p))
    def tearDown(self):
        self.temp.cleanup()
    def baseline(self, out, render_target=None):
        out = render_target or out
        Image.new('RGB', (1800, 2530), report.COLORS['bg']).save(out/'overview.png')
        (out/'benchmark.html').write_text('<html><body><header></header><section><span>AUDIO PROFILE</span></section><footer></footer></body></html>')
    def test_frozen_pair_empty_states_status_order_and_size(self):
        with patch.object(report, 'render_report', side_effect=self.baseline):
            result = report.render_delivery_report(self.out, self.dest)
        self.assertEqual(result['version'], 'motionstudio-review-v1')
        self.assertEqual({p.name for p in self.dest.iterdir()}, {'overview.png','report.html'})
        with Image.open(self.dest/'overview.png') as im:
            self.assertEqual(im.size, (1800, 5400))
            self.assertEqual(im.getpixel((0,0)), (11,17,25))
        page = (self.dest/'report.html').read_text()
        self.assertIn('data-presentation-version="motionstudio-review-v1"', page)
        self.assertIn('listening: UNVERIFIED', page)
        self.assertIn('NOT_RUN', page)
        self.assertIn('download="overview.png"', page)
        self.assertNotIn('alt="统一报告总览"', page)
        self.assertNotIn('<img', page)
        self.assertIn('<a href="data:image/png;base64,', page)
        self.assertLess(page.index('motion_heatmaps'), page.index('spatial_maps'))
        self.assertLess(page.index('spatial_maps'), page.index('AUDIO PROFILE'))
    def test_optional_panels_embedded_and_caption_escaped(self):
        Image.new('RGB', (600,200), 'red').save(self.out/'panel.png')
        with patch.object(report, 'render_report', side_effect=self.baseline):
            report.render_delivery_report(self.out, self.dest, {'panels': {'motion_heatmaps':
                {'path': 'panel.png', 'method': '<script>not markup</script>'}}})
        page = (self.dest/'report.html').read_text()
        self.assertIn('&lt;script&gt;', page)
        self.assertNotIn('<script>not markup', page)
        self.assertIn('data:image/png;base64,', page)
    def test_rejects_approval_unknown_version_and_missing_method(self):
        for spec in [{'statuses': {'listening': 'PASS'}}, {'version':'v999'},
                     {'panels': {'motion_heatmaps': {'path': 'panel.png'}}},
                     {'statuses': {'owner': 'UNVERIFIED'}}, {'panels': {'invented': {}}}]:
            with self.subTest(spec=spec), self.assertRaises(ValueError):
                report.render_delivery_report(self.out, self.dest, spec)
        self.assertFalse(self.dest.exists())
    def test_rejects_external_and_symlink_panel(self):
        Image.new('RGB',(10,10)).save(self.root/'secret.png')
        (self.out/'link.png').symlink_to(self.root/'secret.png')
        for name in ['../secret.png', str(self.root/'secret.png'), 'link.png']:
            with self.subTest(name=name), self.assertRaises(ValueError):
                report.render_delivery_report(self.out,self.dest,{'panels':{
                    'motion_heatmaps': {'path':name,'method':'test'}}})
    def test_destination_must_not_replace_baseline(self):
        with self.assertRaises(ValueError):
            report.render_delivery_report(self.out, self.out)
    def test_cli_exposes_delivery_options(self):
        result = subprocess.run([sys.executable, report.__file__, '--help'], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0)
        self.assertIn('--delivery-output', result.stdout)
        self.assertIn('--presentation', result.stdout)
    def test_input_exports_are_unchanged(self):
        (self.out/'overview.png').write_bytes(b'original overview')
        (self.out/'benchmark.html').write_text('original html')
        before = {p.name:p.read_bytes() for p in self.out.iterdir()}
        with patch.object(report, 'render_report', side_effect=self.baseline):
            report.render_delivery_report(self.out,self.dest)
        self.assertEqual(before,{p.name:p.read_bytes() for p in self.out.iterdir()})
    def test_refuses_overwrite_of_bound_pair(self):
        self.dest.mkdir(); (self.dest/'report.html').write_text('bound report')
        with self.assertRaisesRegex(ValueError,'overwrite'):
            report.render_delivery_report(self.out,self.dest)
        self.assertEqual((self.dest/'report.html').read_text(),'bound report')
    def test_gate_pair_without_reference_is_fixed_and_preserves_assessment(self):
        import io
        result = {'movie': {'sha256':'b'*64,'duration_seconds_exact':'3/2'},
                  'reference_based':False,'technical':{'status':'passed'},
                  'reviews':{'audio':{'status':'missing','blockers':['NOT_LISTENED']}},
                  'status':'review_candidate','owner_approval':'not_checked',
                  'blockers':['NOT_LISTENED']}
        png, page = report.render_gate_report(result,[])
        with Image.open(io.BytesIO(png)) as im:self.assertEqual(im.size,(1800,5400))
        page=page.decode()
        self.assertEqual(page.count('id="delivery-assessment"'),1)
        self.assertIn('NOT_LISTENED',page)
        self.assertIn('technical: MEASURED_NOT_APPROVED',page)
        self.assertIn('listening: BLOCKED',page)
        self.assertIn('motionstudio-review-v1',page)
        self.assertNotIn('alt="统一报告总览"',page)
    def test_palette_and_font_contract(self):
        self.assertEqual(report.COLORS['reference'], '#6edac6')
        self.assertEqual(report.COLORS['candidate'], '#f2b773')
        self.assertIn('NotoSansCJK',report.FONT_PATH)
        self.assertEqual(report.PRESENTATION_STATUSES,('technical','visual','listening','av_sync'))

if __name__ == '__main__': unittest.main()
