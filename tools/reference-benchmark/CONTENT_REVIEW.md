# 独立内容审查校验器

不改 benchmark.py/report.py 或冻结导出。此工具**不识别视频、不评判质量**：它检查人提交的注释是否结构有效、引用完整、真实媒体 hash 一致、时间窗有效以及计划/虚构证据是否冒充观察。通过校验不等于注释真实、因果正确或质量好。

在 MotionStudio 根目录运行；生成报告写到仓库外新建的临时目录，输入示例保持只读。以下 Bash 示例使用 `/tmp`，不要把输出目录改成仓库内路径；需要长期保留时另存到已授权的仓库外项目目录：

```bash
REVIEW_OUT="$(mktemp -d /tmp/motion-content-review.XXXXXX)"
printf '报告目录：%s\n' "$REVIEW_OUT"

# 教学示例：无需媒体，不得作为实测
python tools/reference-benchmark/content_review.py \
  tools/reference-benchmark/examples/content-review.synthetic.json --synthetic \
  --output-json "$REVIEW_OUT/example.validation.json" \
  --output-html "$REVIEW_OUT/example.content-review.html"

# 真实注释：相对路径以 annotation.json 所在目录为根；可用 --base-dir 覆盖
python tools/reference-benchmark/content_review.py /absolute/path/outside-repository/annotation.json \
  --output-json "$REVIEW_OUT/content-review.summary.json" \
  --output-html "$REVIEW_OUT/content-review.html"

# 回归测试
(cd tools/reference-benchmark && python -m unittest -v test_content_review.py)
```

依赖：Python、当前环境已有 jsonschema、ffprobe；不会自动安装或联网下载。缺依赖/不匹配时失败，不静默降级为通过。退出码 0 仅表示契约校验通过，2 表示失败。

真实 asset 必须填写读取文件得到的 SHA-256；媒体时长和音视频轨来自 ffprobe，不信任手填时长。brief 也绑定实际文件 hash。schema 默认读取本模块的 `schemas/content-review.schema.json`，不依赖当前工作目录；可 `--schema` 指定同版副本。路径由本地授权操作员提供，应仅处理可信本地注释文件。

限制：帧PNG locator 目前仅为定位文本，不对其另外计算hash；观察绑定的是源媒体hash与时间窗。人工应核对PNG确实来自该源。不能由工具声称人已经正常速观看或听审，音画语义和综合评分始终为 null。若只抽帧，写 visual 证据并在 confidence_reason 注明；音轨存在不等于已听审。观众结果需要原话及 viewer_response 证据，否则保持 not_tested。

HTML/JSON 会保留提交的目标、证据、事件、假设、修改单与复验状态，并明确标记这些注释未经程序独立验证。ID 全局唯一；引用需存在；observed 需绑定同资产、重叠时间的真实视觉/音频观察证据，计划、作者意图和虚构不得混入。主体 actor/patient 是开放实体标签，不是事件表外键。

## 模块资料

- [结构契约](schemas/content-review.schema.json)：由校验器直接读取，schema 版本不因迁移改变。
- [合成格式示例](examples/content-review.synthetic.json)：仅用于教学与测试，不是真实影片证据。
- [研究依据与边界](research/content-review.zh-CN.md)：保留论文来源及未执行状态，不代表已运行模型。

这些内容及校验器目前不在 `scripts/build-skill.py` 的可移植 Skill 显式清单内；导演参考中的远端链接不是包内运行能力。媒体、真实注释及生成报告仍放仓库外授权目录，不因模块收纳研究资料而扩大公开范围。
