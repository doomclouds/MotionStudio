import hashlib,importlib.util,json,os,pathlib,tempfile,sys,shutil,subprocess
sys.dont_write_bytecode=True
ROOT=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('prepare',ROOT/'prepare-fonts.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
source=os.environ.get('FEATURE_STACK_FONT_INPUT')
if not source:raise SystemExit('FEATURE_STACK_FONT_INPUT exact external variable font required')
checks=0
def reject(fn):
 global checks
 try:fn()
 except (ValueError,FileExistsError,FileNotFoundError,RuntimeError):checks+=1;return
 raise AssertionError('expected rejection')
with tempfile.TemporaryDirectory(prefix='feature-stack-prepare-') as d:
 d=pathlib.Path(d);a=d/'a';b=d/'b';m.prepare(source,a);m.prepare(source,b)
 lock=json.loads((ROOT/'font-lock.json').read_text())
 for f in lock['outputs']:
  raw=(a/f['file']).read_bytes();assert raw==(b/f['file']).read_bytes();assert hashlib.sha256(raw).hexdigest()==f['sha256'];checks+=1
 reject(lambda:m.prepare(source,a))
 empty=d/'empty';empty.mkdir();reject(lambda:m.prepare(source,empty));assert not list(empty.iterdir())
 target=d/'never-created';link=d/'dangling';link.symlink_to(target);reject(lambda:m.prepare(source,link));assert not target.exists()
 alias=d/'alias';alias.symlink_to(a,target_is_directory=True);reject(lambda:m.prepare(source,alias/'write-through'));assert not (a/'write-through').exists()
 srcLink=d/'source-link';srcLink.symlink_to(source);reject(lambda:m.prepare(srcLink,d/'from-link'))
 bad=d/'bad.ttf';bad.write_bytes(b'not a font');reject(lambda:m.prepare(bad,d/'bad-result'));assert not (d/'bad-result').exists()
 reject(lambda:m.prepare(source,ROOT/'forbidden-output'));assert not (ROOT/'forbidden-output').exists()
 reject(lambda:m.prepare('relative.ttf',d/'relative-result'))
 original=m.fontTools.__version__;m.fontTools.__version__='0';reject(lambda:m.prepare(source,d/'bad-version'));m.fontTools.__version__=original
with tempfile.TemporaryDirectory(prefix='feature-stack-boundary-') as tmp:
 d=pathlib.Path(tmp);(d/'.git').mkdir();pkg=d/'package';pkg.mkdir()
 for name in ['prepare-fonts.py','font-lock.json']:shutil.copy2(ROOT/name,pkg/name)
 spec=importlib.util.spec_from_file_location('isolated_prepare',pkg/'prepare-fonts.py');isolated=importlib.util.module_from_spec(spec);spec.loader.exec_module(isolated)
 assert isolated.repo_root()==pkg;isolated.prepare(source,d/'allowed-fonts');checks+=1
 reject(lambda:isolated.prepare(source,pkg/'inside-fonts'))
 subprocess.run(['git','init','--quiet',str(d)],check=True);assert isolated.repo_root()==d
 reject(lambda:isolated.prepare(source,d/'blocked-fonts'))
 linked=d/'linked';linked.mkdir();(linked/'.git').write_text('gitdir: '+str(d/'.git')+'\n');lp=linked/'package';lp.mkdir()
 for name in ['prepare-fonts.py','font-lock.json']:shutil.copy2(ROOT/name,lp/name)
 spec=importlib.util.spec_from_file_location('linked_prepare',lp/'prepare-fonts.py');linkedmod=importlib.util.module_from_spec(spec);spec.loader.exec_module(linkedmod);assert linkedmod.repo_root()==linked
 reject(lambda:linkedmod.prepare(source,linked/'blocked-fonts'))
print(json.dumps({'checks':checks,'status':'PASS','scope':'exact offline font derivation and exclusive external filesystem writes'}))
