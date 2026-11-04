"""Independent work/1 static admission gate. No legacy metadata/parser imports."""
import hashlib,re
from pathlib import Path
from validate_work import read,require,validate
import source_checks as s
import source_identity

def local(root,value):
 root=Path(root);s.relative(value,'local-reference');p=root/value
 require(not root.is_symlink(),'SOURCE_ROOT_SYMLINK')
 cursor=root
 for part in Path(value).parts:cursor=cursor/part;require(not cursor.is_symlink(),'REFERENCE_SYMLINK')
 require(p.resolve().is_relative_to(root.resolve()) and p.is_file(),'REFERENCE_MISSING_OR_ESCAPE');return p

def check_design_references(d,work,repo):
 # These are local work/rule references, not dependency source identities.
 # Source identities have one strict verifier: source_identity.verify_source.
 if 'design' not in d:return
 design=d['design'];local(work,design['decisionCard'])
 for name in design['sourceAnalysis']:local(work,name)
 for name in design['ruleRefs']:local(repo,name)

def inspect(work,repo,source_repo=None):
 """Check local admission gates and recorded historical Design identities.

 Missing historical source blocks this inspection, not the recorded lifecycle.
 Local safety failures still raise Blocked. No source restoration or execution.
 """
 work=Path(work);repo=Path(repo)
 require(not any((work/name).exists() or (work/name).is_symlink() for name in ('entry.json','retention.json')),'PARALLEL_METADATA_FORBIDDEN')
 d=read(local(work,'work.json'));validate(d,work)
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
 check_design_references(d,work,repo)
 source=source_identity.verify_source(work,repo if source_repo is None else source_repo)
 source_ok=source['sourceVerification'] in {'PASSED','NOT_APPLICABLE'}
 status='PASSED' if source_ok else source['sourceVerification']
 reason=('RECORDED_GATES_PRESENT' if d['lifecycle']=='retained' else 'CURRENT_VERSION_NOT_RUN') if source_ok else 'SOURCE_VERIFICATION_'+status
 return {'id':d['id'],'kind':d['kind'],'lifecycle':d['lifecycle'],
         'status':status,'static_checks':status,'local_checks':'PASSED',
         'sourceVerification':source['sourceVerification'],
         'recoveryAvailability':source['recoveryAvailability'],
         'admissible':source_ok and d['lifecycle']=='retained','reason':reason,
         'checks':source['checks'],'errors':source['errors'],
         'sourceLimitations':source['limitations'],
         'scope':'Static local admission checks and frozen Design source identities only; no restore, render, perceptual review, legal approval or new owner acceptance.'}
