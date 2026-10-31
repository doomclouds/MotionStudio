"""SPDX-License-Identifier: Apache-2.0. Exact offline import; never downloads fonts."""
from pathlib import Path
import argparse,hashlib,json,stat
ROOT=Path(__file__).resolve().parent
REPO=next((p for p in [ROOT,*ROOT.parents] if (p/'.git').exists() and (p/'scripts/check-source-tree.py').is_file() and (p/'engine/design-elements').is_dir()),ROOT)
def target(raw):
 p=Path(raw).absolute()
 if p.is_symlink():raise ValueError('Symlink target rejected, including dangling links')
 q=p.resolve()
 if q==REPO or REPO in q.parents:raise ValueError('Output must be external to repository/package')
 if q.exists():raise ValueError('Output must be new')
 if not q.parent.is_dir():raise ValueError('Output parent must exist')
 return q
def prepare(source,output):
 out=target(output);src=Path(source)
 if src.is_symlink() or not src.is_dir():raise ValueError('Regular source directory required')
 files=[]
 for row in json.loads((ROOT/'font-lock.json').read_text()):
  p=src/row['file']
  if p.is_symlink() or not p.is_file():raise ValueError('Regular font required')
  data=p.read_bytes()
  if len(data)!=row['bytes'] or hashlib.sha256(data).hexdigest()!=row['sha256']:raise ValueError('Font identity mismatch')
  files.append((row['file'],data))
 # Validate every byte before first output. Not a hostile-race-safe file service.
 out.mkdir()
 for name,data in files:(out/name).write_bytes(data)
 return out
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--source',required=True);a.add_argument('--output',required=True);ns=a.parse_args();print(prepare(ns.source,ns.output))
