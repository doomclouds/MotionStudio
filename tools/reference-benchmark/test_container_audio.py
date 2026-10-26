"""Real local containers exercise timestamp origin, quantization, mono and silence."""
import json
from pathlib import Path
import shutil
import tempfile
import unittest

import benchmark as b


@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'),'FFmpeg/ffprobe required')
class ContainerAudioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory(prefix='benchmark-container-')
        cls.root=Path(cls.tmp.name)
        cls.late=cls.root/'nonzero-start.mkv'
        cls.silent=cls.root/'silent.mkv'
        cls.gapped=cls.root/'gapped.mkv'
        common=['ffmpeg','-v','error','-f','lavfi','-i','color=blue:size=96x96:rate=10:duration=2',
                '-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=2']
        b.run(common+['-c:v','ffv1','-c:a','pcm_s16le','-output_ts_offset','5',cls.late])
        b.run(common+['-af','volume=0','-c:v','ffv1','-c:a','pcm_s16le',cls.silent])
        b.run(common+['-af',r'asetpts=PTS+0.2/TB*gte(T\,1)','-c:v','ffv1','-c:a','pcm_s16le',cls.gapped])
        cls.late_profile,_,_=b.extract_profile(cls.late,cls.root/'late-output','fixture',key_times=[])
        cls.silent_profile,_,_=b.extract_profile(cls.silent,cls.root/'silent-output','fixture',key_times=[])
    @classmethod
    def tearDownClass(cls):cls.tmp.cleanup()
    def test_nonzero_origin_excerpt_is_not_empty(self):
        p=self.late_profile
        self.assertAlmostEqual(p['input']['video']['first_pts_s'],5)
        self.assertEqual(p['timeline']['samples'][0]['t_s'],0)
        out=self.root/'clip-output'
        for role in ['reference','candidate']:(out/'assets'/role).mkdir(parents=True)
        clips=b.make_clips(self.late,self.late,p,p,out,[(0,1)])
        for role in ['reference','candidate']:
            result=json.loads(b.run(['ffprobe','-v','error','-show_streams','-of','json',out/clips[0][role+'_path']]).stdout)
            video=next(s for s in result['streams'] if s['codec_type']=='video')
            self.assertEqual(int(video['nb_frames']),10)
            self.assertAlmostEqual(float(video['duration']),1,places=2)
            self.assertTrue(any(s['codec_type']=='audio' for s in result['streams']))
    def test_mono_conversion_does_not_invent_stereo_position(self):
        audio=self.late_profile['audio']
        self.assertEqual(audio['original_channels'],1)
        self.assertEqual(audio['stereo_balance']['status'],'NOT_APPLICABLE')
        self.assertTrue(all(r['lr_balance'] is None for r in audio['samples']))
        self.assertGreaterEqual(audio['timing']['pts_quantization_tolerance_s'],.001)
    def test_silence_has_uninformative_loudness_not_negative_seventy_claim(self):
        a=self.silent_profile['audio']
        self.assertIsNone(a['loudness']['integrated_lufs'])
        self.assertEqual(a['loudness']['status'],'UNINFORMATIVE')
        self.assertEqual(a['tempo']['status'],'UNINFORMATIVE')
        self.assertEqual(a['listening_status'],'UNVERIFIED')
    def test_real_audio_gap_is_rejected_not_concatenated(self):
        v,a,frames,d=b.probe(self.gapped)
        with self.assertRaises(b.BenchmarkError):
            b.audio_timing(self.gapped,frames[0]['pts_s'],int(a['sample_rate']),a['time_base'])


if __name__=='__main__':unittest.main()
