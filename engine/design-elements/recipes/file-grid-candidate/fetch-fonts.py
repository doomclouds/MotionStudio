#!/usr/bin/env python3
"""MIT. Fetch two fixed official resources to a NEW external directory only."""
import argparse,json,urllib.request
from font_support import external,lock,digest,ROOT
def main():
 p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args()
 out=external(a.output)
 if out.exists():raise ValueError('fetch requires a new external directory')
 r=lock()['source'];outputs={}
 for name,url,want,limit in [(r['file'],r['url'],r['sha256'],r['bytes']), (r['licenseFile'],r['licenseUrl'],r['licenseSHA256'],10000)]:
  with urllib.request.urlopen(url,timeout=30) as response:b=response.read(limit+1)
  if len(b)>limit or digest(b)!=want:raise ValueError('official resource identity')
  outputs[name]=b
 if outputs[r['licenseFile']]!=(ROOT/'licenses/Inter-OFL.txt').read_bytes():raise ValueError('notice mismatch')
 # No filesystem write occurs before both complete official responses pass identity.
 out.mkdir(parents=True,exist_ok=False)
 for name,b in outputs.items():
  with (out/name).open('xb') as f:f.write(b)
 print(json.dumps({'status':'PASS','network':True,'resources':[{'file':n,'sha256':digest(b),'bytes':len(b)} for n,b in outputs.items()]}))
if __name__=='__main__':main()
