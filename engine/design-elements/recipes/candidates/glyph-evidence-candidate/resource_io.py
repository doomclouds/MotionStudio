# SPDX-License-Identifier: Apache-2.0
from pathlib import Path
import os,stat,hashlib,json
ROOT=Path(__file__).absolute().parent
MASTER_SHA='47b24add204c8d43d8396b40c7772e799983dbf83eea9790ddeda35f8a8803a0';SPEC_SHA='4e41ed6f48d516b5dcd2cb6bc6fe7bb599fdf9cdadd4fb29fd97f7a76e913326'
def check(ok,msg):
 if not ok:raise ValueError(msg)
def digest(raw):return hashlib.sha256(raw).hexdigest()
def external(value,new=False):
 check(isinstance(value,str) and os.path.isabs(value),'absolute external path');check(all(x not in ('.','..') for x in value.split('/')),'no dot components');p=Path(value);q=Path(p.anchor)
 for part in p.parts[1:]:
  q=q/part
  try:check(not stat.S_ISLNK(os.lstat(q).st_mode),'symlink path')
  except FileNotFoundError:pass
 check(p!=ROOT and ROOT not in p.parents,'outside package')
 if new:check(p.parent.is_dir() and not os.path.lexists(p),'fresh output with existing parent')
 else:check(p.is_dir(),'existing directory')
 return p
def regular(p):
 q=Path(p.anchor)
 for part in p.parts[1:]:q=q/part;check(not stat.S_ISLNK(os.lstat(q).st_mode),'symlink file component')
 check(stat.S_ISREG(os.lstat(p).st_mode),'regular file');return p
def locked(name,sha):
 p=regular(ROOT/name);check(p.stat().st_size<20000,'lock size');b=p.read_bytes();check(digest(b)==sha,'lock identity');return json.loads(b)
def locks():return locked('master-lock.json',MASTER_SHA),locked('instance-spec.json',SPEC_SHA)
def checked_masters(inputs):
 lock,spec=locks()
 for f in lock['files']:
  p=regular(inputs/f['file']);check(p.stat().st_size==f['bytes'],'master size');b=p.read_bytes();check(digest(b)==f['sha256'],'master SHA');check(hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()==f['gitBlob'],'master Git blob')
 return lock,spec
