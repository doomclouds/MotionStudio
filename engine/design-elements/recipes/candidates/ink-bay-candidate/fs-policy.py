# SPDX-License-Identifier: MIT
from pathlib import Path
import os,hashlib
# Logical source path must be real before resolution; no silently followed alias root.
SELF=Path(os.path.abspath(__file__))
if any(q.is_symlink() for q in [SELF,*SELF.parents]) or not SELF.is_file():raise ValueError('real policy source')
R=SELF.parent
def regular(p):
 p=Path(p)
 if any(q.is_symlink() for q in [p,*p.parents])or not p.is_file():raise ValueError('regular nonsymlink input')
 return p.read_bytes()
def external(raw,kind='directory'):
 p=Path(raw)
 if not p.is_absolute()or os.path.normpath(raw)!=raw or p==R or R in p.parents:raise ValueError('normalized absolute external output')
 if p.exists()or any(q.is_symlink()for q in [p,*p.parents])or not p.parent.is_dir():raise ValueError('new nonsymlink target/existing parent')
 return p
def sha(b):return hashlib.sha256(b).hexdigest()
