#!/usr/bin/env python3
"""Explicit licensed asset preparation. Offline by default; no downloaded code runs."""
from pathlib import Path
import argparse,hashlib,json,os,shutil,subprocess,sys,tarfile,tempfile,urllib.request,urllib.parse
HERE=Path(__file__).resolve().parent
SOURCE_ROOT=HERE.parents[2]
LOCK=json.loads((HERE/'resources.lock.json').read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
class Bad(RuntimeError):pass

def regular_path(path):
    """Keep the caller's lexical path long enough to reject every symlink ancestor."""
    path=Path(os.path.abspath(os.fspath(path)))
    for part in (path,*path.parents):
        if part.is_symlink():raise Bad('Symlink path component refused: '+str(part))
    return path

def inside(path,root):
    path=regular_path(path);root=regular_path(root)
    actual=path.resolve();boundary=root.resolve()
    if actual!=boundary and boundary not in actual.parents:raise Bad('Path escapes authorized root: '+str(path))
    return path

def verify(path,row,root=None):
    path=inside(path,root) if root is not None else regular_path(path)
    if not path.is_file():raise Bad(f"Missing resource {row['id']}: {path}. Supply the authorized exact file or explicitly use --download.")
    if path.stat().st_size!=row['bytes']:raise Bad(f"Resource hash/size mismatch: {row['id']}; no substitute is allowed")
    with path.open('rb') as f:b=f.read(row['bytes']+1)
    if len(b)!=row['bytes'] or sha(b)!=row['sha256']:raise Bad(f"Resource hash/size mismatch: {row['id']}; no substitute is allowed")
    return b

def put(path,b,expected,root=None):
    path=inside(path,root) if root is not None else regular_path(path)
    if sha(b)!=expected:raise Bad('Input identity mismatch: '+path.name)
    if path.is_symlink():raise Bad('Symlink refused: '+str(path))
    if path.exists():
        if path.read_bytes()!=b:raise Bad('Refusing replacement of changed resource: '+str(path))
        return
    path.parent.mkdir(parents=True,exist_ok=True)
    if root is not None:inside(path,root)
    fd,tmp=tempfile.mkstemp(prefix='.prepare-',dir=path.parent)
    try:
        with os.fdopen(fd,'wb') as f:f.write(b)
        os.replace(tmp,path)
    finally:
        if os.path.exists(tmp):os.unlink(tmp)

class FixedRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        if urllib.parse.urlsplit(newurl).hostname != urllib.parse.urlsplit(req.full_url).hostname:raise Bad('Cross-host redirect refused')
        if urllib.parse.urlsplit(newurl).scheme!='https':raise Bad('Non-HTTPS redirect refused')
        return super().redirect_request(req,fp,code,msg,headers,newurl)

def prepare(cache,seed,download):
    cache=regular_path(cache)
    if seed is not None:seed=regular_path(seed)
    if cache==SOURCE_ROOT or SOURCE_ROOT in cache.parents or cache in SOURCE_ROOT.parents:raise Bad('Resource cache must be outside the source tree')
    if cache.is_symlink():raise Bad('Symlink cache root refused')
    cache.mkdir(parents=True,exist_ok=True)
    downloads=inside(cache/'downloads',cache);downloads.mkdir(exist_ok=True)
    # Reject pre-existing links before any acquisition or font subprocess runs.
    for directory in ['reference','fonts','LICENSES']:inside(cache/directory,cache)
    for row in LOCK['assets']:
        if row['permission']!='explicit-license':raise Bad('Resource license not cleared')
        if not inside(HERE/row['notice'],HERE).is_file():raise Bad('Required license notice missing')
        target=inside(downloads/row['id'],cache)
        if target.exists():verify(target,row,cache);continue
        seeded=inside(seed/row['id'],seed) if seed is not None else None
        if seeded is not None and seeded.exists():b=verify(seeded,row,seed)
        elif download:
            u=urllib.parse.urlsplit(row['url'])
            if u.scheme!='https' or u.username or u.password or u.hostname not in {'raw.githubusercontent.com','registry.npmjs.org'}:raise Bad('Unapproved resource URL')
            try:
                with urllib.request.build_opener(FixedRedirect).open(row['url'],timeout=60) as response:b=response.read(row['bytes']+1)
            except Exception as e:raise Bad(f"Could not obtain {row['id']} from its fixed licensed source: {e}. No fallback; use an authorized cached copy.") from e
            if len(b)!=row['bytes'] or sha(b)!=row['sha256']:raise Bad('Downloaded identity mismatch: '+row['id'])
        else:raise Bad(f"Offline resource missing: {row['id']}. Provide --seed-cache with hash-matching licensed bytes or explicitly request --download.")
        put(target,b,row['sha256'],cache)
    for row in LOCK['assets']:
        if row['role']=='background':put(cache/'reference/source/public/fx'/f"{row['id']}.png",verify(downloads/row['id'],row,cache),row['sha256'],cache)
        elif row['role']=='audio':put(cache/'audio/soundtrack.wav',verify(downloads/row['id'],row,cache),row['sha256'],cache)
    for font in LOCK['fonts']:
        with tarfile.open(inside(downloads/font['id'],cache),'r:gz') as tar:
            for name,key,out in [(font['member'],'sha256',cache/f"reference/font-packages/{font['id']}-5.3.0"/font['member']),
                                 (font['license_member'],'license_sha256',cache/f"reference/font-packages/{font['id']}-5.3.0"/font['license_member'])]:
                if Path(name).is_absolute() or '..' in Path(name).parts:raise Bad('Unsafe font package member path')
                out=inside(out,cache);info=tar.getmember(name)
                if not info.isfile() or info.size>2*1024*1024:raise Bad('Unexpected font package member')
                b=tar.extractfile(info).read();put(out,b,font[key],cache)
    fonts=inside(cache/'fonts',cache)
    if not fonts.exists():subprocess.run([sys.executable,str(HERE/'src/full-prepare-fonts.py'),'--reference-root',str(cache/'reference'),'--output',str(fonts)],check=True)
    for row in LOCK['derived_fonts']:
        p=inside(fonts/row['file'],cache)
        if not p.is_file() or sha(p.read_bytes())!=row['sha256']:raise Bad('Derived font mismatch: '+row['file'])
    for name in ['Leonxlnx-Tessel-MIT.txt','geist-OFL.txt','geist-mono-OFL.txt']:
        b=inside(HERE/'LICENSES'/name,HERE).read_bytes();put(cache/'LICENSES'/name,b,sha(b),cache)
    print(json.dumps({'status':'prepared','reference_root':str(cache/'reference'),'font_root':str(fonts),'audio':str(cache/'audio/soundtrack.wav'),'resource_count':len(LOCK['assets']),'font_count':len(LOCK['derived_fonts'])}))

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--cache',type=Path,required=True);p.add_argument('--seed-cache',type=Path);p.add_argument('--download',action='store_true');a=p.parse_args()
    try:prepare(a.cache,a.seed_cache,a.download)
    except (Bad,OSError,KeyError,tarfile.TarError,subprocess.CalledProcessError) as e:raise SystemExit('PREPARATION FAILED: '+str(e))
