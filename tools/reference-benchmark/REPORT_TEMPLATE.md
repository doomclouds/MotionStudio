# 固定报告形式 · motionstudio-review-v1

报告展示版本独立于 profile / evidence schema。**后续报告复用 `report.py` 的
`render_delivery_report`，不要复制项目私有脚本、重画分析结果或另起报告框架。**
README 的 Kiln 图片是本模板的已完成候选示意，不是合成 benchmark，也不是审美验收。

## 生成与交付

最终报告只有一个发布者：`check_final_delivery.py`。先核验技术/视听证据与既有诊断，
在临时目录调用本模板生成 PNG/HTML，再计算最终文件 SHA-256，一次性无覆盖发布：

```sh
python3 skills/motion-film-director/scripts/check_final_delivery.py /absolute/film.mp4 \
  --packet /absolute/packet.json --project-root /absolute/project
```

固定交付为 `output/review/overview.png` 与 `output/review/report.html`；内部 JSON 只作
机器记录。PDF/资源包不自动作为附件。缺少参考/测量时仍输出同尺寸占位，标明未测；
不会复制任意旧 PNG 冒充模板。原始影片没有参考不是错误；参考任务缺诊断仍保持候选阻断。
没有 benchmark profile 帧时，交付门把当前清单已核 hash 的第一份 PNG/JPEG 缩略展示在
既有候选指定画面槽，标注数量、hash 摘要与缩略用途；全部原图仍在 HTML。不得把接触表
写成带虚构时码的 profile 样本，也不复制候选作为参考。此为既有画面槽的数据填充，
不移动图表、不改展示尺寸或版本；尚无测量的图表继续明确未测。图像存在与 hash
匹配不证明视觉审查记录绑定或观看通过；这些失败继续独立阻断，不能被缩略图覆盖。

便携 Skill 不包含完整数值 benchmark/模板依赖；规范报告必须使用仓库的既有 renderer。
便携入口可通过 `--report-renderer /absolute/MotionStudio/tools/reference-benchmark/report.py`
显式指定已安装依赖的本地仓库。缺少 renderer 或 Pillow/NumPy 时明确失败，不降级为旧报告。
只支持`--project-root`固定PNG＋HTML报告入口；不再提供`--report`或HTML-only分支。

`report.py --delivery-output` 是底层排版/测试入口，不能在交付门发布之后再运行。
它拒绝覆盖已存在的 PNG 或 HTML，防止使交付清单 hash 失效。底层接口只使用已有测量，
不解码影片、不调用模型；临时渲染不改写 benchmark 输入及其清单。最终门自己的技术解码
检查仍按原合同运行。任何内容修改必须用新的独立交付目录重新验证和发布。

最小可选展示配置（路径相对 benchmark 输出，不接受越界或指向外部的符号链接）：

```json
{
  "version": "motionstudio-review-v1",
  "statuses": {"technical": "RECORDED_NOT_VERIFIED", "listening": "UNVERIFIED"},
  "panels": {
    "motion_heatmaps": {
      "path": "assets/paired-rgb-change.png",
      "method": "既有 motion-check；双方 4 Hz、192×108 RGB；共享绝对 0–1 色阶；无自动时间平移。"
    },
    "spatial_maps": {
      "path": "assets/paired-spatial-change.png",
      "method": "既有 motion-check；全片时间平均，与帧变化共用绝对色阶；保留双方标识。"
    }
  }
}
```

配置只声明展示信息，不认证图像内容、采样方法或真实听看。参考对照必须使用已有的双片诊断图，
保留双方标签、时间轴、色阶图例及实际方法；不能填入假数据或只给一方却称双片对照。
固定色阶 RGB 阈值为 0 / .02 / .05 / .15 / 1（非等距），与既有 motion-check 一致。
完整方法文字保留在 HTML；PNG 长说明最多显示前 120 字，详述放 HTML。
原创无参考任务也可显式附同版候选 motion-check 诊断；按候选标注，不称双片对照，
不要求补造 benchmark，不能从数字诊断升级听审、常速观看或用户接受。

## 解释与覆盖职责

图表是辅助证据，不是结论排序器。沿用[共同推理边界](../../knowledge/design/reference-to-composition.md#检测工具的辅助职责)：可比条件下的高吻合通常伴随相关小差异，但不能倒推；局部 SSIM、相似曲线和频谱不证明内容、完整动作或美感。报告说明应把已测事实、解释假设与实际观看/听审分开，列出短片默认窗口被跳过、关键帧/事件未覆盖等实际缺口。缺口由本次已有采集结果核实，不凭默认配置假定覆盖。

本补充不更改模板布局、展示版本、指标、schema 或历史 README 图片，也不新增报告自动判分/覆盖检测能力。当前示例图中的相近信号不能代替独立内容判断；历史图的文字与原状态按原字节保留，新解释由相邻文档提供。

## 不变的展示约定

- **PNG：1800 × 5400。** 顺序固定为身份/指定帧 → 全片索引 → 视觉曲线 →
  log-mel → RMS/左右平衡 → 独立审查状态/方法 → 左右声道波形 → 时空 RGB 变化 →
  空间平均变化 → 频谱通量 → 判断边界 → 双片 hash/版本。缺失模块不得删掉留白后挪位。
- **HTML：** 身份/独立审查状态 → 已有局部 A/B → 全片索引 → 视觉曲线 → 原生细节 →
  RGB/空间变化 → 波形、声学曲线、mel、起音 → 差值/事件 → 方法/证据 → 独立总览下载链接。
  详细图表各保留一次；完整总览 PNG 仅作为内嵌下载链接，不再作为正文图片显示，
  避免同一组图表重复，同时保持单 HTML 文件独立可用。
  不另行重写播放器、曲线或证据表；原有响应式布局和键盘控件保留。
- **配色：** 背景 `#0b1119`、面板 `#111c29`、正文 `#e9eef5`、次级 `#a5b2c3`、
  网格 `#29384a`；参考青绿 `#6edac6`、候选琥珀 `#f2b773`。HTML 曲线实线/虚线辅助区分。
- **字级：** PNG 使用现有 Noto Sans CJK 字体：主标题 51、模块 32、正文 23–25、
  轴/身份 16–22 px；HTML 沿用现有 CSS，正文 15、模块 25、说明 12 px。
- **尺度：** 双方共享未平移的原始时间（较长片长），波形 ±1 FS，左右平衡 −1…1，
  mel 固定 −100…0 dB；视觉/RMS/通量按两片共同数值域，不逐片归一化。
  空轨、缺失时段、未运行不能画成零值或静音。
- **方法：** ebur128 与 loudnorm 数值必须分别署名；混音不称 BGM/SFX 分轨，
  RGB 差不称光流/注意力，起音不称语义音效，短窗/稀疏帧不称完整观看。
- **状态：** technical / visual / listening / av_sync 分开，缺省 `UNVERIFIED`；可声明
  `NOT_RUN`、`BLOCKED`、`FAILED`、`RECORDED_NOT_VERIFIED`；技术已测可显示
  `MEASURED_NOT_APPROVED`。展示器不能签发 PASS 或 OWNER
  批准，也不能把模型辅助记录改成人工听审；实际记录与细节由已有证据门保留和核验。

修改上述布局、色彩、尺度或模块契约须升展示版本、更新本文与回归测试；数据、片长、
标签、实际审查记录可以变化。已发布 README 图片保留其原字节和来源，不随测试生成覆盖。
