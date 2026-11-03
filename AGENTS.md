# MotionStudio 协作入口

先读 [工程规范索引](specs/README.md)，再只加载本任务所需条目。当前规范状态与版本以索引为准，仍为治理草案；不得声称已部署治理自动化。

- 开工记录实际分支、commit、任务范围和允许修改的路径；不要假设 dev 始终停在草案基线。
- UI 设计（直接委托或影片中存在明确 UI 设计缺口）读 [UI 设计导演](skills/ui-design-director/SKILL.md)，共享知识只读 [knowledge/design](knowledge/design/INDEX.md) 真源，当前旧设计知识路径与CLI已直接迁移、不保留兼容层；此为仓库文件入口，不代表宿主自动注册或多代理调度。
- 声音、配乐或旁白/配音任务读 [声音导演](skills/sound-director/SKILL.md)；复用现有声音/听审正文，不把结构验证当实际听审。
- 制作任务再读 [导演 Skill](skills/motion-film-director/SKILL.md)；实现任务先读所属模块 README、契约与测试。查阅路径见 [按需加载](specs/production-and-knowledge.md)。
- [源码范围](SOURCE-SCOPE.md)、[第三方声明](THIRD_PARTY_NOTICES.md)、各级 LICENSE/NOTICE/RIGHTS 与现有安全门禁不可因整理而删除、降级或绕过；冲突按 [治理规则](specs/README.md) 停止相关变更并报告。
- 私有制作、素材、报告与实际证据保留在已授权仓库外目录；公开库只接收审定源码/方法及既有规则准许的例外，不把“忽略”当作权限。
- 新产出先判断归属，再按 [资产生命周期](specs/asset-lifecycle.md) 晋级；作品、方法、机制、配方与技术夹具不能互相冒名。
- 验证和接受分开：技术、视觉、实际听审、同步、用户接受、权利范围逐项报告，未跑/阻断/过期不算通过。
- 修改索引或目录前遵守 [索引与迁移](specs/indexes-and-migration.md)；完成时报告实际变更、测试与未验项，不自动提交、推送、发布或删除历史。

- 作品只读 `portfolio/works/*/work.json`，使用 `python3 portfolio/work.py` 的 inspect/query/index/admit-check；无旧schema兼容。外部引用只保留数据，不做可达性门；candidate/NOT_RUN不当作已接受。
