# 独立事件区间 sidecar（v1）

`event_intervals.py`只做**已声明事件的区间算术与复查定位**。不改旧benchmark事件schema或report，不解码、不识别事件、不听声音、不联网，也不评分。Python标准库；仓库内输出另用已有Git核忽略规则。真实工作树由Git验证根目录与inside-work-tree状态；空的宿主`.git`占位不视为仓库，疑似真实仓库验证失败则拒绝而不绕过忽略规则。测试中的临时Git/worktree夹具也需要已有Git。

## 运行

先准备双方已有`motionstudio.reference-profile/1.0` profile、真实媒体及人工/测量记录。注释格式见`event-intervals.example.synthetic.json`；该文件是中性合成格式示例，零hash是占位，不能直接当实测。

```sh
python3 tools/reference-benchmark/event_intervals.py evaluate \
  --annotations /local/annotations.json \
  --reference-media /local/reference.mp4 --candidate-media /local/candidate.mp4 \
  --reference-profile /local/reference.profile.json \
  --candidate-profile /local/candidate.profile.json \
  --evidence-root /local/evidence --out /local/new-interval-report.json
python3 -m unittest discover -s tools/reference-benchmark -p test_event_intervals.py -v
```

输出文件必须尚不存在，父目录已存在；仓库内输出须已Git-ignored。完整JSON先写同目录临时文件并fsync，再用独占hard-link原子发布；不支持此发布方式的文件系统失败关闭，不降级覆盖写。不覆盖任何输入。失败收据不含测量结果：hash不符`STALE`、缺文件`MISSING`、访问失败`BLOCKED`。退出0仅收集成功（可有未知/歧义），1绑定失败，2合同/参数/限额错误。重新运行必须新out，不改旧hash以“修复”stale。

### 可执行的纯合成演示

下面生成的是明确标为合成的**非媒体bytes**和合成profile，验证绑定/算术，不伪装播放/解码。它们只写到现有临时目录：

```sh
DEMO=$(mktemp -d)
python3 - "$DEMO" <<'PY'
import sys
sys.path.insert(0, 'tools/reference-benchmark')
from test_event_intervals import make_fixture
make_fixture(sys.argv[1])
PY
python3 tools/reference-benchmark/event_intervals.py evaluate \
  --annotations "$DEMO/annotations.json" \
  --reference-media "$DEMO/reference.synthetic-bytes" \
  --candidate-media "$DEMO/candidate.synthetic-bytes" \
  --reference-profile "$DEMO/reference.profile.json" \
  --candidate-profile "$DEMO/candidate.profile.json" \
  --evidence-root "$DEMO" --out "$DEMO/result.json"
```

## 合同与读法

根字段固定`schema_version/dataset_kind/inputs/time_basis/evidence/observations/events`，未知字段/重复JSON键拒绝。schema=`motionstudio.event-intervals/1.0`。双方media/profile SHA-256独立绑定，每份证据也实际读/hash；hash不证明注释真实或profile测量正确。

- 事件ID、证据ID、观察ID唯一；slot为`reference_visual/reference_audio/candidate_visual/candidate_audio`，每slot 0–4个观察。必须明确声明`mapping:explicit`，不猜事件身份。多候选为`AMBIGUOUS`，不选最近峰或求平均；空/unknown不变0。
- 层=`manual/measured/planned/unknown`。单个事件只能同层：manual与measured不混算，planned/unknown永远不填观测差值。manual记录也只是操作者声明，并非工具认证听看。
- state=`candidate/unknown/not_observed/intentional_silence`；只有candidate有区间。unknown无结论；not_observed需检查记录；intentional_silence仅manual/planned音频意图。`analysis_support`为测量候选支持窗，不保证真实事件位于其中。
- 区间端点用十进制字符串秒，最多7位整数、9位小数，拒绝负零/NaN/指数。Decimal只避免新增算术舍入，**不提升源profile已舍入时间的精度**。输入区间超域拒绝，不悄悄裁剪STFT窗。
- 固定`time_basis=RELATIVE_TO_EACH_FIRST_VIDEO_PTS_NO_ALIGNMENT`。首视频PTS分别保留；音频域从profile的`audio.origin_s`起算，允许负值。不按fps猜帧，不自动平移/拉伸/DTW。时间验证仅`BOUND_PROFILE_NOT_REDECODED`。
- 声音减视觉为内部lag，候选减参考为跨片shift；lag_error为两内部lag之差。区间差`[a0-b1,a1-b0]`是保守算术包络，**不是统计置信区间**；含0不是相等/同步通过，不含0也不是艺术失败。

先读`review_actions`和`review_windows`：缺哪个slot、在哪些原始证据窗解歧义、哪些已声明差异需复查。`context_s`仅固定±0.25s邻域（裁到可用媒体域），不改变exact区间。随后看五个measurements及各自缺失原因。缺声音仍可计算明确的视觉shift；双方一起迟到不会被内部lag为0掩盖。

## 安全和限额

所有媒体/profile来自显式CLI参数；证据仅相对evidence-root路径，拒绝`..`、绝对路径、符号链接（含中间路径）、非普通文件。禁止网络URL。annotation≤1MiB，profile/单证据≤64MiB，单媒体≤2GiB，累计读入文件≤8GiB；流式hash每块1MiB。事件≤100、观察≤800、证据≤200、JSON深度≤20、文本≤1000字、每片视频/音频跨度≤3600s；超限拒绝而非截断。输入读前/读后stat变化检测不等于恶意并发文件系统安全沙箱。

v1无HTML、音视频读取、通用同步性判别、感知容差、自动合格判断或旧report集成。合成测试只验证合同/算术/边界，不能算任何影片视听验收。
