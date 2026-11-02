#!/usr/bin/env python3
"""Opt-in HTTPS acquisition of exact public font files; no install or runtime execution."""
from pathlib import Path
import argparse,json,hashlib,urllib.request,urllib.parse,sys
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parent
ALLOWED={'raw.githubusercontent.com','github.com','media.githubusercontent.com'}
class FixedHTTPSRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):
  u=urllib.parse.urlsplit(newurl)
  if u.scheme!='https' or u.hostname not in ALLOWED:raise ValueError('Unexpected font redirect destination')
  return super().redirect_request(req,fp,code,msg,headers,newurl)
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--case',required=True,choices=['data-chart','light-leak','bold-signal']);p.add_argument('--output',required=True);a=p.parse_args()
 # Reuse only the path boundary helper; importing preparation does not perform work.
 import importlib.util
 spec=importlib.util.spec_from_file_location('prepare_fonts',ROOT/'prepare-fonts.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
 out=mod.external(a.output,new_output=True)
 if out.exists() or out.is_symlink():raise ValueError('Output must be a new external directory')
 rows=json.loads((ROOT/'resources.json').read_text())[a.case]['inputs'];data={};opener=urllib.request.build_opener(FixedHTTPSRedirect())
 for x in rows:
  u=urllib.parse.urlsplit(x['url'])
  if u.scheme!='https' or u.hostname!='raw.githubusercontent.com' or len(u.path.split('/')[3])!=40:raise ValueError('Fixed official source URL required')
  if not 0<x['bytes']<=32*1024*1024 or Path(x['file']).name!=x['file']:raise ValueError('Unsafe font resource record')
  with opener.open(urllib.request.Request(x['url'],headers={'User-Agent':'MotionStudio-explicit-font-preparation'}),timeout=60)as r:b=r.read(x['bytes']+1)
  if len(b)!=x['bytes'] or hashlib.sha256(b).hexdigest()!=x['sha256']:raise ValueError('Fetched font identity mismatch '+x['file'])
  git=hashlib.sha1(b'blob '+str(len(b)).encode()+bytes([0])+b).hexdigest()
  if git!=x['gitBlob']:raise ValueError('Fetched Git blob mismatch '+x['file'])
  data[x['file']]=b
 out.mkdir(parents=True)
 for n,b in data.items():
  with(out/n).open('xb')as f:f.write(b)
 print(json.dumps({'case':a.case,'inputs':len(data),'allSourceSHAAndGitBlob':'PASS','automaticDuringRender':False}))
if __name__=='__main__':main()
