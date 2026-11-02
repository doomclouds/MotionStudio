#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""This directory is the migration boundary, not a full-repository history audit."""
import pathlib,json,re
root=pathlib.Path(__file__).absolute().parent
policy=json.loads((root/'source-policy.json').read_text());expected=sorted(policy['allowedPaths']);seen=[]
for item in sorted(root.rglob('*')):
 if item.is_symlink():raise ValueError('symlink in source boundary')
 if not item.is_file():continue
 relative=item.relative_to(root).as_posix();seen.append(relative)
 if relative not in expected:raise ValueError('unexpected path '+relative)
 data=item.read_bytes();text=data.decode('utf-8')
 if b'\x00'in data or len(data)>200000:raise ValueError('non-text or oversized source')
 if item.suffix.lower()in{'.png','.jpg','.jpeg','.gif','.ttf','.otf','.woff','.woff2','.zip','.mp4','.icc'}:raise ValueError('media outside boundary')
 patterns=[r'libfile_'+'[0-9a-f]{12,}',r'file_'+'[0-9a-f]{12,}',r'/'+'workspace/',r'/'+'home/agent/',r'data:'+'image/[^;]+;base64,[A-Za-z0-9+/]{100}',r'base64,'+'[A-Za-z0-9+/]{100}',r'ext-kando-'+'petalwork-native']
 if any(re.search(rx,text)for rx in patterns):raise ValueError('private/media content '+relative)
if seen!=expected:raise ValueError('missing source entries')
m=json.loads((root/'candidate-manifest.json').read_text())
if m['newPublicFamilies']!=0 or m['registryChanges']!=0 or m['published']:raise ValueError('not promoted')
print(json.dumps({'status':'PASS','textFiles':len(seen),'mediaFontPrivateFiles':0,'scope':'exact candidate text only, not repository history','newPublicFamilies':0}))
