# 设备内容槽配方
设备框只是叙事容器，真正学习点是一个品牌的多阶段内容如何保持边距、角色和视觉密度一致。不能用重复套手机壳代替产品设计，也不能宣称按钮可交互。

`drawPhoneStage(ctx,{x,y,width,height},content,{createCanvas})`使用Lull源快照，内容回调在局部坐标绘制，inner给出边框内槽。width180–720、height400–1400、比率1.6–2.5；坐标±16384。离屏留70px影子边距。旧Lull模块current path和callback异常可能污染调用者的缺点，适配器通过独立画布处理；callback失败不修改caller像素。

外观固定为此手机壳，不声称所有设备、比例、刘海都成立。内容自身排版/字体/溢出需要调用方验证，回调只受屏幕clip约束，不自动给文案缩字。caller alpha/filter/shadow/composite需默认；clip和transform保留作用。两示例为工坊选择与博物馆入场，尚未验证真实交互流程。

material-surfaces已有表面/内容槽抽象，应保留关系而不是提议“phone surface”第15族。pager更像parameter-controls的步骤语义但本候选没有抽出；不把三个小函数算三块新积木。
