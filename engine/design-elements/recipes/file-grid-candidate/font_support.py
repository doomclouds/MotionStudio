"""MIT. Shared strict external resource paths; parent directories are trusted."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parent
def digest(b):return hashlib.sha256(b).hexdigest()
def lock():return json.loads((ROOT/'font-lock.json').read_text())
def external(raw):
 p=Path(raw)
 if not p.is_absolute():raise ValueError('absolute external path required')
 # Check lexical leaf before resolve: includes dangling symlinks.
 if p.is_symlink():raise ValueError('symlink output/input directory')
 q=p.resolve()
 if q==ROOT or ROOT in q.parents:raise ValueError('binary resources must remain outside source package')
 return q
def regular(p):
 if p.is_symlink() or not p.is_file():raise ValueError('regular resource required')
 return p.read_bytes()
def verified_inputs(inputs):
 rows=lock();r=rows['source'];raw=regular(inputs/r['file']);notice=regular(inputs/r['licenseFile'])
 if len(raw)!=r['bytes'] or digest(raw)!=r['sha256']:raise ValueError('master font SHA/size')
 blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
 if blob!=r['gitBlob'] or digest(notice)!=r['licenseSHA256']:raise ValueError('source blob/OFL identity')
 if notice!=regular(ROOT/'licenses/Inter-OFL.txt'):raise ValueError('bundled OFL mismatch')
 return raw
