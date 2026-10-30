from pathlib import Path
import json,base64,os
r=Path(__file__).resolve().parent
e=Path(os.environ['B06_EVIDENCE_DIR'])
if not e.is_absolute() or e.resolve()==r or r in e.resolve().parents:raise ValueError('external absolute evidence directory required')
v=json.loads((e/'results.json').read_text());font=json.loads((e/'font-coverage.json').read_text())
def img(name):return '<img alt="'+name+'" src="data:image/png;base64,'+base64.b64encode((e/name).read_bytes()).decode()+'">'
s=['''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>B06 组合配方沉淀</title><style>body{background:#211e31;color:#f3e8da;font:17px/1.7 system-ui;margin:0}main{max-width:1200px;margin:auto;padding:48px 24px}h1{font-size:40px}h2{margin-top:48px;color:#efb37d}p,li{color:#c9bfce;max-width:1000px}img{width:100%;margin:14px 0;border:1px solid #5f5369}code{color:#efb37d}table{border-collapse:collapse;width:100%}td,th{padding:14px;border:1px solid #5f5369;text-align:left}</style><main><h1>B06：保留作者配方，组合成可以再次使用的结构</h1><p>本轮增加0个通用UI族。保留两个已有作者helper，结合现有积木形成2个候选组合配方，每个都用两种内容实际验证。它们不是四件新收藏作品，也不是重新给现有案例改名。</p><h2>有序选择 → 标题与详情同步</h2><p>原节气24项色带helper保持逐字一致。相同选中索引驱动色带、高亮标题与任务卡；色块宽高仅表示选择，不暗示时间或数量。第二份输入改为24步创作练习，改变类别顺序、任务、索引、配色与说明。</p>''']
for n in ['seasonal-observation.png','creative-curriculum.png']:s.append(img(n))
s+=['<h2>连续正文 → 有数据定义的旁证</h2><p>原年度信显式分栏helper保持逐字一致。新侧栏组合已有material、typographic、proportional-partition，总量和分类面积来自同一输入。原例含义未定义的68%条不迁移，也不把虚构机构成果变成事实。</p>']
for n in ['library-letter.png','studio-letter.png']:s.append(img(n))
s+=['<h2>真实调用关系与计数</h2><table><tr><th>对象</th><th>真实关系</th><th>不能混算</th></tr><tr><td>原节气 / 原年度信</td><td>已经调用各自的strip/columns helper</td><td>没有调用新组合配方</td></tr><tr><td>新4张合成图</td><td>调用2个组合配方、原helper与现有UI族</td><td>不算4件用户收藏作品或2个新通用族</td></tr><tr><td>地图 / 图例</td><td>作者已有面积符号/路径描边配方与测试，本轮引用并去重</td><td>不冒称已变为通用地图或认证导向图标系统</td></tr></table>']
s+=['<h2>验证与限制</h2><p>'+str(v['testCount'])+'项组合测试通过：不同内容确定性、索引联动、同源总量/面积、上下文与输入不变、错误输入的离屏事务不污染目标画面。'+str(font['characters'])+'个汉字cmap覆盖通过，实际发现缺字方框后修正字体/文字契约，而非仅看测试成功。</p><p>固定1200×750静态配方，24项导航与两栏明确断行都是限制，不是通用自动排版。原14族及原作代码未修改；源helper SHA记录在verification/results.json。独立复核和用户审美认可仍分开。</p></main></html>']
with(e/'b06-recipes-review.html').open('x')as out:out.write(''.join(s))
