"""Path guards are ordinary filesystem checks, not race/hostile-code sandboxing."""
import os,json,sys,tempfile,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent;base=Path(tempfile.mkdtemp(prefix='cue-io-',dir=os.environ.get('TMPDIR')));masters=Path(os.environ['CUE_MASTER_DIR']);checks=[]
existing=base/'existing';existing.mkdir();(base/'dangling').symlink_to(base/'absent-target',target_is_directory=True);(base/'parent-link').symlink_to(existing,target_is_directory=True)
outputs=['relative',str(base)+'/./dot',str(base)+'/a/../dot',str(existing),str(base/'dangling'),str(base/'parent-link'/'new'),str(ROOT/'must-not-create')]
for script in ['fetch-fonts.py','prepare-fonts.py']:
 for i,out in enumerate(outputs):
  # Monkeypatch HTTP before running the real parser/path validation; any network is a failed guard.
  code="import runpy,sys,urllib.request;calls=[];urllib.request.urlopen=lambda *a,**k:(calls.append(1),None)[1];sys.argv="+repr([str(ROOT/script),'--output',out]+(['--inputs',str(masters)]if script.startswith('prepare')else[]))+"\ntry:runpy.run_path(sys.argv[0],run_name='__main__')\nexcept Exception:pass\nelse:raise AssertionError('accepted invalid output')\nassert not calls,'network before rejection'"
  r=subprocess.run([sys.executable,'-c',code],capture_output=True,text=True);assert r.returncode==0,(script,out,r.stderr);checks.append(script+':'+str(i))
assert not (base/'absent-target').exists() and not (existing/'new').exists() and not (ROOT/'must-not-create').exists()
# Existing same-byte input symlink must fail before destination creation.
for name in ['Inter.ttf','OFL.txt']:
 d=base/('input-'+name);d.mkdir()
 for n in ['Inter.ttf','OFL.txt']:
  if n==name:(d/n).symlink_to(masters/n)
  else:(d/n).write_bytes((masters/n).read_bytes())
 out=base/('result-'+name);r=subprocess.run([sys.executable,str(ROOT/'prepare-fonts.py'),'--inputs',str(d),'--output',str(out)],capture_output=True,text=True);assert r.returncode!=0 and not out.exists();checks.append('symlink-input:'+name)
# Real render CLI must reject malformed/existing output. It is allowed to prepare trusted fonts first.
for i,out in enumerate(outputs):
 r=subprocess.run(['node',str(ROOT/'examples/render.mjs'),'--output',out],capture_output=True,text=True);assert r.returncode!=0,(out,r.stdout);checks.append('render:'+str(i))
print(json.dumps({'passed':len(checks),'checks':checks,'workspace':str(base)}))
