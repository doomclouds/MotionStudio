"""Synthetic native-PTS/visual benchmark regressions, not artistic acceptance.

Fixtures are generated locally as 4 s / 96 px lossless FFV1 videos. No source
movie, model weights, browser, network access, or private user path is required.
"""
from pathlib import Path
import json
import shutil
import subprocess
import tempfile
import unittest

import numpy as np

import benchmark as b


DURATION = 4.0
SIZE = 96
TIMES = np.array([0, .25, .5, 1, 1.25, 1.75, 2, 2.5, 3, 3.25, 3.75, 4.])
POSITIONS = np.array([0, 0, 1, 11, 11, 26, 28, 9, 9, 22, 30, 30.])


def motion_frame(t):
    """Continuous translated texture with deliberately nonperiodic speed envelope."""
    pos = np.interp(max(0, t), TIMES, POSITIONS)
    yy, xx = np.indices((SIZE, SIZE), dtype=float)
    gray = (112 + 52*np.sin((xx-pos)/9) + 28*np.cos((yy+.33*pos)/13)
            + 24*np.sin((xx+yy-.75*pos)/7))
    rgb = np.stack([gray, .8*gray+20, .55*gray+50], axis=-1)
    return np.clip(np.rint(rgb), 0, 255).astype(np.uint8)


def encode_fixture(path, fps=30, lag=0.0, frozen=False):
    frames = np.stack([motion_frame(0 if frozen else i/fps-lag)
                       for i in range(round(DURATION*fps))])
    result = subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo',
        '-pix_fmt', 'rgb24', '-s', f'{SIZE}x{SIZE}', '-r', str(fps), '-i', '-',
        '-an', '-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'bgr0', '-threads', '1',
        str(path)], input=frames.tobytes(), capture_output=True, check=False)
    if result.returncode:
        raise AssertionError('Fixture encoder failed: ' + result.stderr.decode(errors='replace'))
    return frames


def all_keys(value):
    if isinstance(value, dict):
        for key, item in value.items():
            yield key
            yield from all_keys(item)
    elif isinstance(value, list):
        for item in value:
            yield from all_keys(item)


@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'FFmpeg/ffprobe required')
class NativeVideoFixtureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='motionstudio-visual-fixtures-')
        cls.root = Path(cls.temp.name)
        cls.paths = {}
        cls.encoded_frames = {}
        cls.profiles = {}
        cls.rgb = {}
        for name, fps, lag, frozen in [
            ('motion24', 24, 0, False), ('motion30', 30, 0, False),
            ('lag30', 30, .5, False), ('frozen30', 30, 0, True),
        ]:
            path = cls.root / (name + '.mkv')
            cls.paths[name] = path
            cls.encoded_frames[name] = encode_fixture(path, fps, lag, frozen)
            profile, rgb, _ = b.extract_profile(path, cls.root/name, 'fixture', key_times=[])
            cls.profiles[name], cls.rgb[name] = profile, rgb
        # A second independent decode/export of the identical bitstream, not a dict copy.
        p, rgb, _ = b.extract_profile(cls.paths['motion30'], cls.root/'identical', 'candidate', key_times=[])
        cls.profiles['identical'], cls.rgb['identical'] = p, rgb
        p, rgb, _ = b.extract_profile(cls.paths['frozen30'], cls.root/'static-identical', 'candidate', key_times=[])
        cls.profiles['static-identical'], cls.rgb['static-identical'] = p, rgb

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def assert_no_quality_gate(self, value):
        forbidden = {'overall_score', 'quality_score', 'quality_passed', 'artistic_score', 'passed'}
        self.assertTrue(forbidden.isdisjoint(set(all_keys(value))))

    def test_same_continuous_motion_24_and_30_uses_native_intervals(self):
        selected = {}
        for name, fps in [('motion24', 24), ('motion30', 30)]:
            p = self.profiles[name]
            native = p['timeline']['frames']
            rows = p['timeline']['samples']
            self.assertEqual(len(native), 4*fps)
            self.assertEqual(len(rows), 16)
            self.assertEqual([r['t_s'] for r in rows], list(np.arange(0, 4, .25)))
            for row in rows:
                i = row['frame_index']
                pts = native[i]['pts_s'] - native[0]['pts_s']
                next_pts = pts + native[i]['duration_s']
                self.assertLessEqual(pts, row['t_s']+1e-8)
                self.assertLess(row['t_s'], next_pts+1e-8)
                self.assertLessEqual(abs(row['request_delta_s']), 1/fps+.001)
                self.assertEqual(i, int(np.floor(row['t_s']*fps+1e-7)))
            selected[name] = rows
            # Verify actual lossless decode, not only metadata selection.
            native_rgb = b.decode_selected(self.paths[name], [r['frame_index'] for r in rows], SIZE, SIZE)
            expected = self.encoded_frames[name][[r['frame_index'] for r in rows]]
            np.testing.assert_array_equal(native_rgb, expected)
        for a, c in zip(selected['motion24'], selected['motion30']):
            self.assertLessEqual(abs(a['pts_s']-c['pts_s']), max(1/24, 1/30)+.001)
        # Spatial residual is bounded by the analytic trajectory's one-frame support,
        # not forced to zero and not interpreted as a fidelity/quality score.
        max_speed = np.max(np.abs(np.diff(POSITIONS)/np.diff(TIMES)))
        max_luma_slope = 52/9 + 28*.33/13 + 24*.75/7
        bound = (max_speed*max_luma_slope/24 + 2)/255
        residual = np.abs(self.rgb['motion24'].astype(float)-self.rgb['motion30'])/255
        self.assertLess(float(residual.max()), bound)

    def test_fps_contact_first_is_not_native_opening_or_boundary_evidence(self):
        # Distinct single-frame opening/end states disappear in a 2 Hz overview.
        # This fixture documents a specific resampling counterexample, not a
        # promise about which source frame every FFmpeg/version will select.
        path = self.root / 'boundary-states.mkv'
        frames = np.zeros((30, SIZE, SIZE, 3), dtype=np.uint8)
        frames[:, :, :, 2] = 255
        frames[0] = [255, 0, 0]
        frames[-1] = [0, 255, 0]
        subprocess.run([
            'ffmpeg', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
            '-s', f'{SIZE}x{SIZE}', '-r', '30', '-i', '-', '-an',
            '-c:v', 'ffv1', '-pix_fmt', 'bgr0', '-threads', '1', str(path)],
            input=frames.tobytes(), capture_output=True, check=True)
        _, _, native, _ = b.probe(path)
        requested = [0, native[-1]['pts_s'] - native[0]['pts_s']]
        chosen = b.choose_frames(native, requested)
        self.assertEqual([r['frame_index'] for r in chosen], [0, 29])
        exact = b.decode_selected(path, [0, 1, 28, 29], SIZE, SIZE)
        np.testing.assert_array_equal(exact, frames[[0, 1, 28, 29]])
        raw = b.run(['ffmpeg', '-v', 'error', '-i', path, '-vf',
                     'setpts=PTS-STARTPTS,fps=2:round=near:eof_action=pass',
                     '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-']).stdout
        overview = np.frombuffer(raw, np.uint8).reshape((-1, SIZE, SIZE, 3))
        self.assertGreater(len(overview), 0)
        self.assertFalse(np.array_equal(overview[0], frames[0]))
        self.assertFalse(np.array_equal(overview[-1], frames[-1]))
        # Native extraction keeps both source endpoints irrespective of overview.
        self.assertEqual(chosen[0]['pts_s'], native[0]['pts_s'])

    def test_identical_independent_exports_share_schema_and_zero_raw_deltas(self):
        a, c = self.profiles['motion30'], self.profiles['identical']
        self.assertEqual(a['schema_version'], b.SCHEMA)
        self.assertEqual(a['schema_version'], c['schema_version'])
        self.assertEqual(set(a), set(c))
        self.assertEqual(set(a['visual']), set(c['visual']))
        self.assertEqual(set(a['audio']), set(c['audio']))
        self.assertEqual(a['input']['sha256'], c['input']['sha256'])
        self.assertEqual(a['visual']['samples'], c['visual']['samples'])
        comparison = b.compare_profiles(a, c, self.rgb['motion30'], self.rgb['identical'])
        for feature in b.FEATURE_UNITS:
            row = comparison['deltas'][feature]
            if row['mean_absolute'] is not None:
                self.assertAlmostEqual(row['mean_absolute'], 0, places=7)
        self.assertAlmostEqual(comparison['deltas']['ssim']['mean_signed'], 1, places=7)
        self.assertEqual(comparison['alignment']['mode'], 'RAW_TIME')
        self.assert_no_quality_gate(comparison)
        self.assert_no_quality_gate(a)

    def test_static_static_is_uninformative_for_lag_not_bad_by_default(self):
        a, c = self.profiles['frozen30'], self.profiles['static-identical']
        comparison = b.compare_profiles(a, c, self.rgb['frozen30'], self.rgb['static-identical'])
        self.assertEqual(comparison['deltas']['frame_difference']['mean_absolute'], 0)
        self.assertEqual(comparison['offset_estimates']['visual_motion']['status'], 'UNINFORMATIVE')
        self.assertIsNone(comparison['offset_estimates']['visual_motion']['offset_s'])
        self.assertEqual(a['evidence']['owner_acceptance'], 'UNVERIFIED')
        self.assert_no_quality_gate(comparison)

    def test_frozen_candidate_keeps_visible_motion_difference_without_grade(self):
        comparison = b.compare_profiles(self.profiles['motion30'], self.profiles['frozen30'],
                                        self.rgb['motion30'], self.rgb['frozen30'])
        delta = comparison['deltas']['frame_difference']
        self.assertLess(delta['mean_signed'], -.001)
        self.assertGreater(delta['mean_absolute'], .001)
        self.assertEqual(comparison['alignment']['applied_offset_s'], 0)
        self.assertEqual(comparison['offset_estimates']['visual_motion']['status'], 'UNINFORMATIVE')
        self.assert_no_quality_gate(comparison)

    def test_known_half_second_visual_delay_has_positive_sign_and_no_warp(self):
        a, c = self.profiles['motion30'], self.profiles['lag30']
        before = json.dumps(c['visual']['samples'], sort_keys=True)
        comparison = b.compare_profiles(a, c, self.rgb['motion30'], self.rgb['lag30'])
        offset = comparison['offset_estimates']['visual_motion']
        self.assertEqual(offset['status'], 'ESTIMATED')
        self.assertAlmostEqual(offset['offset_s'], .5, places=6)
        self.assertGreater(offset['correlation'], .99)
        self.assertGreaterEqual(offset['uncertainty_s'], .25)
        self.assertEqual(comparison['alignment']['applied_offset_s'], 0)
        self.assertEqual(comparison['alignment']['dtw'], 'NOT_RUN')
        self.assertGreater(comparison['deltas']['frame_difference']['mean_absolute'], .001)
        self.assertEqual(before, json.dumps(c['visual']['samples'], sort_keys=True))
        reverse = b.compare_profiles(c, a)
        self.assertAlmostEqual(reverse['offset_estimates']['visual_motion']['offset_s'], -.5, places=6)

    def test_optional_models_are_not_run_and_listening_stays_unverified(self):
        p = self.profiles['motion30']
        for name in ['LPIPS', 'DISTS', 'RAFT', 'CLAP', 'Synchformer', 'FAD']:
            self.assertEqual(p['optional_models'][name]['status'], 'NOT_RUN')
        self.assertEqual(p['visual']['camera_motion']['status'], 'NOT_RUN')
        self.assertEqual(p['evidence']['audio_listening'], 'UNVERIFIED')
        self.assertEqual(p['audio']['status'], 'ABSENT')
        self.assert_no_quality_gate(p)


class EngineeredProxyCounterexampleTests(unittest.TestCase):
    def test_equal_histograms_do_not_imply_spatial_structure_match(self):
        a = np.zeros((96, 96), np.uint8)
        a[:, :48] = 255
        c = 255-a
        ar, cr = np.repeat(a[..., None], 3, axis=2), np.repeat(c[..., None], 3, axis=2)
        self.assertEqual(b.palette(ar[None])['histogram_512'], b.palette(cr[None])['histogram_512'])
        _, same = b.ssim_local(a/255, a/255)
        _, different = b.ssim_local(a/255, c/255)
        self.assertAlmostEqual(same, 1, places=9)
        self.assertLess(different, .2)

    def test_noise_can_raise_texture_proxy_without_creating_quality_evidence(self):
        rng = np.random.default_rng(1979)
        clean = np.full((96, 96, 3), 128, np.uint8)
        noise = rng.integers(-25, 26, size=(96, 96, 1))
        noisy = np.clip(clean.astype(int)+noise, 0, 255).astype(np.uint8)
        a, _ = b.frame_features(clean)
        c, _ = b.frame_features(noisy)
        self.assertGreater(c['laplacian_variance'], a['laplacian_variance']+.01)
        self.assertFalse({'quality', 'quality_score', 'material_realism', 'passed'} & set(c))


if __name__ == '__main__':
    unittest.main(verbosity=2)
