# B10 受限组合配方

两项独立技术审阅通过的配方：**显式多行彩色文本片段**与**有量程/空值语义的等面积数值格网**。0新增通用家族，现族仍14；不按五作品凑五个积木。

[五案覆盖](docs/CASE-COVERAGE.md) · [文本指导](docs/code-spans.md) · [格网指导](docs/value-grid.md)

两内容实例：工作室虚构周计划4×5、文化活动虚构周末计划3×3，量程/单位不同。配置文本中的rows/columns/range/unit由同一brief生成，格网使用同一输入；标题、注释等其余文案仍作者编写。配置不包含全部数据、不执行，不冒充可运行成品工具或真实日志。两组合为固定1200×750教学验证，不是两个成熟品牌系统。

## 运行
环境 `MOTION_ENGINE_ROOT` 指向安装`@napi-rs/canvas@0.1.100`的Native引擎。三个包外绝对字体路径：`B10_DISPLAY_FONT`(Anton-Regular.ttf)、`B10_BODY_FONT`(DejaVuSans.ttf)、`B10_CODE_FONT`(DejaVuSansMono.ttf)。SHA、官方来源、许可见font-lock.json。失败关闭，不自动下载或替换，无字体二进制随源码分发。本轮只验证LTR拉丁内容，更换字体/中文混排需另做覆盖与实看。

```
B10_EVIDENCE_DIR=/absolute/new-empty-directory node verify.mjs
node test-runtime.mjs
python build-report.py /absolute/new-empty-directory
```
所有环境变量一并设置。证据输出真实包外新/空目录，防symlink回写与覆写；报告排他创建。源码不包含PNG/离线报告/参考截图。正式来源已锁定`6284a94bf74cc18c832ae907bb9175b78b7b79bd`，路径/候选与正式SHA见source-provenance.json（gentle场景不同，其余4 helper相同）。独审通过；源码出处与受限运行入口随工程保留，技术审阅不等于新组合的用户审美认可。

组合层只取主题对象的五个明确颜色字段，不能用theme.domain/values/unit/bounds覆盖数据契约；回归验证注入后图像和结果保持原身份。

独立复跑23项组合/边界/像素测试与8项运行门，最终2图与作者逐字节相同，报告2嵌图匹配。评审发现并确认关闭主题对象覆盖语义参数问题；同色大小写拒绝回归通过。技术审阅不是用户审美或整体无障碍通过。
