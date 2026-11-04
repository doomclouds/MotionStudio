# design.color-sections.v1 · 主张与证据分区

<!-- asset-self-description: design.color-sections.v1 -->

[本目录实现](index.mjs)导出id/version/guidance/validate/draw，由[唯一catalog](../../catalog.json)登记，[dispatcher](../../index.mjs)调用相同实现。[design.md](design.md)说明来源、设计理由与反例。当前canonical路径不保留旧平层入口；版本/稳定ID与算法不因共置改动。

## 什么时候选择

内容已有两个不同职责，例如主张/证据、故事/下一步，且需要面积与阅读顺序表达主次时使用。输出的是两块背景及可组合的槽位，不是完成的海报或SaaS卡片。不要为了填空强加第二栏，不适用于任意网格、密集多列工作台或响应式布局；颜色区别不天然证明内容重要程度。

## 自足输入合同

`draw(ctx,{bounds,theme,data})`使用Canvas 2D；`validate`返回原输入，不改参数、不规范化未知字段。

- bounds：有限x/y；width/height为40–4096px。选择轴扣除gap后的有效跨度还必须≥80px。
- theme：surface/ink/muted/accent均为六位#RRGGBB，fontFamily非空且≤100字符。共享合同仍要求这些字段，本族仅用surface铺底，不画文字、不调用字体，因此自身示例没有字体依赖。
- data.orientation仅horizontal或vertical。horizontal按从左到右，vertical按从上到下排列；不自动判断语言方向。
- ratio必需且有限，范围.25–.75。gap省略或null为16px，显式值0–80px。
- regions恰好2项；每项id非空≤40字符、role非空≤60字符、fill为六位#RRGGBB。两个id必须不同；不要求两个fill不同，不自动检查对比度。

有效跨度span =（horizontal的width或vertical的height）−gap。第一槽跨度span×ratio，第二槽span−第一槽；ratio不是包含gap后的全画布面积比例。两槽与间隔恰好填满bounds，间隔显示theme.surface。原始Canvas抗锯齿会影响分数像素边缘，不能从几何比率推导所有像素完全等比。

返回`{id,bounds,regions,readingOrder}`。每region含绝对x/y/width/height及原id/role；readingOrder保留regions输入顺序中的ID，不重新排序或推断视觉显著性。内容由调用方绘入这些槽位；本族没有文字排版、圆角、滚动、点击区或动画时钟。

参数与有效跨度在绘像素前拒绝；绘制保存/恢复样式与transform，继承调用者的alpha和合成方式，不擅自重置画布。没有内容溢出、可读性或主题适配的自动验收。

## 两例与调用验证

[输入案例](examples/cases.mjs)保留横向主张/证据（.44、18px间隔）和纵向故事/下一步（.6、20px间隔）两组明确不同的色彩、方向与角色。[render](examples/render.mjs)真实调用本族，默认输出PNG哈希和返回几何，不写媒体；[专项测试](test/contract.mjs)检查重复确定性、dispatcher一致、双轴面积/顺序、整数边界真实像素数量、输入不变、上下文恢复及绘前拒绝。

```sh
export MOTION_ENGINE_ROOT=/absolute/path/to/installed/runtime
node engine/design-elements/families/color-sections/examples/render.mjs
node engine/design-elements/families/color-sections/test/contract.mjs
```

需要Node24+与调用者外置已安装的@napi-rs/canvas；不安装、不下载、不携入node_modules或字体。可加`--out /absolute/new-external-directory`独占创建仓库/Skill外新目录并保存两张PNG；输出路径和文件系统须受信任。portable包内把engine换为runtime。技术通过不是视觉或用户接受。

## 来源、冻结作品与权利

设计关系源于《幕启》《慢火》《摩登焙香》的内容分区，入口见[catalog来源](../../catalog.json)与[历史设计说明](../../CASE-DESIGN-NOTES.md)。自有几何实现不携入原作截图、字体、商标或媒体；遵守[源码范围](../../../../SOURCE-SCOPE.md)与[第三方声明](../../../../THIRD_PARTY_NOTICES.md)，不能从可用代码推导原作资产再分发授权。

bauhaus-theatre-study、xie-symbol-study和pixel-hiking-study的既有work、sourceCommit、模块hash及锁不改写。前两件的已保留事实不因canonical搬迁降级，pixel仍是既有candidate。它们固定使用历史路径与字节，不能直接把新模块冒充旧锁。历史身份验证不代表当前检出能运行这些场景；需另行按单件隔离恢复原则提供真实历史源码与各自资源。当前树没有旧路径兼容，也不会自动取源/恢复/渲染这些作品。
