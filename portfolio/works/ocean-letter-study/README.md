# 海洋基金年度信 · 编辑式长文

完整1200×750固定静态Native工程，用户已同意收藏。Huashu样张非官方复刻，不是原创基金会品牌或真实环境报告。设计逻辑见design/DESIGN-ANALYSIS.md，沉淀入口DESIGN-RETENTION.md与retention.json。

## 离线复现
按font-inputs.json固定源SHA合法自备字体，使用fonttools4.61.1与locks中的Native版本：
```sh
python prepare-fonts.py --source-dir /ABS/ORIGINAL_FONTS --output-dir /ABS/PREPARED_FONTS
OCEAN_LETTER_FONT_DIR=/ABS/PREPARED_FONTS MOTION_ENGINE_ROOT=/ABS/ENGINE node verify.mjs
OCEAN_LETTER_FONT_DIR=/ABS/PREPARED_FONTS node /ABS/ENGINE/scripts/render.mjs --scene /ABS/WORK/design/scene.mjs --work /ABS/OUTPUT --frames 0
```
ENGINE是MotionStudio的engine/motion-render-core。源和派生字体分别验SHA；无网络下载/系统回退，错误明确失败。Newsreader光学尺寸按400→19、500→72、600→42固定。全部字体注册OceanLetter*独立别名。改字须同步字符集/派生锁并重新排版审看。

原帧SHA256：`b232587c974632392b14be3a6b6a843f1727f8a336f4030930bf129f1933e5cf`。

## 语义与真实复用
基金会、人名、引语、62/24处、38%→46%和三次复测都仅源例文未核验；68%示意条无数据映射，不得当覆盖率图。正文是固定断行，并非自动流排。

实际调用本地material-surfaces快照opaque一次作小卡；shared只是状态工具。快照源commit与SHA在module-snapshots.json，不是实时从引擎导入。新增drawAuthoredColumns是本例真实调用的候选配方，不列入14个公共设计族，不自动避碰/分页；验证与边界见design/SETTLEMENT.md。

仅自渲染cover随工程留存。参考、报告与独审证据在本次可定位本地记录，未核实其持久存储；retention.json如实记录。正文450经独审校准，仍有字体栅格/标点/齐行差异；没有浏览器、响应式、交互、音视频验证。
