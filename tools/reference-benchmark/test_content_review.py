import copy
import json
from pathlib import Path
import shutil
import tempfile
import unittest
import wave

import content_review as cr


class ContentReviewTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.base = Path(self.tmp.name)
        path = self.base / 'tone.wav'
        with wave.open(str(path), 'wb') as f:
            f.setnchannels(1); f.setsampwidth(2); f.setframerate(8000)
            f.writeframes(b'\0\0' * 8000)
        self.review = {'schema_version':'1.0','is_synthetic_example':False,'mode':'original','status':'partial','assets':[{'id':'asset','role':'candidate','path':'tone.wav','sha256':cr.sha256(path),'version':'test'}],'targets':[],'evidence':[{'id':'ev','asset_id':'asset','interval':{'start_s':0,'end_s':0.5},'modality':'audio','provenance':'human_observation','description':'Test fixture only; no real review claim.','locator':'fixture','confidence':'unknown','confidence_reason':'test fixture','ambiguity':[]}],'events':[{'id':'event','asset_id':'asset','interval':{'start_s':0,'end_s':0.5},'epistemic_status':'observed','actor_ids':[],'action':'test','patient_ids':[],'state_before':'','state_after':'','evidence_ids':['ev']}],'relations':[],'issues':[],'audience_questions':[]}
    def tearDown(self): self.tmp.cleanup()
    def check(self, review=None, synthetic=False):
        return cr.validate(review or self.review, self.base, synthetic)
    def test_real_binding_and_unknown_semantics(self):
        result=self.check(); self.assertTrue(result['valid'],result['errors'])
        self.assertIsNone(result['audio_visual_semantic_assessment'])
        self.assertIsNone(result['overall_quality_score'])
        self.assertFalse(result['assessment_performed'])
    def test_wrong_hash(self):
        self.review['assets'][0]['sha256']='0'*64
        self.assertFalse(self.check()['valid'])
    def test_changed_bytes(self):
        with (self.base/'tone.wav').open('ab') as f: f.write(b'changed')
        self.assertFalse(self.check()['valid'])
    def test_duplicate_id(self):
        self.review['events'][0]['id']='ev'; self.assertFalse(self.check()['valid'])
    def test_missing_reference(self):
        self.review['events'][0]['evidence_ids']=['missing']; self.assertFalse(self.check()['valid'])
    def test_reverse_interval(self):
        self.review['events'][0]['interval']={'start_s':0.8,'end_s':0.1}; self.assertFalse(self.check()['valid'])
    def test_beyond_duration(self):
        self.review['evidence'][0]['interval']['end_s']=2; self.assertFalse(self.check()['valid'])
    def test_nonfinite_interval(self):
        self.review['evidence'][0]['interval']['end_s']=float('nan'); self.assertFalse(self.check()['valid'])
    def test_planned_is_not_observed(self):
        self.review['evidence'][0]['provenance']='planned'; self.assertFalse(self.check()['valid'])
    def test_synthetic_evidence_real_mode(self):
        self.review['evidence'][0]['provenance']='synthetic'; self.assertFalse(self.check()['valid'])
    def test_visual_claim_without_video(self):
        self.review['evidence'][0]['modality']='visual'; self.assertFalse(self.check()['valid'])
    def test_unbound_time_evidence(self):
        self.review['events'][0]['interval']={'start_s':0.8,'end_s':0.9}; self.assertFalse(self.check()['valid'])
    def test_schema_extra_property(self):
        self.review['invented_quality_score']=98; self.assertFalse(self.check()['valid'])
    def test_synthetic_cannot_enter_real_mode(self):
        ex=json.loads((cr.DEFAULT_SCHEMA.parent/'example.synthetic.json').read_text())
        self.assertFalse(self.check(ex)['valid'])
        self.assertTrue(self.check(ex,True)['valid'])
    def test_html_and_json_cli(self):
        p=self.base/'review.json'; p.write_text(json.dumps(self.review))
        self.assertEqual(cr.main([str(p),'--output-json',str(self.base/'summary.json'),'--output-html',str(self.base/'report.html')]),0)
        self.assertIn('未执行视频语义实测',(self.base/'report.html').read_text())
        self.assertIsNone(json.loads((self.base/'summary.json').read_text())['overall_quality_score'])


if __name__ == '__main__': unittest.main()
