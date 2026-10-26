# Bailian native audio review (opt-in)

Default provider: Alibaba Cloud Bailian, `qwen3.8-omni-flash`, Beijing.
This adapter supplies **audio bytes**, not a transcript or loudness graph. It is
source-only infrastructure, not evidence that any particular film has been heard.

## Three independent results

- `technical`: remains `unverified` here. Run the existing
  `skills/motion-film-director/scripts/motion-check/motion_check.py` on the final
  media for full decode, loudness and true-peak evidence. Numeric success cannot
  establish perceptual quality.
- `native_audio_review`: `unverified` until a complete native-audio response,
  usage record and schema-valid critique are received. Then `reviewed`, **not
  passed**. Each supplied clip has its own SHA-256, duration and result.
- `owner_preference`: always `unverified` in this adapter. Only the owner's
  approval establishes acceptance. Audio-only review cannot verify audiovisual
  sync, match to an absent reference, or stereo imaging (default model parsing
  is not a demonstrated multichannel evaluation).

Readiness separately records presence of the environment credential, whether
clip-upload consent was asserted, and whether this actual run verified a live
response. Merely choosing a default provider proves none of these.

## Safe default: local dry run

Prepare explicit PCM16 WAV excerpts locally, one or two channels, 8–48 kHz,
maximum 20 seconds each, maximum three distinct clips. These are adapter limits,
not claims about the provider's maximum capability. It does not silently split
or transcode a whole film, and never uploads adjacent unapproved content.

```sh
python3 scripts/audio_review.py --audio /path/to/approved-excerpt.wav
python3 -m unittest discover -s scripts -p test_audio_review.py -v
```

Dry run validates local WAV structure, hashes inputs and estimates a reservation.
It sends nothing, writes no report, requires no key, and never produces a pass.
For perceptual inspection keep original sample rate; avoid low-bitrate proxies
that could manufacture defects. Document the excerpt's source-file hash and
source in/out points in the external runtime review record: this tool's times
are **clip-relative**, not whole-film timestamps.

## Live invocation: only after specific authorization

Obtain approval covering these excerpts, upload to Bailian, critique purpose and
budget. Historic one-off pilot permission is not a standing spending grant.
Use the existing secure environment `DASHSCOPE_API_KEY`. Do not recover keys from
chat or paste them into commands, prompts, reports, source or Git. This tool
never creates/restores `.env` files or prints credential values.

Optional `DASHSCOPE_BASE_URL` accepts only verified official Beijing endpoints:
`https://cn-beijing.maas.qianwenaiapi.com/compatible-mode/v1` (default),
`https://dashscope.aliyuncs.com/compatible-mode/v1`, or the documented
`https://{WorkspaceId}.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`.
No WorkspaceId is needed for the default. The platform's standard environment
proxy route is preserved: previous deployment testing showed that bypassing it
could cause DNS failure. Proxy values and credentials are never logged. This
does not change the allowlisted HTTPS destination, default TLS verification or
redirect refusal. A failure does not trigger an alternative host or retry.

After rechecking the linked official pricing on the UTC execution date:

```sh
python3 scripts/audio_review.py --audio /path/to/approved-excerpt.wav \
  --live --consent-upload --budget-cny 0.10 \
  --pricing-confirmed-on YYYY-MM-DD --output output/audio-review/approved-run
```

This example is not upload authorization. No live calls are made by tests.

The pricing snapshot expires after seven UTC days; recheck and deliberately
update source then. Missing/stale acknowledgement, absent credential, unsupported
endpoint, invalid audio, insufficient reservation or existing run ledger blocks
submission. The pilot duration cap is intentionally 20 seconds per clip; no CLI flag can expand it.
Runtime outputs must live under a Git-ignored `output/` directory.
Do not delete/move a ledger or select a new directory to repeat an uncertain
call. Inspect provider billing and get renewed scope first.

## Cost and failure handling

Snapshot checked 2026-10-25: Beijing input ¥0.8/million tokens, output
¥2.7/million; input audio 7 tokens/second, subsecond audio charged as one second.
The reservation includes twice that audio estimate, UTF-8 prompt bytes plus
512 framing tokens and 2,058 output tokens. This is conservative budgeting,
**not a provider-enforced billing cap or a guarantee about tokenization**.
The request disables thinking with top-level `reasoning_effort="none"` for
Qwen3.8-Omni, not the older `enable_thinking` field; no `thinking_budget` is
sent. `max_tokens=2048` is unchanged. This request contract is offline-tested,
not live-verified. Cost uses total `completion_tokens` without adding nested
reasoning tokens again.
Total local budget is >0 and ≤¥0.10. Actual usage is priced without assuming
cache discounts, so the report is an estimate rather than an invoice.

A locked, fsync'ed JSONL ledger reserves the entire run before transmission.
Only one run is allowed per ledger. Interrupted/incomplete/invalid responses
remain uncertain and may have incurred charges; there is no automatic retry.
Usage beyond the reservation stops further clips. Provider errors, headers,
raw audio/Base64 and reasoning output are not saved. A successful response
contains structured time-bounded evidence, uncertainty and proposed fixes,
never an automatic aesthetic score or publication approval.

## Interpretation and negative controls

Inspect whether reported pulses/biu/sweeps actually exist at the approximate
clip times. Review both present and absent cues rather than accepting praise.
A separately approved normal/clipped/noisy negative-control set can test defect
recognition; it does **not** validate taste, mix quality or reference similarity.
Compare results to the exact encoded film and human judgment. Use visual
review alongside it; no claim of sound-picture sync is possible in this
initial audio-only adapter. Full-film approval cannot follow from three short
excerpts, even if all return valid model critiques.

## Primary sources checked

- [Official model and Beijing default endpoint](https://www.qianwenai.com/models/qwen3.8-omni-flash)
- [Qwen3.8 thinking controls](https://help.aliyun.cn/zh/model-studio/qwen-omni)
- [Native audio, Base64 and token conversion](https://help.aliyun.com/en/model-studio/qwen-omni)
- [Current Beijing pricing](https://help.aliyun.com/zh/model-studio/model-pricing)
- [Chat endpoint migration, thinking and max_tokens](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions)

The documented `max_tokens` limit excludes reasoning on other modes, so this
adapter explicitly disables thinking. This implementation has offline/mocked
coverage only until a separately authorized real run verifies deployment.
