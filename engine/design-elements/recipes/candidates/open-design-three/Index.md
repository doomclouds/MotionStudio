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

Node24.22.1 / @napi-rs/canvas0.1.100。稳定身份见 [recipe-manifest.json](recipe-manifest.json) 的 `candidate.od-social-series.v1`、`candidate.od-phone-stage.v1`、`candidate.od-semantic-table.v1`；仍为隔离候选。`test.mjs` 与 `examples/compose.mjs` 使用相对源码位置的 bare require，不读取外部Canvas环境变量。本包没有 `package.json` 或 npm锁，不能在这里承诺 `npm ci` 或锁定冷安装。使用已有、授权且包含匹配平台包的完整Native依赖；仅改变cwd不会改变源码的依赖解析。

先准备**仓库外、授权的新独立WORK目录**。当前 `examples/compose.mjs` 固定把包根的上五层作为资源/输出排除边界，不能把该包浅放在任意目录后直接执行，否则边界可能被算成文件系统根。下面只建立相同的五层路径骨架并复制本包，**不复制整个仓库**。`REPO` 为原仓库，`SOURCE` 为保留的纯文本包，`WORK` 为外部隔离根，`PACKAGE` 为实际源码副本和运行cwd，`RUNTIME` 为已有依赖根，`OUTPUT` 为另一外部输出目录。字体与输出均在原仓库及整个WORK之外；路径占位值需替换为授权绝对路径，WORK的父目录须已存在。

```sh
set -eu
REPO=/absolute/MotionStudio
SOURCE="$REPO/engine/design-elements/recipes/candidates/open-design-three"
WORK=/absolute/authorized-scratch/open-design-three-work
PACKAGE="$WORK/engine/design-elements/recipes/candidates/open-design-three"
RUNTIME=/absolute/authorized-existing-runtime
OUTPUT=/absolute/authorized-output/open-design-three
mkdir "$WORK"
mkdir -p "$WORK/engine/design-elements/recipes/candidates"
cp -R "$SOURCE" "$PACKAGE"
cp "$REPO/LICENSE" "$PACKAGE/MotionStudio-LICENSE.txt"
ln -s "$RUNTIME/node_modules" "$PACKAGE/node_modules"
cd "$PACKAGE"
node -e "const p=require('@napi-rs/canvas/package.json'); if(p.name!=='@napi-rs/canvas'||p.version!=='0.1.100') throw Error('Canvas 0.1.100 required'); require('@napi-rs/canvas');"
node test-io.mjs
export OPEN_DESIGN_RESOURCE_ROOT=/absolute/external-assets/exact-social-fonts
export OD_RECIPE_OUTPUT_DIR="$OUTPUT"
node test.mjs
```

复制前确认SOURCE中没有 `node_modules` 或生成物，保留全部源码快照、锁、设计文档和现有Apache通知。包内没有仓库根MIT原文，故另从已核REPO/LICENSE原样携入副本；这不把OpenDesign的两级许可事实或OFL字体改作MIT。已有运行时保留自身依赖通知；上述版本/加载探针不等于二进制完整性、全依赖许可或重新安装证明。

Social字体仍是**条件提供**：`OPEN_DESIGN_RESOURCE_ROOT` 下必须有 `InstrumentSerif-Regular.ttf`、`InstrumentSerif-Italic.ttf`、`IBMPlexMono-Regular.ttf`，全部匹配 [source-lock.json](source-lock.json) 的SHA。已知恢复依据只到已核私有Social备份，不提供公开冷下载/重建承诺，也不打包字体或把私人备份当默认可访问。缺失时停止字体依赖的测试/合成并记NOT_RUN；不静默换系统字库。

`node test-io.mjs` 无需Canvas或字体，使用系统外部临时目录，只验证5项IO边界。`node test.mjs` 则会实际合成两张PNG并写 `tests.json`；不是纯模型测试。只需合成时，在相同cwd和变量下运行 `node examples/compose.mjs`。合成模块导入时便创建/核验输出目录，随后才验字体，因此缺字体也可能留下空目录。目录可新建或已存在；同名普通文件仅在字节完全相同时允许重用，变更内容或symlink拒绝。换内容/版本请另选OUTPUT，不以覆盖旧证据为恢复办法。

## 候选门槛
既有作者与独立复核记录为19项及5项外部IO边界通过，并实看两张组合页，**已有独立技术与合成图条件复核，但没有新适配器用户审美验收**。原作品已获用户在2026-10-30对展示十项的认可，但该认可不自动扩展到这3个新适配器；原作品独审不自动继承。Social合成图仍有下沿阴影截断带，phone仅内容槽演示；欲正式入库仍需修复视觉残差并在至少两个真实新任务使用，再决定留作配方还是并入现有族。现有示例只是合成内容验证，不是已迁移原作品。

## 许可与沉淀
OpenDesign固定commit12d970eacc8971150e3c76470d2a9afe16dc2ed1，仓库根Apache-2.0；相关官方example元数据另称MIT，保留两级事实，不笼统改作MIT。source-lock链接原作说明。snapshots保留原模块原样以核验，不是新开发的通用接口。表格核心为独立重构，原FlowAI表只做对照，不作runtime依赖。没有原参考、报告、字体图片进入候选源码快照；验证PNG/HTML是新合成示例且仅本地候选。
