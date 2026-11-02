import copy,importlib.util,json,pathlib,tempfile,unittest,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]/'skills/ui-design-director'
spec=importlib.util.spec_from_file_location('contract',ROOT/'scripts/validate_handoff.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
BASE=json.loads((ROOT/'assets/design-handoff.template.json').read_text())
class ContractTests(unittest.TestCase):
 def test_draft_no_pass_claim(self): self.assertEqual(m.validate(BASE),[])
 def test_empty_candidate_rejected(self):
  x=copy.deepcopy(BASE);x['delivery_status']='static_candidate';self.assertTrue(m.validate(x))
 def test_pass_without_evidence_rejected(self):
  x=copy.deepcopy(BASE);x['gates']['static_visual']['status']='pass';self.assertTrue(m.validate(x))
 def test_hash_and_version_binding(self):
  x=copy.deepcopy(BASE);x['artifacts']=[{'id':'image','sha256':'a'*64,'media_type':'image','locator':'output/image.png'}];x['evidence']=[{'id':'review','artifact_id':'image','artifact_sha256':'a'*64,'design_version':'draft-1','result':'pass','scope':'static_visual','method':'actual_image_viewing','reviewer':'reviewer'}];x['gates']['static_visual']={'status':'pass','evidence_ids':['review']};self.assertEqual(m.validate(x),[])
  x['artifacts'][0]['sha256']='b'*64;self.assertTrue(m.validate(x))
  x['evidence'][0]['artifact_sha256']='b'*64;x['design_version']='draft-2';self.assertTrue(m.validate(x))
 def test_permission_not_inferred(self):
  x=copy.deepcopy(BASE);x['publish_permission']['status']='granted';self.assertTrue(m.validate(x))
 def test_duplicate_object_rejected(self):
  x=copy.deepcopy(BASE);x['objects']=[{'id':'same','parent':None}]*2;self.assertTrue(m.validate(x))
 def test_wrong_shape_rejected(self):
  self.assertTrue(m.validate([]));x=copy.deepcopy(BASE);x['evidence']=None;self.assertTrue(m.validate(x))
 def test_bad_state_and_parent_are_errors(self):
  x=copy.deepcopy(BASE);x['states']=[42];self.assertTrue(m.validate(x))
  x=copy.deepcopy(BASE);x['objects']=[{'id':'object','parent':[]}];self.assertTrue(m.validate(x))
 def test_history_retained_without_current_acceptance(self):
  x=copy.deepcopy(BASE);x['history_evidence']=[{'id':'old','design_version':'old-1','result':'stale'}];self.assertEqual(m.validate(x),[])
 def test_still_cannot_pass_motion(self):
  x=copy.deepcopy(BASE);x['artifacts']=[{'id':'image','sha256':'a'*64,'media_type':'image','locator':'output/image.png'}];x['evidence']=[{'id':'review','artifact_id':'image','artifact_sha256':'a'*64,'design_version':'draft-1','result':'pass','scope':'motion_viewing','method':'continuous_video_viewing','reviewer':'reviewer'}];x['gates']['motion_viewing']={'status':'pass','evidence_ids':['review']};self.assertTrue(m.validate(x))
 def test_fake_visual_and_authorization_rejected(self):
  x=copy.deepcopy(BASE);x['artifacts']=[{'id':'doc','sha256':'a'*64,'media_type':'document','locator':'out.json'}];x['evidence']=[{'id':'review','artifact_id':'doc','artifact_sha256':'a'*64,'design_version':'draft-1','result':'pass','scope':'static_visual','method':'numeric_only','reviewer':True}];x['gates']['static_visual']={'status':'pass','evidence_ids':['review']};self.assertTrue(m.validate(x))
  x=copy.deepcopy(BASE);x['publish_permission']={'status':'granted','authorization':True};self.assertTrue(m.validate(x))
 def test_video_only_candidate_rejected(self):
  x=copy.deepcopy(BASE);x['delivery_status']='static_candidate';x['target'].update(width=800,height=600);x['artifacts']=[{'id':'film','sha256':'a'*64,'media_type':'video'}];self.assertTrue(m.validate(x))
 def test_minimal_real_candidate_declaration(self):
  x=copy.deepcopy(BASE);x['delivery_status']='static_candidate';x['target'].update(width=800,height=600);x['brief']['primary_message']='Weekend open';x['content']['provenance_note']='User supplied text';x['artifacts']=[{'id':'image','sha256':'a'*64,'media_type':'image','locator':'output/image.png'}];x['objects']=[{'id':'title','parent':None,'bounds':{'x':0,'y':0,'width':100,'height':50},'anchor':{'x':0,'y':0},'z_order':1,'editable_source':'scene.mjs'}];x['states']=[{'id':'default','basis':'verified','description':'Default poster','object_ids':['title']}];self.assertEqual(m.validate(x),[])
 def test_missing_sources_nonzero(self):
  with tempfile.TemporaryDirectory() as t:
   r=subprocess.run([sys.executable,str(ROOT/'scripts/check_sources.py'),'--repo-root',t],capture_output=True,text=True)
   self.assertEqual(r.returncode,1);self.assertIn('missing_or_unreadable',r.stdout)
 def test_invalid_artifact_reference_is_error_not_exception(self):
  x=copy.deepcopy(BASE);x['evidence']=[{'id':'bad','artifact_id':[]}]
  self.assertTrue(m.validate(x))
 def test_empty_state_and_nonfinite_geometry_rejected(self):
  x=copy.deepcopy(BASE);x['states']=[{'id':'','basis':'unknown','description':'unknown','object_ids':[]}]
  self.assertTrue(m.validate(x))
  x=copy.deepcopy(BASE);x['objects']=[{'id':'object','parent':None,'bounds':{'x':float('nan'),'y':0,'width':10,'height':10},'anchor':{'x':0,'y':0},'z_order':0,'editable_source':'scene.mjs'}]
  self.assertTrue(m.validate(x))
class RepositoryIntegrationTests(unittest.TestCase):
 def test_repository_routes_to_canonical_skill(self):
  repo=ROOT.parents[1]
  self.assertIn('skills/ui-design-director/SKILL.md',(repo/'AGENTS.md').read_text())
  self.assertIn('../skills/ui-design-director/SKILL.md',(repo/'specs/production-and-knowledge.md').read_text())
  self.assertIn('skills/ui-design-director/SKILL.md',(repo/'skills/motion-film-director/SKILL.md').read_text())
 def test_shared_sources_from_unrelated_cwd(self):
  with tempfile.TemporaryDirectory() as cwd:
   r=subprocess.run([sys.executable,str(ROOT/'scripts/check_sources.py'),'--repo-root',str(ROOT.parents[1])],cwd=cwd,capture_output=True,text=True)
  self.assertEqual(r.returncode,0,r.stdout+r.stderr)
  checks=json.loads(r.stdout)['checks']
  self.assertEqual(len(checks),10)
  self.assertIn('knowledge/design/reference-to-composition.md',{x['path'] for x in checks})
 def test_ui_skill_has_no_copied_runtime_or_knowledge(self):
  self.assertEqual({p.name for p in ROOT.iterdir()}-{'__pycache__'}, {'SKILL.md','references','scripts','assets'})
 def test_local_ui_and_governance_links(self):
  import re
  repo=ROOT.parents[1]
  for page in [repo/'AGENTS.md',*(repo/'specs').glob('*.md'),*ROOT.rglob('*.md')]:
   for target in re.findall(r'\]\(([^)]+)\)',page.read_text()):
    if re.match(r'[a-zA-Z][a-zA-Z0-9+.-]*:',target):continue
    path=target.split('#')[0]
    if path:self.assertTrue((page.parent/path).exists(),str(page)+': '+target)
if __name__=='__main__':unittest.main()
