# 离线目录查询

[返回入口](../../README.md) · [目录与公共 API](../registered-foundations.md)

本页保存对应机制的详细合同、合成示例和已有证据限定。历史批次数量不是当前目录数，已有测试描述不代表本次重新运行或艺术通过。代码片段中相对导入以本页所在目录为基准；shell 命令按各段注明的工作目录运行。

## 离线目录查询（metadata，不执行动作）

当前条目以 [catalog.json](../../catalog.json) 为真源（本次整理基线为60基础＋7配方，全部experimental）。先缩小候选，再读适用条件/反例；不是检索命中即推荐，也不是艺术评分：

```sh
# 仓库根目录运行；也可用脚本绝对路径从任意 cwd 调用
node engine/motion-elements/scripts/query-catalog.mjs list --limit 100
node engine/motion-elements/scripts/query-catalog.mjs find --text '重组' --status experimental
node engine/motion-elements/scripts/query-catalog.mjs find --tag trail --kind geometry
node engine/motion-elements/scripts/query-catalog.mjs show --id fragment.fixed-tiles
```

纯模块独立于绘制/动画 exports，无 I/O：

```js
import {queryCatalog} from '../../lib/catalog-query.mjs';
// catalog 是调用者已解析的仓库 catalog.json；不接受路径或远程地址。
const selection = queryCatalog(catalog, {tag:'重组', limit:10});
```

- `list` 可用 kind/status/text/tag/limit；`find` 额外要求 text 或 tag；`show` 只接受精确 `--id`，不存在即 `total:0, results:[]`，不猜 ID、不自动替代。
- kind 仅 motion/transition/composition/recipe/geometry/reveal/fragment/field/raster；当前 status 仅 experimental。所有过滤条件 AND。一个 tag 作规范化后的完整标签匹配；多个标签/重复参数拒绝，不偷偷改为 OR。
- text 为 NFC、首尾去空白、小写化后的 **literal substring**，无分词、正则、向量/AI/置信度。搜索字段限 id/summary/api/tags/applicability/counterexamples；英文与中文均可，但不自动翻译或展开同义词。反例也可能命中，`reasons.fields` 明确指出；证据/knowledgeLinks/示例参数不参与全文匹配。
- id 不做规范化，必须是小写 canonical ID；kind/status 也要求精确。text 1..256、tag 1..64、id 1..128 UTF-16 units（规范化前），空白或控制字符拒绝。limit 默认20、整数1..100；CLI 仅普通十进制，不接受01/1e1等形式。最多13个命令参数，未知/重复/缺值/非法枚举均退出2且仅stderr报错。
- 按 ID Unicode code-unit 升序稳定排序（不是相关度排行），`total` 是过滤后的总数、`truncated` 表示受 limit 截断。无匹配是正常退出0。结果保留每条完整 example、applicability、counterexamples、evidence、knowledgeLinks 与匹配原因，深复制且不改输入。
- `example` 是既有 API 的完整参数输入；需要 Canvas/context 的 API 仍须调用者按上文提供环境，不是自动运行脚本。查询**不执行 example、不动态 import entry、不访问证据或私有 knowledgeLinks、不联网、不调用动作、不改知识库**。CLI 只读相对脚本固定位置的 catalog.json；只向 stdout 输出 JSON，不提供 --catalog/--out 等路径入口，不创建文件。若重定向由调用者自行保证目标是新文件。
- 标签为通用机制描述，不含用户/影片私有信息；标签增加不代表技术/艺术/迁移验收升级。foundation（例如 finite-settle）仍非独立机制，不为查询凑数。catalog schemaVersion 仍为1；tags是检索元数据，不增加机制。

`test/catalog-query.test.mjs` 覆盖合成中英文、字面匹配/反例、无匹配、边界、CLI错误及目录不变性。历史13条目录阶段曾在 Node 24 permission 模式仅授权 CLI/查询模块/catalog 三个文件读取运行成功；这是当时限定证据，不是本次整理新执行的权限或当前数量证明。查询不需要动画入口或私有链接读取权限。
