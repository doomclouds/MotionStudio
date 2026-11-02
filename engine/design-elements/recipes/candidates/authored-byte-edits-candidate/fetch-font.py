#!/usr/bin/env python3
# SPDX-License-Identifier: BSD-2-Clause
"""Restore one unmodified public OFL font, never an upstream program or image."""
import sys
sys.dont_write_bytecode=True
import argparse,urllib.request,hashlib
from io_paths import fresh
URL='https://raw.githubusercontent.com/google/fonts/2e61f4355afd22b801791b0df176065082423b87/ofl/ibmplexmono/IBMPlexMono-Regular.ttf'
SIZE=135580;SHA='6a3412f058c7d8dfd9170c41e85ade48e5156ecb89356110ca57a0a27734af46';BLOB='0c9770d5183ba60dc4350d3e011b782a320761ae'
p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args();out=fresh(a.output)
with urllib.request.urlopen(URL,timeout=45) as response:b=response.read(SIZE+1)
if len(b)!=SIZE or hashlib.sha256(b).hexdigest()!=SHA or hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()!=BLOB:raise ValueError('official font identity')
out.mkdir(mode=0o700);(out/'IBMPlexMono-Regular.ttf').write_bytes(b);print(SHA)
