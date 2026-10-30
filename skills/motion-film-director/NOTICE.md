# 来源、许可与当前维护边界

当前生产核心是独立编写的原生 Canvas 实现，不导入或包含 Huashu 改编 CDP 代码。旧浏览器核心、GSAP、字体与原许可曾另行归档；本次恢复的源码仓库不包含 历史浏览器核心归档，不将其作为现存本地路径或新 native core 内容。新核心依赖许可在源码模式见 ../../engine/motion-render-core/NOTICE.md，可移植包中见 runtime/motion-render-core/NOTICE.md；@napi-rs/canvas 自身的 MIT 与 Huashu MIT 是不同许可来源。

本 Skill 曾研究 huashu-motion 0.3.1 的四份指导文档，历史出处和 hash 保留在 upstream-provenance.json，原 MIT 保留于 LICENSES/huashu-motion-MIT.txt。历史研究记录不是当前运行依赖；未经逐段衍生审查，不宣称整个指导包完全没有来源义务，也不为了移除名字删掉必要署名。

MIT 要求软件副本或实质部分附版权和许可，并非要求导出视频画面展示作者推广。新核心不包含旧改编代码，不因历史上使用过该代码而继承其代码署名；若分发仍携带旧代码的归档，须保留其原许可；本包保留指导文本适用的来源声明与许可。官方条款：https://opensource.org/license/mit

项目场景、品牌/产品标志、音频、字体、照片和参考影片分别核权利；代码许可不自动授予示范影片、人物形象或第三方商标的使用权。私人项目及其素材不随公开工具集分发；排除项目不改变原有素材来源义务。Node、FFmpeg 和原生依赖二进制为现有外部安装，本包不重新分发这些二进制。

静态 UI 复刻方法研究参考 JimLiu/baoyu-design 固定版本 `0fd52fc77765b214cfcc2ced20b092b2969bb0b0` 中 hi-fi-design、import-from-html、data-visualization、design-feedback 与 fork-verifier-agent；具体映射见[方法合同](references/static-ui-reference-study.md)。本包只含原创方法重述，不携带上游提示词、执行链、媒体或私有研究记录；保守保留其 [MIT 版权与许可](LICENSES/baoyu-design-MIT.txt)，不将其宣称为官方设计系统或当前宿主工具能力。
