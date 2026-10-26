"""Local synthetic regression tests; never reference/private footage, network or APIs."""
from argparse import Namespace
from copy import deepcopy
from fractions import Fraction
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('review_film', Path(__file__).with_name('review_film.py'))
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)


def timing(pts=(100, 110, 130), duration=10):
    return {'stream': {'time_base': '1/10', 'index': 0}, 'audio_stream_indices': [],
            'frames': [{'best_effort_timestamp': p, 'duration': duration} for p in pts]}


class MatchingTests(unittest.TestCase):
    def test_receipt_only_ignore_does_not_allow_private_frames(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(['git', 'init', '-q', str(root)], check=True, capture_output=True)
            (root / '.gitignore').write_text('out/receipt.json\n')
            with patch.object(r, 'ROOT', root), self.assertRaises(ValueError):
                r.safe_output(root / 'out')
            self.assertFalse((root / 'out').exists())
            (root / '.gitignore').write_text('out/\n')
            with patch.object(r, 'ROOT', root):
                self.assertEqual(r.safe_output(root / 'out'), root / 'out')

    def test_cli_absent_audio_intent_defaults_unknown(self):
        argv = ['compare', 'candidate.mp4', '--source-root', 'project', '--reference-video', 'reference.mp4',
            '--brief', 'test', '--pair', '0=0', '--alignment-note', 'same start', '--text-font-differences', 'none',
            '--reference-caveats', 'unknown', '--out', 'tmp/new']
        with patch.object(r, 'compare_review', return_value={'status': 'collected', 'gates': {'technical': 'not_run'}}) as run:
            with contextlib.redirect_stdout(io.StringIO()): self.assertEqual(r.main(argv), 0)
        self.assertEqual(run.call_args.args[0].audio, 'unknown')

    def test_rational_and_decimal_pairs_are_exact(self):
        self.assertEqual(r.time_pairs(['160/30=5.333333', '0=0']),
                         [(Fraction(16, 3), Fraction(5333333, 1000000)), (0, 0)])

    def test_invalid_timestamps(self):
        for value in ('nan=0', 'inf=0', '-1=0', '1/0=0', '0', '=0', '0=0=0'):
            with self.subTest(value=value), self.assertRaises(ValueError):
                r.time_pairs([value])
        with self.assertRaises(ValueError): r.time_pairs([])
        with self.assertRaises(ValueError): r.time_pairs(['0=0'] * 257)

    def test_vfr_selection_relative_to_first_pts_not_nominal_fps(self):
        actual = r.match_frame(timing(), Fraction('2.9'))
        self.assertEqual(actual['decoded_frame_index'], 1)
        self.assertEqual(actual['pts_ticks'], 110)
        self.assertEqual(actual['request_after_frame_start_seconds'], '19/10')
        self.assertEqual(r.match_frame(timing(), Fraction(3))['decoded_frame_index'], 2)

    def test_half_open_endpoint_and_negative_refused(self):
        for t in (-1, 4, 100):
            with self.assertRaises(ValueError): r.match_frame(timing(), Fraction(t))
        self.assertEqual(r.match_frame(timing(), Fraction('3.999'))['decoded_frame_index'], 2)

    def test_no_inferred_pts_or_last_duration(self):
        for fixture in (timing((100, 100)), timing((100, 90)), timing(duration=0), timing(duration=None)):
            with self.assertRaises(ValueError): r.validate_timing(fixture)
        fixture = timing(); del fixture['frames'][0]['best_effort_timestamp']
        with self.assertRaises(ValueError): r.validate_timing(fixture)


@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'Existing ffmpeg/ffprobe required; no install')
class SyntheticMediaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        (r.ROOT / 'tmp').mkdir(exist_ok=True)
        cls.temp = tempfile.TemporaryDirectory(prefix='comparison-test-', dir=r.ROOT / 'tmp')
        cls.root = Path(cls.temp.name)
        cls.media = cls.root / 'synthetic.mkv'
        # Four lossless, distinct 4x4 RGB frames at 2 fps. No personal or copyrighted input.
        raw = b''.join(bytes([i * 40, 10, 20]) * 16 for i in range(4))
        subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-v', 'error', '-f', 'rawvideo',
            '-pixel_format', 'rgb24', '-video_size', '4x4', '-framerate', '2', '-i', 'pipe:0',
            '-an', '-c:v', 'ffv1', '-threads', '1', str(cls.media)], input=raw, check=True, capture_output=True)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def setUp(self):
        self.work = self.root / self._testMethodName
        self.work.mkdir()
        self.movie = self.work / 'candidate.mkv'; shutil.copyfile(self.media, self.movie)
        self.reference = self.work / 'reference.mkv'; shutil.copyfile(self.media, self.reference)
        self.args = Namespace(video=str(self.movie), source_root=str(r.ROOT / 'scripts'),
            reference_video=str(self.reference), brief='Synthetic color-frame correspondence', pair=['0=0', '1.25=1'],
            text_font_differences='No text or font in synthetic fixture', reference_caveats='Synthetic lossless media, no browser capture',
            alignment_note='Identical fixture; explicit pairs intentionally include an off-grid request',
            audio='unknown', extract_frames=True, out=str(self.work / 'evidence'), timeout=30)

    def run_compare(self):
        return r.compare_review(self.args)

    def test_decoded_matching_and_extraction_and_unknown_audio(self):
        before = (r.digest(self.movie), r.digest(self.reference))
        result = self.run_compare()
        self.assertEqual(result['status'], 'collected', result.get('blocker'))
        self.assertEqual(result['pairs'][1]['reference']['decoded_frame_index'], 2)
        self.assertEqual(result['pairs'][1]['reference']['request_after_frame_start_seconds'], '1/4')
        self.assertEqual(result['audio_intent_check'], 'not_declared')
        self.assertEqual(result['gates']['technical'], 'not_run')
        self.assertEqual(result['gates']['native_audio'], 'not_reviewed')
        png = Path(self.args.out) / result['pairs'][1]['candidate']['image']
        raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(png), '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'])
        self.assertEqual(raw, bytes([80, 10, 20]) * 16)
        self.assertEqual((r.digest(self.movie), r.digest(self.reference)), before)
        self.assertEqual(r.report_receipt(Path(self.args.out) / 'receipt.json')['status'], 'collected')

    def test_no_extract_still_binds_timing_evidence(self):
        self.args.extract_frames = False
        result = self.run_compare()
        self.assertEqual(result['status'], 'collected')
        self.assertFalse(list(Path(self.args.out).glob('*.png')))
        self.assertEqual(result['media']['reference']['decoded_frames'], 4)

    def test_repeated_out_of_order_pairs_share_exact_extracted_frames(self):
        self.args.pair = ['1.5=1.5', '0=0', '1.5=1.5']
        result = self.run_compare()
        self.assertEqual(result['status'], 'collected')
        self.assertEqual(result['pairs'][0]['candidate']['image'], 'candidate-000001.png')
        self.assertEqual(result['pairs'][2]['candidate']['image'], 'candidate-000001.png')
        self.assertEqual(len(list(Path(self.args.out).glob('candidate-*.png'))), 2)

    def test_real_nonzero_first_pts_is_preserved(self):
        delayed = self.work / 'delayed.mkv'
        subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(self.reference),
            '-vf', 'setpts=PTS+5/TB', '-r', '2', '-c:v', 'ffv1', '-threads', '1', str(delayed)], check=True, capture_output=True)
        self.args.reference_video = str(delayed)
        self.args.extract_frames = False
        result = self.run_compare()
        self.assertEqual(result['status'], 'collected')
        self.assertEqual(result['pairs'][0]['reference']['pts_seconds'], '5')
        self.assertEqual(result['pairs'][0]['reference']['relative_seconds'], '0')
        self.assertEqual(result['pairs'][1]['reference']['decoded_frame_index'], 2)

    def test_out_of_range_pair_blocks_without_fake_frames(self):
        self.args.pair = ['2=0']
        result = self.run_compare()
        self.assertEqual(result['status'], 'blocked')
        self.assertFalse(list(Path(self.args.out).glob('*.png')))

    def test_reference_missing_before_output_created(self):
        self.reference.unlink()
        with self.assertRaises(FileNotFoundError): self.run_compare()
        self.assertFalse(Path(self.args.out).exists())

    def test_missing_tool_blocks_not_installs(self):
        with patch.object(r.shutil, 'which', return_value=None): result = self.run_compare()
        self.assertEqual(result['status'], 'blocked')
        self.assertEqual(result['gates']['visual'], 'not_reviewed')

    def test_missing_declaration_rejected(self):
        self.args.text_font_differences = ' '
        with self.assertRaises(ValueError): self.run_compare()
        self.assertFalse(Path(self.args.out).exists())

    def test_changed_reference_or_candidate_stales_receipt(self):
        result = self.run_compare()
        for path in (self.reference, self.movie):
            original = path.read_bytes()
            path.write_bytes(original + b'changed')
            self.assertEqual(r.report_comparison(deepcopy(result))['status'], 'stale')
            path.write_bytes(original)

    def test_missing_reference_is_missing_not_passed(self):
        result = self.run_compare(); self.reference.unlink()
        self.assertEqual(r.report_comparison(result)['status'], 'missing')

    def test_changed_evidence_stales_and_missing_evidence_does_not_pass(self):
        result = self.run_compare()
        artifact = Path(self.args.out) / 'reference-timing.json'
        original = artifact.read_bytes(); artifact.write_bytes(original + b' ')
        self.assertEqual(r.report_comparison(deepcopy(result))['status'], 'stale')
        artifact.write_bytes(original); artifact.unlink()
        self.assertEqual(r.report_comparison(deepcopy(result))['status'], 'missing')

    def test_removing_required_artifact_from_receipt_not_pass(self):
        result = self.run_compare()
        del result['artifacts'][str(Path(self.args.out) / 'candidate-timing.json')]
        self.assertEqual(r.report_comparison(result)['status'], 'missing')

    def test_edited_frame_mapping_cannot_pass_recheck(self):
        result = self.run_compare()
        result['pairs'][0]['candidate']['decoded_frame_index'] = 3
        self.assertEqual(r.report_comparison(result)['status'], 'stale')

    def test_swapped_frame_image_cannot_pass_recheck(self):
        result = self.run_compare()
        result['pairs'][0]['candidate']['image'] = result['pairs'][1]['candidate']['image']
        self.assertEqual(r.report_comparison(result)['status'], 'stale')

    def test_editable_receipt_cannot_approve_or_claim_listening(self):
        result = self.run_compare()
        result['gates'] = dict.fromkeys(result['gates'], 'passed')
        reviewed = r.report_comparison(result)
        self.assertEqual(reviewed['status'], 'collected')
        self.assertEqual(reviewed['gates']['visual'], 'not_reviewed')
        self.assertEqual(reviewed['gates']['native_audio'], 'not_reviewed')
        self.assertEqual(reviewed['gates']['owner_artistic_approval'], 'not_requested')

    def test_declared_audio_absent_remains_explicit_contradiction(self):
        self.args.audio = 'present'
        result = self.run_compare()
        self.assertEqual(result['audio_intent_check'], 'track_presence_contradicts_intent')
        self.assertEqual(result['gates']['native_audio'], 'not_reviewed')

    def test_no_network_protocols_or_seek_in_media_commands(self):
        original = r.media_command
        with patch.object(r, 'media_command', wraps=original) as command:
            result = self.run_compare()
        self.assertEqual(result['status'], 'collected')
        for call in command.call_args_list:
            argv = call.args[0]
            self.assertEqual(argv[argv.index('-protocol_whitelist') + 1], 'file,pipe')
            self.assertNotIn('-ss', argv)

    def test_existing_or_nonignored_output_refused(self):
        self.args.out = str(self.work)
        with self.assertRaises(ValueError): self.run_compare()
        self.args.out = str(r.ROOT / 'scripts' / 'comparison-unignored-output')
        with self.assertRaises(ValueError): self.run_compare()
        self.assertFalse(Path(self.args.out).exists())


if __name__ == '__main__':
    unittest.main()
