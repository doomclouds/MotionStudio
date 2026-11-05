# 中文白板：先让变化可读，再让笔看起来在画

这是创作与复用入口，不是影片模板或自动审美系统。先读[纸面标注与图卡交接](../../../engine/motion-elements/docs/guides/paper-annotation-composition.md)的去重与语义边界，再按本片真正需要选择下面的部件。各模块仍是其API/有限域真源；候选、技术验证与用户接受分开。

## 1. 冷启动顺序

1. 用自己的题目写一句要改变的理解，选一个可见因果：对象怎样被画出、比较、修正或连接。先画无纹理静态关键帧，不从旧电影的火箭/国家图表开始改字。
2. 将信息分成“必须读完”“只需看动作”“可省略”。重要短词可以逐笔；正文用清楚字体一次呈现或轻量揭示。每字都慢慢写不等于白板风格。
3. 冻结本片全部中文字、标点、数字和Latin字符。分别检查字体cmap与笔顺数据，缺什么就明确解决，不静默换字体、丢字或拿别的字骨架代替。
4. 字体先查[已审定字体输入](../../../engine/design-elements/assets/fonts/README.md)及其单一manifest，已授权保留的确切原件和完整OFL可随包离线使用。逐笔字数据仍按[固定外部输入清单](whiteboard-resources.json)核字节、SHA及完整许可，放在授权的仓库外制作根，数据集不随本Skill分发；加载被拒或拿不到时报告缺口，不绕过限制。无需安装上游动画库或全字库。
5. 复用确定时间的部件，先做两三秒内部技术探针，包含转折笔/抬笔/一处标注/一次卡片交接。常速观察仍需真的播放；抽帧和成功编码不能代填。
6. 通过后做自己的全片。台词、配乐、拟音按[声音制作](sound-craft.md)自己选编制混；整片审查沿[视听SOP](audiovisual-review-sop.md)，不因“主要是文字”免掉可读性、声画和听审。

## 2. 两条中文路径，不混称

**有中文字形的字体**负责排版与外观。默认选霞鹜文楷 GB 轻便版（LXGW WenKai GB Lite）常规楷体，用字体目录read-font.mjs的readReviewedFont()按manifest默认加载确切原件（内存恢复无损gzip并核双SHA）；它不是行书，也不带笔顺。猫啃硬笔楷书是硬笔楷书备选，可检查钢笔式线条、轻重和清楚转折；它不是行书，行书要求须另找并验证合适资源。霞鹜漫黑 LXGW Marker Gothic 是马克笔式字形，适合短标题/注记；马善政 Ma Shan Zheng 是毛笔式字形，适合少量展示字。固定官方原件、身份与完整OFL见字体目录manifest。这些字体不是同一种手写风格，不把马克笔/毛笔候选当硬笔答案。cmap覆盖不代表当前后端命中正确字体：显式注册文件到独有family，绘制目标句，并核advance、真实墨迹边界、标点/Latin混排及缺字。长段阅读必要时用正常中文正文体，不把展示体放大当解决办法。

**有序单笔轮廓与中线数据**负责笔顺。Hanzi Writer Data / Make Me a Hanzi 的字形来自Arphic字体，不是上述马克笔字体的轨迹；不能把其median套上另一个字体轮廓并称匹配。使用[ordered-stroke-reveal](../../../engine/motion-elements/lib/support/ordered-stroke-reveal/README.md)的原创消费者，逐笔填局部轮廓，中线前缀末点驱动笔尖。核心支持不同笔画时长；Hanzi便捷导入仅均匀每笔时长。长横/撇捺可按长度预算，转折和停顿由导演决定，仍非真人采集。

明确标记以下区别：
- 整字/整行clip擦出是**文字揭示**，配一支移动笔也不会变成真实笔顺。
- 沿字体轮廓的边缘描线是**轮廓描边**，不是笔画中线。
- 按有序轮廓+有向中线逐笔揭示是**笔顺数据驱动**；mask、宽圆头和完整终态填充仍是渲染近似，不是模拟墨水/压感。

真实数据坐标1024×1024，源左上(0,900)、右下(1024,-124)。屏幕局部映射为x+scale×glyphX、y+scale×(900−glyphY)，不要把900当全高。先以“中”“永”核方向和转折，再核本片每个字；缺字在制作前失败，不交给系统回退。数字、Latin和标点不默认存在于汉字数据集，走显式字体或自绘符号路径。

数据固定来源为[Hanzi Writer Data的指定提交](https://github.com/chanind/hanzi-writer-data/tree/68d10a4b21150cae5e1ebbd223eed289cf32d90c/data)，按唯一字取单文件。资源清单提供中/永的精确最小恢复身份；新字用同一提交的data/<字>.json并记录实际身份、stroke/median配对及许可，不用latest、all.json或npm整包。根字形数据适用[Arphic Public License](https://github.com/chanind/hanzi-writer-data/blob/68d10a4b21150cae5e1ebbd223eed289cf32d90c/ARPHICPL.TXT)，**不是Hanzi Writer引擎的MIT**。原件分发带完整原许可，修改数据显著标修改/日期并遵守APL条件。独立原创consumer与字形数据分别归因；字体subset/轮廓导出也不会自动变成MIT。动画不需要Make Me a Hanzi的dictionary.txt，勿顺带混入其LGPL词典。

## 3. 已有部件与新增受限支持

- **纸卡与层级**：[material-surfaces](../../../engine/design-elements/families/material-surfaces/README.md)的paper容器/硬影继续用，不新造同样布局。
- **纸面与笔形**：[paper-drawing](../../../engine/design-elements/recipes/candidates/paper-drawing/README.md)补固定种子的静态纤维/颗粒/可选点格及笔尖锚定marker。它不是物理纸/手，也不缓存整片；调用者初始化纸面并复用不可变快照。小字/数据优先对比度。
- **线生长与笔跟随**：[polyline-sections](../../../engine/motion-elements/docs/support/polyline-sections.md)保留原折点，前缀最后点是笔尖。路径、标注、笔形同一父变换一次。两份相似但独立的进度/路径会漂移。
- **沸腾线**：[held-vertex-jitter](../../../engine/motion-elements/lib/support/held-vertex-jitter/README.md)按固定帧组更新顶点，不是整体shake。只用于允许小变形的插画；精确图表、文字/统计面积、连接拓扑不应随意扰动。
- **逐笔与提笔**：[ordered-stroke-reveal](../../../engine/motion-elements/lib/support/ordered-stroke-reveal/README.md)明确before/stroke/lift/complete。lift的from/to/progress只作笔飞行提示，不生成跨笔墨线；完成后保留字，笔退场。marker可消费其tip，但中线端点不是宽圆头最前沿。
- **重点标注**：圈/括号/引线/下划线由作者提供几何并组合已有线生长。先留事实阅读时间，一次只强调一个关系；避碰和目标选择仍是导演/排版职责。
- **图表**：先声明数据/量程/单位/零基线/缺失值，再选对应图表候选。semantic-data、illustrative authored-paths和份额族各有边界，不把装饰路径称精确统计图；这批未发布通用柱状赛跑引擎。
- **卡片交接**：用已有transform/opacity/local-reveal组合。进场前明确“为什么看这张”，退场后回到原来的对象/数据锚点。保留一处位置、颜色或图形身份完成交接；不要每一段都擦掉全部重开。

## 4. 最小逐笔消费

```js
import {compileHanziStrokeReveal} from '../../../engine/motion-elements/lib/support/ordered-stroke-reveal/hanzi-data.mjs';
import {drawOrderedStrokeReveal} from '../../../engine/motion-elements/lib/support/ordered-stroke-reveal/adapter.mjs';
// data由caller显式读取已核本地字数据；Path2D来自已有Canvas实现。
const plan=compileHanziStrokeReveal({strokes:data.strokes,medians:data.medians,
  startTime:0,strokeDuration:.5,liftDuration:.12,revealWidth:160});
const {state,tip}=drawOrderedStrokeReveal(ctx,plan,t,
  {x:80,y:60,scale:.2,yOrigin:900,color:'#20394d',Path2D});
// 每帧先清理/重画背景；tip为caller-local。lift时不画连接墨线。
```

代码中的路径示意相对本参考目录；制作工程应从自己的确定根导入，不假设当前工作目录。portable中的维护代码在runtime；遵守实际包布局。无需为新场景复制一套renderer。

## 5. 核验先找容易错的位置

- 字体：目标全文cmap非.notdef；Native明确family；缩到目标观看大小看标点、笔形/正文风格和墨迹裁切。零缺字、width未超界不等于美术通过。
- 逐笔：空态不先出圆点，笔顺与源一致，部分笔不越本笔轮廓，提笔期间无新墨，终态与独立整轮廓oracle一致；乱序/重复时间的清帧结果相同。
- 终端跳变：比较每笔接近1与1的像素，窄mask或不匹配中线会补出尾部；即使width足够也有clip抗锯齿差。不可只测终态就承诺全程平滑。宽圆头也可能提前显现转折/自交处，必须检查。
- 场景：同帧笔尖/墨迹共源还不够，须检查笔身是否掠字。下划线/引线优先让笔身位于空白侧，转角前后避免突然翻身；采样动作中段与提笔，不能只看笔已退场的完成帧。抬笔和离场不挡读，纸纹稳定，图表数值不被风格变形，卡片接续后主线仍清楚。
- 声音：写字/落笔/圈重点可用稀疏自制拟音，不逐字密集轰炸；音乐不能抢中文旁白。各自检查实际最终混音，不以有音轨或LUFS达标充作听审。
- 分别报告纯几何、Native像素、静帧查看、常速观看、实际听审、声画同步、来源许可和用户接受。没有执行的保持未验。

## 6. 原创冷启动检验

新执行者只拿需求、当前仓库/包入口与环境，不拿旧片故事、镜头表、隐藏提示或私有实现。让其自己选主题、中文层级、路径/字体路线、声画焦点和现有部件；先保存选择理由，再制作。检查实际消费而非import数：哪些输入进入哪些像素/声音、为什么没有选其他部件、是否出现新缺口。失败要回写对应合同/导演指导，不能靠把成片源塞进基础库制造“复用成功”。

真正的停止条件是题目表达与可见输出得到独立核验，不是代码能跑、资产数量上升或技术图漂亮。审查方法继续沿现有工具/Skill，不在本页另造评分器或第二套作品索引。
