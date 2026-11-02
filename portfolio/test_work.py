"""Local new-format metadata/source regression checks; never renders or reads external materials."""
import copy,json,shutil,tempfile,unittest
from pathlib import Path
import admission,work
from validate_work import Blocked,read,sha,SCHEMA
from schema_check import check_schema,matches
ROOT=Path(__file__).resolve().parents[1];PORTFOLIO=ROOT/'portfolio'
class WorkContract(unittest.TestCase):
 def test_only_current_contract_is_active(self):
  rows=work.load_all(PORTFOLIO);self.assertEqual(len(rows),66)
  self.assertTrue(all(d['schema']=='motionstudio.work/1' for _,d in rows))
  for old in ['validate.py','retention.py','design-index.json','DESIGN-INDEX.md']:self.assertFalse((PORTFOLIO/old).exists())
 def test_static_checks_and_candidates_are_separate(self):
  results=[admission.inspect(folder,ROOT) for folder,_ in work.load_all(PORTFOLIO)]
  self.assertEqual(sum(x['admissible'] for x in results),63)
  self.assertEqual({x['id'] for x in results if not x['admissible']},{'pixel-hiking-study','film-festival-study','hk-street-signs-study'})
 def test_video_contracts_and_review_dimensions_remain_distinct(self):
  for name,frames,fps in [('tessel',1980,60),('favorite52',1560,30)]:
   d=read(PORTFOLIO/'works'/name/'work.json');self.assertEqual(d['render']['timeline'],{'frames':frames,'fps_num':fps,'fps_den':1});self.assertEqual(d['render']['audio'],{'sample_rate':48000,'channels':2})
   self.assertEqual(d['acceptance']['listened']['status'],'NOT_LISTENED');self.assertEqual(d['acceptance']['av_sync']['status'],'NUMERIC_ONLY')
 def test_generated_projection_and_literal_queries(self):
  data=work.index(PORTFOLIO,ROOT);self.assertEqual(data['counts'],{'works':66,'static':64,'video':2,'candidates':3})
  self.assertEqual(read(PORTFOLIO/'index.json'),data);self.assertEqual((PORTFOLIO/'INDEX.md').read_text(),work.index_markdown(data));self.assertEqual((ROOT/'engine/design-elements/CASE-COVERAGE.md').read_text(),work.coverage_markdown(data))
  self.assertEqual(len(work.query(PORTFOLIO,ROOT,kind='video')),2);self.assertEqual(work.query(PORTFOLIO,ROOT,text='[not-a-regex.*]'),[])
  self.assertTrue(all(r['visual']=='NOT_RUN' for r in data['works'] if r['lifecycle']=='candidate'))
 def test_external_references_have_no_reachability_field_or_gate(self):
  for _,d in work.load_all(PORTFOLIO):
   self.assertEqual(d['evidence'],{'reviewArtifacts':{'status':'NOT_INCLUDED'}});self.assertTrue(all('availability' not in r for r in d['resources']))
 def test_unknown_schema_extensions_fail_closed(self):
  for schema in [{'$ref':'https://example.com/schema'},{'type':'imaginary'},{'minItems':True},{'pattern':'(?=unreviewed)'}]:
   with self.assertRaises(ValueError):check_schema(schema)
  self.assertFalse(matches({'type':'integer'},True))
 def test_security_checks_not_bypassed_by_rehash(self):
  for scenario in ['jpeg','floating','permission','false-technical','credential-url']:
   with self.subTest(scenario=scenario),tempfile.TemporaryDirectory() as t:
    folder=Path(t)/'tessel';shutil.copytree(PORTFOLIO/'works/tessel',folder);d=read(folder/'work.json')
    if scenario=='jpeg':
     (folder/'cover.jpg').write_bytes(b'invalid');next(x for x in d['files'] if x['path']=='cover.jpg')['sha256']=sha(folder/'cover.jpg')
    elif scenario=='floating':d['runtime'][0]['version']='latest'
    elif scenario=='permission':d['resources'][0]['permission']='user-supplied-not-distributed'
    elif scenario=='false-technical':d['acceptance']['technical']=False
    else:d['resources'][0]['fetch_url']='https://example.com/a?token=secret'
    (folder/'work.json').write_text(json.dumps(d))
    with self.assertRaises(Blocked):admission.inspect(folder,ROOT)
 def test_candidate_cannot_inherit_current_acceptance(self):
  with tempfile.TemporaryDirectory() as t:
   folder=Path(t)/'pixel-hiking-study';shutil.copytree(PORTFOLIO/'works/pixel-hiking-study',folder);d=read(folder/'work.json');d['acceptance']=d['history'][0]['acceptance'];(folder/'work.json').write_text(json.dumps(d))
   with self.assertRaises(Blocked):admission.inspect(folder,ROOT)
if __name__=='__main__':unittest.main()
