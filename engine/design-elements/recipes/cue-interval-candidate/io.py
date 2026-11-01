"""MIT. Ordinary trusted filesystem boundaries; no concurrent-writer sandbox."""
from pathlib import Path
import os
ROOT=Path(__file__).resolve().parent
REPO=next((p for p in [ROOT,*ROOT.parents]if(p/'.git').is_file()or(p/'.git'/'HEAD').is_file()),None)
def external(raw,new=False,directory=True):
 if not isinstance(raw,str)or not os.path.isabs(raw)or os.path.normpath(raw)!=raw:raise ValueError('normalized absolute path')
 p=Path(raw)
 if any(r and(p==r or r in p.parents)for r in [ROOT,REPO]):raise ValueError('outside package and detected Git checkout')
 for q in [p,*p.parents]:
  if q.is_symlink():raise ValueError('nonsymlink path')
 if new:
  if p.exists():raise ValueError('new destination only')
  if not p.parent.is_dir():raise ValueError('existing destination parent')
 elif not (p.is_dir()if directory else p.is_file()):raise ValueError('regular existing input')
 return p
