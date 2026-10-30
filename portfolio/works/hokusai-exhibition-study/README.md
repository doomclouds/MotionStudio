# 富岳三十六景 · 固定画幅展览首屏
非官方静态研究，1440×900；不是交互网站。来源与差异见 CREDITS.md。

## 离线恢复
需要 Node 24.22.1、@napi-rs/canvas 0.1.100；可使用仓库固定依赖的独立安装目录，设置 NODE_PATH 指向其中 node_modules。npm-package-lock.json 为仓库已有确切 Canvas 安装锁的副本，不是此处 package.json 的 npm ci 锁。
将 resource-lock.json 的3个合法输入放在仓库外目录；设置 HOKUSAI_RESOURCE_DIR。不自动联网、不在仓库内写资源/输出。所有输入逐次校验 SHA。
字体可从字体原源冷恢复：Python + fontTools 4.61.1，`python prepare-fonts.py /external/original-fonts /external/resources`；原源及派生 SHA 均检查，固定时间元数据以保持字节。Met画作需手动取得精确原文件；不是重新下载任意相似图。
`node scene.cjs /external/output/hokusai.png`
`node verify.cjs`

## 真实范围
只绘制静态画作、双渐变、导航/大字/署名；两个连续渲染与已审 PNG 完全相同。原参考用另一馆藏印本，本作保留 Met JP11 署名与色版差异，年代文案为系列范围不是单幅馆藏日期。无响应式、点击、动画、声音验证。没有 imagegen。报告仅私有研究使用，封面不是对照报告。
这次提交仅新增此案例，不表示旧工作区57件未发布作品已经找回或提交。公共设计族调用0，不新增族或正式配方。
