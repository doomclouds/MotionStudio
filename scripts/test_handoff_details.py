"""Synthetic v0.2 contract checks; no actual artifacts, approvals or scheduler."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / 'skills/ui-design-director'
spec = importlib.util.spec_from_file_location('handoff', SKILL / 'scripts/validate_handoff.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
BASE = json.loads((SKILL / 'assets/design-handoff.template.json').read_text())


def detailed():
    d = copy.deepcopy(BASE)
    d['objects'] = [{'id':'title', 'parent':None, 'bounds':{'x':0,'y':0,'width':100,'height':30}, 'anchor':{'x':0,'y':0}, 'z_order':0, 'editable_source':'scene.mjs'}]
    d['artifacts'] = [{'id':'image', 'locator':'not-opened.png', 'media_type':'image', 'sha256':'a'*64}]
    d['assets'] = [{'id':'font', 'kind':'font', 'locator':'not-opened.ttf', 'source':'Synthetic declaration', 'rights':{'status':'unknown'}, 'object_ids':['title']}]
    d['tokens'] = {'accent': {'value':'#123456', 'role':'highlight'}, 'gap': {'value':8, 'unit':'px'}}
    d['implementation'].update(asset_ids=['font'], token_ids=['accent'], object_ids=['title'], dependencies=[{'id':'model', 'kind':'model', 'locator':'model.mjs', 'sha256':'b'*64}], support_domain={'description':'Synthetic fixed layout', 'tested_scope':[], 'untested_scope':['All actual output']})
    d['motion_receipt'] = {'design_version':d['design_version'], 'consumer':'Synthetic consumer declaration', 'object_map':[{'object_id':'title','motion_object_id':'shot.title'}], 'adopted_artifacts':[{'artifact_id':'image','sha256':'a'*64}], 'used_asset_ids':['font'], 'used_token_ids':['accent'], 'deviations':[{'scope':'layout','reason':'Synthetic example','object_ids':['title']}], 'revalidation_scope':['Actual continuous viewing not performed']}
    return d


class DetailsTests(unittest.TestCase):
    def test_current_template_and_synthetic_details(self):
        self.assertEqual(module.validate(BASE), [])
        self.assertEqual(module.validate(detailed()), [])
    def test_old_version_rejected_without_mutating_input(self):
        d=copy.deepcopy(BASE);d['schema_version']='0.1';original=copy.deepcopy(d)
        self.assertIn('unsupported schema_version', module.validate(d));self.assertEqual(d,original)
    def test_asset_duplicate_and_missing_declaration(self):
        d=detailed();d['assets']*=2;self.assertTrue(module.validate(d))
        d=detailed();del d['assets'][0]['source'];self.assertTrue(module.validate(d))
    def test_rights_claim_does_not_grant_publish_permission(self):
        d=detailed();d['assets'][0]['rights']={'status':'declared_permission'};self.assertTrue(module.validate(d))
        d['assets'][0]['rights'].update(reference='Synthetic reference',scope='Synthetic scope')
        self.assertEqual(module.validate(d),[]);self.assertEqual(d['publish_permission']['status'],'not_granted')
    def test_invalid_asset_references_and_crop(self):
        d=detailed();d['assets'][0]['object_ids']=[[]];self.assertTrue(module.validate(d))
        d=detailed();d['assets'][0]['crop']={'x':0,'y':0,'width':0,'height':10};self.assertTrue(module.validate(d))
    def test_tokens_have_typed_finite_values(self):
        for token in ('red', {'value':[]}, {'value':float('nan')}, {'value':10**1000}, {'value':1,'typo':'x'}):
            d=detailed();d['tokens']['accent']=token;self.assertTrue(module.validate(d))
    def test_implementation_lists_and_references(self):
        for key,value in [('family_ids','not-list'),('asset_ids',['missing']),('token_ids',['missing']),('object_ids',['missing'])]:
            d=detailed();d['implementation'][key]=value;self.assertTrue(module.validate(d))
    def test_dependencies_identity_and_duplicates(self):
        d=detailed();del d['implementation']['dependencies'][0]['sha256'];self.assertTrue(module.validate(d))
        d['implementation']['dependencies'][0]['version']='synthetic-v1';self.assertEqual(module.validate(d),[])
        d['implementation']['dependencies']*=2;self.assertTrue(module.validate(d))
    def test_support_domain_shape_not_truth(self):
        d=detailed();d['implementation']['support_domain']['tested_scope']='everything';self.assertTrue(module.validate(d))
    def test_receipt_null_missing_and_shape(self):
        d=detailed();d['motion_receipt']=None;self.assertEqual(module.validate(d),[])
        del d['motion_receipt'];self.assertTrue(module.validate(d))
        for value in (True, [], {}, 'done'):
            d=detailed();d['motion_receipt']=value;self.assertTrue(module.validate(d))
    def test_receipt_version_and_adopted_hash_binding(self):
        d=detailed();d['motion_receipt']['design_version']='old';self.assertTrue(module.validate(d))
        d=detailed();d['artifacts'][0]['sha256']='c'*64;self.assertTrue(module.validate(d))
        d=detailed();d['motion_receipt']['adopted_artifacts'][0]['artifact_id']=[];self.assertTrue(module.validate(d))
    def test_mapping_duplicate_and_reference_errors(self):
        d=detailed();d['motion_receipt']['object_map']*=2;self.assertTrue(module.validate(d))
        d=detailed();d['motion_receipt']['object_map'][0]['object_id']=[];self.assertTrue(module.validate(d))
        d=detailed();d['motion_receipt']['used_token_ids']=['missing'];self.assertTrue(module.validate(d))
    def test_deviation_reason_and_revalidation_scope(self):
        d=detailed();d['motion_receipt']['deviations'][0]['reason']='';self.assertTrue(module.validate(d))
        d=detailed();d['motion_receipt']['revalidation_scope']=False;self.assertTrue(module.validate(d))
    def test_receipt_cannot_replace_acceptance_evidence(self):
        d=detailed();d['gates']['motion_viewing']['status']='pass';self.assertTrue(module.validate(d))
    def test_no_artifact_access_and_no_input_mutation(self):
        d=detailed();before=copy.deepcopy(d)
        from unittest.mock import patch
        with patch('builtins.open',side_effect=AssertionError('Must not open artifact')):
            self.assertEqual(module.validate(d),[])
        self.assertEqual(d,before)
    def test_malformed_nested_values_return_errors_not_exceptions(self):
        paths = [('assets',0), ('assets',0,'rights'), ('assets',0,'crop'),
                 ('tokens','accent'), ('implementation','dependencies'),
                 ('implementation','dependencies',0), ('implementation','support_domain'),
                 ('motion_receipt','object_map'), ('motion_receipt','object_map',0),
                 ('motion_receipt','adopted_artifacts',0), ('motion_receipt','deviations',0)]
        for path in paths:
            for value in (None, False, 123, 'bad', []):
                # support_domain:null explicitly represents an unknown support domain.
                if path == ('implementation','support_domain') and value is None:
                    continue
                if value == [] and path in (('implementation','dependencies'), ('motion_receipt','object_map')):
                    continue
                d=detailed();current=d
                for key in path[:-1]:current=current[key]
                current[path[-1]]=value
                self.assertTrue(module.validate(d), (path,value))

    def test_every_current_evidence_needs_nonempty_string_scope(self):
        for result in ('pass','fail','not_assessed','blocked','stale'):
            row={'id':'synthetic-review','artifact_id':'image','artifact_sha256':'a'*64,
                 'design_version':'draft-1','scope':'layout_bounds','result':result,
                 'method':'synthetic_structure_fixture','reviewer':'synthetic reviewer'}
            d=detailed();d['evidence']=[row]
            self.assertEqual(module.validate(d),[])
            for invalid in (None, '', '   ', {}, [], False, 42):
                with self.subTest(result=result,scope=invalid):
                    d=detailed();d['evidence']=[{**row,'scope':invalid}]
                    self.assertIn('evidence needs nonempty string scope',module.validate(d))
            d=detailed();d['evidence']=[dict(row)];del d['evidence'][0]['scope']
            self.assertIn('evidence needs nonempty string scope',module.validate(d))
    def test_template_does_not_fabricate_observations(self):
        self.assertEqual(BASE['evidence'],[])
        self.assertTrue(all(g['status']=='not_assessed' for g in BASE['gates'].values()))

    def test_cli_says_structure_only(self):
        with tempfile.TemporaryDirectory() as work:
            p=Path(work)/'synthetic.json';p.write_text(json.dumps(detailed()))
            result=subprocess.run([sys.executable,str(SKILL/'scripts/validate_handoff.py'),str(p)],capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertIn('no media inspection',json.loads(result.stdout)['claim'])

if __name__=='__main__':
    unittest.main()
