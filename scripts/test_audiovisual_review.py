"""Offline synthetic data and injected transports only; no credentials/network."""
import base64, io, json, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
import audiovisual_review as av

class AVTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        self.manifest=self.root/'manifest.json'
        self.data={'movie':{'sha256':'a'*64},'audio':{'duration_s':25}}
        self.manifest.write_text(json.dumps(self.data));self.session=self.root/'output'
        self.mock=patch.object(av,'payload',return_value={'synthetic':True});self.mock.start()
    def tearDown(self):self.mock.stop();self.tmp.cleanup()
    def send(self,*args,**kwargs):
        return {'summary':'synthetic','uncertainties':['no real review'],'observations':[]},{'prompt_tokens':100,'completion_tokens':100},{'request_id':'mock-id','model':av.a.MODEL,'response_text':'synthetic'}
    def run_call(self,**kw):
        args=dict(manifest_path=self.manifest,session=self.session,key='synthetic-secret',consent=True,send=self.send);args.update(kw);return av.call(**args)
    def test_no_consent_no_call(self):
        with self.assertRaises(av.a.ReviewError):self.run_call(consent=False)
        self.assertFalse(self.session.exists())
    def test_no_key_no_call(self):
        with self.assertRaises(av.a.ReviewError):self.run_call(key='')
    def test_success_never_approval(self):
        r=self.run_call();self.assertEqual(r['status'],'model_assisted_review_completed');self.assertFalse(r['human_listening']);self.assertFalse(r['delivery_approved']);self.assertEqual(r['audiovisual_sync'],'unverified')
    def test_failure_cannot_retry(self):
        def fail(*a,**k):raise RuntimeError('synthetic-secret')
        r=self.run_call(send=fail);self.assertEqual(r['status'],'blocked')
        with self.assertRaises(av.a.ReviewError):self.run_call(acknowledge_previous=True)
        self.assertNotIn('synthetic-secret',(self.session/'review-1.json').read_text())
    def test_second_requires_ack(self):
        self.run_call();self.data['movie']['sha256']='b'*64;self.manifest.write_text(json.dumps(self.data))
        with self.assertRaises(av.a.ReviewError):self.run_call()
        self.assertEqual(self.run_call(acknowledge_previous=True)['status'],'model_assisted_review_completed')
        self.data['movie']['sha256']='c'*64;self.manifest.write_text(json.dumps(self.data))
        with self.assertRaises(av.a.ReviewError):self.run_call(acknowledge_previous=True)
    def test_echo_suppressed(self):
        def echo(*args,**kw):
            r,u,m=self.send();r['summary']='synthetic-secret';return r,u,m
        self.assertEqual(self.run_call(send=echo)['status'],'blocked')
        self.assertNotIn('synthetic-secret',(self.session/'review-1.json').read_text())
    def test_overbudget_stops_session(self):
        def costly(*args,**kw):
            r,u,m=self.send();u['prompt_tokens']=1000000;return r,u,m
        self.assertEqual(self.run_call(send=costly)['status'],'blocked')
        with self.assertRaises(av.a.ReviewError):self.run_call(acknowledge_previous=True)
    def test_invalid_timestamps_fail_closed(self):
        def invalid(*args,**kw):
            r,u,m=self.send();r['observations']=[{'start_s':30,'end_s':35,'category':'other','evidence':'x','severity':'info','suggestion':'x'}];return r,u,m
        self.assertEqual(self.run_call(send=invalid)['status'],'blocked')
    def test_duplicate_refused(self):
        self.run_call()
        with self.assertRaises(av.a.ReviewError):self.run_call(acknowledge_previous=True)
    def test_sse_receipt_requires_consistent_actual_id_and_model(self):
        chunks=[{'id':'actual-id','model':av.a.MODEL,'choices':[{'index':0,'delta':{'content':'{}'},'finish_reason':None}]},
            {'id':'actual-id','model':av.a.MODEL,'choices':[{'index':0,'delta':{},'finish_reason':'stop'}]},
            {'id':'actual-id','model':av.a.MODEL,'choices':[],'usage':{'prompt_tokens':1,'completion_tokens':1}}]
        def wire(rows):return b''.join(b'data: '+json.dumps(c).encode()+b'\n\n' for c in rows)+b'data: [DONE]\n'
        with patch.object(av.a.urllib.request,'build_opener') as opener:
            opener.return_value.open.return_value=io.BytesIO(wire(chunks))
            r,u,m=av.a.request_review(b'',av.a.BASE_URL,'fake-secret',payload_override={'model':av.a.MODEL},include_metadata=True)
            self.assertEqual(m['request_id'],'actual-id')
        for bad in [dict(chunks[1],id='different'),dict(chunks[1],model='wrong'),dict(chunks[1],id=None)]:
            with patch.object(av.a.urllib.request,'build_opener') as opener:
                opener.return_value.open.return_value=io.BytesIO(wire([chunks[0],bad,chunks[2]]))
                with self.assertRaises(av.a.ReviewError):av.a.request_review(b'',av.a.BASE_URL,'fake-secret',include_metadata=True)
    def test_budget_below_one_yuan(self):self.assertLess(av.RESERVATION*2,1)


class RealMediaBindingTests(unittest.TestCase):
    """Real FFmpeg-generated media; no mocked payload/probe/preparation."""
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        self.movie=self.root/'movie.mp4'
        av.command(['ffmpeg','-v','error','-f','lavfi','-i','color=c=blue:s=160x90:r=10:d=1','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=1','-shortest','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',str(self.movie)])
        self.manifest=av.prepare(self.movie,av.sha(self.movie),self.root/'prepared')
    def tearDown(self):self.tmp.cleanup()
    def test_real_media_accepts_and_constructs_audio_and_image(self):
        body=av.payload(self.manifest)
        kinds=[x['type'] for x in body['messages'][1]['content']]
        self.assertIn('input_audio',kinds);self.assertIn('image_url',kinds)
    def test_foreign_same_duration_wav_with_updated_hash_rejected(self):
        p=Path(self.manifest['audio']['path'])
        raw=bytearray(p.read_bytes());raw[-300:]=b'\0'*300;p.write_bytes(raw)
        self.manifest['audio']['sha256']=av.sha(p)
        with self.assertRaises(av.a.ReviewError):av.payload(self.manifest)
    def test_foreign_jpeg_with_updated_hash_rejected(self):
        p=Path(self.manifest['frames'][0]['path'])
        av.command(['ffmpeg','-y','-v','error','-f','lavfi','-i','color=c=red:s=640x360','-frames:v','1',str(p)])
        self.manifest['frames'][0]['sha256']=av.sha(p)
        with self.assertRaises(av.a.ReviewError):av.payload(self.manifest)
    def test_nonmovie_even_with_matching_hash_rejected(self):
        self.movie.write_bytes(b'not a movie');self.manifest['movie']['sha256']=av.sha(self.movie)
        with self.assertRaises(av.a.ReviewError):av.payload(self.manifest)
    def test_nonjpeg_even_with_matching_hash_rejected(self):
        p=Path(self.manifest['frames'][0]['path']);p.write_bytes(b'not a jpeg')
        self.manifest['frames'][0]['sha256']=av.sha(p)
        with self.assertRaises(av.a.ReviewError):av.payload(self.manifest)
    def test_delayed_audio_origin_rejected(self):
        delayed=self.root/'delayed.mp4'
        av.command(['ffmpeg','-v','error','-i',str(self.movie),'-itsoffset','0.08','-i',str(self.movie),'-map','0:v:0','-map','1:a:0','-c','copy',str(delayed)])
        with self.assertRaises(av.a.ReviewError):av.prepare(delayed,av.sha(delayed),self.root/'delayed-prepared')
    def test_short_soundtrack_still_rejected(self):
        short=self.root/'short-audio.mp4'
        av.command(['ffmpeg','-v','error','-f','lavfi','-i','color=c=blue:s=160x90:r=10:d=2',
                    '-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=1',
                    '-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',str(short)])
        with self.assertRaisesRegex(av.a.ReviewError,'Audio coverage mismatch'):
            av.prepare(short,av.sha(short),self.root/'short-prepared')
    def test_timestamp_lie_rejected(self):
        self.manifest['frames'][0]['time_s']=.5
        with self.assertRaises(av.a.ReviewError):av.payload(self.manifest)
    def test_coverage_lie_rejected(self):
        self.manifest['audio']['coverage_s']=[0,.1]
        with self.assertRaises(av.a.ReviewError):av.payload(self.manifest)


class StreamTimingTests(unittest.TestCase):
    def test_unknown_nonfinite_or_inconsistent_timing_rejected(self):
        valid={'duration_ts':1000,'time_base':'1/1000','duration':'1.000000'}
        for invalid in ({},dict(valid,duration='nan'),dict(valid,duration_ts=0),
                        dict(valid,time_base='0/0'),dict(valid,duration='1.1'),
                        dict(valid,duration_ts='1000'),dict(valid,duration='inf')):
            with self.subTest(invalid=invalid), self.assertRaises(av.a.ReviewError):
                av.stream_timing(invalid)

class AACTailTests(unittest.TestCase):
    """Actual encoded AAC tail must never extend the visual sampling schedule."""
    def test_complete_audio_tail_and_independent_visual_extent(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);movie=root/'tail.mp4'
            av.command(['ffmpeg','-v','error','-f','lavfi','-i','color=c=blue:s=160x90:r=10:d=2',
                        '-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=2.01',
                        '-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',str(movie)])
            manifest=av.prepare(movie,av.sha(movie),root/'prepared')
            timing=manifest['movie']['stream_timing']
            self.assertEqual(timing['video']['duration_s'],2)
            self.assertAlmostEqual(timing['audio']['duration_s'],2.01,places=3)
            self.assertEqual([f['time_s'] for f in manifest['frames']],[0,1])
            self.assertGreater(manifest['audio']['duration_s'],2)
            # Independent untrimmed decoding, including the codec's decoded tail.
            full=root/'full.wav'
            av.command(['ffmpeg','-v','error','-i',str(movie),'-map','0:a:0','-vn','-c:a','pcm_s16le','-ar','48000',str(full)])
            self.assertEqual(av.sha(full),manifest['audio']['sha256'])
            body=av.payload(manifest)
            content=body['messages'][1]['content']
            encoded=next(x['input_audio']['data'] for x in content if x['type']=='input_audio')
            self.assertEqual(base64.b64decode(encoded.split(',',1)[1]),full.read_bytes())
            self.assertEqual(sum(x['type']=='image_url' for x in content),2)
            manifest['movie']['stream_timing']['video']['duration_s']=2.01
            with self.assertRaises(av.a.ReviewError):av.payload(manifest)
            manifest['schema_version']=1
            with self.assertRaisesRegex(av.a.ReviewError,'Reprepare legacy'):av.payload(manifest)



class FixedConfigTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        self.script=self.root/'scripts'/'audio_review.py';self.script.parent.mkdir();self.script.write_text('')
    def tearDown(self):self.tmp.cleanup()
    def config(self,value):
        p=self.root/'.env';p.write_text(value);p.chmod(0o600);return p
    def test_missing_key_is_optional_skip(self):
        self.assertIsNone(av.a.load_project_key(self.script))
        self.assertEqual(av.a.skipped_not_configured()['status'],'SKIPPED_NOT_CONFIGURED')
    def test_empty_and_placeholder_are_skip(self):
        for v in ['', 'DASHSCOPE_API_KEY=', 'DASHSCOPE_API_KEY=YOUR_API_KEY']:
            self.config(v);self.assertIsNone(av.a.load_project_key(self.script))
    def test_fixed_root_independent_of_cwd_and_env(self):
        self.config('DASHSCOPE_API_KEY=synthetic-fixed')
        with patch.dict(av.os.environ,{'DASHSCOPE_API_KEY':'synthetic-foreign'}),patch.object(Path,'cwd',return_value=Path('/tmp')):
            self.assertEqual(av.a.load_project_key(self.script),'synthetic-fixed')
    def test_portable_layout_resolves_skill_root(self):
        p=self.root/'runtime'/'review-tools'/'audio_review.py';p.parent.mkdir(parents=True);p.write_text('')
        self.assertEqual(av.a.project_root(p),self.root)
    def test_unknown_layout_no_search(self):
        with self.assertRaises(av.a.ReviewError):av.a.project_root(self.root/'unknown'/'audio_review.py')
    def test_unsafe_permissions_refused(self):
        p=self.config('DASHSCOPE_API_KEY=synthetic');p.chmod(0o644)
        with self.assertRaises(av.a.ReviewError):av.a.load_project_key(self.script)
    def test_duplicate_keys_refused(self):
        self.config('DASHSCOPE_API_KEY=one\nDASHSCOPE_API_KEY=two')
        with self.assertRaises(av.a.ReviewError):av.a.load_project_key(self.script)
    def test_symlink_config_refused(self):
        target=self.root/'private';target.write_text('synthetic');target.chmod(0o600)
        (self.root/'.env').symlink_to(target)
        with self.assertRaises(av.a.ReviewError):av.a.load_project_key(self.script)

if __name__=='__main__':unittest.main()
