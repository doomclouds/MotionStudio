"""Offline exact-byte + real cmap check for reviewed, unmodified font inputs."""
import argparse, gzip, hashlib, io, json
from pathlib import Path
try:
    from fontTools.ttLib import TTFont
except ImportError as error:
    raise SystemExit('Existing fontTools is required; no automatic installation.') from error
ROOT=Path(__file__).resolve().parent

def checked_bytes(name, digest, size=None):
    if not isinstance(name,str) or Path(name).name!=name: raise ValueError('Local basename required')
    file=ROOT/name
    if file.is_symlink() or not file.is_file(): raise ValueError('Regular declared input required')
    data=file.read_bytes()
    if hashlib.sha256(data).hexdigest()!=digest: raise ValueError('SHA mismatch: '+name)
    if size is not None and len(data)!=size: raise ValueError('Byte size mismatch: '+name)
    return file

def verify(text):
    manifest=json.loads((ROOT/'manifest.json').read_text())
    if manifest['schema']!='reviewed-font-inputs/1' or not manifest['fonts']: raise ValueError('Nonempty reviewed manifest required')
    if manifest.get('defaultFontId') not in {r['id'] for r in manifest['fonts']}: raise ValueError('Declared default font must exist')
    rows=[]
    for record in manifest['fonts']:
        storage=record.get('storage')
        if storage:
            if storage['encoding']!='gzip': raise ValueError('Unsupported storage encoding')
            packed=checked_bytes(storage['file'],storage['sha256'],storage['bytes'])
            with gzip.open(packed,'rb') as stream: data=stream.read(record['bytes']+1)
            if len(data)!=record['bytes'] or hashlib.sha256(data).hexdigest()!=record['sha256']: raise ValueError('Restored original identity mismatch')
            file=io.BytesIO(data)
        else:
            file=checked_bytes(record['file'],record['sha256'],record['bytes'])
        checked_bytes(record['licenseFile'],record['licenseSha256'])
        with TTFont(file) as font:
            names={n.toUnicode() for n in font['name'].names if n.nameID in (1,16)}
            if record['family'] not in names: raise ValueError('Internal family mismatch: '+record['file'])
            cmap=font.getBestCmap() or {}
            missing=[ch for ch in dict.fromkeys(text) if not ch.isspace() and cmap.get(ord(ch),'.notdef')=='.notdef']
            if missing: raise ValueError(record['file']+' missing actual glyphs: '+''.join(missing))
            rows.append({'file':record['file'],'family':record['family'],'unicodeMappings':len(cmap),'target':text,'missing':missing,'strokeOrderIncluded':False})
    return rows

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--text',default='白板动画：中文手写，逐笔绘制。汉字与故事，2026！');args=p.parse_args()
    print(json.dumps(verify(args.text),ensure_ascii=False,indent=2))
