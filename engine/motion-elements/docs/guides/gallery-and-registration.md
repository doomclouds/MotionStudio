# 合成展示、测试与机制收录

[返回入口](../../README.md) · [目录与公共 API](../registered-foundations.md)

本页保存对应机制的详细合同、合成示例和已有证据限定。历史批次数量不是当前目录数，已有测试描述不代表本次重新运行或艺术通过。代码片段中相对导入以本页所在目录为基准；shell 命令按各段注明的工作目录运行。

## 可视化与测试

在仓库根目录：

```sh
npm --prefix engine/motion-elements test
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/elements-gallery-new
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/elements-still-new --frame 43
node engine/motion-elements/scripts/render-gallery.mjs --out /tmp/elements-reduced-new --reduced-motion
```

`--out` 必须是父目录已存在、目标目录尚不存在的新目录。默认输出 `motion-elements-gallery.mp4` 和 `render.json`：8 秒、1280×720、30fps、240 帧、无音轨。示例展览 **显式每 4 秒重复** 便于观察；库内部没有自动循环。`--frame 0..239` 只输出指定帧 PNG，可用于暂停检查。媒体是生成产物，不提交 Git。

示例通过 `examples/gallery-fonts.mjs` 在常见 Linux 系统字体目录寻找 DejaVu Sans 或 Liberation Sans，显式注册 regular/bold 到专用字体族；不下载、不附带字体，不含私有机器路径。若找不到会打印警告并使用平台 sans-serif fallback，此时字体外观不保证。CLI 的 `render.json`（单帧则为 stdout）记录实际字体文件名和 SHA-256；跨机器比较像素时必须同时核对这些字体哈希。通用 native renderer 的源码 fingerprint 不包含系统字体字节，不能仅凭该 fingerprint 声称跨机器像素一致。

gallery 源文件为 `examples/gallery-scene.mjs`，同时符合 native renderer 的 createScene 接口；无私有角色、品牌、参考媒体或生产数据。展示只是说明机制，不冒称“发布会级模板”。测试覆盖数值边界、固定种子、乱序状态/像素、Canvas 异常恢复、双场景首尾及像素接缝。实际常速完整观看、美术认可、声音体验、跨平台浮点/字体像素一致均需另外验证。

## 从复刻中收录

1. 在项目中描述动词、动作因果、适用范围与反例；先检索 catalog，避免换参数就复制一份函数。
2. 提取不含私有内容的纯参数机制，提供至少三个参数变体、正常与 reduced-motion 示例，以及未知参数/边界/乱序回归。
3. 新机制先进入 experimental；其技术证据、关键帧与完整播放审查分别记录，不混为“通过”。
4. 在不同内容/尺寸/背景下验证，记录真实迁移 Case，再考虑 stable。知识库 Case / Technique 是证据与选择指导，catalog 是实现索引；knowledgeLinks 只填已存在、可核对的条目，不伪造成功经验。

后续按真实制作缺口扩展，而不是凑数量。历史首批的未实现清单保存在[阶段记录](../history/production-batches.md)，当前可用能力以catalog与对应合同为准。
