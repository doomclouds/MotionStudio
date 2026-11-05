"""Synthetic signal and timeline checks; not keyboard realism/listening tests."""
import copy
import hashlib
import json
from pathlib import Path
import shutil
import struct
import subprocess
import tempfile
import unittest

import sound


class SoftKeyboardTests(unittest.TestCase):
    def test_four_explicit_short_noise_roles(self):
        alternatives = [list(sound.synth.samples('keyboard-soft', v)) for v in range(4)]
        self.assertEqual(alternatives[0], list(sound.synth.samples('keyboard-soft')))
        self.assertEqual(len({tuple(pcm) for pcm in alternatives}), 4)
        for variant, pcm in enumerate(alternatives):
            self.assertEqual(pcm, list(sound.synth.samples('keyboard-soft', variant)))
            self.assertEqual(len(pcm), 1920)
            self.assertEqual((pcm[0], pcm[-1]), (0, 0))
            self.assertGreater(max(abs(x) for x in pcm), 0)
            self.assertLess(max(abs(x) for x in pcm), 32767)
            # An authored short energy envelope, not a subjective softness test.
            total = sum(x*x for x in pcm)
            self.assertGreater(sum(x*x for x in pcm[:960]) / total, .95)
            self.assertLess(sum(x*x for x in pcm[1440:]) / total, .001)
            self.assertNotEqual(pcm, list(sound.synth.samples('keyboard-press', variant))[:1920])

    def test_bounds_and_receipts(self):
        d, p = next((d, p) for d, p in sound.load() if d['id'] == 'keyboard-soft')
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for variant in [-1, 4, True, False, 1.0, '1', None]:
                with self.assertRaises(ValueError):
                    sound.materialize(d, p, root/'bad', variant=variant)
                self.assertFalse((root/'bad').exists())
            for variant in range(4):
                target = root/str(variant)
                receipt = sound.materialize(d, p, target, variant=variant)
                self.assertEqual(receipt['generation'], {'recipe': 'keyboard-soft', 'variant': variant})
                self.assertEqual(receipt['listening'], 'NOT_LISTENED')
                self.assertEqual(receipt['av_sync'], 'NOT_RUN')
                self.assertEqual(receipt['output_sha256'], hashlib.sha256((target/'source.wav').read_bytes()).hexdigest())

    def test_frame_events_drive_audio_core(self):
        if not all(shutil.which(x) for x in ['node', 'ffmpeg', 'ffprobe']):
            self.skipTest('Audio Core runtime unavailable')
        d, p = next((d, p) for d, p in sound.load() if d['id'] == 'keyboard-soft')
        rat = lambda n: {'n': str(n), 'd': '48000'}
        # Explicit synthetic visible events, including a long pause and overlap.
        # Arbitrary frame access and cursor-only frames never create audio events.
        events = [(3, 0, 0), (4, 1, -6), (8, 2, 0), (21, 3, -3), (25, 0, -2)]
        total_samples = 48000
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            sources, waveforms = [], []
            for variant in range(4):
                source = root/f'variant-{variant}'
                sound.materialize(d, p, source, variant=variant)
                base = json.loads((source/'timeline.json').read_text())
                item = base['sources'][0]
                item.update(id=f'key-source-{variant}', path=f'variant-{variant}/source.wav')
                sources.append(item)
                waveforms.append(list(sound.synth.samples('keyboard-soft', variant)))
            plan = copy.deepcopy(base)
            template = plan['clips'][0]
            plan.update(sources=sources, clips=[])
            plan['project'].update(duration=rat(total_samples), frameRate={'n': 30, 'd': 1})
            expected = [0.0]*total_samples
            covered = [False]*total_samples
            for index, (frame, variant, gain_db) in enumerate(events):
                onset = frame*1600
                pcm = waveforms[variant]
                clip = copy.deepcopy(template)
                clip.update(id=f'key-{index}', sourceId=sources[variant]['id'], gainDb=gain_db)
                clip['timelineRange'] = {'start': rat(onset), 'end': rat(onset+len(pcm))}
                plan['clips'].append(clip)
                for j, value in enumerate(pcm):
                    expected[onset+j] += value/32768 * 10**(gain_db/20)
                    covered[onset+j] = True
            timeline = root/'timeline.json'
            timeline.write_text(json.dumps(plan))
            work = root/'mix'
            subprocess.run(['node', str(sound.ROOT.parent/'motion-audio-core/scripts/audio.mjs'),
                            'render', '--timeline', str(timeline), '--source-root', str(root), '--work', str(work)],
                           check=True, capture_output=True)
            raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(work/'result/master.wav'),
                                  '-f', 'f32le', '-c:a', 'pcm_f32le', '-'], check=True, capture_output=True).stdout
            stereo = list(struct.iter_unpack('<ff', raw))
            self.assertEqual(len(stereo), total_samples)
            for index, (left, right) in enumerate(stereo):
                self.assertAlmostEqual(left, expected[index], places=7)
                self.assertEqual(left, right)
                if not covered[index]:
                    self.assertEqual((left, right), (0, 0))
            report = json.loads((work/'result/report.json').read_text())
            self.assertEqual(report['review']['listening']['status'], 'NOT_RUN')


if __name__ == '__main__':
    unittest.main()
