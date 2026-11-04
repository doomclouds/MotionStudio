"""Synthetic timing/PCM tests only; no private footage or listening certification."""
import copy
import hashlib
import json
import shutil
import struct
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
import sound


class KeyboardTests(unittest.TestCase):
    def test_explicit_variants_are_bounded_and_reproducible(self):
        alternatives = [list(sound.synth.samples('keyboard-press', i)) for i in range(4)]
        self.assertEqual(alternatives[0], list(sound.synth.samples('keyboard-press')))
        self.assertEqual(len({tuple(pcm) for pcm in alternatives}), 4)
        for variant, pcm in enumerate(alternatives):
            self.assertEqual(len(pcm), 2496)
            self.assertEqual((pcm[0], pcm[-1]), (0, 0))
            self.assertLess(max(abs(v) for v in pcm), 32767)
            self.assertEqual(pcm, list(sound.synth.samples('keyboard-press', variant)))
            for start, end in [(0, 72), (72, 864), (960, 1200), (1200, 2304)]:
                self.assertTrue(any(pcm[start:end]))

    def test_variant_rejections_do_not_create_output(self):
        d, p = next((d, p) for d, p in sound.load() if d['id'] == 'keyboard-press')
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for index, bad in enumerate([-1, 4, True, False, 1.0, '1', None]):
                with self.subTest(variant=bad):
                    with self.assertRaises(ValueError):
                        sound.materialize(d, p, root/f'bad-{index}', variant=bad)
                    with self.assertRaises(ValueError):
                        sound.synth.render('keyboard-press', root/f'bad-{index}.wav', bad)
                    self.assertEqual(list(root.iterdir()), [])
            for recipe in ['soft-tick', 'quiet-pulse-bed', 'unknown']:
                with self.assertRaises(ValueError):
                    list(sound.synth.samples(recipe, 1))

    def test_cli_variant_identity_and_unsupported_requests(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cli = [sys.executable, str(sound.ROOT/'sound.py')]
            success = subprocess.run(cli + ['render', '--id', 'keyboard-press', '--variant', '3',
                                          '--output', str(root/'valid')], check=True, capture_output=True, text=True)
            receipt = json.loads(success.stdout)
            self.assertEqual(receipt['generation'], {'recipe': 'keyboard-press', 'variant': 3})
            self.assertEqual(receipt['listening'], 'NOT_LISTENED')
            self.assertEqual(receipt['output_sha256'], hashlib.sha256((root/'valid/source.wav').read_bytes()).hexdigest())
            self.assertEqual(json.loads((root/'valid/receipt.json').read_text()), receipt)
            for args in [
                ['render', '--id', 'keyboard-press', '--variant', '4', '--output', str(root/'bad')],
                ['render', '--id', 'soft-tick', '--variant', '1', '--output', str(root/'bad')],
                ['query', '--id', 'keyboard-press', '--variant', '1'],
            ]:
                result = subprocess.run(cli+args, capture_output=True, text=True)
                self.assertEqual(result.returncode, 1)
                self.assertFalse(json.loads(result.stderr)['valid'])
                self.assertFalse((root/'bad').exists())

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

    def test_explicit_variant_sequence_audio_core(self):
        if not all(shutil.which(x) for x in ['node', 'ffmpeg', 'ffprobe']):
            self.skipTest('Audio Core runtime unavailable')
        d, p = next((d, p) for d, p in sound.load() if d['id'] == 'keyboard-press')
        rat = lambda n: {'n': str(n), 'd': '48000'}
        frames = 38400
        # Two authored patterns cover all variants, overlaps and long pauses.
        # These are synthetic cue plans, not observations of a real typing video.
        patterns = [((4800, 0), (7680, 1), (10560, 2), (13440, 3), (24960, 0)),
                    ((4800, 3), (5184, 1), (5568, 0), (9600, 2), (24960, 3))]
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            sources, waveforms = [], []
            for variant in range(4):
                source = root/f'variant-{variant}'
                receipt = sound.materialize(d, p, source, variant=variant)
                self.assertEqual(receipt['generation'], {'recipe': 'keyboard-press', 'variant': variant})
                base = json.loads((source/'timeline.json').read_text())
                item = base['sources'][0]
                item['id'] = f'key-source-{variant}'
                item['path'] = f'variant-{variant}/source.wav'
                sources.append(item)
                waveforms.append(list(sound.synth.samples('keyboard-press', variant)))
            self.assertEqual(len({s['expectedSha256'] for s in sources}), 4)
            repeated = sound.materialize(d, p, root/'same-again', variant=3)
            self.assertEqual(repeated['output_sha256'], sources[3]['expectedSha256'])
            for case, sequence in enumerate(patterns):
                with self.subTest(pattern=case):
                    plan = copy.deepcopy(base)
                    template = plan['clips'][0]
                    plan['sources'], plan['clips'] = sources, []
                    plan['project']['duration'] = rat(frames)
                    expected = [0.0]*frames
                    covered = [False]*frames
                    for index, (onset, variant) in enumerate(sequence):
                        pcm = waveforms[variant]
                        clip = copy.deepcopy(template)
                        clip['id'], clip['sourceId'] = f'key-{index}', sources[variant]['id']
                        clip['timelineRange'] = {'start': rat(onset), 'end': rat(onset+len(pcm))}
                        plan['clips'].append(clip)
                        for j, value in enumerate(pcm):
                            expected[onset+j] += value/32768
                            covered[onset+j] = True
                    timeline, work = root/f'plan-{case}.json', root/f'mix-{case}'
                    timeline.write_text(json.dumps(plan))
                    subprocess.run(['node', str(sound.ROOT.parent/'motion-audio-core/scripts/audio.mjs'), 'render',
                                    '--timeline', str(timeline), '--source-root', str(root), '--work', str(work)],
                                   check=True, capture_output=True)
                    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(work/'result/master.wav'),
                                          '-f', 'f32le', '-c:a', 'pcm_f32le', '-'], check=True, capture_output=True).stdout
                    stereo = list(struct.iter_unpack('<ff', raw))
                    self.assertEqual(len(stereo), frames)
                    for index, (left, right) in enumerate(stereo):
                        self.assertEqual((left, right), (expected[index], expected[index]))
                        if not covered[index]:
                            self.assertEqual((left, right), (0, 0))
                    report = json.loads((work/'result/report.json').read_text())
                    self.assertEqual(report['review']['listening']['status'], 'NOT_RUN')
                    self.assertEqual(report['review']['owner']['status'], 'NOT_RUN')


if __name__ == '__main__':
    unittest.main()
