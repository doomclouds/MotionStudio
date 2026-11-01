"""Creates only a fresh disposable test directory below the caller's supplied parent."""
import importlib.util,json,os,pathlib,shutil,subprocess,sys,tempfile,zipfile
sys.dont_write_bytecode=True
ROOT=pathlib.Path(__file__).absolute().parent
spec=importlib.util.spec_from_file_location('pack',ROOT/'package.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
p=pathlib.Path(sys.argv[1]);mod.check(p,'dir');work=pathlib.Path(tempfile.mkdtemp(prefix='seam-io-',dir=p));source=work/'source';source.mkdir();count=0
for name in mod.FILES:(source/name).parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/name,source/name)
script=(source/'package.py').read_text()
def run(out,entry=None):
 global count
 count+=1
 if entry is None:args=[sys.executable,str(source/'package.py'),str(out)]
 else:args=[sys.executable,'-c',"import sys;sys.argv=["+repr(str(source/'package.py'))+","+repr(str(out))+"];exec(compile("+repr(script)+","+repr(str(source/'package.py'))+",'exec'),{'__file__':"+repr(str(source/'package.py'))+",'__name__':'__main__'})"]
 if entry is not None:args[2]=args[2].replace(';exec(compile(', ';\ntry:exec(compile(')+'\nexcept Exception:sys.exit(31)'
 return subprocess.run(args,capture_output=True,timeout=15)
try:
 baseline=work/'baseline';assert run(baseline).returncode==0
 expected=(baseline/'text-candidates.zip').read_bytes()
 (source/'fonts/private-comparison').mkdir(parents=True);(source/'fonts/private-comparison/private.png').write_bytes(b'NOT A REAL PRIVATE IMAGE');(source/'fonts/link.txt').symlink_to(source/'README.md')
 out=work/'junk-ignored';assert run(out).returncode==0 and (out/'text-candidates.zip').read_bytes()==expected
 for name in mod.FILES:
  f=source/name;data=f.read_bytes()
  for mode in ['missing','directory','live','dangling','fifo']:
   f.unlink()
   if mode=='directory':f.mkdir()
   elif mode=='live':f.symlink_to(source/'README.md' if name!='README.md' else source/'LICENSE')
   elif mode=='dangling':f.symlink_to(work/'absent')
   elif mode=='fifo':os.mkfifo(f)
   out=work/f'bad-{count}'
   r=run(out,entry=True if name=='package.py' else None);assert r.returncode!=0 and not out.exists(),(name,mode,r.stdout,r.stderr)
   if f.is_dir() and not f.is_symlink():f.rmdir()
   elif f.is_symlink() or f.exists():f.unlink()
   f.write_bytes(data)
 for mode in ['existing','live','dangling','dot']:
  out=work/('out-'+mode)
  if mode=='existing':out.mkdir()
  elif mode=='live':out.symlink_to(baseline,target_is_directory=True)
  elif mode=='dangling':out.symlink_to(work/'not-created',target_is_directory=True)
  raw=str(work)+'/./dot-output' if mode=='dot' else str(out)
  assert run(raw).returncode!=0
  assert not (work/'not-created').exists() and not (work/'dot-output').exists()
 # Preparation executed through a source-root alias or individual entry link must fail at that gate,
 # before any otherwise invalid dummy inputs are consumed.
 for mode in ['root-alias','entry-alias']:
  alias=work/mode
  if mode=='root-alias':alias.symlink_to(source,target_is_directory=True);entry=alias/'examples/prepare-inputs.py'
  else:alias.mkdir();entry=alias/'prepare-inputs.py';entry.symlink_to(source/'examples/prepare-inputs.py')
  out=source/('unexpected-'+mode);count+=1
  r=subprocess.run([sys.executable,str(entry),str(work/'missing-repo'),str(work/'missing-font'),str(out)],capture_output=True,timeout=15)
  assert r.returncode!=0 and b'symlink' in r.stderr and not out.exists(),(mode,r.stdout,r.stderr)
 assert (baseline/'text-candidates.zip').read_bytes()==expected
 print(json.dumps({'pass':True,'cases':count,'whitelist':len(mod.FILES),'unknownNestedIgnored':True,'readOnlyInputLinksRejected':True}))
finally:shutil.rmtree(work)
