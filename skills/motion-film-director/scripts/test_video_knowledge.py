#!/usr/bin/env python3
"""Mutation fixtures: structural evidence checks, not artistic validation."""
import importlib.util
import json
import hashlib
import tempfile
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('knowledge',Path(__file__).with_name('video_knowledge.py'))
k=importlib.util.module_from_spec(spec);spec.loader.exec_module(k)
class KnowledgeTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.base=Path(self.tmp.name)/'skill'; self.root=self.base/'research/video-knowledge'
        # Entirely synthetic in-memory metadata; no source media or production case is read.
        case = {
            'schema_version':1, 'kind':'case', 'id':'case-synthetic', 'revision':1,
            'title':'Synthetic structural fixture, not an observed film', 'status':'observed-with-limits',
            'tags':['rhythm'], 'revision_note':'Fictional test data only', 'supersedes':[],
            'source':{'origin':'external-reference', 'creator':'Synthetic fixture', 'title':'Fictional media',
                      'url':'https://example.org/synthetic', 'media_url':'https://example.org/synthetic.mp4',
                      'sha256':hashlib.sha256(b'synthetic fixture, not media').hexdigest(), 'duration_seconds':2,
                      'rights':'Fictional fixture; no asset permission is asserted', 'access':'No media exists or is downloaded'},
            'inspection':{'methods':['dense-frames'], 'coverage':'Synthetic method label for validation tests only', 'not_verified':['All real perception']},
            'observations':[{'id':'O1','range_seconds':[0,1],'claim_type':'observed','statement':'Fictional observation for schema test'}],
            'interpretations':[{'claim_type':'inferred','alternative':'Synthetic alternative','evidence':['O1']}],
            'technique_ids':['tech-synthetic'], 'feedback':[]}
        technique = {
            'schema_version':1,'kind':'technique','id':'tech-synthetic','revision':1,'title':'Synthetic hypothesis',
            'status':'hypothesis','tags':['rhythm'],'claim_type':'inferred','hypothesis':'Fixture only',
            'evidence':[{'case_id':'case-synthetic','observation_ids':['O1']}],
            'applies_when':'Test only','limits':'No actual observation','counterexample':'Synthetic counterexample',
            'falsification_test':'Mutation fixture','rule_level':'candidate',
            'validation':{'state':'not-tested-in-transfer','results':[]},'revision_note':'Synthetic data','supersedes':[]}
        index={'schema_version':1,'cases':[{'id':case['id'],'path':'cases/synthetic.json','tags':case['tags']}],
               'techniques':[{'id':technique['id'],'path':'techniques/synthetic.json','tags':technique['tags']}], 'legacy':[]}
        for rel,data in [('cases/synthetic.json',case),('techniques/synthetic.json',technique),('index.json',index)]:
            path=self.root/rel;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data))
    def tearDown(self): self.tmp.cleanup()
    def edit(self,path,fn):
        p=self.root/path;c=json.loads(p.read_text());fn(c);p.write_text(json.dumps(c))
    def bad(self): self.assertTrue(k.validate(self.root)[0])
    def test_public_default_is_empty(self):
        errors,cards=k.validate(k.DEFAULT_ROOT)
        self.assertEqual(errors,[]); self.assertEqual(cards,{})
        self.assertEqual(k.query(cards),[])
    def test_valid_and_bounded_query(self):
        errors,cards=k.validate(self.root);self.assertEqual(errors,[])
        self.assertEqual(len(k.query(cards,['rhythm'],kind='technique',limit=1)),1)
        self.assertEqual(k.query(cards,['nonexistent']),[])
    def test_method_filter_does_not_invent_listening(self):
        errors,cards=k.validate(self.root);self.assertEqual(errors,[])
        self.assertEqual(k.query(cards,method='actual-listening'),[])
        self.assertTrue(k.query(cards,method='dense-frames',rule_level='candidate'))
    def test_withdrawn_hidden_unless_requested(self):
        errors,cards=k.validate(self.root)
        cards['tech-synthetic']['status']='withdrawn'
        self.assertFalse(any(c['id']=='tech-synthetic' for c in k.query(cards,limit=10)))
        self.assertEqual(k.query(cards,status='withdrawn')[0]['id'],'tech-synthetic')
    def test_broken_related_case_ref(self):
        self.edit('cases/synthetic.json',lambda c:c.update(related_case_ids=['case-missing']));self.bad()
    def test_broken_case_ref(self):
        self.edit('techniques/synthetic.json',lambda c:c['evidence'][0].update(case_id='case-missing'));self.bad()
    def test_broken_observation_ref(self):
        self.edit('techniques/synthetic.json',lambda c:c['evidence'][0].update(observation_ids=['O99']));self.bad()
    def test_time_beyond_duration(self):
        self.edit('cases/synthetic.json',lambda c:c['observations'][0].update(range_seconds=[0,30]));self.bad()
    def test_nonfinite_time(self):
        self.edit('cases/synthetic.json',lambda c:c['observations'][0].update(range_seconds=[0,float('nan')]));self.bad()
    def test_claim_type_mismatch(self):
        self.edit('cases/synthetic.json',lambda c:c['observations'][0].update(claim_type='inferred'));self.bad()
    def test_inference_without_alternative(self):
        self.edit('cases/synthetic.json',lambda c:c['interpretations'][0].update(alternative=''));self.bad()
    def test_media_rejected(self):
        (self.root/'cases/video.mp4').write_bytes(b'\x00\x00ftypisom');self.bad()
    def test_disguised_binary_rejected(self):
        (self.root/'cases/frame.md').write_bytes(b'\x89PNG\r\n');self.bad()
    def test_internal_locator_rejected(self):
        self.edit('cases/synthetic.json',lambda c:c.update(revision_note='libfile_deadbeef'));self.bad()
    def test_unindexed_card(self):
        (self.root/'cases/unindexed.json').write_text('{}');self.bad()
    def test_index_path_escape(self):
        self.edit('index.json',lambda c:c['cases'][0].update(path='../../outside.json'));self.bad()
    def test_unsupported_promotion(self):
        self.edit('techniques/synthetic.json',lambda c:c.update(rule_level='reusable-in-scope'));self.bad()
    def test_unverified_no_fake_observations(self):
        self.edit('cases/synthetic.json',lambda c:c.update(status='unverified'));self.bad()
    def test_duplicate_index(self):
        self.edit('index.json',lambda c:c['cases'].append(c['cases'][0]));self.bad()
    def test_unknown_method(self):
        self.edit('cases/synthetic.json',lambda c:c['inspection'].update(methods=['guessed-listening']));self.bad()
if __name__=='__main__': unittest.main()
