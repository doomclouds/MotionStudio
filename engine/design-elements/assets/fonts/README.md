# 已审定字体输入

[manifest.json](manifest.json)是本目录字体身份、来源、许可和用途的唯一机器清单。字体是官方固定版本的**未修改原件**，文楷以无损gzip包装保存，其余为直接TTF，不是本项目原创字体；每份保留完整版权/OFL原文。按精确路径和SHA获得源码范围例外，不通配允许字体或其他媒体。它们不增加design-elements正式族/catalog计数。

## 先按用途选，别把“像手写”混成一类

- **默认：霞鹜文楷 GB 轻便版**（LXGW WenKai GB Lite）。用常规楷体保持中文白板清楚、自然；不是行书，也不自带笔顺。manifest的defaultFontId明确选择，具体片中文字与大小仍逐次核验。

- **猫啃硬笔楷书**是硬笔楷书短标题/注记备选，不是行书，保留轻重、转折和笔势；仍需按本片观看尺寸检查，不等于用户已经选择该字形。需要行书时另核字形与许可，不用楷书替代声称满足。
- **马克笔/毛笔展示字**是不同风格，不能作为“硬笔书法”的默认答案。查看manifest的style/useFor/notFor，再看真实目标文字样张。
- 所有这些普通字体只提供字形和排版表，**不包含笔画顺序/中线路径**。与ordered-stroke-reveal使用的APL汉字数据是两套独立资源，不能交叉套用后称同款逐笔字体。
- manifest中的字符映射数量只是固定版本的覆盖描述。每支片仍须检查其完整文字、标点和Latin，确认cmap非.notdef，Native明确注册命中，并测字形墨迹/基线/宽度。
- 字形漂亮不等于长正文可读；展示体适合少量标题/注释，长句应在目标观看大小核验。

## 使用与身份检查

```sh
python3 engine/design-elements/assets/fonts/verify-fonts.py
# 需要已有fontTools；不会安装或联网。也可指定本片全文：
python3 engine/design-elements/assets/fonts/verify-fonts.py --text '白板动画：中文手写，逐笔绘制。'
```

验证先核font和license精确字节，再读取内部family/cmap及目标句。不把这些技术结果当美术审片。Node消费者用 `read-font.mjs` 的 `readReviewedFont(id)`：省略id即manifest默认字体，先核存储字节/完整OFL，文楷在内存解压，再核官方原TTF的字节数/SHA，返回独立owned Buffer和元数据。初始化时调用一次并复用，禁止每帧解压。Native见 `test-native.mjs`，以GlobalFonts.register(bytes,独有别名)显式注册，不系统安装、不写文件；按实际环境设置已有 `MOTIONSTUDIO_CANVAS_MODULE`。

文楷压缩只是传输包装，不裁字、不改轮廓/内部名称/字体表，恢复结果须等于官方原TTF。manifest同时记录存储和原件双SHA/Git blob。需要文件路径的宿主可在自己的授权制作目录显式解压一次并再核原件SHA；不能把恢复文件作为新的公共身份自动加入仓库。

```sh
MOTIONSTUDIO_CANVAS_MODULE=/absolute/installed/@napi-rs/canvas node --test engine/design-elements/assets/fonts/test-native.mjs
```

portable中engine替为runtime；相邻runtime核心依赖仍要保留。字体随审定源码包供离线使用，不自动激活或修改系统设置。若文件缺失/身份变化先停止消费，可从manifest的固定sourceUrl恢复原字节和完整许可，禁止静默换用latest或系统回退。

## 修改与分发

完整字体文件及OFL可随软件分发，字体本身不得单独销售或改为其他许可；字体输入不受根MIT重新许可。需要subset、改轮廓或导出字体软件时，按对应OFL的保留名称条款和作者说明处理新名称、版权、许可、源/产物身份及修改说明；本目录只保留未修改原件，不自动接收这些衍生字节。渲染出的正常作品与再分发字体软件分别判断。

没有捆绑Hanzi Writer引擎、APL字库、词典、私有电影/评审记录或字体预览图。字体许可不证明片中其他素材的权利，也不证明真实书写/常速观看/听审通过。
