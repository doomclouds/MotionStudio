# SPDX-License-Identifier: BSD-2-Clause
from pathlib import Path
import os,stat
ROOT=Path(__file__).absolute().parent
def fresh(raw):
 if not os.path.isabs(raw) or raw!=os.path.normpath(raw) or any(x in ('.','..') for x in raw.split('/')):raise ValueError('absolute normalized output')
 p=Path(raw)
 for q in [p,*p.parents]:
  try:s=os.lstat(q)
  except FileNotFoundError:continue
  if stat.S_ISLNK(s.st_mode):raise ValueError('symlink path')
 if p==ROOT or ROOT in p.parents or os.path.lexists(p) or not p.parent.is_dir():raise ValueError('new external output and existing parent')
 for q in [p,*p.parents]:
  if (q/'engine/design-elements/catalog.json').is_file() and (q/'scripts/check-source-tree.py').is_file():raise ValueError('outside MotionStudio source checkout')
 return p
