# OpenDesign 跨案例配方候选

**结论：可以提升，但当前只新增3个隔离配方候选，不增加正式14族/9配方；也不把6组示例当6件作品。**

| 候选 | 值得保留的设计能力 | 真正迁移范围 | 去重结论 |
|---|---|---|---|
| social-series | 稳定品牌锁定区、章节编号、下沿文案在不同景观中连续叙事 | 2–4卡；原3景观；两行短标题；工作室日志/户外故事两内容 | 位于typographic-focus、material-surfaces、authored-paths之上的特定风格配方；不新建“渐变卡片族” |
| phone-stage | 将产品内容置于一致设备框里，形成多个阶段的展示 | 任意受控绘制回调；工坊报名/博物馆通行两场景；离屏合成 | 与material-surfaces共享“表面+内容槽”方法，但不是该模块实际调用；设备框不是新设计体系 |
| semantic-table | 显式列结构、短文本记录、局部状态强调 | 2–7列、1–12行；生产状态表/馆内日程表 | 与semantic-data同属数据表达但不使用面积编码；与value-grid矩阵热色不同，不能借它替代普通记录表 |

## 使用入口

- `docs/social-series.md` → `src/social-series.cjs` → `examples/compose.mjs`上方两组卡。
- `docs/phone-stage.md` → `src/phone-stage.mjs` → 同例下方两个独立内容槽。
- `docs/semantic-table.md` → `src/semantic-table.cjs` → 两种表结构。
- `deduplication.json`：与14族/9配方的关系、真实调用/仅方法关联分开。
- `source-lock.json`：3原模块、许可证、基线catalog/配方清单SHA；原工程未迁移。
- 外置输出中的两个PNG：组合图与限制，可视复查用。

## 运行
Node24.22.1 / @napi-rs/canvas0.1.100。设置`OPEN_DESIGN_RESOURCE_ROOT`为包含Social的3份外置字体的绝对目录，并设置`OD_RECIPE_OUTPUT_DIR`为仓库外的绝对输出目录，再运行`node engine/design-elements/recipes/open-design-three/test.mjs`。字体为调用方外置依赖，不打包。示例需Social原包3份OFL字体，准确SHA在source-lock.json。输入依赖缺失即报错；不静默换字库。备份可从已核私有Social包恢复。

## 候选门槛
当前作者与独立复核19项及5项外部IO边界通过，并实看两张组合页，**已有独立技术与合成图条件复核，但没有新适配器用户审美验收**。原作品已获用户在2026-10-30对展示十项的认可，但该认可不自动扩展到这3个新适配器；原作品独审不自动继承。Social合成图仍有下沿阴影截断带，phone仅内容槽演示；欲正式入库仍需修复视觉残差并在至少两个真实新任务使用，再决定留作配方还是并入现有族。现有示例只是合成内容验证，不是已迁移原作品。

## 许可与沉淀
OpenDesign固定commit12d970eacc8971150e3c76470d2a9afe16dc2ed1，仓库根Apache-2.0；相关官方example元数据另称MIT，保留两级事实，不笼统改作MIT。source-lock链接原作说明。snapshots保留原模块原样以核验，不是新开发的通用接口。表格核心为独立重构，原FlowAI表只做对照，不作runtime依赖。没有原参考、报告、字体图片进入候选源码快照；验证PNG/HTML是新合成示例且仅本地候选。
