# 短键按压

由 [asset.json](asset.json) 生成；修改事实后同步本页，不建立第二套事实。

ID: keyboard-press · version 2 · sfx / ui-feedback · candidate

## 意图与使用

以短噪声按压、低频键帽联想与延迟释键支持可见键入动作，不替代状态确认或泛用UI轻触。

适用：可见文字实际新增或明确键被按下时按事件摆位；密集键入可重叠，但先检查增益、覆盖与留白。

反例：占位符、静态文字、仅光标闪烁、成功确认、要求真实特定键盘录音或没有键入动作的画面。

混音：固定52ms recipe；默认variant=0仍用seed=84701；LCG 1664525/1013904223/2^32生成[-1,1)均匀噪声；1400/6500Hz双单极低通之差。按压=1.5ms线性起音×exp(-105t)，噪声系数0.11；键帽=(sin(2π235t)+0.34sin(2π510t))×exp(-95t)×同起音，系数0.075；19ms后释键以1ms起音×exp(-190(t-0.019))调制同噪声，系数0.024；最后4ms线性淡出到末样本零。左右同值。可显式选择variant=0..3：依次采用(seed, 键帽频率倍率, 释键起点秒)=(84701,1.0,0.019)、(45047,0.985,0.018)、(13337,1.015,0.020)、(96731,0.995,0.0185)；其他参数和时长不变。默认0保留原PCM，变体不自动轮换、不改变cue时间或增益；回执保存所选variant与输出hash。不同字节不证明可听差异或更自然，密集重复感、差异力度与配乐遮蔽仍须同窗试听。

情绪意图：tactile, restrained

## 来源与调用

[文件或生成器](../../../synth.py) · recipe: keyboard-press · MotionStudio contributors

Original bounded procedural synthesis; no recordings, samples, borrowed melody or brand audio. Finite, explicitly selected standard-library press/body/release variants, not an exact PCM reproduction of a production mix or numerical-library prototype. Variant seeds and all synthesis parameters are stated in mix_notes. Variant zero preserves the original default in the same runtime; no automatic or unbounded randomization.

0.052s · PCM16 stereo 48kHz · one-shot。时长依据：recipe。

从库根调用：`python3 sound.py render --id keyboard-press --output /authorized/new-output`；私有库加 `--library /authorized/library`。输出必须在源码/输入库外且不存在。

## 权利与验收

[许可](../../../LICENSE)：MIT；使用 allowed；独立分发 allowed。

Retain the MIT copyright and permission notice with the source and generated asset redistribution. No trademark, voice or endorsement rights implied.

Original source and synthesis without third-party samples.

技术 RUN_REQUIRED · 听审 NOT_LISTENED · 声画 NOT_RUN · 用户 NOT_RUN

NOT_LISTENED: no certification of keyboard realism, audibility, pleasantness, mix suitability or owner acceptance. Nonzero event coverage and silent-gap tests establish technical timing only, not visual synchronization or perceptual approval.
