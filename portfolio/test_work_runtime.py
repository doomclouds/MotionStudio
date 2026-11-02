"""Long-lived new-format-only smoke test, without historical work or migrator imports."""
import hashlib,json,struct,subprocess,sys,tempfile,unittest
from pathlib import Path
class NewRuntime(unittest.TestCase):
 def test_stdlib_runtime_with_migration_modules_disabled(self):
  with tempfile.TemporaryDirectory() as t:
   repo=Path(t);portfolio=repo/'portfolio';work=portfolio/'works/synthetic';work.mkdir(parents=True)
   catalog=repo/'engine/design-elements';catalog.mkdir(parents=True);(catalog/'catalog.json').write_text('{"assets":[]}')
   # Structural JPEG fixture only; no actual rendered/approved artwork is claimed.
   cover=b'\xff\xd8\xff\xc0'+struct.pack('>H',11)+b'\x08'+struct.pack('>HH',1,1)+b'\x01\x01\x11\x00'+b'\xff\xda\x00\x08\x01\x01\x00\x00\x3f\x00\x00\xff\xd9'
   contents={'README.md':('documentation',b'Synthetic unit fixture, not an actual approved work.'),'CREDITS.md':('documentation',b'Synthetic unit fixture only.'),'LICENSE':('license',b'Synthetic test terms only.'),'runtime-lock.json':('lock',b'{"synthetic":true}'),'scene.mjs':('source',b'// Synthetic test source, not a real rendered work.\n'),'cover.jpg':('cover',cover)}
   files=[]
   for name,(kind,raw) in contents.items():(work/name).write_bytes(raw);files.append({'path':name,'kind':kind,'sha256':hashlib.sha256(raw).hexdigest()})
   d={'schema':'motionstudio.work/1','id':'synthetic','version':'1.0.0','title':'Synthetic unit fixture','kind':'static','lifecycle':'retained','publication':{'status':'released'},'authorship':{'unofficial_recreation':False},'rights':{'status':'reviewed','credits':'CREDITS.md','notices':['LICENSE'],'evidence_urls':['https://example.com/test-terms']},'files':files,'runtime':[{'name':'synthetic-runtime','version':'1.0.0','lock':'runtime-lock.json'}],'render':{'entrypoint':'scene.mjs','width':1,'height':1},'resources':[],'cover':{'path':'cover.jpg','kind':'rendered-static','source_sha256':hashlib.sha256(b'synthetic-not-a-render').hexdigest(),'frame':None,'rights_status':'reviewed','credit':'CREDITS.md'},'acceptance':{'complete_work':True,'owner_keep':True,'clean_restore':True,'technical':True,'visual':{'status':'NOT_REVIEWED','coverage':'Synthetic test declarations only.'}},'evidence':{'reviewArtifacts':{'status':'NOT_INCLUDED'}}}
   (work/'work.json').write_text(json.dumps(d))
   tool=Path(__file__).resolve().parent
   bootstrap="import sys,json;sys.path.insert(0,sys.argv[1]);"+"[sys.modules.__setitem__(x,None) for x in ['migrate','upgrade_candidate','reference_archive','preservation_ledger']];import work;print(json.dumps(work.query(sys.argv[2],sys.argv[3])))"
   result=subprocess.run([sys.executable,'-S','-c',bootstrap,str(tool),str(portfolio),str(repo)],capture_output=True,text=True)
   self.assertEqual(result.returncode,0,result.stderr);rows=json.loads(result.stdout);self.assertEqual([x['id'] for x in rows],['synthetic']);self.assertEqual(rows[0]['reviewArtifacts'],'NOT_INCLUDED')
if __name__=='__main__':unittest.main()
