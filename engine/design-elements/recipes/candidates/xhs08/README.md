# XHS08 定量面积受限配方

最小源码闭包；0新增公共家族。独立教学技术验证，不是完整品牌作品、原画改版或事实认证。原忠实复刻保留；本包不带原截图、私人报告、图像或字体二进制。

接口与数值边界见 DESIGN-RETENTION.md、design/area-plan.mjs。gap=0仅连续几何面积精确；离散光栅允许边缘误差。gap>0返回逻辑和着色比例，不混淆。华夫格使用部分格，1格=10单位，空尾不是类别。两套分类在演示中明确区分。原源样例计数不是经核验研究数据。

## 独立运行

Node 24.22.1；Native依赖为 @napi-rs/canvas@0.1.100，见 [package.json](package.json) 和原 `package-lock.json`，不带node_modules。稳定身份为 [recipe-manifest.json](recipe-manifest.json) 的 `recipe.xhs08-semantic-area.v1`，状态仍是 `technical-reviewed-static-recipe-candidate`，不是用户审美验收。核心plan函数无第三方依赖、无需字体；`test.mjs` 后半段实际载入Canvas检查100×100像素，但无需字体。

`test.mjs` 与 `render.mjs` 用 `createRequire(import.meta.url)` 解析包旁的Canvas，不支持另设环境变量指向任意运行时。不能只把npm安装到另一个目录而继续执行仓库中的源码。将干净的文本包复制到**仓库外授权新目录**，在副本内按原锁安装；保留LICENSE、OFL、字体锁、设计与来源文件，不复制全仓、既有node_modules或产物，也不重建锁。

以下 `SOURCE` 是保留源码，`WORK` 是新独立副本及所有命令的cwd，`OUTPUT` 是另一新建/空的外部输出目录，`FONT_SOURCE` 与 `FONT_WORK` 分别为精确原字和派生目录。`PYTHON` 必须是调用方已有、授权且含fontTools==4.61.1的Python环境；命令不隐式安装Python依赖。请把绝对路径替换为授权位置，WORK父目录须已存在，字体与输出都放在原仓库和WORK之外。

```sh
set -eu
SOURCE=/absolute/MotionStudio/engine/design-elements/recipes/candidates/xhs08
WORK=/absolute/authorized-scratch/xhs08-source
OUTPUT=/absolute/authorized-output/xhs08
FONT_SOURCE=/absolute/external-assets/Figtree.ttf
FONT_WORK=/absolute/external-assets/new-figtree-derived
PYTHON=/absolute/existing-python-environment/bin/python
mkdir "$WORK"
cp -R "$SOURCE/." "$WORK/"
cd "$WORK"
npm ci --ignore-scripts --no-audit --no-fund
node test.mjs
PYTHONDONTWRITEBYTECODE=1 "$PYTHON" prepare-fonts.py "$FONT_SOURCE" "$FONT_WORK"
XHS08_FONT_FILE="$FONT_WORK/Figtree700.ttf" XHS08_OUTPUT_DIR="$OUTPUT" node render.mjs
```

npm锁不包含运行时二进制；离线安装仍需调用方已有的兼容完整缓存，不据此声称新环境冷恢复。字体原源来自 [Google Fonts Figtree](https://github.com/google/fonts/tree/main/ofl/figtree)，版本以 [font-lock.json](font-lock.json) 中原源SHA为准；下载最新同名字体不保证相同字节。准备脚本不自动下载、不接受替代，先核fontTools==4.61.1及原源SHA，再按锁中的字符集、wght=700和固定modified派生并核输出SHA。OFL通知随包，运行时只接受匹配锁的 `Figtree700.ttf`。已有精确派生字可直接供渲染，不能因此宣称此次跑过原字恢复/派生流程；缺资源或版本不合则相关步骤NOT_RUN。

运行时的路径门禁只保证本配方包外，**不保证整个仓库外**；本流程额外要求由调用方选择仓库外位置。输出和派生目录都须新建/空目录；不要把原字目录兼作派生目录。现有symlink/包内路径拒绝规则不是并发恶意文件系统沙箱。输出两1600×1460教学PNG与JSON计划；不生成带原参考图的报告。数值/小画布测试通过不等于字体恢复、完整渲染或图像验收通过。

显式英文图例，中文需另验字体覆盖。当前连续状态保护与数学测试不等于Motion跨帧重排验证。
