#!/usr/bin/env python3
"""Check or render the complete 52 s work, using exact external resources; no downloads."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import argparse,json,os,re,subprocess
from prepare import HERE,REPO,Bad,check,external,inside,regular_path,sha_file

def preflight(cache):
 cache=check(cache)
 lock=json.loads((HERE/'locks/runtime.json').read_text())
 for row in lock['sources']:
  p=inside(REPO/row['path'],REPO)
  if not p.is_file() or sha_file(p)!=row['sha256']:raise Bad('Source/install-lock mismatch: '+row['path'])
 versions={
  'node':subprocess.check_output(['node','--version'],text=True).strip().removeprefix('v'),
  'ffmpeg':subprocess.check_output(['ffmpeg','-version'],text=True).splitlines()[0].split()[2],
  'ffprobe':subprocess.check_output(['ffprobe','-version'],text=True).splitlines()[0].split()[2],
 }
 for k,v in versions.items():
  if v!=lock['versions'][k]:raise Bad('Runtime version mismatch '+k+': expected '+lock['versions'][k]+', found '+v)
 if sys.version.split()[0]!=lock['versions']['python']:raise Bad('Python version mismatch: '+sys.version.split()[0])
 module=inside(REPO/'engine/motion-render-core/node_modules/@napi-rs/canvas',REPO)
 if not (module/'package.json').is_file():raise Bad('Install the existing locked runtime: npm ci --ignore-scripts --prefix engine/motion-render-core')
 if json.loads((module/'package.json').read_text())['version']!=lock['versions']['canvas']:raise Bad('Canvas version mismatch')
 return cache,module

def output_path(path,cache):
 work=external(path)
 if any(c in str(work) for c in ["'", "\\", "\n", "\r"]):raise Bad("Output path must not contain quotes, backslashes or newlines")
 if work==cache or work in cache.parents or cache in work.parents:raise Bad('Work/output and asset cache must be disjoint')
 if work.exists():raise Bad('Choose a new empty --work path; existing paths are never overwritten')
 return work

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--cache',type=Path,required=True);p.add_argument('--work',type=Path);p.add_argument('--name',default='favorite52-source');p.add_argument('--check',action='store_true');a=p.parse_args()
 try:
  if not re.fullmatch(r"[A-Za-z0-9_-]+",a.name):raise Bad("Output name must use ASCII letters/digits, hyphen or underscore")
  cache,module=preflight(a.cache)
  if a.check:print(json.dumps({'status':'preflight-passed','resources':16,'scope':'no rendering or listening performed'}));return
  if a.work is None:raise Bad('--work outside the repository is required')
  work=output_path(a.work,cache)
  work.mkdir(parents=True,exist_ok=False)
  env={**os.environ,'FAVORITE52_ASSETS':str(cache),'FAVORITE52_WORK':str(work),'MOTIONSTUDIO_CANVAS_MODULE':str(module)}
  subprocess.run([sys.executable,str(HERE/'src/export-native.py'),'--name',a.name],env=env,check=True)
 except (Bad,OSError,subprocess.CalledProcessError) as e:p.exit(1,str(e)+'\n')

if __name__=='__main__':main()
