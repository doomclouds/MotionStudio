"""Independent work/1 static admission gate. No legacy metadata/parser imports."""
import hashlib,re
from pathlib import Path
from validate_work import read,sha,require,validate
import source_checks as s

def local(root,value):
 root=Path(root);s.relative(value,'local-reference');p=root/value
 require(not root.is_symlink(),'SOURCE_ROOT_SYMLINK')
 cursor=root
 for part in Path(value).parts:cursor=cursor/part;require(not cursor.is_symlink(),'REFERENCE_SYMLINK')
 require(p.resolve().is_relative_to(root.resolve()) and p.is_file(),'REFERENCE_MISSING_OR_ESCAPE');return p

def closure(root,name,seen=None):
 seen=set() if seen is None else seen
 if name in seen:return seen
 seen.add(name);code=local(root,name).read_text();require('import(' not in code,'DYNAMIC_DEPENDENCY_UNSUPPORTED')
 for target in re.findall(r"(?:from\s*|import\s*)['\"](\./[^'\"]+)['\"]",code):closure(root,str(Path(name).parent/target),seen)
 return seen

def check_design(d,work,repo):
 if 'design' not in d:return
 design=d['design'];local(work,design['decisionCard'])
 for name in design['sourceAnalysis']:local(work,name)
 for name in design['ruleRefs']:local(repo,name)
 if not design['assetUsage']:return
 assets=read(local(repo,'engine/design-elements/catalog.json'))['assets'];catalog={a['id']:a for a in assets};require(len(catalog)==len(assets),'DUPLICATE_FAMILY_ID');seen=set()
 for u in design['assetUsage']:
  require(u['familyId'] in catalog and u['familyId'] not in seen,'UNKNOWN_OR_DUPLICATE_FAMILY');seen.add(u['familyId'])
  require(u['modulePath']=='engine/design-elements/'+catalog[u['familyId']]['entry'],'FAMILY_MODULE_MISMATCH')
  module=local(repo,u['modulePath']);require(sha(module)==u['moduleSha256'],'MODULE_IDENTITY_MISMATCH')
  code=local(work,u['callsite']).read_text();require(u['importToken']==module.name and u['importToken'] in code,'IMPORT_EVIDENCE_MISSING')
  callcode=re.sub(r"/\*[\s\S]*?\*/|//[^\n]*|\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`",'',code)
  require(re.search(r'\b'+re.escape(u['callToken'])+r'\s*\(',callcode) is not None,'CALL_EVIDENCE_MISSING')
  if u['mode']=='vendored-snapshot':
   require(sha(local(work,u['snapshotPath']))==u['moduleSha256'],'SNAPSHOT_IDENTITY_MISMATCH')
   snapshots=read(local(work,'module-snapshots.json'))['files'];require(any(x['path']==u['snapshotPath'] and x['sha256']==u['moduleSha256'] and u['sourceCommit'] in x['source_url'] for x in snapshots),'SNAPSHOT_PROVENANCE_MISSING')
  else:
   require(u['snapshotPath'] is None,'RUNTIME_IMPORT_HAS_SNAPSHOT')
   require(('MOTION_UI_ASSETS_ROOT' in code and 'import(' in code) or u['modulePath'] in code,'RUNTIME_IMPORT_ROOT_MISSING')
   if (work/'ui-dependencies.json').exists():
    lock=read(local(work,'ui-dependencies.json'))
    # Lifecycle semantics, not old work-schema compatibility: frozen tested locks
    # retain their factual names, untested candidate locks cannot claim tested_commit.
    if d['lifecycle']=='candidate':
     require(set(lock)=={'repository','dependency_commit','verification_status','root','files'} and lock['verification_status']=='NOT_RUN','CANDIDATE_DEPENDENCY_LOCK_INVALID');commit=lock['dependency_commit']
    else:
     require(set(lock)=={'repository','tested_commit','root','files'},'RETAINED_DEPENDENCY_LOCK_INVALID');commit=lock['tested_commit']
    require(commit==u['sourceCommit'] and lock['root']=='engine/design-elements','DEPENDENCY_COMMIT_OR_ROOT_MISMATCH')
    require(closure(repo/'engine/design-elements',module.name).issubset({x['path'] for x in lock['files']}),'DEPENDENCY_CLOSURE_INCOMPLETE')
    require(len({x['path'] for x in lock['files']})==len(lock['files']),'DUPLICATE_DEPENDENCY')
    for row in lock['files']:
     require(set(row)=={'path','sha256'},'DEPENDENCY_ROW_FIELDS');require(sha(local(repo/'engine/design-elements',row['path']))==row['sha256'],'DEPENDENCY_BYTES_MISMATCH')
   else:require(u['moduleSha256'] in code,'RUNTIME_HARDCODED_IDENTITY_MISSING')

def inspect(work,repo):
 work=Path(work);repo=Path(repo);d=read(local(work,'work.json'));validate(d,work)
 inventory={x['path']:x for x in d['files']};cover_dimensions=None
 for path in work.rglob('*'):
  require(not path.is_symlink(),'SOURCE_SYMLINK');rel=path.relative_to(work).as_posix();s.relative(rel,'source-tree')
  if path.is_dir():continue
  require(path.is_file(),'NONREGULAR_SOURCE')
  if rel=='work.json':s.read_text(path);continue
  row=inventory[rel]
  if row['kind']=='cover':raw,cover_dimensions=s.read_cover(path)
  else:
   require(path.suffix in s.TEXT_SUFFIXES or path.name in {'LICENSE','NOTICE','COPYING'},'NON_SOURCE_EXTENSION');raw,_=s.read_text(path)
  require(hashlib.sha256(raw).hexdigest()==row['sha256'],'SOURCE_BYTES_MISMATCH')
 def listed(name,kind):s.relative(name,'listed');require(name in inventory and inventory[name]['kind']==kind,'REFERENCE_ROLE_MISMATCH')
 listed('README.md','documentation');rights=d['rights'];listed(rights['credits'],'documentation')
 require(bool(rights['notices']) and bool(rights['evidence_urls']),'RIGHTS_REFERENCES_EMPTY')
 for name in rights['notices']:listed(name,'license')
 for url in rights['evidence_urls']:s.public_url(url,'rights-url')
 if d['authorship']['unofficial_recreation']:s.public_url(d['authorship']['original']['url'],'original-url')
 require(bool(d['runtime']),'RUNTIME_LOCKS_EMPTY');names=set()
 for row in d['runtime']:
  require(row['name'] not in names,'DUPLICATE_RUNTIME');names.add(row['name'])
  require(not re.search(r'[~^*<>=\s]|latest|unspecified|unknown',row['version'],re.I),'UNPINNED_RUNTIME');listed(row['lock'],'lock')
 listed(d['render']['entrypoint'],'source');cover=d['cover'];require(cover['path']=='cover.jpg','COVER_LOCATION');listed(cover['path'],'cover')
 require(sum(x['kind']=='cover' for x in d['files'])==1 and cover['credit']==rights['credits'],'COVER_SCOPE')
 require(cover_dimensions is not None and cover_dimensions[0]*d['render']['height']==cover_dimensions[1]*d['render']['width'],'COVER_ASPECT_RATIO')
 resource_ids=set();provided=set()
 for row in d['resources']:
  require(s.ID.fullmatch(row['id']) is not None and row['id'] not in resource_ids,'RESOURCE_ID');resource_ids.add(row['id'])
  listed(row['notice'],'license');require(row['notice'] in rights['notices'],'RESOURCE_NOTICE_SCOPE');s.public_url(row['source_url'],'resource-source')
  if row['mode']=='provide':
   require(row['permission']=='user-supplied-not-distributed','RESOURCE_PERMISSION_BROADENED');s.relative(row['local_path'],'resource-input');require(row['local_path'] not in provided,'DUPLICATE_RESOURCE_PATH');provided.add(row['local_path'])
  else:
   require(row['permission']=='explicit-license' and not re.search('unknown|pending|unclear|tbd',row['license'],re.I),'UNRESOLVED_RESOURCE_LICENSE')
  if row['mode']=='fetch':s.public_url(row['fetch_url'],'fetch-url')
  elif row['mode']=='generate':listed(row['generator'],'source')
 if d['lifecycle']=='retained':
  require(rights['status']==('reviewed-publication-scope' if d['publication']['status']=='source-release' else 'reviewed'),'PUBLICATION_RIGHTS_MISMATCH')
  if d['publication']['status']=='source-release':require(any(x['mode']=='provide' for x in d['resources']),'SOURCE_RELEASE_RESOURCES_UNDECLARED')
  require(all(d['acceptance'][k] is True for k in ['complete_work','owner_keep','clean_restore','technical']),'REQUIRED_ACCEPTANCE_NOT_ESTABLISHED')
 check_design(d,work,repo)
 return {'id':d['id'],'kind':d['kind'],'lifecycle':d['lifecycle'],'static_checks':'PASSED','admissible':d['lifecycle']=='retained','reason':'RECORDED_GATES_PRESENT' if d['lifecycle']=='retained' else 'CURRENT_VERSION_NOT_RUN','scope':'Static checks only; no render, perceptual review, legal approval or new owner acceptance.'}
