#!/usr/bin/env python3
"""Entirely synthetic schema/identity fixtures; not execution or production evidence."""
import copy
import hashlib
import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('knowledge', Path(__file__).with_name('video_knowledge.py'))
k = importlib.util.module_from_spec(spec)
spec.loader.exec_module(k)
s = k.static_module()


def fixture(root, assets):
    """No probe is executed. Run labels below are deliberately fictional test data."""
    root.mkdir(); assets.mkdir()
    payloads = {'script.py': b'# synthetic fixture only; never executed\n',
                'result.json': b'{"synthetic": true}\n',
                'before.json': b'{"pixel": 5}\n', 'after.json': b'{"pixel": 0}\n',
                'alternative.json': b'{"pixel": 1}\n'}
    for filename, payload in payloads.items():
        (assets / filename).write_bytes(payload)
    def artifact(i, role, filename):
        return {'id': i, 'role': role, 'filename': filename, 'sha256': hashlib.sha256(payloads[filename]).hexdigest(),
                'media_type': 'text/x-python' if role=='script' else 'application/json', 'origin':'synthetic', 'width':None, 'height':None}
    artifacts = [artifact('script', 'script', 'script.py'), artifact('receipt', 'result', 'result.json')]
    variants, observations, refs = [], [], []
    for name, value in [('before',5),('after',0),('alternative',1)]:
        artifacts.append(artifact(name,'output',name+'.json'))
        variants.append({'id':name,'parameters':{'method':name,'alpha':1},'output_artifact_ids':[name],'reference_semantics':'synthetic-reference'})
        observations.append({'id':'obs-'+name,'type':'static-measurement','run_id':'fixture-run','variant_id':name,'artifact_ids':[name],
            'method':'static-pixel-probe','provenance':'instrument-measurement','access_method':'receipt-ingestion',
            'claim':'synthetic-zero-channel','reference_semantics':'synthetic-reference','statement':'Fictional parser fixture, no actual probe.',
            'scope':'Synthetic test only.','result_locator':'/fictional/'+name,'assertion':None,'metrics':[{'name':'channel','value':value,'unit':'8bit-channel','reference_value':0,'tolerance':0,'sample_count':4,'selection':'four fictional pixels'}],
            'outcome':'supports' if value==0 else 'contradicts'})
        refs.append({'id':'E-'+name,'kind':'static-observation','case_id':'case-static-fixture','case_revision':1,
            'observation_id':'obs-'+name,'run_id':'fixture-run','artifact_ids':[name],'artifact_hashes':{name:artifacts[-1]['sha256']}})
    d={'schema_version':2,'lifecycle':'active','problem':{'symptom':'synthetic edge test','goal':'Exercise contract, not certify a real result.','hard_constraints':[],'preserve':[]},
       'options':[{'id':v['id'],'variant_id':v['id'],'action':'Synthetic choice '+v['id'],'cost':'Fixture only.','risks':['No real validation.']} for v in variants],
       'chosen_option_id':'after','rationale':'Synthetic fixture only.','experiment':{'baseline_variant_id':'before','candidate_variant_id':'after',
       'varied_parameters':['method'],'control_validity':'valid','confounders':[],'protocol':'Do not execute this fixture.','acceptance':'Schema consistency only.','stop_condition':'Stop after parser test.','regression_scope':['Synthetic scope.']},
       'evidence_refs':refs,'result':{'scope_kind':'synthetic-static-technical','claim':'synthetic-zero-channel','reference_semantics':'synthetic-reference','outcome':'supports','evidence_ids':['E-before','E-after'],'owner_feedback_refs':[]},
       'applies_when':'Only test fixtures.','counterexample':'All actual production.','not_verified':['No real execution, observation, listening or approval.'],
       'permission_semantics':'informational-only-not-authorization'}
    c={'schema_version':2,'kind':'case','id':'case-static-fixture','revision':1,'title':'Synthetic test-only record; not actual execution',
       'status':'recorded-with-limits','tags':['synthetic-edge'],'revision_note':'Entirely fictional run labels to test validators.','supersedes':[],
       'source':{'origin':'synthetic','creator':'Test fixture','title':'No actual probe','rights':'No rights or permissions asserted.','access':'Local temporary fixture.'},
       'artifact':{'kind':'static-probe'},'run':{'id':'fixture-run','execution_state':'recorded-executed','execution_evidence':'recorded-receipt',
       'recorded_at':'2026-01-01T00:00:00Z','executed_at':None,'executed_at_unknown_reason':'Fictional test label, no execution time.',
       'exit_code':None,'exit_code_unknown_reason':'No actual execution.','script_artifact_id':'script','result_artifact_id':'receipt','input_artifact_ids':[],
       'environment':{'runtime':'synthetic','runtime_version':'fixture','backend':'synthetic','backend_version':'fixture','os':'synthetic','arch':'synthetic'},
       'parameters':{'width':2,'height':2},'variants':variants},'artifacts':artifacts,'observations':observations,'technique_ids':[],'feedback':[],'decision':d}
    index={'schema_version':2,'capabilities':[s.CAPABILITY],'scope':'Synthetic parser fixture only.','cases':[{'id':c['id'],'path':'cases/static.json','tags':c['tags']}],'techniques':[]}
    (root/'cases').mkdir();(root/'cases/static.json').write_text(json.dumps(c));(root/'index.json').write_text(json.dumps(index))
    return c


class StaticTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.base=Path(self.tmp.name);self.root=self.base/'library';self.assets=self.base/'assets'
        fixture(self.root,self.assets)
    def tearDown(self):self.tmp.cleanup()
    def edit(self,fn):
        p=self.root/'cases/static.json';c=json.loads(p.read_text());fn(c);p.write_text(json.dumps(c))
    def bad(self):self.assertTrue(k.validate(self.root)[0])
    def valid(self):
        errors,cards=k.validate(self.root);self.assertEqual(errors,[]);return cards
    def test_recorded_label_and_alternatives(self):
        r=k.decide(self.valid(),text='synthetic edge');item=r['recommendations'][0]
        self.assertEqual(item['recommendation_type'],'recorded-synthetic-static-support')
        self.assertEqual(len(item['alternatives']),2);self.assertIn('not independently certified',item['warning'])
    def test_no_match(self):self.assertEqual(k.decide(self.valid(),text='missing')['status'],'no-match')
    def test_no_timed_fields(self):
        for field in ('duration_seconds','range_seconds'):
            with self.subTest(field=field):
                self.edit(lambda c:c['observations'][0].update({field:1}));self.bad()
                self.edit(lambda c:c['observations'][0].pop(field))
    def test_no_listening(self):self.edit(lambda c:c['observations'][0].update(method='actual-listening'));self.bad()
    def test_no_production_origin(self):self.edit(lambda c:c['source'].update(origin='original-production'));self.bad()
    def test_unknown_fields(self):self.edit(lambda c:c['run'].update(extra=True));self.bad()
    def test_unknown_version(self):self.edit(lambda c:c['decision'].update(schema_version=3));self.bad()
    def test_missing_capability(self):
        p=self.root/'index.json';x=json.loads(p.read_text());x['capabilities']=[];p.write_text(json.dumps(x));self.bad()
    def test_v1_index_rejects_v2_case(self):
        p=self.root/'index.json';x=json.loads(p.read_text());x.update(schema_version=1,legacy=[]);p.write_text(json.dumps(x));self.bad()
    def test_unknown_time_and_exit_require_reason(self):self.edit(lambda c:c['run'].update(exit_code_unknown_reason=None));self.bad()
    def test_timestamp_requires_zone(self):self.edit(lambda c:c['run'].update(recorded_at='2026-01-01'));self.bad()
    def test_nonzero_exit_not_success(self):self.edit(lambda c:c['run'].update(exit_code=1,exit_code_unknown_reason=None));self.bad()
    def test_planned_cannot_claim_execution(self):self.edit(lambda c:c['run'].update(execution_state='planned'));self.bad()
    def test_direct_run_requires_rerun_receipt(self):self.edit(lambda c:c['observations'][0].update(access_method='direct-run'));self.bad()
    def test_script_identity_missing(self):self.edit(lambda c:c['run'].update(script_artifact_id='missing'));self.bad()
    def test_result_identity_missing(self):self.edit(lambda c:c['run'].update(result_artifact_id='missing'));self.bad()
    def test_duplicate_output_variant(self):self.edit(lambda c:c['run']['variants'][1].update(output_artifact_ids=['before']));self.bad()
    def test_unknown_variant(self):self.edit(lambda c:c['observations'][0].update(variant_id='missing'));self.bad()
    def test_observation_wrong_output(self):self.edit(lambda c:c['observations'][0].update(artifact_ids=['after']));self.bad()
    def test_wrong_hash(self):self.edit(lambda c:c['decision']['evidence_refs'][0]['artifact_hashes'].update(before='0'*64));self.bad()
    def test_wrong_revision(self):self.edit(lambda c:c['decision']['evidence_refs'][0].update(case_revision=2));self.bad()
    def test_wrong_run(self):self.edit(lambda c:c['decision']['evidence_refs'][0].update(run_id='other'));self.bad()
    def test_cross_case_not_supported(self):self.edit(lambda c:c['decision']['evidence_refs'][0].update(case_id='case-other'));self.bad()
    def test_same_variant_not_a_comparison(self):self.edit(lambda c:c['decision']['experiment'].update(candidate_variant_id='before'));self.bad()
    def test_undeclared_difference(self):self.edit(lambda c:c['run']['variants'][1]['parameters'].update(alpha=.5));self.bad()
    def test_mixed_reference_semantics(self):self.edit(lambda c:c['run']['variants'][1].update(reference_semantics='other'));self.bad()
    def test_mixed_claims(self):self.edit(lambda c:c['decision']['result'].update(claim='other'));self.bad()
    def test_one_sided_evidence(self):self.edit(lambda c:c['decision']['result'].update(evidence_ids=['E-after']));self.bad()
    def test_numeric_support_must_match(self):self.edit(lambda c:c['observations'][1]['metrics'][0].update(value=9));self.bad()
    def test_numeric_metric_types(self):
        for value in (float('nan'),float('inf'),True):
            with self.subTest(value=value):self.edit(lambda c:c['observations'][1]['metrics'][0].update(value=value));self.bad()
    def test_invalid_control_cannot_support(self):self.edit(lambda c:c['decision']['experiment'].update(control_validity='invalid',confounders=['Multiple changes.']));self.bad()
    def test_withdrawn_and_stale_hidden(self):
        for state in ('withdrawn','stale'):
            self.edit(lambda c:c['decision'].update(lifecycle=state));r=k.decide(self.valid());self.assertEqual(r['recommendations'],[])
    def test_no_owner_feedback(self):self.edit(lambda c:c['feedback'].append({'result':'accepted'}));self.bad()
    def test_no_permission_inheritance(self):self.edit(lambda c:c['decision'].update(permission_semantics='approved'));self.bad()
    def test_retrieved_command_not_executed(self):
        target=self.base/'not-created';self.edit(lambda c:c['decision']['options'][1].update(action='touch '+str(target)))
        k.decide(self.valid());self.assertFalse(target.exists())
    def test_path_rejection(self):
        for name in ('../outside','/etc/passwd','a/../b','a//b','C:/file','a\\b'):
            with self.subTest(name=name):self.edit(lambda c:c['artifacts'][0].update(filename=name));self.bad()
    def test_verify_hashes(self):
        r=s.verify_artifacts(self.valid(),self.assets);self.assertEqual(r['status'],'checked');self.assertFalse(r['execution_certified'])
    def test_verify_mismatch_and_missing(self):
        (self.assets/'after.json').write_text('changed');(self.assets/'before.json').unlink()
        r=s.verify_artifacts(self.valid(),self.assets);self.assertEqual(r['status'],'stale')
        states={x['status'] for x in r['cases'][0]['artifacts']};self.assertTrue({'mismatch','missing'}<=states)
    def test_verify_symlink_file(self):
        (self.assets/'after.json').unlink();(self.assets/'after.json').symlink_to(self.assets/'before.json')
        self.assertEqual(s.verify_artifacts(self.valid(),self.assets)['status'],'stale')
    def test_verify_symlink_root(self):
        alias=self.base/'alias';alias.symlink_to(self.assets,target_is_directory=True)
        self.assertEqual(s.verify_artifacts(self.valid(),alias)['status'],'blocked')
    def test_verify_symlink_directory(self):
        (self.assets/'alias').symlink_to(self.assets,target_is_directory=True)
        self.edit(lambda c:c['artifacts'][0].update(filename='alias/script.py'))
        self.assertEqual(s.verify_artifacts(self.valid(),self.assets)['status'],'stale')
    def test_verify_budgets(self):
        for file_limit,total_limit in ((1,1000),(1000,1)):
            self.assertEqual(s.verify_artifacts(self.valid(),self.assets,file_limit,total_limit)['status'],'stale')
    def test_verify_directory_not_file(self):
        (self.assets/'after.json').unlink();(self.assets/'after.json').mkdir()
        self.assertEqual(s.verify_artifacts(self.valid(),self.assets)['status'],'stale')
    def test_mutation_during_read(self):
        original=s.os.read;mutated=False
        def mutate(fd,n):
            nonlocal mutated
            data=original(fd,n)
            if data and not mutated:
                mutated=True
                with (self.assets/'script.py').open('ab') as f:f.write(b'# changed\n')
            return data
        with patch.object(s.os,'read',side_effect=mutate):r=s.verify_artifacts(self.valid(),self.assets)
        self.assertEqual(r['status'],'stale')
    def test_same_output_file_cannot_impersonate_two_variants(self):
        def change(c):
            before,after=c['artifacts'][2:4]
            after.update(filename=before['filename'],sha256=before['sha256'])
            c['decision']['evidence_refs'][1]['artifact_hashes']['after']=before['sha256']
        self.edit(change);self.bad()
    def test_status_cannot_disguise_failed_run(self):
        self.edit(lambda c:c.update(status='failed'));self.bad()
    def test_failed_run_cannot_have_supporting_observations(self):
        def change(c):
            c['status']='failed';c['run']['execution_state']='failed'
            c['decision']['result'].update(outcome='inconclusive')
        self.edit(change);self.bad()
    def test_result_locator_required(self):
        self.edit(lambda c:c['observations'][0].update(result_locator=''));self.bad()
    def test_code_assertion_consistency(self):
        def change(c):
            c['observations'][1].update(type='code-assertion',method='code-test',assertion={'expected':0,'actual':0,'passed':True})
        self.edit(change);self.valid()
        self.edit(lambda c:c['observations'][1]['assertion'].update(actual=1));self.bad()
    def test_assertions_do_not_conflate_booleans_and_numbers(self):
        for expected,actual in [(False,0),([False],[0]),({'value':True},{'value':1})]:
            with self.subTest(expected=expected):
                self.edit(lambda c:c['observations'][1].update(type='code-assertion',method='code-test',assertion={'expected':expected,'actual':actual,'passed':True}))
                self.bad()
    def test_unselected_counterevidence_cannot_be_omitted(self):
        def change(c):
            o=copy.deepcopy(c['observations'][1]);o.update(id='omitted',outcome='contradicts')
            o['metrics'][0]['value']=9;c['observations'].append(o)
        self.edit(change);self.bad()
    def test_metric_units_and_sample_counts(self):
        for field,value in [('unit','seconds'),('value',256),('sample_count',True),('sample_count',0),('value',10**400)]:
            with self.subTest(field=field,value=value):
                original=(self.root/'cases/static.json').read_text()
                self.edit(lambda c:c['observations'][1]['metrics'][0].update({field:value}));self.bad()
                (self.root/'cases/static.json').write_text(original)
    def test_contradiction_needs_numeric_criterion(self):
        self.edit(lambda c:c['observations'][0]['metrics'][0].update(reference_value=None));self.bad()
    def test_static_stale_case_and_candidate_hidden(self):
        self.add_technique();self.edit(lambda c:c.update(status='stale'))
        cards=self.valid();self.assertEqual(k.query(cards),[])
        self.assertEqual(len(k.query(cards,status='stale')),1)
        self.assertEqual(k.decide(cards)['recommendations'],[])
    def test_static_withdrawn_dependency_hidden(self):
        self.add_technique();self.edit(lambda c:c['decision'].update(lifecycle='withdrawn'))
        self.assertEqual(k.query(self.valid()),[])
    def test_index_non_object_diagnostic(self):
        (self.root/'index.json').write_text('[]');self.bad()
    def test_valid_planned_record_has_no_observations(self):
        def change(c):
            c['status']='planned';c['run'].update(execution_state='planned',execution_evidence='none',result_artifact_id=None)
            c['observations']=[];c['decision']['evidence_refs']=[]
            c['decision']['result'].update(outcome='not-tested',evidence_ids=[])
            c['artifacts']=[a for a in c['artifacts'] if a['role']=='script']
            for v in c['run']['variants']:v['output_artifact_ids']=[]
        self.edit(change);self.assertEqual(k.decide(self.valid())['recommendations'][0]['outcome'],'not-tested')
    def add_technique(self):
        c=json.loads((self.root/'cases/static.json').read_text())
        t={'schema_version':1,'kind':'technique','id':'tech-static-fixture','revision':1,'title':'Synthetic candidate only','status':'hypothesis','tags':['synthetic-edge'],'claim_type':'inferred','hypothesis':'Fixture only','evidence':[{'case_id':c['id'],'observation_ids':['obs-after']}],'applies_when':'Tests','limits':'No production','counterexample':'Real production','falsification_test':'Fixture mutation','validation':{'state':'not-tested-in-transfer','results':[]},'rule_level':'candidate','revision_note':'Fixture only','supersedes':[]}
        (self.root/'techniques').mkdir();(self.root/'techniques/fixture.json').write_text(json.dumps(t))
        p=self.root/'index.json';x=json.loads(p.read_text());x['techniques']=[{'id':t['id'],'path':'techniques/fixture.json','tags':t['tags']}];p.write_text(json.dumps(x))
        return t
    def test_static_candidate_allowed(self):self.add_technique();self.valid()
    def test_static_production_promotion_rejected(self):
        t=self.add_technique();t.update(rule_level='tested-in-scope',status='tested-with-limits');t['validation']={'state':'tested-with-limits','results':[{'case_id':'case-static-fixture','outcome':'supports'}]}
        (self.root/'techniques/fixture.json').write_text(json.dumps(t));self.bad()
    def test_static_method_query(self):self.assertEqual(len(k.query(self.valid(),method='static-pixel-probe')),1)

if __name__=='__main__':unittest.main()
