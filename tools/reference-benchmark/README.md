# 视听参考基准：同格式导出，不做自动审美判分

这是独立、离线、只读输入的诊断模块。参考与候选导出 **同一 profile schema**，以原始时间轴配对；生成中文 `benchmark.html`、`overview.png`、两个 profile、`comparison.json` 和文件 hash 清单。**`COLLECTED_NOT_APPROVED` 只表示采集完成。** 不修改电影、渲染核心或既有审核门，不联网、不上传媒体、不安装权重、不调用付费模型。

## 运行

依赖已安装的 Python 3.12+、NumPy、SciPy、Pillow，以及带 `libx264` / `ebur128` 的 FFmpeg / ffprobe。开发环境实测 Python 3.12.14、NumPy 2.3.5、SciPy 1.17.0、Pillow 12.3.0；没有导入 OpenCV / torch，也不自动安装。无需浏览器即可导出；HTML 的视频/交互是否可用仍应在交付环境验证。

```bash
python3 tools/reference-benchmark/benchmark.py \
  --reference /your/local/reference.mp4 \
  --candidate /your/local/candidate.mp4 \
  --out /your/private/output/new-comparison \
  --window 8:18 --window 36:46 --window 64:74 \
  --keyframe '12:细节 A' --keyframe '40:月亮' \
  --keyframe '68:螺旋中段' --keyframe '72:复原中段' \
  --roi '40:0.14:0.12:0.50:0.48'
```

路径为操作者自己的本地文件，不需要源码里的私有路径。输出目录必须尚不存在；仓库内输出必须已被 Git 忽略，仓库外输出也不覆盖旧目录。不要把受限参考帧、声音或电影提交到 Git。最多三段、每段不超过 10 秒；`--no-clips` 禁用片段。默认窗口为 `8–18 / 36–46 / 64–74s`，超过共有时长的窗口不导出。没有提供 `--keyframe` 时只请求 `12 / 40 / 68 / 72s` 中存在的时间，标签是中性“重点”，不是自动识别语义。

- `--events path/to/events.json`：导入显式 SHA-256 绑定的人工观察/计划，见下方契约。
- `--owner-rejected`：只在用户确实否决候选时手动标注，不从指标推断。
- `--no-render`：先只导出数据/资产。后续 `python3 tools/reference-benchmark/report.py /your/output` 可离线重绘；重绘后需重新计算产物 manifest，不沿用旧 hash。

完整导出后可复核或打紧凑包（不覆盖已有 ZIP）：

```bash
python3 tools/reference-benchmark/audit_export.py /your/private/output/new-comparison
python3 tools/reference-benchmark/audit_export.py /your/private/output/new-comparison \
  --package /your/private/output/new-comparison-compact.zip
```

`ARTIFACT_HASHES_MATCH` 只是产物完整性，不是艺术通过。紧凑包包含自包含 HTML、overview 和三份 JSON；原生 PNG / 独立短窗 / 日志保留在完整目录，紧凑包会显式说明未包含它们。

## 实际测了什么

| 面板 | 实现 / 单位 | 不能推出什么 |
|---|---|---|
| 时间轴 / 缩略图 | ffprobe 原生 PTS，按 `[PTS,next PTS)` 选显示帧，默认 4Hz；缩略图 2s 间隔 | 不是正常速度全片观看；会漏短剪、闪帧、小于采样周期的动作 |
| 色彩 / 明暗 / 纹理 | 固定 RGB bins；gamma luma；饱和度；Sobel 边缘占比；Laplacian 方差 | 不是材质厚度、玻璃/金属真实感、光照物理正确性或美学 |
| 结构差异 | Wang-style SSIM，192px 宽 gamma luma，11×11 Gaussian σ1.5，K1=.01/K2=.03，固定 L=1，排除 5px 边界 | 非配准/异语义图像可能很低；不是总质量分。数值是结构指数，**不是候选−参考差值** |
| 运动 | 相邻采样帧差；稀疏块平移匹配：24px 块、±8px 搜索、32px 网格，保留残差、歧义、valid fraction；按真实 ΔPTS 换算 px/s | 不是 dense optical flow / RAFT / 相机分解。主体、相机、光照、遮挡混在一起；大位移超窗会失效 |
| 音频信号 | 解码 48kHz stereo float PCM；100ms 左右声道 min/max/RMS；全 PCM RMS；L/R 均方能量平衡 | 有音轨/低峰值/左右不同，不代表听清音效或声源跟踪正确 |
| 响度 / 真峰 | FFmpeg `ebur128=peak=true`：LUFS / LU / dBTP；无交付目标时只写测量 | 不代表合听通过。全片 RMS、100ms bin dB 差的均值、门限 LUFS 是不同量，不互相替代 |
| Log-mel | stereo **功率平均**后做谱分析，避免反相抵消；16kHz，1024 Hann，400 hop，48 HTK mel bands，40–8000Hz，按 PSD×Δf 积分，dB re 1 FS² | 固定共同 −100..0dB 色标，不逐片归一；谱图不能命名乐器、SFX、情绪 |
| onset / tempo | Ellis-inspired 正向 log-mel 谱变化 + 自相关的多个 tempo 候选；未实现 DP beat tracker | onset不是SFX；自相关不是概率；倍/半拍和非平稳性会歧义；BPM不等于情绪/适配性 |
| 对齐提示 | 跨片包络互相关的 lag 假设及近峰宽度；正数=候选更晚；**不应用偏移** | 不同音乐/画面内容可能没有可对应事件；相关性不是 AV-sync，更不是因果正确性 |

RGB 经 FFmpeg 解码转换，保留源色彩元数据是否 unknown。没有进行色彩管理、空间配准、DTW、背景分割或相机补偿。采样/阈值和依赖版本写入每个 profile；源电影、源码、产物均保留 hash。非单调/缺失视频 PTS、未知末帧时长和音频时间戳 gap/overlap 会拒绝，不悄悄拼接。多声道输入显式下混为 stereo 并记录原声道数；mono 明确复制。

## 听觉 / 语义 / 艺术门

`audio_listening=UNVERIFIED`、`visual_semantics=UNVERIFIED` 不会因导出、播放按钮、峰值安全、模型可用而升级。A/B 控件同步片段，但始终只启用一侧音频；默认原片。可选电平匹配只降低较响的一边，是试听便利，不改原始信号/指标，不表示听过。片段是 320px 重编码预览，不是原生画质证据。

LPIPS、DISTS、dense optical flow、RAFT、CLAP、Synchformer 明确 `NOT_RUN`。FAD/FVD 不适合作为单片对单片的总体质量分。单独的模型语义审核接口仍是未执行的可选步骤；需要独立授权、版本/权重与数据来源、片段 hash、实际调用证据，不能借此模块填写审核通过。

## 事件注释：计划不是实测

`events.example.json` 是格式示例，所有时间为第一帧 video PTS 起算的秒。换成真实输入 hash 后才可加载。每行写 cause、source certainty、expected lag；未知/缺失值为 `null`，不是 0。

- `reference_audio_s - reference_visual_s` = 参考音画时差；正值声音晚。
- 候选同式；`lag_error_s` = 候选时差 − 参考时差。
- 同时保留 `visual_shift_s`、`audio_shift_s`，避免音画一起迟到而内部时差为0掩盖复刻相位错误。
- `candidate_planned_*` 与实际时点分列。未听到/未验证事件，`candidate_audio_s` 保持 null；计划落点不补成观测。
- 先行 whoosh 可能有意为负时差，不能把所有事件压到同一帧。该接口不自动赋予人工注释真实性。

## 研究依据

完整元数据、主论文 URL、发表状态、代码许可边界、可运行/未运行状态见 [`method-references.json`](method-references.json)。核心采用：

1. Wang et al., *Image Quality Assessment: From Error Visibility to Structural Similarity*, IEEE TIP 2004 — [作者论文](https://ece.uwaterloo.ca/~z70wang/publications/ssim.pdf)。本地结构诊断，不代替审美。
2. Ellis, *Beat Tracking by Dynamic Programming*, JNMR 2007 — [作者论文](https://www.ee.columbia.edu/~dpwe/pubs/Ellis07-beattrack.pdf)。这里只独立实现受其启发的 onset/tempo 前端，**未复现 DP beat tracker**。
3. Huang et al., *VBench*, CVPR 2024 — [正式论文](https://openaccess.thecvf.com/content/CVPR2024/html/Huang_VBench_Comprehensive_Benchmark_Suite_for_Video_Generative_Models_CVPR_2024_paper.html)。借鉴分维度、保留域限制；没有运行 VBench，更不把稳定等于好。
4. Iashin et al., *Sparse in Space and Time: Audio-visual Synchronisation with Trainable Selectors*, BMVC 2022，以及 *Synchformer*, ICASSP 2024 — 稀疏 AV 对齐、可同步性和 shortcut 风险支持这里的显式事件/时间契约；模型未运行。
5. Zhang et al. LPIPS (CVPR 2018)、Ding et al. DISTS (TPAMI 2022)、Wu et al. CLAP (ICASSP 2023)、McKee et al. ViML (CVPR 2023) 是后续有边界的可选能力，不把论文存在写成本模块已会理解材质、选曲或情绪。

色彩/边缘/Laplacian/块匹配是明确的工程代理，不冒称论文等价实现。固定谱底、阈值与不应期峰竞争使弱/模糊瞬态候选可能随 gain 改变；不保证候选不变，更不保证候选对应真实事件。许可记录针对作者实现代码，不代表模型权重、训练数据或参考电影可再分发。

## 验证与范围

```bash
python3 -m unittest discover -s tools/reference-benchmark -p 'test_*.py' -v
node tools/reference-benchmark/test_report_js.cjs
```

测试应覆盖 identical、已知正/负 lag、gain、左右互换、静止/静音、同运动24/30fps原生PTS、缺失事件、反相立体声、非零起始PTS，以及同直方图不同结构。夹具只验证测量/不确定性/契约，不计为影片审美通过。实际源/候选相同参数与同 schema；同一采样时刻记录各自原生 frame index 与 PTS，不用 `fps×t` 猜帧。

本模块是本地私有研究工具。报告不内嵌完整参考片，仅少量短窗、帧和图表；不公开发布、不建立 Sites、不上传 Library，交付/权限由操作者另行决定。

## 可选：独立事件区间复查

[事件区间sidecar](EVENT_INTERVALS.md)在显式事件对应和同一证据层内传播lag/跨片shift范围，输出缺失/歧义与复查窗；不改变本工具事件schema、默认流程或报告，不解码/听审，也不生成艺术分。

[静态事件区间报告](EVENT_INTERVAL_REPORT.md)可将独立sidecar receipt绘为四泳道HTML/SVG快照：保留原始时间、歧义、未知与计划层，不读取媒体/证据链接，不生成同步通过或艺术分。输出只解释该receipt，不重新核验其来源文件。
