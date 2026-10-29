# 来源、版权与非官方复刻声明

## 原作品与这份代码

原作参考：**AlchainHust / huashu**，[原作链接](https://x.com/AlchainHust/status/2113208707668729984)。构图、排版、叙事、部分像素形状、坐标与时间表参考、量测或描摹该作品。这是使用 MotionStudio 重新编写/迁移的 52 秒非官方学习复刻，**不是全部原创设计，不是原作者工程恢复，不是官方版本或原作者/品牌背书**。原作表达、商标、人物与其他第三方权益保留；这里没有声称获得对原影片所有视觉元素的概括授权。

MotionStudio 自有代码适用仓库根 MIT；`huashu-motion` 历史浏览器代码的固定上游提交为 `52467f99c602b76ba86d511d37acdfe93fa1e16e`，Copyright (c) 2026 Huashu，完整 MIT 见 [`LICENSES/Huashu-MIT.txt`](LICENSES/Huashu-MIT.txt)。该 MIT 只覆盖其适用代码，不自动授权 X 视频、Anthropic 图标、音乐或照片。本条目实际执行 Native Canvas / FFmpeg，不需要旧浏览器、Chrome/CDP 或 GSAP；本条目保留相关 Huashu MIT 声明；旧浏览器/GSAP 文件与其许可仍留在私人原备份，不伪称它们为本条目最低依赖。

## 完整资源清单，不公开受限字节

[`resources.lock.json`](resources.lock.json)逐项登记全部 **16** 个必需资源。不随仓库提供它们的二进制文件。来源网址只是出处，不等于下载/再分发许可；固定 hash 只是身份，不是授权。自行提供资源时，用户须有适用使用权。公开代码与资源外置的边界不等于所有原作表达均已清权。

### 图标及品牌

Claude Duet 独立 SVG 来自 [官方介绍页](https://claude.com/resources/articles/claude-duet)，保留 Anthropic 等权利人的版权/商标权。没有确认开放许可，故不纳入 Git、不自动获取；脚本仍完整列出文件和 hash，并在缺失时停止。Claude Duet、DARIO 和游戏式角色/物件叙事按参考复刻保留，不表示相关权利人参与、许可或背书。

### 音乐及实际混音

**“Bit Shift” — Kevin MacLeod (incompetech.com)**， [原曲页面](https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1600045)， [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)；完整条款见 [`LICENSES/CC-BY-4.0-legalcode.txt`](LICENSES/CC-BY-4.0-legalcode.txt)。

旧工程记录的修改：截取、滤波、淡入出、增益自动化，混入程序生成音效；记录称 SFX 为多谐波、滑音、滤波噪声及包络合成，无第三方游戏采样。**记录不等于本条目独立复核了全部混音许可**。实际恢复沿用 `original-v4-audio.m4a`；没有分轨/完整合成配方或公开 exact-mix URL，因此不分发这条 AAC，不把原曲许可扩张为整体混音权利结论，也不把全曲下载说成原样恢复。声音不是 X 原作原声。

### 照片

**Kimberly White/Getty Images for TechCrunch**，TechCrunch 发布。 [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Dario_Amodei_at_TechCrunch_Disrupt_2023_01.jpg) / [原发布](https://www.flickr.com/photos/techcrunch/53202070940/)；[CC BY 2.0](https://creativecommons.org/licenses/by/2.0/)，全文见 [`LICENSES/CC-BY-2.0-legalcode.txt`](LICENSES/CC-BY-2.0-legalcode.txt)。

修改：多边形裁剪、平移、缩采样、调色板像素化、黑色描边，以及代码绘制眼镜、眼白与瞳孔。保留原人物姿态；不暗示摄影者或被摄者背书。生成代码读独立原照片，不读取原作整屏画面。照片外置，不随源码分发。

### 字体、Emoji、语言卡片

13 个实际文件及内嵌版权/版本、官方家族来源、完整 notices 和身份见资源清单。Inter、Gelasio、Noto 各字族、Noto Color Emoji、Press Start 2P、Liberation Serif 沿用各自 SIL OFL；DejaVu Sans/Mono 沿用 Bitstream Vera / DejaVu 许可，不笼统归为 MIT 或全部 OFL。完整正文及版权保留于 `LICENSES/`，并随准备器复制到外置缓存。

CJK SC Bold 是原 TTC face 2 的表级提取，记录在 `src/font-registry.json`。NotoSansSC、Inter、Press 等精确文件可能涉及格式转换/子集，不能用同名字体替换。**Press Start 2P 内部仍含保留名称，现证据不足确认其历史转换是否满足 RFN 条件；Canvas 注册别名 `Pixel` 不等于内部改名。** 本条目不分发或自动取得该文件，也不声称已消除此历史问题。若重新派生，需按许可处理内部名称并作为另版本重新验证。

### 唯一封面

`cover.jpg` 选自 MotionStudio 已完成复刻影片的整数帧 **450 / 30 fps = 15 s**，影片 SHA-256 `5f1b3e4307d8ca2d75dbdc97e75570ef198285c8fb9b61730167da1e15be9b95`。1280×720 JPEG，无 EXIF/IPTC/XMP/位置/注释元数据。不是原作者视频帧；选择多语言卡片以避免包含外置 SVG、Dario 照片和游戏人物。其构图仍参考原作；卡片文字与旗帜 Emoji 按字体/图形来源保留声明，不声称第三方设计完全原创。

## 维护目的与权利处理

本作品集用于学习、研究与非商业展示，不用于商业目的。上述说明不替代授权，不缩减 MIT/OFL/CC 既有权利。原作者/权利人认为涉及侵权，可通过 [MotionStudio GitHub Issues](https://github.com/doomclouds/MotionStudio/issues)联系；我们及时核查，必要时暂停展示、下架/删除具体公开内容并告知处理结果。不要在公开 Issue 放身份证件、私人合同、邮箱或电话号码。完整响应流程见作品集唯一规范 [`../../README.md`](../../README.md)。私人恢复包不会因收录或争议被擅自删除、覆盖或改写历史。

CC 条款留存来源：Creative Commons 官方 `cc-legal-tools-data` 固定提交 `a0dac18d1a773b4cdb7d8dd5d9bf4efab7901030` 的 [CC BY 2.0 HTML](https://github.com/creativecommons/cc-legal-tools-data/blob/a0dac18d1a773b4cdb7d8dd5d9bf4efab7901030/docs/licenses/by/2.0/legalcode.en.html) 与 [CC BY 4.0 文本](https://github.com/creativecommons/cc-legal-tools-data/blob/a0dac18d1a773b4cdb7d8dd5d9bf4efab7901030/docs/licenses/by/4.0/legalcode.txt)。2.0 在保留条号和正文前提下抽为纯文本，4.0 保留原文本字节；官方法律正文链接继续有效。
