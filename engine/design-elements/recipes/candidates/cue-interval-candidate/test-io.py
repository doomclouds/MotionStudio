"""Font-free filesystem/CLI preflight tests; not real font preparation or rendering."""
import importlib.util,json,os,re,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('cueio',ROOT/'io.py');io=importlib.util.module_from_spec(spec);spec.loader.exec_module(io)
checks=[]
def js_error(stderr):
 messages=re.findall(r'^[A-Za-z]*Error(?: \[[^\]\r\n]+\])?: (.+)$',stderr,re.M)
 assert len(messages)==1,('expected one actual exception line',stderr)
 return messages[0]
def expect_js_error(stderr,expected):
 assert js_error(stderr)==expected,('wrong exception message',js_error(stderr),expected)
# A source-code line may contain the expected reason while the real error differs.
try:expect_js_error('throw Error("nonsymlink path");\nError: different failure\n    at example','nonsymlink path')
except AssertionError:checks.append('wrong-js-reason-in-source-rejected')
else:raise AssertionError('source-line text concealed wrong exception reason')
with tempfile.TemporaryDirectory(prefix='cue-io-') as tmp:
 base=Path(tmp);masters=base/'synthetic-inputs';masters.mkdir()
 # Only ordinary path fixtures. These bytes are never presented as valid fonts.
 sample=masters/'sample.bin';sample.write_bytes(b'path fixture, not font data')
 assert io.external(str(sample),directory=False)==sample;checks.append('regular-input-positive')
 link=base/'input-link';link.symlink_to(sample)
 try:io.external(str(link),directory=False)
 except ValueError as e:assert str(e)=='nonsymlink path'
 else:raise AssertionError('input symlink accepted')
 checks.append('input-symlink-exact-rejection')
 existing=base/'existing';existing.mkdir();(base/'dangling').symlink_to(base/'absent',target_is_directory=True);(base/'parent-link').symlink_to(existing,target_is_directory=True)
 outputs=[('relative','normalized absolute path','normalized absolute external path'),(str(base)+'/./dot','normalized absolute path','normalized absolute external path'),(str(base)+'/a/../dot','normalized absolute path','normalized absolute external path'),(str(existing),'new destination only','new external destination'),(str(base/'dangling'),'nonsymlink path','nonsymlink path'),(str(base/'parent-link'/'new'),'nonsymlink path','nonsymlink path'),(str(ROOT/'must-not-create'),'outside package and detected Git checkout','outside package and detected Git checkout')]
 for script in ['fetch-fonts.py','prepare-fonts.py']:
  for out,reason,js_reason in outputs:
   argv=[str(ROOT/script),'--output',out]+(['--inputs',str(masters)]if script.startswith('prepare')else[])
   code="import runpy,sys,urllib.request; calls=[]; urllib.request.urlopen=lambda *a,**k: calls.append(1); sys.argv="+repr(argv)+"\ntry: runpy.run_path(sys.argv[0],run_name='__main__')\nexcept ValueError as e: assert "+repr(reason)+" == str(e),str(e)\nelse: raise AssertionError('invalid path accepted')\nassert not calls,'network reached before path rejection'"
   p=subprocess.run([sys.executable,'-S','-c',code],capture_output=True,text=True);assert p.returncode==0,(script,out,p.stderr);checks.append(script+':'+reason)
 # Valid fetch path reaches a stubbed acquisition boundary, never the network.
 argv=[str(ROOT/'fetch-fonts.py'),'--output',str(base/'fetch-positive')]
 code="import runpy,sys,urllib.request; calls=[]\ndef stop(*a,**k): calls.append(1); raise RuntimeError('ACQUISITION_STAGE')\nurllib.request.urlopen=stop;sys.argv="+repr(argv)+"\ntry:runpy.run_path(sys.argv[0],run_name='__main__')\nexcept RuntimeError as e:assert str(e)=='ACQUISITION_STAGE'\nelse:raise AssertionError('expected stub boundary')\nassert len(calls)==1"
 p=subprocess.run([sys.executable,'-S','-c',code],capture_output=True,text=True);assert p.returncode==0,p.stderr;checks.append('fetch-valid-path-positive-boundary')
 env={k:v for k,v in os.environ.items() if not k.startswith('CUE_')};env.pop('DISABLE_SYSTEM_FONTS_LOAD',None)
 for out,reason,js_reason in outputs:
  p=subprocess.run(['node',str(ROOT/'examples/render.mjs'),'--output',out],env=env,capture_output=True,text=True);assert p.returncode!=0,(out,p.stderr);expect_js_error(p.stderr,js_reason);checks.append('render:'+js_reason)
 # A valid destination passes pure preflight and can receive synthetic JSON.
 target=base/'json-positive';code="import {preflightNew,writeNew} from "+json.dumps((ROOT/'runtime.mjs').as_uri())+"; const p="+json.dumps(str(target))+"; if(preflightNew(p)!==p)throw Error('wrong path');writeNew(p,{'fixture.json':Buffer.from('{\"synthetic\":true}')});"
 p=subprocess.run(['node','--input-type=module','-e',code],env=env,capture_output=True,text=True);assert p.returncode==0,p.stderr;assert json.loads((target/'fixture.json').read_text())=={'synthetic':True};checks.append('writer-positive-json-fixture')
 p=subprocess.run(['node',str(ROOT/'examples/render.mjs'),'--output',str(base/'render-positive')],env=env,capture_output=True,text=True);assert p.returncode!=0,p.stderr;expect_js_error(p.stderr,'DISABLE_SYSTEM_FONTS_LOAD=1 before loading Native');assert not (base/'render-positive').exists();checks.append('render-valid-path-reaches-resource-stage')
 assert not (base/'absent').exists() and not (existing/'new').exists() and not (ROOT/'must-not-create').exists()
print(json.dumps({'passed':len(checks),'checks':checks,'scope':'font-free path preflight; real font derivation and rendering NOT_RUN'}))
