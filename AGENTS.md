# MotionStudio 协作入口

先读 [工程规范索引](specs/README.md)，再只加载本任务所需条目。当前规范状态与版本以索引为准，仍为治理草案；不得声称已部署治理自动化。

- 开工记录实际分支、commit、任务范围和允许修改的路径；不要假设 dev 始终停在草案基线。
- UI 设计（直接委托或影片中存在明确 UI 设计缺口）读 [UI 设计导演](skills/ui-design-director/SKILL.md)，共享知识只读 [knowledge/design](knowledge/design/INDEX.md) 真源，当前旧设计知识路径与CLI已直接迁移、不保留兼容层；此为仓库文件入口，不代表宿主自动注册或多代理调度。
- 声音、配乐或旁白/配音任务读 [声音导演](skills/sound-director/SKILL.md)；从 [声音书架](knowledge/sound/INDEX.md) 发现 [独立资产合同](engine/sound-elements/INDEX.md)，复用现有声音/听审正文，不把结构验证当实际听审。
- 独立检查已有媒体时直达 [视频审核](skills/video-review/SKILL.md) 或 [音频审核](skills/audio-review/SKILL.md)，配乐制作/修订直达 [配乐生产](skills/soundtrack-production/SKILL.md)；三者复用既有正文与工具，不重复建引擎/证据合同，不因配置 key 自动上传或付费。
- 制作任务再读 [导演 Skill](skills/motion-film-director/SKILL.md)；实现任务先读所属模块 README、契约与测试。查阅路径见 [按需加载](specs/production-and-knowledge.md)。
- [源码范围](SOURCE-SCOPE.md)、[第三方声明](THIRD_PARTY_NOTICES.md)、各级 LICENSE/NOTICE/RIGHTS 与现有安全门禁不可因整理而删除、降级或绕过；冲突按 [治理规则](specs/README.md) 停止相关变更并报告。
- 私有制作、素材、报告与实际证据保留在已授权仓库外目录；公开库只接收审定源码/方法及既有规则准许的例外，不把“忽略”当作权限。
- 新产出先判断归属，再按 [资产生命周期](specs/asset-lifecycle.md) 晋级；作品、方法、机制、配方与技术夹具不能互相冒名。
- 验证和接受分开：技术、视觉、实际听审、同步、用户接受、权利范围逐项报告，未跑/阻断/过期不算通过。
- 修改索引或目录前遵守 [索引与迁移](specs/indexes-and-migration.md)；完成时报告实际变更、测试与未验项，不自动提交、推送、发布或删除历史。

- 作品只读 `portfolio/works/*/work.json`，使用 `python3 portfolio/work.py` 的 inspect/query/index/admit-check/verify-source；无旧schema兼容。query/index验证本地清单并显示记录状态，不隐式验历史Git；verify-source显式选单件严格验源，inspect/admit-check复用该历史身份门并支持单件选择；缺源不改接受状态，不等于可恢复或可渲染。外部引用只保留数据，不做可达性门；candidate/NOT_RUN不当作已接受。

- 创作与复用任务按需读 [三导演任务闭环与本地证据](tools/director-evidence/README.md)：在已有设计说明中贯通需求、阅读/选择、真实消费、复验及缺口回写；可选工具只记录正文输出和 Node 执行，不证明模型理解、设计质量或实际听审。
