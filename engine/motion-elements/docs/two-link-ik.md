# 二维两连杆 IK：让手端跟随明确的接触目标

**experimental基础机制，有实际有声验证候选，不等于艺术验收。** 只新增一个几何机制；两侧bend、关节数量、颜色、朝向不是不同积木。矩阵、路径、残差回弹和素材绘制复用旧项，不包装成新机制。

## 服务场景与非目标

身体根部在移动时，保持两段固定长度，将手端尽量放到由作品明确提供的圆片或灯座目标。
调用方用同一物体状态计算目标，避免手、物各自插值产生滑动。求解器本身不认识“接触”，不决定碰撞、抓取、摩擦、冲量、重量、步态或放手时间。
这是单条二维链的闭式位置几何，不是全身骨架、蒙皮、逆动力学、3D或逐帧物理积分器。

## 严格接口

```js
import {solveTwoLinkIK} from '../lib/two-link-ik.mjs';
const state=solveTwoLinkIK({
  root:{x:100,y:100}, target:{x:150,y:100},
  upperLength:30, lowerLength:40,
  bend:'positive', fallbackAxis:{x:1,y:0}
});
// state.joint ~= {x:118,y:124}; state.end === target in value.
```

全部六个字段必填，外层及三个点对象严格拒绝未知字段、Symbol、null、数组、非plain对象；点必须具有自身x/y字段。

- root/target：世界空间坐标，各轴有限数，范围−1e6..1e6。
- upperLength/lowerLength：有限数，各为0.001..100000，固定骨长，不做隐式scale。
- bend：仅`positive`或`negative`。从root指向target的单位轴为(u.x,u.y)时，positive选择垂向(−u.y,u.x)，negative选反向。Canvas y向下时，水平向右的positive肘部在下方。
- fallbackAxis：同样有限±1e6，向量长度至少1e−9，内部归一化。仅root和target精确重合时参与求解；即使非重合也必须提供合法字段。
- 非零root-target距离必须至少1e−9；0是单独支持的奇点。比此更小的非零距离明确拒绝，防止subnormal方向归一化误导几何。阈值针对IEEE求得的差与距离，不做epsilon吸附。

返回深冻结、与输入隔离的普通对象：

```js
{
  root, target, joint, end,
  angles:{upper,lower},
  reach:'reachable' /* or 'inside' / 'outside' */,
  projected:false, usedFallback:false,
  requestedDistance, solvedDistance,
  error:{x,y,distance}
}
```

angles为两段分别从+x轴出发的**世界绝对弧度**，使用atan2主值，不是第二段相对第一段的角度，不自动unwrap。需要连续角度插值时由调用方建立明确的角度策略；端点几何不依赖上一次求值。
error定义为target−end，distance为其欧氏长度。requestedDistance为root到请求target的距离；solvedDistance为钳制后的根到末端距离。projected在inside/outside时为true，即使世界坐标舍入把极小投影差舍掉；不是按error非零猜测状态。

## 可达域与奇点

- reach分类及可达阈值按IEEE浮点距离与长度计算，不承诺精确实数比较或导数连续。
- 可达距离为闭区间 `[abs(upperLength−lowerLength), upperLength+lowerLength]`。边界属于reachable，不用epsilon改变分类。
- 可达时end直接复制target，joint由两圆交点及显式bend确定。
- outside按同方向投影到外半径，完全展开；inside投影到内半径，完全折叠。两个分支都不拉长短骨。
- 目标重合且长度不同：fallbackAxis决定内半径投影方向；短第一段可能朝反方向。
- 目标重合且长度相同：end=root，joint位于fallbackAxis的bend侧垂向，距离为upperLength。此约定与目标沿该fallback轴趋近0时的几何分支相符；它不是唯一数学解。
- 目标穿过root、接近共线或调用方更改bend可能造成姿态突变；库不自动翻肘、阻尼或保存上一帧角度。导演应避开不希望的奇点或显式编排过渡。

所有坐标和长度为IEEE浮点，三角形几何有舍入残差，不承诺精确实数长度或跨后端逐字节像素。返回的派生点可超出输入点域（例如重合目标的内半径投影），不得把派生点再次当受限输入而不检查。
测试覆盖域内极端ratio、大小坐标及近边界；2e−8世界单位是测试中的骨长、端点等几何残差门，
不是近奇点joint位置或角度的误差界，更不是全输入域误差定理。极近共线时，微小坐标/距离舍入可放大为可观察的关节偏差。
例如两段各100000、root(0,0)、target(186465.46912120687,72323.08639299238)：
JS hypot恰为200000，按合同返回共线joint；以输入float精确值作高精度实数求解时目标略在内侧，
joint可相差约0.001325，尽管名义骨长残差远小于2e−8。不得由骨长守恒推断姿态高精度或跨后端一致。

## 组合、时间与绘制

每次用当前绝对帧/时间产生root与target，再求解；不调用上一帧状态修补结果。API无clock、duration、reducedMotion、回调或后台cache。
减少动态时由作品保持静态root/target并保留原时段；不把该策略冒称已做无障碍验收。

绘制可连接root→joint→end，或用旧composeTransform和两段世界角度放置素材。父变换应在坐标换算或绘制阶段明确应用一次，不能既传世界root又重复乘同一父矩阵。
固定末端并不保证肢体不会穿过身体或其他物体；遮挡、层序、关节美术、手端旋转、灯芯轨迹、接触cue均为作品职责。

## 工程复现与当前证据

在仓库根目录：

```sh
node --test engine/motion-elements/test/two-link-ik.test.mjs
node --test engine/motion-elements/test/*.test.mjs
```

专属测试含：3-4-5已知三角形、内/外可达投影与边界、两bend、等长/异长重合、输入严格域、不可变输出、变换等变性；2500个由正向关节角构造的独立joint oracle；10000个极端几何组及端点/比例边界；乱序、重复、新进程；Native画出两段及末端的逆序/新进程PNG一致。
这些是数值与像素工程测试，不是角色表演、美术、常速连续观看或听审通过。作品覆盖与状态见下，不借一部作品泛化全部参数。

## 官方参考与原创边界

本批以原创两圆交点几何实现，不复制第三方代码、不安装依赖。

- [Paper.js Point](https://github.com/paperjs/paper.js/blob/fcdc9eb2e11965a5ee680923db210f77ce78239b/src/basic/Point.js)：实际阅读normalize/angle/rotate入口。其零向量可保留`_angle`；本API刻意不用隐藏角度状态，要求显式fallbackAxis。Paper Point不是本API的IK求解器。[实际MIT许可](https://github.com/paperjs/paper.js/blob/fcdc9eb2e11965a5ee680923db210f77ce78239b/LICENSE.txt)。
- [Matter Constraint.solve](https://github.com/liabru/matter-js/blob/b8ee71cd7f9b49f53639ddaedd6254f1929bcbe5/src/constraint/Constraint.js#L140-L260)：实际阅读其距离约束与position/angle/constraintImpulse修改；它依赖迭代状态，不适合直接冒充本库乱序求值。未采用其物理solver，更不声称这里支持碰撞。[实际MIT许可](https://github.com/liabru/matter-js/blob/b8ee71cd7f9b49f53639ddaedd6254f1929bcbe5/LICENSE)。

许可核查与具体源码对照不增加条目，也不替代作品验证。具体官方对照与其余参考库取舍见[character-reference-decisions.md](character-reference-decisions.md)。


## 真实作品覆盖与视觉接触的限制

本项被一支14秒、1080p60、840帧有声原创角色候选实际使用：角色追上移动物体，双手收回并安置。
1680次求解结果被两臂绘制消费（f0–839），固定两段长度、相反bend，全部正常可达。
声明接触段target误差为0；这是几何记录，不是实际手掌轮廓、碰撞或力学的自动证明。
作品曾有“手型先贴上而物体仍未减速”的视觉问题；最终版本通过修改项目美术/接近时序、真实编码邻帧复核闭合。
不得把旧失败版或数字全绿冒称成功的视觉接触，也不据此认定IK数学错误。

复用旧polyline路径的position（不消费tangent）及有限settle残差；其中一个settle终点求值被后续分支覆盖，
不把未绘制结果计作消费。父矩阵、脚步支撑、手朝向、相机、灯光响应、声音均为项目编排，不是本批新机制。
片中没有内/外投影、零目标fallback或奇点的可见演示；工程测试不能替代这些分支的作品验收。

原冻结solver及实际导入依赖与本批源字节一致；目录/测试/指导接入在影片之后，历史manifest保持不变。
完整影片、源码/媒体hash、参数、逐帧调用与绘制回执、复现命令和失败版本保留私有。
公开合成例仅复现API合同，不含该片艺术参数，不表示可独立重制私有作品。
工程、全解码与限定邻帧技术检查通过；常速连续观看NOT_DONE、实际听审NOT_LISTENED、
用户艺术PENDING_USER、通用生产迁移NOT_RUN分别保留。没有全片审美或优秀设计的自动背书。

私有复现应先核所有冻结源与音频身份，重建原创声音及代表Native帧，再完整编码/full-decode与比对调用范围。
数值与像素的同机复现不等于跨平台后端一致；新作品仍需实际听看与用户验收。
