#!/usr/bin/env python3
"""Verify exported artifact hashes; optionally create a small, explicitly partial delivery ZIP."""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile


def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest()


def audit(out):
    out=Path(out).resolve()
    manifest=json.loads((out/'manifest.json').read_text())
    problems=[]; seen=set()
    for row in manifest['files']:
        name=row['path']; target=(out/name).resolve()
        if name in seen or Path(name).is_absolute() or not target.is_relative_to(out):
            raise ValueError('Unsafe or duplicate manifest path')
        seen.add(name)
        if not target.is_file(): problems.append({'path':name,'status':'MISSING'})
        elif target.stat().st_size!=row['bytes'] or digest(target)!=row['sha256']:
            problems.append({'path':name,'status':'STALE'})
    for name in ['reference.profile.json','candidate.profile.json','comparison.json']:
        if name not in seen or not (out/name).resolve().is_relative_to(out):
            raise ValueError('Required profile is not safely bound in manifest: '+name)
    ref=json.loads((out/'reference.profile.json').read_text()); cand=json.loads((out/'candidate.profile.json').read_text())
    comp=json.loads((out/'comparison.json').read_text())
    if ref['schema_version']!=cand['schema_version']:
        problems.append({'path':'profiles','status':'SCHEMA_MISMATCH'})
    if ref['algorithm']!=cand['algorithm']:
        problems.append({'path':'profiles','status':'ALGORITHM_MISMATCH'})
    for role,profile in [('reference',ref),('candidate',cand)]:
        if profile['input']['sha256']!=comp['inputs'][role+'_sha256']:
            problems.append({'path':role+'.profile.json','status':'INPUT_BINDING_MISMATCH'})
    return {'status':'ARTIFACT_HASHES_MATCH' if not problems else 'INVALID_OR_STALE',
            'manifest_files':len(seen),'problems':problems,
            'meaning':'Artifact integrity only. Not source rights, actual hearing, browser playback, or artistic approval.'}


def compact_package(out, destination):
    out=Path(out).resolve(); dest=Path(destination).resolve()
    result=audit(out)
    if result['problems']: raise ValueError('Refusing to package stale/incomplete artifacts')
    if dest.exists(): raise ValueError('Package already exists; refusing overwrite')
    names=['benchmark.html','overview.png','reference.profile.json','candidate.profile.json','comparison.json']
    rows=[]
    for name in names:
        p=out/name
        listed={r['path'] for r in json.loads((out/'manifest.json').read_text())['files']}
        if name not in listed or not p.resolve().is_relative_to(out) or not p.is_file():
            raise ValueError('Required delivery file missing or not safely manifest-bound: '+name)
        rows.append({'path':name,'bytes':p.stat().st_size,'sha256':digest(p)})
    note=('私有视听参考诊断 / compact delivery\n\n'
          '打开 benchmark.html：内嵌缩略图、图表和最多三组短窗；不需要网络。\n'
          'overview.png 为快速总览。两个 profile 与 comparison.json 可复用。\n'
          '此紧凑包不包含完整原生 PNG、独立短窗和分析日志；完整输出目录另保留。\n'
          'HTML 中原生 PNG 的相对链接需完整 assets 目录，不在此紧凑包内。\n'
          '报告不是质量通过，实际听审仍以 profile/evidence 为准。\n')
    dest.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(dest,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for name in names: z.write(out/name,name)
        z.writestr('README-DELIVERY.txt',note)
        z.writestr('package-manifest.json',json.dumps({'scope':'compact, not full native assets', 'files':rows},ensure_ascii=False,indent=2))
    return {'package':str(dest),'bytes':dest.stat().st_size,'sha256':digest(dest),'scope':'COMPACT_WITH_NATIVE_ASSETS_SEPARATE'}


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('output',type=Path)
    p.add_argument('--package',type=Path,help='Optional NEW destination ZIP; no overwrite')
    a=p.parse_args()
    try:
        result=compact_package(a.output,a.package) if a.package else audit(a.output)
        print(json.dumps(result,ensure_ascii=False,indent=2))
        sys.exit(1 if result.get('problems') else 0)
    except (ValueError,KeyError,OSError) as e:
        print('audit-export: '+str(e),file=sys.stderr);sys.exit(2)
