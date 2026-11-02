import pathlib,sys,json,html,base64
p=pathlib.Path(sys.argv[1]).resolve();root=pathlib.Path(__file__).resolve().parent
if p==root or root in p.parents:raise SystemExit('external evidence required')
r=json.loads((p/'results.json').read_text());parts=['<!doctype html><meta charset="utf-8"><title>B10 配方验证</title><style>body{font:17px/1.7 system-ui;background:#eeeae3;color:#222;max-width:1220px;margin:40px auto;padding:0 24px}img{width:100%}section{margin:40px 0}pre{white-space:pre-wrap}</style><h1>B10：显式文本与有量程的格网</h1><p>2受限配方，0新增家族；原scene未迁移。两组合都是作者虚构计划，不执行代码、不伪造数据采集，不代替用户审美验收。</p>']
for f in r['frames']:
 data=(p/f['file']).read_bytes();parts.append('<section><h2>'+html.escape(f['name'])+'</h2><img src="data:image/png;base64,'+base64.b64encode(data).decode()+'"><p>'+html.escape(f['description'])+'</p><details><summary>实际接口结果</summary><pre>'+html.escape(json.dumps(f['result'],ensure_ascii=False,indent=2))+'</pre></details></section>')
parts.append('<h2>设计与边界</h2><p>同一brief提供配置文字的行/列/量程/单位和矩阵值。颜色辅助扫描，格内真实输入数字保留；null与0明确区分。原CSS透明度没有被反推为出行量。code-spans仅按显式片段着色，不解析或执行；格网是sRGB通道线性插值，非感知均匀色阶，也非医疗或天文仪器。</p><p>仅固定1200×750双栏技术示例；真实数值/原始记录、响应式、Motion、中文混排未验证。独立评审记录另附，不用测试数冒充审美分。</p><h2>测试记录</h2><pre>'+html.escape(json.dumps(r['tests'],ensure_ascii=False,indent=2))+'</pre>')
with (p/'b10-recipes-review.html').open('x',encoding='utf-8') as f:f.write(''.join(parts))
