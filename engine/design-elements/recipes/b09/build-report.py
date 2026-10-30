import json,base64,html,sys,pathlib
p=pathlib.Path(sys.argv[1]).resolve()
if pathlib.Path(__file__).resolve().parent in (p,*p.parents): raise SystemExit('external evidence required')
r=json.loads((p/'results.json').read_text())
parts=['<!doctype html><meta charset="utf-8"><title>B09 配方复用验证</title><style>body{background:#edece8;color:#20212a;font:17px/1.7 system-ui;max-width:1240px;margin:40px auto;padding:0 24px}img{width:100%;display:block;margin:18px 0}section{margin:48px 0}code{overflow-wrap:anywhere}</style><h1>B09：从作品到可组合配方</h1><p>两项有边界配方，零新增家族。两组合是虚构内容的技术/表达验证，不是原作复刻、真实运营计划或用户审美认可。</p><h2>为什么提这两项</h2><p>强调词建立阅读焦点，固定大小的全/半枚符号表达数量。不同计量的书籍指标不错误相加，图符不靠放大面积伪编码。</p>']
for f in r['frames']:
 data=(p/f['file']).read_bytes();parts.append('<section><h2>'+html.escape(f['name'])+'</h2><img src="data:image/png;base64,'+base64.b64encode(data).decode()+'"><p>'+html.escape(f['description'])+'</p><details><summary>真实调用与几何结果</summary><pre>'+html.escape(json.dumps(f['result'],ensure_ascii=False,indent=2))+'</pre></details></section>')
parts+=['<h2>验证边界</h2><p>固定1200×750、相同骨架的两种内容。显式强调不是自动段内流排；单位图符支持有限圆片/票形，明确全/半枚、不代表任意图标库。数据全部作者编造并在图中标记。字体外置哈希锁，PNG/报告不随源包分发；没有生成图层。</p><h2>测试</h2><pre>'+html.escape(json.dumps(r['tests'],ensure_ascii=False,indent=2))+'</pre><p>独立评审意见另附，不以自动测试数代替视觉完成度或用户认可。</p>']
with (p/'b09-recipes-review.html').open('x',encoding='utf-8') as f: f.write(''.join(parts))
