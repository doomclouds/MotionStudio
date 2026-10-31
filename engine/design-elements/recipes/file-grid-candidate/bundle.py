"""MIT. Deterministic text-only candidate ZIP; no binary fonts or private evidence."""
from pathlib import Path
import argparse,hashlib,json,zipfile
from font_support import ROOT,external
def main():
 a=argparse.ArgumentParser();a.add_argument('--output',required=True);args=a.parse_args();out=external(args.output)
 if out.exists():raise ValueError('new external ZIP path required')
 files=json.loads((ROOT/'package-files.json').read_text())
 for f in files:
  p=ROOT/f
  if p.is_symlink() or not p.is_file() or b'\0' in p.read_bytes():raise ValueError('regular text source')
 out.parent.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(out,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for f in files:
   i=zipfile.ZipInfo(f,date_time=(2026,10,31,0,0,0));i.compress_type=zipfile.ZIP_DEFLATED;i.external_attr=0o100644<<16;z.writestr(i,(ROOT/f).read_bytes())
 print(json.dumps({'members':len(files),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'fontBinaries':0}))
if __name__=='__main__':main()
