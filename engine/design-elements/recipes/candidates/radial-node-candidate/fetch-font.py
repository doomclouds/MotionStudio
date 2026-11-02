#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Fetch only the fixed OFL master; no program, screenshot or theme execution."""
import argparse,os,stat,pathlib,urllib.request,hashlib
ROOT=pathlib.Path(__file__).absolute().parent
URL='https://raw.githubusercontent.com/kando-menu/kando/63c2502c11d31ca709c6496642745c75dc37e8a2/assets/fonts/NotoSans-VariableFont_wdth,wght.ttf'
SHA='74df1f61ab9d4bfaa961c65f8dc991deaae2885b0a6a6d6a60ed23980b3c8554';SIZE=2490816
p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args()
if not os.path.isabs(a.output) or any(x in ['.','..']for x in a.output.split('/')):raise ValueError('absolute dot-free output')
out=pathlib.Path(a.output)
for q in [out,*out.parents]:
 try:
  if stat.S_ISLNK(os.lstat(q).st_mode):raise ValueError('no symlinks')
 except FileNotFoundError:pass
if out==ROOT or ROOT in out.parents or os.path.lexists(out) or not out.parent.is_dir():raise ValueError('new external output')
with urllib.request.urlopen(URL,timeout=45)as r:b=r.read(SIZE+1)
if len(b)!=SIZE or hashlib.sha256(b).hexdigest()!=SHA:raise ValueError('fixed master identity')
out.mkdir(mode=0o700);(out/'Noto-master.ttf').write_bytes(b);print(SHA)
