#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
import argparse,urllib.request,hashlib
from resource_io import external,locks,check,digest
p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args();out=external(a.output,new=True);lock,_=locks();pending=[]
for f in lock['files']:
 with urllib.request.urlopen(f['url'],timeout=60)as response:check(response.geturl()==f['url'],'redirect unsupported');b=response.read(f['bytes']+1)
 check(len(b)==f['bytes'] and digest(b)==f['sha256'],'download identity');check(hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()==f['gitBlob'],'Git blob');pending.append((f['file'],b))
out.mkdir(mode=0o700)
for name,b in pending:
 with (out/name).open('xb')as f:f.write(b)
print('PASS two fixed official masters; no font binaries bundled')
