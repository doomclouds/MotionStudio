"""Synthetic timing/PCM tests only; no private footage or listening certification."""
import copy
import json
import shutil
import struct
import subprocess
import tempfile
import unittest
from pathlib import Path
import sound


class KeyboardTests(unittest.TestCase):
    def test_fixed_press_body_release(self):
        pcm = list(sound.synth.samples('keyboard-press'))
        self.assertEqual(len(pcm), 2496)
        self.assertEqual((pcm[0], pcm[-1]), (0, 0))
        self.assertGreater(max(abs(v) for v in pcm), 0)
        self.assertLess(max(abs(v) for v in pcm), 32767)
        self.assertEqual(pcm, list(sound.synth.samples('keyboard-press')))
        # Compare equal windows, not unequal lengths that pass vacuously.
        for other in ['soft-tick', 'resonant-tap', 'print-snap']:
            self.assertNotEqual(pcm, list(sound.synth.samples(other))[:len(pcm)])
        for start, end in [(0, 72), (72, 912), (912, 1200), (1200, 2304)]:
            self.assertTrue(any(pcm[start:end]))

    def test_two_synthetic_typing_timelines(self):
        if not all(shutil.which(x) for x in ['node', 'ffmpeg', 'ffprobe']):
            self.skipTest('Audio Core runtime unavailable')
        d, p = next((d, p) for d, p in sound.load() if d['id'] == 'keyboard-press')
        cli = sound.ROOT.parent/'motion-audio-core/scripts/audio.mjs'
        # Authored synthetic event sample positions, not frame observations.
        # Includes separated actions, a same-frame-style cluster and overlap.
        schedules = [tuple(4800 + 2880*i for i in range(8)), (4800, 5184, 5568, 9600, 12480, 24960)]
        pcm = list(sound.synth.samples('keyboard-press'))
        frames = 38400
        rat = lambda n: {'n': str(n), 'd': '48000'}
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root/'source'
            receipt = sound.materialize(d, p, source)
            self.assertEqual(receipt['listening'], 'NOT_LISTENED')
            self.assertEqual(receipt['owner'], 'NOT_RUN')
            base = json.loads((source/'timeline.json').read_text())
            for case, onsets in enumerate(schedules):
                with self.subTest(schedule=case):
                    plan = copy.deepcopy(base)
                    template = plan['clips'][0]
                    plan['clips'] = []
                    expected = [0.0]*frames
                    covered = [False]*frames
                    for index, onset in enumerate(onsets):
                        self.assertLessEqual(onset+len(pcm), frames)
                        clip = copy.deepcopy(template)
                        clip['id'] = f'key-{index}'
                        clip['timelineRange'] = {'start': rat(onset), 'end': rat(onset+len(pcm))}
                        plan['clips'].append(clip)
                        for j, value in enumerate(pcm):
                            expected[onset+j] += value/32768
                            covered[onset+j] = True
                    plan['project']['duration'] = rat(frames)
                    timeline = source/f'case-{case}.json'
                    timeline.write_text(json.dumps(plan))
                    work = root/f'mix-{case}'
                    subprocess.run(['node', str(cli), 'render', '--timeline', str(timeline), '--source-root', str(source), '--work', str(work)], check=True, capture_output=True)
                    report = json.loads((work/'result/report.json').read_text())
                    self.assertEqual(report['review']['listening']['status'], 'NOT_RUN')
                    self.assertEqual(report['review']['owner']['status'], 'NOT_RUN')
                    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(work/'result/master.wav'), '-f', 'f32le', '-c:a', 'pcm_f32le', '-'], check=True, capture_output=True).stdout
                    stereo = list(struct.iter_unpack('<ff', raw))
                    self.assertEqual(len(stereo), frames)
                    # Exact float sums of PCM16 dyadic values prove every authored
                    # event contribution, including overlapping attacks, survived.
                    for index, (left, right) in enumerate(stereo):
                        self.assertEqual(left, expected[index])
                        self.assertEqual(right, expected[index])
                        if not covered[index]:
                            self.assertEqual((left, right), (0, 0))
                    for onset in onsets:
                        self.assertTrue(any(left != 0 for left, _ in stereo[onset:onset+72]))
                    self.assertTrue(any(not v for v in covered))
                    self.assertEqual(stereo[0], (0, 0))
                    self.assertEqual(stereo[-1], (0, 0))


if __name__ == '__main__':
    unittest.main()
