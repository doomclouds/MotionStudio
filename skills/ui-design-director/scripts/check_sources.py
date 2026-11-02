#!/usr/bin/env python3
"""Readability preflight, not a runtime installation or compatibility test."""
import argparse,json,pathlib,sys
p=argparse.ArgumentParser();p.add_argument('--repo-root',required=True);a=p.parse_args()
root=pathlib.Path(a.repo_root)
paths=['knowledge/design/'+x for x in ('INDEX.md','DESIGN-GUIDE.md','CONTENT-DECISIONS.md','reference-to-composition.md')]+['skills/motion-film-director/references/design-to-motion.md','knowledge/design/static-ui-reference-study.md','engine/design-elements/README.md','engine/design-elements/catalog.json','portfolio/INDEX.md','portfolio/work.py']
results=[]
for path in paths:
    try:
        with (root/path).open('rb') as f:f.read(1)
        state='readable'
    except OSError:state='missing_or_unreadable'
    results.append({'path':path,'state':state})
print(json.dumps({'checks':results,'claim':'File readability only; no runtime or version validation.'},indent=2))
sys.exit(any(x['state']!='readable' for x in results))
