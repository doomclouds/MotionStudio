# B09 可受限组合配方

2项独立技术审阅通过的配方，**0新增家族**：受限旋转强调词、同尺寸单位图符。不是把五张案例改名。设计卡、边界与五案选择见[覆盖表](docs/CASE-COVERAGE.md)、[强调词](docs/emphasis-tile.md)、[图符](docs/unit-pictogram.md)。

两固定1200×750组合：唱片借阅260张（含零类/半枚）、工作室邀请180张（不同类别/票形/半枚），均明确虚构。数据驱动行数值、符号、合计及正文中的total/half/unitValue/categoryCount/unit显式占位符；shelves/sessions等语义名词、标题与主张仍为作者编辑，换场景必须人工核对，不宣称全文自动写作；不假称真实销售/到场证据。两组合不是成熟品牌作品或新用户审美认可。

## 可复现运行
`MOTION_ENGINE_ROOT`指向安装`@napi-rs/canvas@0.1.100`的Native引擎；`B09_DISPLAY_FONT`为包外Anton-Regular.ttf，`B09_BODY_FONT`为包外DejaVuSans.ttf，具体SHA/官方来源/许可在font-lock.json。本轮仅验证样例拉丁文字；更换字体系需补字体覆盖及视觉测量，不承诺中文/混排无缺字。无字体/PNG/报告随源包分发，不自动下载、不接受篡改或替换字体。

```
B09_EVIDENCE_DIR=/absolute/new-empty-directory node verify.mjs
node test-runtime.mjs
python build-report.py /absolute/new-empty-directory
```
以上环境变量一并提供。输出只能真实包外新/空目录，symlink回包内被拒绝，不覆盖旧证据。报告排他写入。原作未迁移新接口；B09来源固定正式commit `af1c9a419afc7a392e33f8f0dea4c99ba589c293`；5项正式路径/候选与整合SHA在source-provenance.json，不把同画面当作同源码。

## 独立验证
独立复跑21项组合/边界/像素测试和7项运行门，最终两图与作者逐字节相同，报告2嵌图匹配。评审发现正文同步范围含糊与有限输入派生溢出，已分别修正文占位符/明确人工语义、完整派生几何绘前拒绝。源码纯文本18文件；独审不等于用户审美验收或发布许可。
