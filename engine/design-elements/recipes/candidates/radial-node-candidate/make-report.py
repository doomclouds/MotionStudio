#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
import pathlib,argparse,os,stat,base64,hashlib,html,struct
ROOT=pathlib.Path(__file__).absolute().parent
p=argparse.ArgumentParser();p.add_argument('--images',required=True);p.add_argument('--output',required=True);a=p.parse_args()
def path(raw,new=False):
 if not os.path.isabs(raw)or any(x in ['.','..']for x in raw.split('/')):raise ValueError('absolute dot-free path')
 p=pathlib.Path(raw)
 for q in [p,*p.parents]:
  try:
   if stat.S_ISLNK(os.lstat(q).st_mode):raise ValueError('no symlink')
  except FileNotFoundError:pass
 if new and (p==ROOT or ROOT in p.parents or os.path.lexists(p)or not p.parent.is_dir()):raise ValueError('new external output')
 return p
out=path(a.output,True);images=path(a.images);figures=[]
for name,size,desc in [('guide',(1560,1080),'Five chapters, 15 marks, no selected category.'),('signal',(1280,1520),'Three rooms, 14 marks, Transmit selected.')]:
 f=path(str(images/(name+'.png')))
 if not f.is_file()or f.stat().st_size>20000000:raise ValueError('regular bounded PNG')
 b=f.read_bytes()
 if not f.is_file()or len(b)>20000000 or b[:8]!=b'\x89PNG\r\n\x1a\n'or struct.unpack('>II',b[16:24])!=size:raise ValueError('expected rendered PNG')
 digest=hashlib.sha256(b).hexdigest();figures.append('<figure><img alt="'+html.escape(desc)+'" src="data:image/png;base64,'+base64.b64encode(b).decode()+'"><figcaption>'+html.escape(desc)+'<br><small>Full-resolution PNG SHA256 '+digest+'</small></figcaption></figure>')
doc='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bounded radial-node recipe</title><style>body{margin:0;background:#121923;color:#e8edf5;font:16px/1.6 system-ui,sans-serif}main{max-width:1250px;margin:auto;padding:28px}h1{font-size:32px}img{display:block;width:100%;height:auto}figure{margin:28px 0;background:#202938;padding:12px;border-radius:12px}figcaption{padding:12px;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.7 system-ui,sans-serif}small{color:#b5c2d2}</style><main><h1>Direction is category. Count is evidence.</h1><p>Two fictional fixed compositions from one restricted radial-node recipe. No original reference, desktop, interaction, animation, or live data. This report is not independent or user aesthetic acceptance.</p>'+''.join(figures)+'<h2>Design guidance</h2><pre>'+html.escape((ROOT/'DESIGN.md').read_text())+'</pre><h2>Rights and resources</h2><pre>'+html.escape((ROOT/'NOTICES.md').read_text())+'</pre></main></html>'
with out.open('x')as f:f.write(doc)
print(hashlib.sha256(out.read_bytes()).hexdigest())
