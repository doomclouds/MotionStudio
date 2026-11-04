# 有限粒子：一次发射，绝对时间回采

<!-- asset-self-description: motion.finite-particles -->

## 身份与机器索引

`motion.finite-particles` 是有限、播种的运动基础机制。唯一登记是 [catalog](../../../../catalog.json) 的 `elements[id=motion.finite-particles]`；状态、版本与证据从该记录读取，本目录不是第二份登记库。

本资产自包含入口：本页说明合同，[design.md](design.md) 说明选择理由与导演取舍，[index.mjs](index.mjs) 是实际实现，[examples/contract.mjs](examples/contract.mjs) 是可执行调用，[test](test/finite-particles.test.mjs) 是技术回归。公共 API 仍由 [lib/index.mjs](../../../index.mjs) 导出同一个实现，不新增兼容层。返回 [Motion 图书入口](../../../../README.md)。

## 设计意图

让有限的碎屑、点状尾迹或一次喷发在跳时、倒序和重渲时保留同一身份与轨迹，而不是靠逐帧随机更新。每个发射粒子显式指定出生时间与初始世界位置；播种只在编译时选取区间内参数。视觉重点由调用者给出的出生节奏、初速和绘制规则决定，本机制不提供默认烟雾风格或粒子材质。

## 适用与不适用

适用：至多512个一次性事件、恒定加速度弹道、需要稳定重采样的短时点迹。若发射源移动，应先采样发射源在每次出生时的位置，并存入该次 emission；不要每帧以当前发射源位置重算旧粒子。

不适用：持续无限发射、粒子回收、粒子间碰撞、随位置变化的力、流体/烟雾物理或真实湍流。没有自动跟随路径、剪辑时间线、绘制、文字排版或音效。不能用粒子数多冒充叙事效果好。

## 视觉与动态行为

每个粒子在 `birth <= at < death` 时存在；死亡时刻不返回该粒子。`age=at-birth`，位置为 `p0+v0*age+0.5*a*age²`，速度为 `v0+a*age`。返回顺序沿用输入顺序，不等于深度排序。随机样本按 seed、ID和参数通道确定，重排或删除其他ID不会改变保留粒子的轨迹。

本机制无 Canvas、透明度、大小、颜色、纹理或降动效开关。调用者按 `progress` 自行安排尺寸/淡出与遮挡；如需要 reduced-motion，应在调用侧选静态替代并保持内容时序，不向本API传未知选项。运动与样式、音频、无障碍体验须分别验证。

## 参数与代码入口

调用 `compileFiniteParticles({seed, emissions})`，再用同一模块实例的 `sampleFiniteParticles(plan, at)`。所有列出的字段必填，无默认值。实现见 [index.mjs](index.mjs)。

- `seed`：0..4294967295整数。`emissions`：1..512个普通、稠密记录；每项字段严格为 `id,birth,position,velocity,acceleration,lifetime`。
- `id`：唯一ASCII字符串，首字符英文字母，后续英文字母、数字、下划线或连字符，总长1..64。
- `birth`：Number秒，0..3600。`position:{x:[min,max],y:[min,max]}`：每个边界在±16384；`velocity`同结构，边界±4096单位/秒。坐标单位由调用者一致选择，不强制像素。
- `acceleration:{x,y}`：每轴±1024单位/秒²。`lifetime:[min,max]`：0.001..60秒。所有区间要求 min<=max；相同边界可锁定参数。随机比例在[0,1)，所以非退化区间的上界通常不被抽中。
- `at`：Number秒，0..3660；不是 rational 时间。所有数必须有限。未知字段、访问器、非普通对象/非普通或稀疏数组、重复ID、越界、逆序区间均拒绝，不静默钳制。该检查不是任意恶意Proxy的安全沙箱。

编译返回深冻结的 `{seed,particles}`，每粒子含 `id,birth,death,lifetime,x,y,vx,vy,ax,ay`；输入被复制，不持有可变作者数据。采样返回深冻结 `{at,alive}`；alive每项含 `id,birth,death,age,progress,x,y,vx,vy`。plan带模块实例身份，序列化重建或另一份模块的plan会拒绝；保存输入再编译，不保存plan冒充可交换数据。

## 可执行示例

从仓库根执行：

```sh
node engine/motion-elements/lib/foundations/motion/finite-particles/examples/contract.mjs
```

[完整示例](examples/contract.mjs) 包含公开入口import、独立合成输入、出生/死亡/解析位置断言、反向回采、无效输入，以及catalog当前示例的实际compile/sample。无eval、外部媒体或联网。输出是一行 `motion.finite-particles contract PASS`，不产生视频，不声称像素或观看验收。

## 依赖与恢复

本目录的实际实现无外部依赖。仓库支持Node24+；上述公开入口示例通过全库barrel间接加载同级 `motion-timeline-core` 和Node内建crypto，须保留仓库/portable相邻布局。本地测试直接导入本目录index，不需要Canvas、FFmpeg、字体或素材。

从完整源码恢复后检查 `node --version` 并执行上述命令；如果相邻时间核心缺失，恢复同一版本模块，不复制其他版本代码或安装不明替代品。浏览器原生兼容与第三方渲染器接入不在本次验证范围。

## 来源与权利

本库原创有限一次发射实现，采用解析恒加速度公式与确定性32位混合器；没有复制素材或参考影片内容。代码适用 [Motion MIT](../../../../LICENSE)。这不授权调用者图片、字体、声音或参考影片的再分发，范围见 [仓库第三方声明](https://github.com/doomclouds/MotionStudio/blob/5d8a5e99c3bf55994e1f5383fd15dae6fe304a00/THIRD_PARTY_NOTICES.md)。历史研究身份与早期修复记录保存在 [历史合同](../../../../docs/history/candidates/finite-particles.md)，仅作来源，不是当前调用或验收入口。

## 验证与局限

```sh
node --test engine/motion-elements/lib/foundations/motion/finite-particles/test/*.test.mjs
npm --prefix engine/motion-elements test
```

局部测试覆盖解析独立oracle、出生/死亡边界、逆序与重复回采、冻结/复制、seed与ID独立性、资源上限、模块身份及访问器拒绝；示例另检查公开barrel与catalog调用。技术通过不证明随机分布认证、风格质量、观看舒适度或生产迁移。

Native像素、常速观看、实际听审、同步、用户接受和跨场景迁移：本目录示例均为 NOT_RUN。历史通过不沿用为当前版本通过；每次执行结果须绑定实际提交和环境。未提供降动效策略验收，且恒加速度的Number计算不是精确有理数物理。
