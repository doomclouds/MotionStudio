# design.print-poster.v1 · 印刷招贴

<!-- asset-self-description: design.print-poster.v1 -->

## 身份与机器索引

独立静态设计族。唯一登记是 [catalog](../../catalog.json) 的 `assets[id=design.print-poster.v1]`，状态和版本以该条目为准；不加入 `drawAsset` dispatcher。源码 [index.mjs](index.mjs) 直接导出 `drawPaper`、`drawOverprint`、`drawPoster`、`recipes` 和身份/指导元数据。旧平层路径已移除，不设兼容层。

本目录将使用入口、[设计分析](design.md)、实现、[可执行示例](examples/render.mjs)及[测试](test/contract.mjs)放在一起。README说明如何选择与运行；design.md仅深入解释判断依据，不承载被本页遗漏的必填参数。

## 设计意图

用硬边纸签、可控倾斜和硬偏移叠印形成有实体感的印刷语法。短标题先发出主张，一个与内容相关的主物承担中间焦点，少量行动信息收尾。听音活动的主物是唱片，印刷工作坊则是纸张，不能只换标题却留下无关主物。

## 适用与不适用

适合有文化态度、一个主体及少量行动信息的活动/零售招贴；也可单用纸签强调CTA，单用叠印组织短标签。不要给全部元素同等字阶、随机倾斜每一块或用软发光替代印刷关系。不适合密集数据、医疗说明、长文、自动品牌生成、响应式页面或可交互控件。固定 `drawPoster` 不是任意内容排版器。

## 视觉与动态行为

`drawPaper`围绕自身中心按角度旋转，先画有偏移的硬阴影、再画厚边和3px内缩纸面；没有纹理、折痕或真实光照。`drawOverprint`先画偏移墨色再画前景同文案，均左对齐、alphabetic基线。`drawPoster`固定1000×600，布局和纸签位置写在实现里，主物仅record/sheets两个分支。全部静态，无时间、事件、动画或降动效参数；调用者另行安排动效与读时。

## 参数与代码入口

直接从本目录 `index.mjs` import，调用者提供Canvas 2D context。所有绘制函数返回undefined；它们不是返回几何的通用族接口。

- `drawPaper(ctx, {x,y,width,height,rotation=0,fill='#f6eedc',ink='#202020',offset=8})`：x/y为矩形左上角，坐标和宽高为有限像素，width≥40、height≥30；rotation为度，−15..15；offset为像素，0..20。阴影会延伸到名义矩形之外，调用者为倾斜及阴影留白。
- `drawOverprint(ctx, {text,x,y,font='bold 64px serif',fill='#b53028',ink='#202020',offset=5,maxWidth=650})`：text为1–60字符；x/y为有限像素基线坐标；offset0..20、maxWidth>0。以当前Canvas测量advance宽度，超宽抛错，不压缩字号。font和颜色由Canvas解释，当前实现不验证字体实际存在、CSS颜色或墨迹外溢；调用者必须提供可用字体和允许的样式。
- `drawPoster(ctx, recipe)`：读取 `title,note,price,paper,accent,counter,shape`。shape只能record/sheets；其余文本进入上述叠印校验。输入不是严格schema，不拒绝所有未知字段。固定标题60px、note22px、price60px，宽度预算分别920/420/330。`recipes.listening`及`recipes.workshop`为两套合成输入，不能当真实商业信息。

save/restore包围绘制，输入不写回；Canvas当前路径可能改变。Native Canvas颜色getter存在宿主差异，不以getter相等声称全部宿主状态隔离。`drawPoster`不在绘前验证所有下游文字，因此失败时可能已经绘制背景/标题；需要事务式渲染时在离屏Canvas完成后再合成。

## 可执行示例

从仓库根运行（解包后将 `engine/` 换为 `runtime/`）：

```sh
export MOTION_ENGINE_ROOT=/absolute/path/to/installed/motion-render-core
export PRINT_POSTER_FONT_DIR=/absolute/path/to/dejavu
node engine/design-elements/families/print-poster/examples/render.mjs
node engine/design-elements/families/print-poster/test/contract.mjs
# 可选：输出到尚不存在的仓库外目录
node engine/design-elements/families/print-poster/examples/render.mjs --out /absolute/new-external-output
```

示例实际import并调用drawPoster两次，默认只输出字体及PNG哈希，不写文件。输出工具使用独占创建，不覆盖已有目录/图片；输入目录和宿主文件系统须可信，不是对抗性文件系统沙箱。

## 依赖与恢复

Node24+；实现本身没有模块依赖，不读文件、联网或加载字体。示例/测试需要已安装的 `@napi-rs/canvas`，由MOTION_ENGINE_ROOT的package解析上下文加载，不能复制node_modules进本目录。所测Native版本为0.1.100；锁与宿主版本仍由消费者保留。

字体目录需含 DejaVuSans.ttf、DejaVuSans-Bold.ttf、DejaVuSerif.ttf、DejaVuSerif-Bold.ttf；来自合法已安装的DejaVu发行，分别注册sans-serif/serif，逐文件记录SHA256。也接受已有UI_TEST_FONT_DIR作为同一目录输入。没有这些字体则明确失败，不静默用系统替代。资源不随源码分发，改变字体需重新测量、绘制和审查。

## 来源与权利

代码为本库原创有界实现，按仓库 [MIT](../../../../LICENSE) 使用。方法来自 [内容驱动印刷招贴](../../../../knowledge/design/cases/ui-003-print-poster.md) 对Huashu黑胶样例的观察；原图、品牌、字体、颗粒纹理均未复制进实现。方法来源作品不等于已调用本族的作品；实际消费者由work.json记录。

[第三方声明](../../../../THIRD_PARTY_NOTICES.md)及 [源码范围](../../../../SOURCE-SCOPE.md)继续适用，MIT不授权复制参考媒体。外部DejaVu字体许可随字体发行核查，示例不重新分发字体。来源与设计取舍细节见design.md，但使用本函数不要求获取原图。

## 验证与局限

同目录测试覆盖两份不同内容的真实Canvas绘制、同环境重复字节一致、两份图像不同及四类非法输入拒绝。示例输出PNG哈希与字体身份，可在新进程重跑对照。它不是跨平台像素承诺，也不证明自动布局、无障碍、浏览器、Motion、听审或用户审美通过。固定作品迁移后的复验状态独立保存，不因本族测试通过升级作品接受。
