# attractor-orientation（experimental）

<!-- asset-self-description: field.attractor-orientation -->

## 当前资产入口

本页是`field.attractor-orientation`当前合同，状态与证据登记在[catalog](../../../../catalog.json)。[design.md](design.md)说明导演选择，[index.mjs](index.mjs)是真实实现，[可执行例子](examples/contract.mjs)调用公共入口与catalog输入并核对独立几何断言，[专属测试](test/attractor-orientation.test.mjs)补充独立数学断言，原field-slices混合测试继续保留。旧实现位置不留wrapper；共享组合guide、scene及混合测试保留原职责。

本次只迁移文件并修正相对导入，不改变算法。下文源码字节匹配或版本桥接属于原冻结版本，不是新路径的影片等价、听审、艺术接受或重新编码结论；历史manifest不变。


### `field.attractor-orientation`

```js
const plan = compileAttractorField({
  bounds:{x:0,y:0,width:360,height:160}, columns:18, rows:8
});
const state = sampleAttractorField(plan, {
  attractor:{x:150,y:70}, radial:1, tangential:0.4
});
```

Cell centers and `cellId=row:r/col:c` stay fixed. Positive radial points **toward**
the attractor; positive tangential rotates that direction +90° in local x/y
(Canvas y-down appears clockwise). Normalize the weighted radial and tangential
unit vectors, using scaled coefficients to handle subnormal finite inputs. Each
cell returns `position,distance,direction,angle,defined` plus its ID. Exactly at
the attractor, or with both weights zero, return `{x:0,y:0}`, angle 0 and
`defined:false`; no previous orientation is remembered. The singularity is not
continuous. Samples do not integrate particles, infer video optical flow, simulate
fluids, or report velocity. Distance is local length, not screen-space speed.

Bounds x/y within ±1e6, width/height 1e-6..1e6; each grid dimension 1..128,
at most 4096 cells. Attractor coordinates use the existing ±1e9 point contract;
weights are -1..1. Caller owns time/reduced-motion policy and applies the parent
transform **once**, while drawing local state. No seed is needed: the field is
analytic. Plans are module-branded, copied/frozen; serialized plans must recompile.


组合示例、原验证范围和听审/生产边界见[共享field/slices说明](../../../../docs/guides/field-and-slices.md)。

## 运行与恢复

Node24+，完整仓库根执行：

```sh
node engine/motion-elements/lib/foundations/field/attractor-orientation/examples/contract.mjs
node --test engine/motion-elements/lib/foundations/field/attractor-orientation/test/*.test.mjs
```

保留共享validate/math/time及既有timeline依赖；跨资产示例仍共享，不复制组合代码，不复制通用实现。纯数值例子不需字体、Canvas或媒体，不联网或生成影片。公共barrel间接加载相邻motion-timeline-core及Node内建crypto，需保留仓库/portable目录。跨资产组合与Native验证仍在包test目录；需要声明版本的@napi-rs/canvas，缺失应报告阻断，不移除测试。

field计划与slice计划/状态使用canonical品牌，保存原始定义重新compile。local reveal是同步绘制函数，不编译品牌计划或返回冻结状态。纯采样结果深冻，不保留播放历史。代码适用[包MIT许可](../../../../LICENSE)，不授权参考源码、字体、音频或影片再分发。工程、有限帧、常速、听审和艺术接受分开记录。
