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
class DecisionTests(unittest.TestCase):
    edit = KnowledgeTests.edit
    bad = KnowledgeTests.bad
    tearDown = KnowledgeTests.tearDown

    def setUp(self):
        KnowledgeTests.setUp(self)
        example=k.DEFAULT_ROOT.parent.parent/'references/knowledge-decision-example/cases/plan.json'
        self.decision=json.loads(example.read_text())['decision']
        self.edit('cases/synthetic.json',lambda c:c.update(decision=self.decision))
    def change(self,fn):
        self.edit('cases/synthetic.json',lambda c:fn(c['decision']))
    def test_synthetic_example_is_unexecuted(self):
        root=k.DEFAULT_ROOT.parent.parent/'references/knowledge-decision-example'
        errors,cards=k.validate(root);self.assertEqual(errors,[])
        result=k.decide(cards,['masking'])
        self.assertEqual(result['recommendations'][0]['outcome'],'not-tested')
        self.assertEqual(result['recommendations'][0]['bindings'],[])
        self.assertEqual(cards['case-synthetic-decision-plan']['source']['origin'],'synthetic')
    def test_decision_query_and_no_match(self):
        errors,cards=k.validate(self.root);self.assertEqual(errors,[])
        self.assertEqual(k.decide(cards,['rhythm'])['status'],'matched')
        self.assertEqual(k.decide(cards,['absent'])['status'],'no-match')
    def test_unknown_nested_fields_rejected(self):
        self.change(lambda d:d['experiment'].update(execute_shell='echo nope'));self.bad()
    def test_unknown_extension_version(self):
        self.change(lambda d:d.update(schema_version=2));self.bad()
    def test_permission_is_not_authorization(self):
        self.change(lambda d:d.update(permission_semantics='authorize-download'));self.bad()
    def test_text_is_never_executed(self):
        marker=Path(self.tmp.name)/'must-not-exist'
        self.change(lambda d:d['options'][0].update(action=f'touch {marker}'))
        errors,cards=k.validate(self.root);self.assertEqual(errors,[])
        self.assertEqual(k.decide(cards,text='touch')['status'],'matched')
        self.assertFalse(marker.exists())
    def tested(self):
        candidate=json.loads((self.root/'cases/synthetic.json').read_text())
        candidate.pop('decision',None)
        candidate.update(id='case-synthetic-candidate',technique_ids=[])
        candidate['source']['sha256']=hashlib.sha256(b'synthetic candidate').hexdigest()
        (self.root/'cases/candidate.json').write_text(json.dumps(candidate))
        self.edit('index.json',lambda i:i['cases'].append({'id':candidate['id'],'path':'cases/candidate.json','tags':candidate['tags']}))
        def modify(d):
            digest=hashlib.sha256(b'synthetic fixture, not media').hexdigest()
            d['bindings']=[{'id':'baseline','role':'baseline','sha256':digest,'version':'fixture-v1','origin':'synthetic'},
                           {'id':'candidate','role':'candidate','sha256':hashlib.sha256(b'synthetic candidate').hexdigest(),'version':'fixture-v2','origin':'synthetic'}]
            d['experiment'].update(baseline_binding='baseline',candidate_binding='candidate',control_validity='valid')
            d['evidence_refs']=[{'id':'E1','kind':'case-observation','case_id':'case-synthetic','case_revision':1,'record_id':'O1','binding_id':'baseline','method':'dense-frames','provenance':'human-observation'}]
            d['evidence_refs'].append(dict(d['evidence_refs'][0],id='E2',case_id='case-synthetic-candidate',binding_id='candidate'))
            d['result'].update(outcome='supports',evidence_ids=['E1','E2'])
        self.change(modify)
    def test_tested_structural_fixture(self):
        self.tested();self.assertEqual(k.validate(self.root)[0],[])
    def test_invalid_control_preserves_inconclusive(self):
        self.tested()
        self.change(lambda d:d['experiment'].update(control_validity='invalid',confounders=['Different encoding.']))
        self.bad()
        self.change(lambda d:d['result'].update(outcome='inconclusive'))
        self.assertEqual(k.validate(self.root)[0],[])
    def test_hash_mismatch(self):
        self.tested();self.change(lambda d:d['bindings'][0].update(sha256='0'*64));self.bad()
    def test_revision_mismatch(self):
        self.tested();self.change(lambda d:d['evidence_refs'][0].update(case_revision=2));self.bad()
    def test_fake_listening_method(self):
        self.tested();self.change(lambda d:d['evidence_refs'][0].update(method='actual-listening'));self.bad()
    def test_fake_listening_provenance(self):
        self.tested()
        self.edit('cases/synthetic.json',lambda c:c['inspection']['methods'].append('actual-listening'))
        self.change(lambda d:d['evidence_refs'][0].update(method='actual-listening',provenance='instrument-measurement'));self.bad()
    def test_falsified_and_withdrawn_are_counterevidence(self):
        self.tested()
        self.change(lambda d:(d.update(lifecycle='falsified'),d['result'].update(outcome='contradicts')))
        errors,cards=k.validate(self.root);self.assertEqual(errors,[])
        result=k.decide(cards);self.assertEqual(result['recommendations'],[]);self.assertEqual(len(result['counterevidence']),1)
        for state in ('withdrawn','stale'):
            self.change(lambda d:d.update(lifecycle=state))
            errors,cards=k.validate(self.root);self.assertEqual(errors,[])
            self.assertEqual(k.decide(cards)['recommendations'],[])
    def test_withdrawn_case_not_recommended(self):
        self.edit('cases/synthetic.json',lambda c:c.update(status='withdrawn'))
        errors,cards=k.validate(self.root);self.assertEqual(errors,[])
        self.assertEqual(k.decide(cards)['recommendations'],[])
    def test_one_sided_comparison_rejected(self):
        self.tested()
        self.change(lambda d:d['result'].update(evidence_ids=['E1']))
        self.bad()
    def test_withdrawn_dependency_is_counterevidence(self):
        self.tested()
        self.edit('cases/candidate.json',lambda c:c.update(status='withdrawn'))
        errors,cards=k.validate(self.root);self.assertEqual(errors,[])
        self.assertEqual(k.decide(cards)['recommendations'],[])
    def test_unknown_top_decision_field(self):
        self.change(lambda d:d.update(confidence=0.99));self.bad()
    def test_external_refs_not_enough_for_result(self):
        self.tested()
        def modify(d):
            d['bindings'].append({'id':'review','role':'review','sha256':hashlib.sha256(b'synthetic review').hexdigest(),'version':'fixture-review-v1','origin':'synthetic'})
            for e in d['evidence_refs']: e.update(kind='content-review',binding_id='review')
        self.change(modify);self.bad()
    def test_unexecuted_cannot_claim_feedback(self):
        self.change(lambda d:d['result'].update(owner_feedback_refs=[{'case_id':'case-synthetic','case_revision':1,'feedback_index':0}]))
        self.bad()

    def feedback_case(self, status='observed-with-limits', result='accepted'):
        feedback=json.loads((self.root/'cases/candidate.json').read_text())
        feedback.update(id='case-feedback',status=status,feedback=[{'claim_type':'user-feedback','scope':'synthetic candidate','result':result,'statement':'Synthetic feedback fixture only.'}])
        (self.root/'cases/feedback.json').write_text(json.dumps(feedback))
        self.edit('index.json',lambda i:i['cases'].append({'id':feedback['id'],'path':'cases/feedback.json','tags':feedback['tags']}))
        self.change(lambda d:d['result'].update(owner_feedback_refs=[{'case_id':'case-feedback','case_revision':1,'feedback_index':0}]))
    def promote(self):
        for path in ('cases/synthetic.json','cases/candidate.json'):
            self.edit(path,lambda c:c['source'].update(origin='original-production',url=None,media_url=None,artifact_filename='synthetic.mp4'))
        self.edit('techniques/synthetic.json',lambda c:c.update(rule_level='reusable-in-scope',validation={'state':'tested-with-limits','results':[
            {'case_id':cid,'outcome':'supports','methods':['dense-frames'],'scope':'Synthetic validation declaration only.','unresolved_contradiction':False}
            for cid in ('case-synthetic','case-synthetic-candidate')]}))
    def test_withdrawn_feedback_case_is_counterevidence(self):
        self.tested();self.feedback_case(status='withdrawn',result='retracted')
        errors,cards=k.validate(self.root);self.assertEqual(errors,[])
        result=k.decide(cards);self.assertEqual(result['recommendations'],[])
        item=result['counterevidence'][0]
        self.assertEqual(item['result']['evidence_ids'],['E1','E2'])
        self.assertEqual(item['result']['owner_feedback_refs'][0]['case_revision'],1)
        self.assertTrue(item['unavailable_reasons'])
    def test_retracted_feedback_in_active_case_is_counterevidence(self):
        self.tested();self.feedback_case(result='retracted')
        errors,cards=k.validate(self.root);self.assertEqual(errors,[])
        self.assertEqual(k.decide(cards)['recommendations'],[])
    def test_inconclusive_is_proposal_not_validated(self):
        self.tested()
        self.change(lambda d:d['result'].update(outcome='inconclusive'))
        errors,cards=k.validate(self.root);self.assertEqual(errors,[])
        self.assertEqual(k.decide(cards)['recommendations'][0]['recommendation_type'],'proposed-experiment-not-validated')
    def test_synthetic_origin_cannot_supply_actual_transfer(self):
        self.tested();self.promote()
        self.edit('cases/synthetic.json',lambda c:c['source'].update(origin='synthetic'))
        errors,_=k.validate(self.root)
        self.assertTrue(any('validation must reference actual transfer case' in e for e in errors))
    def test_promotion_valid_decision_allowed(self):
        self.tested();self.promote();self.assertEqual(k.validate(self.root)[0],[])
    def test_promotion_invalid_control_inconclusive_rejected(self):
        self.tested();self.promote()
        self.change(lambda d:(d['experiment'].update(control_validity='invalid',confounders=['Different encodings.']),d['result'].update(outcome='inconclusive')))
        errors,_=k.validate(self.root)
        self.assertTrue(any('promotion contradicts linked decision' in e for e in errors))
    def test_promotion_unavailable_lifecycle_rejected(self):
        self.tested();self.promote()
        for lifecycle in ('stale','withdrawn','falsified'):
            with self.subTest(lifecycle=lifecycle):
                self.change(lambda d:(d.update(lifecycle=lifecycle),d['result'].update(outcome='contradicts' if lifecycle=='falsified' else 'supports')))
                errors,_=k.validate(self.root)
                self.assertTrue(any('promotion contradicts linked decision' in e for e in errors))
    def test_promotion_retracted_feedback_rejected(self):
        self.tested();self.promote();self.feedback_case(result='retracted')
        errors,_=k.validate(self.root)
        self.assertTrue(any('promotion contradicts linked decision' in e for e in errors))
    def test_promotion_withdrawn_evidence_rejected(self):
        self.tested();self.promote()
        self.edit('cases/candidate.json',lambda c:c.update(status='withdrawn'))
        errors,_=k.validate(self.root)
        self.assertTrue(any('promotion contradicts linked decision' in e for e in errors))
    def test_legacy_no_decision_promotion_still_valid(self):
        self.tested();self.promote()
        self.edit('cases/synthetic.json',lambda c:c.pop('decision'))
        self.assertEqual(k.validate(self.root)[0],[])

if __name__=='__main__': unittest.main()
