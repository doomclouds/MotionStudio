"""New-format-only structural validator; no old metadata adapter and no approval grants."""
import hashlib,json,re
from pathlib import Path, PurePosixPath
from schema_check import check_schema,matches as schema_matches
class Blocked(ValueError):pass
def require(ok,code):
 if not ok:raise Blocked(code)
def unique(pairs):
 d={}
 for k,v in pairs:
  require(k not in d,'DUPLICATE_JSON_KEY');d[k]=v
 return d
def read(p):return json.loads(Path(p).read_text(),object_pairs_hook=unique)
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def relative(s):
 p=PurePosixPath(s);require(not p.is_absolute() and '\\' not in s and ':' not in s and str(p)==s and all(x not in {'.','..'} and not x.startswith('.') for x in p.parts),'UNSAFE_PATH');return p
def file(root,s):
 relative(s);p=root/s
 require(all(not x.is_symlink() for x in [p,*p.parents] if x==root or root in x.parents),'SYMLINK')
 require(p.is_file(),'MISSING_FILE');return p
SCHEMA=read(Path(__file__).with_name('work.schema.json'));check_schema(SCHEMA)
def validate(d,root=None):
 require(schema_matches(SCHEMA,d),'WORK_SCHEMA_INVALID')

 if d['lifecycle']=='candidate':
  history=d['history'];require(all(h['version']!=d['version'] for h in history),'HISTORICAL_VERSION_IS_CURRENT')
  require(d['cover']['binding']['version'] in {h['version'] for h in history},'PREVIEW_HISTORY_BINDING_MISSING')
  bound=[h for h in history if h['version']==d['cover']['binding']['version']];require(len(bound)==1 and {k:v for k,v in d['cover'].items() if k!='binding'}==bound[0]['cover'],'HISTORICAL_PREVIEW_CHANGED')
  dims=set(d['verification']['dimensions']);require(dims==({'clean_restore','technical','visual'} if d['kind']=='static' else {'clean_restore','technical','visual','listened','av_sync'}),'VERIFICATION_DIMENSIONS_MISMATCH')
  for h in history:
   relative(h['recorded_in']['path'])
   require(h['rights']['status'] in ['reviewed','reviewed-publication-scope'],'HISTORY_RIGHTS_CHANGED')
   require('binding' not in h['cover'],'HISTORY_COVER_MUTATED')
   require(('listened' not in h['acceptance'] and 'av_sync' not in h['acceptance']) if d['kind']=='static' else ('listened' in h['acceptance'] and 'av_sync' in h['acceptance']),'HISTORY_KIND_MISMATCH')
 require(d['kind']!='video' or d['cover']['frame']<d['render']['timeline']['frames'],'COVER_FRAME_RANGE')
 require(len({x['id'] for x in d['resources']})==len(d['resources']),'DUPLICATE_RESOURCE')
 paths=[x['path'] for x in d['files']];require(len(set(paths))==len(paths) and 'work.json' not in paths,'INVENTORY_DUPLICATE_OR_SELF')
 for s in paths:relative(s)
 for k in ('entrypoint',):relative(d['render'][k])
 for r in d['resources']:
  if 'local_path' in r:relative(r['local_path'])
  if 'generator' in r:relative(r['generator'])
 require(not re.search(r'/workspace/|/home/agent/|/Users/|libfile_|recordId|durableStorage|executionEvidence|PRIVATE_LIBRARY|PRIVATE_OWNER_PAGE|SCRATCH_LOCAL_ONLY',json.dumps(d)),'PRIVATE_CONTENT')
 if root is not None:
  root=Path(root);require(root.name==d['id'],'WORK_ID_MISMATCH')
  actual=set()
  for p in root.rglob('*'):
   require(not p.is_symlink(),'SYMLINK')
   if p.is_file() and p!=root/'work.json':actual.add(p.relative_to(root).as_posix())
  require(actual==set(paths),'INVENTORY_SET_MISMATCH')
  for row in d['files']:require(sha(file(root,row['path']))==row['sha256'],'FILE_HASH_MISMATCH')
  if d['lifecycle']=='candidate' and (root/'ui-dependencies.json').exists():
   lock=read(file(root,'ui-dependencies.json'))
   require(set(lock)=={'repository','dependency_commit','verification_status','root','files'},'CANDIDATE_LOCK_FIELDS_INVALID')
   require(lock['verification_status']=='NOT_RUN' and lock['root']=='engine/design-elements','CANDIDATE_LOCK_STATE_INVALID')
   require(re.fullmatch('[0-9a-f]{40}',lock['dependency_commit']) is not None,'CANDIDATE_COMMIT_INVALID')
   require(len({x['path'] for x in lock['files']})==len(lock['files']),'DUPLICATE_DEPENDENCY')
   for row in lock['files']:
    require(set(row)=={'path','sha256'},'CANDIDATE_LOCK_ROW_FIELDS_INVALID');relative(row['path']);require(re.fullmatch('[0-9a-f]{64}',row['sha256']) is not None,'CANDIDATE_DEPENDENCY_HASH_INVALID')
   for usage in d.get('design',{}).get('assetUsage',[]):
    require(usage['sourceCommit']==lock['dependency_commit'],'CANDIDATE_USAGE_COMMIT_MISMATCH')
    matches=[row for row in lock['files'] if lock['root']+'/'+row['path']==usage['modulePath']]
    require(len(matches)==1 and matches[0]['sha256']==usage['moduleSha256'],'CANDIDATE_USAGE_LOCK_MISMATCH')

 return True
if __name__=='__main__':
 import argparse
 ap=argparse.ArgumentParser();ap.add_argument('work');a=ap.parse_args();p=Path(a.work);validate(read(p),p.parent);print('New-format metadata checks passed; no artistic/rights approval implied.')
