# design.material-surfaces.v1 · 材质与表面层级

<!-- asset-self-description: design.material-surfaces.v1 -->

[index.mjs](index.mjs)导出id/version/guidance/validate/draw；[catalog](../../catalog.json)是唯一登记，[dispatcher](../../index.mjs)调用同一实现。[design.md](design.md)保留设计判断、来源、组合规则、shared-theme及方向笔触示例的分工。当前canonical共置没有旧运行别名，稳定ID/version和算法保持。

## 选择与不适用

用表面从背景中分离信息：paper提供纸签式硬偏移影；opaque提供实色阅读面；glass让调用者提供的背景参与颜色关系。不要把所有内容框统一变成玻璃，不把阴影强度当作语义优先级。它是容器及内容槽，不是完整应用、物理材料仿真、CSS backdrop-filter或响应式排版。

## 输入与规范化

`draw(ctx,props,env={})`返回几何；`validate(props)`返回新的bounds/data/theme浅副本和默认值，不修改原输入，也不拒绝所有未知字段。

- bounds：有限x/y；width 120–1600px、height 100–1200px。
- data.variant必需：paper/opaque/glass。padding默认24，8–80，且两倍padding必须小于较短边。
- radius默认paper为0、其他为24；0至较短边一半。elevation默认1，0–3；允许非整数。
- opacity默认.18，.04–.75；三个variant均校验此值，但仅glass使用。
- title/subtitle省略或空串不绘制；最长100个JS字符单元，拒CR/LF。没有自动换行、缩字或复杂文字排版；其他字符是否有字形由调用者保证。
- theme可省略。缺省surface=#ffffff、ink=#182334、muted=#556070、edge=#ffffff、shadow=#081946、fontFamily=sans-serif、fontSize=24。fontSize 10–60；颜色只接收六位#RRGGBB。
- 显式fontFamily须为≤100字符的字符串，禁止分号/CR/LF；校验没有保证非空或字体已注册。缺省只适用于省略的theme键，显式undefined可覆盖默认值，调用者应省略不用的键并提供真实字体。

标题用600字重、fontSize；副标题用400字重、fontSize×.65。绘前按实际Canvas字体测量advance宽，超过width−2×padding拒绝；不检查完整字形墨迹边界。标题占高fontSize×1.3，副标题占高fontSize×.9，两者加双padding不得大于height；相等时contentBounds.height允许为0。大radius与小padding不保证内容矩形避开所有圆角，应由组合者留安全区。

## env、绘制与返回

paper的elevation>0产生向右下各5×elevation像素的实心矩形影，即使表面设置圆角也不改成圆角影。opaque/glass的elevation>0需要`env.canvasApi.createCanvas`；实现对圆角alpha mask进行三次有界separable box blur，再以.24缩放alpha并下移8×elevation。blur半径ceil(4+3×elevation)，离屏padding为3×半径+3；不是Native shadowBlur等效声明。bounds不包含阴影，周围宜留约70px，调用者clip会影响可见影子。

glass无论elevation是否为0，都要求`env.canvasApi`及同步`env.backdrop({ctx,width,height,bounds})`。backdrop画在独立局部画布，bounds为原逻辑坐标副本；它不会自动抓取目标画布。实现把背景画入圆角clip，再叠加theme.surface着色梯度，两个端点alpha为opacity+.18和opacity；没有折射或实际背景模糊。背景回调应确定且可信，不得依赖时钟/随机数来冒称重复确定性。

返回`{id,bounds,contentBounds,material,headingHeight,staticOnly:true}`，contentBounds使用逻辑绝对坐标，上层可放图表、正文或其他积木。不绘制这些内容、不创建交互或动画。

绘制恢复调用者样式/transform/clip并继承alpha与合成方式；当前path可能被替换。参数与标题宽度错误在绘像素前拒绝，但不是事务式渲染：backdrop/后端在绘制中抛错时会恢复状态，却可能已留下阴影，不能声称所有错误都零像素副作用。回调、输入对象、Canvas后端及输出文件系统均为可信调用者资源，不是恶意对象沙箱。

## 两个实例与独立运行

[原始cases与backdrop](examples/cases.mjs)完整保留蓝紫珊瑚色听音玻璃面板、米色印刷工作坊纸签两例，尺寸/内容/配色/材质不同。[render](examples/render.mjs)真实调用两例，输出PNG SHA256、几何及本次字体hash，默认不写图；[test](test/contract.mjs)覆盖三种材质、标题槽、软影/硬影、背景回调、状态恢复、输入拒绝及dispatcher一致。

```sh
export DISABLE_SYSTEM_FONTS_LOAD=1
export MOTION_ENGINE_ROOT=/absolute/path/to/installed/runtime
export UI_TEST_FONT_DIR=/absolute/path/to/dejavu
node engine/design-elements/families/material-surfaces/examples/render.mjs
node engine/design-elements/families/material-surfaces/test/contract.mjs
```

需要Node24+、外置已安装@napi-rs/canvas和DejaVuSans.ttf/DejaVuSans-Bold.ttf。可用MATERIAL_SURFACES_FONT_DIR替代UI_TEST_FONT_DIR。字体按DejaVu/Bitstream条款由调用者提供，不属仓库MIT；不捆绑、不安装、不下载，不用新字体冒充历史作品锁。portable包内把engine换runtime。可加`--out /absolute/new-external-directory`独占创建仓库/Skill外新目录并写两张PNG；输出路径需受信任。技术测试不代表新的视觉、无障碍或用户接受，也不保证跨机器逐像素一致。

## 来源、历史身份与权限

视觉关系来源及独立示例限制见[design.md](design.md)和[catalog sourceCases](../../catalog.json)。本族只携入参数化原创程序，不携入参考截图、字体、音乐或私人研究产物；遵守[源码范围](../../../../SOURCE-SCOPE.md)和[第三方声明](../../../../THIRD_PARTY_NOTICES.md)，来源链接不授予参考品牌/资产权利。

14件既有作品仍固定原sourceCommit/module hash/依赖锁与retained事实：6件有runtime依赖锁、6件在调用点固定模块hash、2件vendored snapshot。其作品文件不改，snapshot仍是独立冻结字节，不是旧活动入口兼容。当前模块路径不能替代历史锁；runtime作品直接在当前检出运行不受保证，vendored作品也仍需各自字体/素材/runtime。严格验源仅证明静态身份，恢复为NOT_CHECKED；缺Git对象仅使该件BLOCKED，索引仍可发现。没有自动恢复命令，也没有因此重渲历史作品或提升接受状态。
