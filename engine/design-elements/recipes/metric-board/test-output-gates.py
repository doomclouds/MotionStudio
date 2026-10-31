from pathlib import Path
import subprocess,os,tempfile,json
recipe=Path(__file__).resolve().parent
repo=next((p for p in recipe.parents if (p/'.git').exists() or ((p/'engine').is_dir() and (p/'portfolio').is_dir())),recipe)
font=Path(os.environ['METRIC_FONT']).resolve();env={**os.environ,'METRIC_FONT':str(font)}
r=[]
def reject(cmd,env=env):
 p=subprocess.run(cmd,env=env,capture_output=True,text=True);assert p.returncode!=0,p.stdout;r.append(p.stderr.strip().splitlines()[-1])
for target in [repo/'rejected-root',repo/'engine/rejected-sibling']:
 reject(['python','-O',str(recipe/'prepare-font.py'),'--out',str(target)])
 reject(['node',str(recipe/'render.cjs')],{**env,'METRIC_OUTPUT':str(target)})
 assert not target.exists()
with tempfile.TemporaryDirectory(prefix='metric-gates-') as t:
 p=Path(t);f=p/'board.png';f.write_text('keep');reject(['node',str(recipe/'render.cjs')],{**env,'METRIC_OUTPUT':t});assert f.read_text()=='keep';f.unlink();f.symlink_to(p/'absent');reject(['node',str(recipe/'render.cjs')],{**env,'METRIC_OUTPUT':t});assert not (p/'absent').exists()
 fontdest=p/'IBMPlexMono-Regular.ttf';fontdest.symlink_to(p/'absent-font');reject(['python','-O',str(recipe/'prepare-font.py'),'--out',t]);assert not (p/'absent-font').exists()
print(json.dumps({'negativeGates':len(r),'result':'PASS','messages':r},indent=2))
