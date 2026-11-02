"""Font-free output preflight with exact failures and positive boundary controls."""
from pathlib import Path
import subprocess,os,re,tempfile,json,sys
recipe=Path(__file__).resolve().parent
repo=next((p for p in recipe.parents if (p/'.git').exists() or ((p/'engine').is_dir() and (p/'portfolio').is_dir())),recipe)
env=dict(os.environ);env.pop('METRIC_FONT',None)
checks=[]
def js_error(stderr):
 messages=re.findall(r'^[A-Za-z]*Error(?: \[[^\]\r\n]+\])?: (.+)$',stderr,re.M)
 assert len(messages)==1,('expected one actual exception line',stderr)
 return messages[0]
def expect_js_error(stderr,expected):
 assert js_error(stderr)==expected,('wrong exception message',js_error(stderr),expected)
try:expect_js_error('throw Error("Output must be outside repository");\nError: missing font\n    at example','Output must be outside repository')
except AssertionError:checks.append('wrong-js-reason-in-source-rejected')
else:raise AssertionError('source-line text concealed wrong exception reason')
def render_reject(target,reason):
 p=subprocess.run(['node',str(recipe/'render.cjs')],env={**env,'METRIC_OUTPUT':str(target)},capture_output=True,text=True)
 assert p.returncode!=0,(target,p.stdout,p.stderr)
 expect_js_error(p.stderr,reason)
 checks.append('render:'+reason)
def prepare_reject(target,reason):
 argv=[str(recipe/'prepare-font.py'),'--out',str(target)]
 code="import runpy,sys,urllib.request; calls=[];urllib.request.urlopen=lambda *a,**k:calls.append(1);sys.argv="+repr(argv)+"\ntry:runpy.run_path(sys.argv[0],run_name='__main__')\nexcept ValueError as e:assert "+repr(reason)+" == str(e),str(e)\nelse:raise AssertionError('invalid path accepted')\nassert not calls,'network reached before rejection'"
 p=subprocess.run([sys.executable,'-S','-c',code],capture_output=True,text=True);assert p.returncode==0,p.stderr;checks.append('prepare:'+reason)
for target in [repo/'rejected-root',repo/'engine/rejected-sibling']:
 prepare_reject(target,'Output must be outside repository');render_reject(target,'Output must be outside repository');assert not target.exists()
with tempfile.TemporaryDirectory(prefix='metric-gates-') as t:
 base=Path(t);f=base/'board.png';f.write_text('keep');render_reject(base,'Destination exists; refusing overwrite or symlink');assert f.read_text()=='keep';f.unlink();f.symlink_to(base/'absent');render_reject(base,'Destination exists; refusing overwrite or symlink');assert not (base/'absent').exists();f.unlink()
 fontdest=base/'IBMPlexMono-Regular.ttf';fontdest.symlink_to(base/'absent-font');prepare_reject(base,'Destination already exists; refusing overwrite or symlink');assert not (base/'absent-font').exists()
 positive=base/'new-output'
 code="const {outputTargets}=require("+json.dumps(str(recipe/'output-preflight.cjs'))+");console.log(JSON.stringify(outputTargets("+json.dumps(str(positive))+")));"
 p=subprocess.run(['node','-e',code],env=env,capture_output=True,text=True);assert p.returncode==0,p.stderr
 result=json.loads(p.stdout);assert result['dir']==str(positive) and result['targets']==[['board',str(positive/'board.png')],['workshop',str(positive/'workshop.png')]];assert not positive.exists();checks.append('pure-preflight-positive-no-writes')
 p=subprocess.run(['node',str(recipe/'render.cjs')],env={**env,'METRIC_OUTPUT':str(positive)},capture_output=True,text=True)
 assert p.returncode!=0,p.stderr;expect_js_error(p.stderr,'Set METRIC_FONT to the exact IBM Plex Mono Regular font; see font-lock.json');assert not positive.exists();checks.append('valid-output-reaches-font-stage')
print(json.dumps({'checks':len(checks),'result':'PASS','cases':checks,'scope':'font-free output preflight; exact-font rendering remains NOT_RUN'},indent=2))
