#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
import pathlib,argparse,subprocess,sys,os,json
ROOT=pathlib.Path(__file__).absolute().parent
p=argparse.ArgumentParser();p.add_argument('--work',required=True);p.add_argument('--master',required=True);a=p.parse_args();w=pathlib.Path(a.work)
if not w.is_absolute()or w.exists()or w.is_symlink():raise ValueError('new absolute work')
w.mkdir();(w/'existing').mkdir();(w/'target').mkdir();(w/'live').symlink_to(w/'target',target_is_directory=True);(w/'dangling').symlink_to(w/'absent',target_is_directory=True)
paths=['relative-output',str(w/'x/../out'),str(w/'existing'),str(w/'missing/out'),str(w/'live/out'),str(w/'dangling/out'),str(ROOT/'forbidden-output')];results=[]
# Denied destinations must be rejected before source-font reads or network requests.
runner="""import runpy,sys,pathlib,urllib.request,json
script=sys.argv[1];sys.argv=sys.argv[1:];calls={'network':0,'masterRead':0};old=pathlib.Path.read_bytes
master=__MASTER__
def read(p):
 if str(p)==master:calls['masterRead']+=1
 return old(p)
def network(*a,**k):
 calls['network']+=1;raise RuntimeError('unexpected network')
pathlib.Path.read_bytes=read;urllib.request.urlopen=network
try:runpy.run_path(script,run_name='__main__');accepted=True
except Exception as e:accepted=False;error=type(e).__name__+':'+str(e)
print(json.dumps({'accepted':accepted,'calls':calls,'error':error if not accepted else None}))
""".replace('__MASTER__',repr(a.master))
for script in ['prepare-fonts.py','fetch-font.py']:
 for dest in paths:
  args=['--master',a.master,'--output',dest]if script=='prepare-fonts.py'else['--output',dest]
  cp=subprocess.run([sys.executable,'-c',runner,str(ROOT/script),*args],capture_output=True,text=True,env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1'));assert cp.returncode==0,cp.stderr;r=json.loads(cp.stdout);assert not r['accepted'] and r['calls']=={'network':0,'masterRead':0};results.append({'script':script,'destinationKind':paths.index(dest),**r})
for bad in [str(w/'absent.ttf'),str(w/'existing')]:
 cp=subprocess.run([sys.executable,str(ROOT/'prepare-fonts.py'),'--master',bad,'--output',str(w/'font-out')],capture_output=True,text=True);assert cp.returncode!=0 and not (w/'font-out').exists();results.append({'script':'prepare-fonts.py','invalidMaster':bad.endswith('.ttf'),'rejected':True,'outputAbsent':True})
# Real render command fails at destination gate, before fonts or runtime resolution.
for dest in paths:
 cp=subprocess.run(['node',str(ROOT/'render.mjs'),'--output',dest],capture_output=True,text=True,env=dict(os.environ,RADIAL_FONTS=str(w/'absent-fonts'),RADIAL_RUNTIME=str(w/'absent-runtime')));assert cp.returncode!=0 and 'font exact'not in cp.stderr and 'absent-fonts'not in cp.stderr;results.append({'script':'render.mjs','destinationKind':paths.index(dest),'rejectedBeforeResources':True})
for script in ['make-package.py','make-report.py']:
 for dest in paths:
  args=['--output',dest] if script=='make-package.py' else ['--images',str(w/'absent-images'),'--output',dest]
  cp=subprocess.run([sys.executable,str(ROOT/script),*args],capture_output=True,text=True,env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1'));assert cp.returncode!=0 and 'absent-images'not in cp.stderr;results.append({'script':script,'destinationKind':paths.index(dest),'rejectedBeforeInput':True})
assert not (w/'absent').exists() and not list((w/'target').iterdir()) and not (ROOT/'forbidden-output').exists();print(json.dumps({'status':'PASS','cases':len(results),'results':results},indent=2))
