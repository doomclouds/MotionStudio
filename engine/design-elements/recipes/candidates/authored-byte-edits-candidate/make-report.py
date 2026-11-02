# SPDX-License-Identifier: BSD-2-Clause
import sys
sys.dont_write_bytecode=True
import argparse,html,base64,hashlib,os
from pathlib import Path
from io_paths import fresh
R=Path(__file__).absolute().parent;p=argparse.ArgumentParser();p.add_argument('--renders',required=True);p.add_argument('--output',required=True);a=p.parse_args();out=fresh(a.output);D=Path(a.renders)
if not D.is_absolute()or a.renders!=os.path.normpath(a.renders)or any(x.is_symlink()for x in[D,*D.parents])or D==R or R in D.parents:raise ValueError('external real renders directory')
parts=['<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; base-uri \'none\'"><title>Authored byte edit evidence</title><style>body{margin:0;background:#10263b;color:#f4f1e8;font:16px/1.6 system-ui,sans-serif;padding:24px}main{max-width:1360px;margin:auto}h1{font-size:clamp(40px,7vw,88px);line-height:1.05}section{margin:28px 0;border:1px solid #577183;padding:18px}img{max-width:100%;height:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.6 monospace}small{display:block;overflow-wrap:anywhere;color:#b6cad5}</style><main><h1>Authored byte edits.</h1><p>Two fictional static evidence compositions. Given operations, not a diff search, patch installer, real file comparison or application UI. No original screenshot or private reference is included. This is an isolated source candidate, not a new registered family; author checks do not imply independent review or owner aesthetic acceptance.</p>']
for name in ['packet','archive','packet-pair','archive-pair','packet-summary','archive-summary']:
 f=D/(name+'.png')
 if f.is_symlink()or not f.is_file():raise ValueError('regular render')
 b=f.read_bytes()
 if b[:8]!=b'\x89PNG\r\n\x1a\n':raise ValueError('PNG render')
 parts.append('<section><h2>'+name+'</h2><img alt="'+name+' static authored byte evidence" src="data:image/png;base64,'+base64.b64encode(b).decode()+'"><small>SHA256 '+hashlib.sha256(b).hexdigest()+'</small></section>')
for name in ['README.md','CONTRACT.md','DESIGN.md','NOTICES.md']:parts.append('<section><details><summary>'+name+'</summary><pre>'+html.escape((R/name).read_text())+'</pre></details></section>')
parts.append('<p>Rendered images are derived outputs and stay outside the text-only migration boundary. No browser/accessibility/security certification or motion validation is claimed.</p></main></html>');out.write_text('\n'.join(parts));print(hashlib.sha256(out.read_bytes()).hexdigest())
