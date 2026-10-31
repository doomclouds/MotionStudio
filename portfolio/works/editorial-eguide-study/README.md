# Editorial Eguide · 双页创作指南
用户已在十项整批展示后明确认可并要求沉淀推送；本目录仍为隔离集成，未自行提交。

Node24.22.1、@napi-rs/canvas0.1.100、fontTools4.61.1。先 `python prepare-fonts.py /absolute/original-fonts /absolute/new-fonts`，原源与派生SHA均检查。再 `OD_RESOURCE_DIR=/absolute/new-fonts node verify.cjs` 异地两进程复现已审帧；直接渲染为 `OD_RESOURCE_DIR=/absolute/new-fonts OD_OUTPUT_DIR=/absolute/new-empty-output node render.mjs`。运行时逐项检查输出字体SHA，拒绝整个仓库内资源/输出（独立复制无仓库时拒绝作品包内）及非空输出。

只固定1024×576静态，未验证交互/响应式/Motion。有限案例内积木见源码与DESIGN-RETENTION；0新增公共族。不把合计/比例源矛盾静默修成事实。依赖package.json/package-lock.json随附，字体原源按font-preparation.json外置。许可范围见CREDITS.md及licenses通知。

可运行案例积木测试：node test.mjs（同样设置OD_RESOURCE_DIR和新OD_OUTPUT_DIR）。owner_keep依据用户对已展示十项的“挺不错的，沉淀积木，然后推送，继续任务”，不将此扩大为浏览器/动效通过。

## 干净安装与外置冷制备顺序
1. Node24环境在本作品目录执行 `npm ci --ignore-scripts --no-audit --no-fund`。node_modules是本地生成依赖，绝不可提交/打包。
2. Python环境安装 `fonttools==4.61.1`；准备font-preparation.json列出的固定输入字体到仓库外绝对目录。OFL通知保留，工具不自动下载/替换字节。
3. 执行 `python prepare-fonts.py /absolute/external-inputs /absolute/new-external-fonts`，逐输入及派生SHA锁验证后才写入；历史输入获取范围见下述限制，不伪称原网页字体可自动获取。
4. `OD_RESOURCE_DIR=/absolute/new-external-fonts npm run verify` 两次异地完整帧核SHA；运行积木测试需再指定新空输出：`OD_RESOURCE_DIR=/absolute/new-external-fonts OD_OUTPUT_DIR=/absolute/new-external-tests npm test`。
资源、输出必须整个仓库外；独立复制作品且无仓库结构时为作品包外。字体锁要求原输入全量与输出精确版本，错误或缺失都拒绝。
