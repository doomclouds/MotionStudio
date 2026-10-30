# design.vertical-imprint.v1 · 直列刻本排印

来源：`song-bauhaus-candidates/song/design/scene.mjs`（归档作品song-block-print-study）。提取右起逐列阅读、字格节律、双边框、正文/批注色，而非复用原气象文案或宣称历史真实性。区别于通用typographic-focus：每字有固定竖向格与实际字形墨迹度量，输出逐字位置和列阅读顺序。

输入columns数组按阅读顺序排列，每列稳定id/text/role(body或annotation)，只支持直立汉字与〇；不支持Latin混排、组合标记、标点转向、禁则换行或自动拆列。fontSize18–64；step至少字号1.2倍；columnGap至少字号1.5倍。title/caption水平显示。调用者须明确分列，内容溢出绘前拒绝，不偷偷缩字。

字体由调用者提供。原Song400/600是源案例字集子集，不足以画新文案；测试使用全量NotoSerifTC变量字体，注册为B05Song，记录SHA256，未把17MB字体打包进模块。字体缺字不能用相似框替代：测试脚本检查所有CJK字在字体cmap；实际绘制还检查可见墨迹尺寸，但模块本身不负责字体文件检索。

适合文化档案、出版式信息、简短观察札记，非长篇排版引擎、医疗记录真伪、古籍鉴定。色批注必须真实标为作者内容；示例是当代虚构。横向副文负责解释版式来源与内容边界。两配方：茶事工作坊与街巷观察索引，结合几何分组标识与正常标题，不把所有内容硬做古风。

字体默认600字重（可选400–700），脚注13px且对比更强；预检与实画使用同字重。固定右起列不是自动均匀填版：列距由编辑决定，空白是外侧留白，不会擅自分散/拉伸字距来填满。示例为紧凑列距调整后的稿，不以满版字数作为质量指标。

稳定来源作品：`portfolio/works/song-block-print-study`。本地提取快照：`song-bauhaus-candidates/song`。这里是设计关系提取；原作品scene未改为调用本模块，真实新调用见`examples/b05-compositions.mjs`。
