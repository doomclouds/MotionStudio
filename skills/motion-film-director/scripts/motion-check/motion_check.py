#!/usr/bin/env python3
"""本地只读动效技术检查：无审美评分，无网络调用；不能替代完整视频验收。"""
from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import math
import platform
import re
import shutil
import subprocess
import sys
import threading
from datetime import datetime, timezone
from pathlib import Path

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont, __version__ as pillow_version
except ImportError as error:
    print(f"缺少现有依赖：{error}。需要NumPy与Pillow；本工具不会安装软件。", file=sys.stderr)
    raise SystemExit(2)

VERSION = "0.1.0-candidate"
LIMITATIONS = [
    "本工具仅辅助技术检查，不替代完整视频质量验收；不做审美评分、显著性/视线分析、光流、AI打分或音画同步认证。",
    "本图用于寻找需复看的时间窗，不能证明逐帧无故障。默认4Hz低清采样会漏短震动、单帧卡顿、短闪光及细小运动，也可能与周期运动发生混叠。",
    "低变化或零变化可以是有意静止，不自动判错或亮红灯；整体低运动也不等于没有内容。切镜、纹理、噪声、闪光、曝光/颜色变化和相机运动都可能造成高能量。",
    "采样时间是相对选定视频流首个解码时间戳的均匀网格，不保证对应原始帧时间或帧号；FFmpeg fps会选择、复制或丢弃源帧。逐帧计数另由ffprobe原始解码帧统计，不从标称帧率推算。",
    "帧差由普通8位RGB转换计算，非线性光/色彩管理/HDR感知分析；结果受采样率、缩放、压缩和转换影响，不同设置不能当评分横比。空间图是像素变化均值；时空图沿横向取均值，会丢失水平位置。",
    "响度/真峰是整音轨EBU R128技术测量，不代表实际听审、清晰度、版权、音乐审美、声画落点或感知同步；本工具不预设响度合格目标。",
    "容器/流时长与声明帧数可能缺失或不准，故与逐帧实测分列；观测尾时间需要末帧时长。音视频起始时间差仅是元数据线索，不能证明同步。",
    "只对首个非封面视频流作图；全量decode请求所有视频/音频流，各音轨分别测响度。字幕、数据流、内容事实、可读性、无障碍及常速播放需另行检查。",
]



class CheckError(Exception):
    pass


def num(value):
    try:
        result = float(value)
        return result if math.isfinite(result) else None
    except (ValueError, TypeError):
        return None


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False, allow_nan=False) + "\n", encoding="utf-8")


def sha256(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def run(cmd, timeout):
    try:
        return subprocess.run(cmd, capture_output=True, timeout=timeout, check=False)
    except subprocess.TimeoutExpired as e:
        raise CheckError(f"命令运行超过{timeout}秒： {Path(cmd[0]).name}") from e
    except OSError as e:
        raise CheckError(f"无法运行{cmd[0]}： {e}") from e


def cleaned(data, source):
    return data.decode("utf-8", errors="replace").replace(str(source), source.name)


def command_version(executable):
    result = run([executable, "-version"], 15)
    return result.stdout.decode(errors="replace").splitlines()[0] if result.stdout else "unavailable"


def local_input_options():
    # No HTTP, network protocols, or external crypto key protocols even if a local
    # playlist/demuxer references them. No shell is ever used for media commands.
    return ["-protocol_whitelist", "file,pipe"]


def frame_census(ffprobe, source, video_index, out, timeout):
    """Count decoded original video frames and retain exact available timestamps."""
    cmd = [ffprobe, "-v", "error", *local_input_options(), "-select_streams", str(video_index),
           "-show_frames", "-show_entries", "frame=media_type,best_effort_timestamp_time,duration_time,pkt_duration_time",
           "-of", "compact=p=0:nk=0", str(source)]
    count = 0
    first = last = minimum = maximum = last_duration = None
    regressions = missing_pts = 0
    timed_out = threading.Event()
    log_path = out / "frame-census-errors.txt"
    with log_path.open("wb") as log:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=log)
        def kill():
            timed_out.set()
            proc.kill()
        timer = threading.Timer(timeout, kill)
        timer.start()
        try:
            for raw in proc.stdout:
                line = raw.decode(errors="replace").strip()
                # Empty lines and side-data-only lines are not decoded frames.
                fields = dict(part.split("=", 1) for part in line.split("|") if "=" in part)
                if fields.get("media_type") != "video":
                    continue
                count += 1
                pts = num(fields.get("best_effort_timestamp_time"))
                dur = num(fields.get("duration_time", fields.get("pkt_duration_time")))
                if pts is None:
                    missing_pts += 1
                    continue
                if first is None:
                    first = pts
                if last is not None and pts < last:
                    regressions += 1
                last, last_duration = pts, dur
                minimum = pts if minimum is None else min(minimum, pts)
                maximum = pts if maximum is None else max(maximum, pts)
            code = proc.wait()
        finally:
            timer.cancel()
            if proc.poll() is None:
                proc.kill()
                proc.wait()
            proc.stdout.close()
    error = cleaned(log_path.read_bytes(), source)
    log_path.write_text(error, encoding="utf-8")
    if timed_out.is_set():
        raise CheckError(f"逐帧统计超过{timeout}秒")
    end = last + last_duration if last is not None and last_duration is not None else None
    return {"returncode": code, "decoded_video_frames": count, "first_pts_s": first,
            "last_pts_s": last, "minimum_pts_s": minimum, "maximum_pts_s": maximum,
            "last_frame_duration_s": last_duration, "observed_last_frame_end_s": end,
            "observed_span_including_last_frame_s": end - first if end is not None and first is not None else None,
            "missing_timestamp_frames": missing_pts, "timestamp_regressions": regressions,
            "errors_present": bool(error.strip()), "log": log_path.name}


def sample_size(stream, bound):
    ratio = 1.0
    sar = stream.get("sample_aspect_ratio", "1:1")
    try:
        a, b = map(float, sar.split(":"))
        ratio = a / b if a > 0 and b > 0 else 1.0
    except (ValueError, ZeroDivisionError):
        pass
    aspect = stream["width"] * ratio / stream["height"]
    rotation = next((num(d.get("rotation")) for d in stream.get("side_data_list", []) if "rotation" in d), 0) or 0
    if abs(rotation) % 180 == 90:
        aspect = 1 / aspect
    return (bound, max(1, round(bound / aspect))) if aspect >= 1 else (max(1, round(bound * aspect)), bound)


def palette(values):
    """Fixed absolute RGB-change scale 0..1; no image-dependent normalization."""
    stops = np.array([[10, 17, 30], [27, 77, 122], [19, 160, 149], [245, 203, 78], [247, 72, 54]], dtype=float)
    positions = np.array([0, .02, .05, .15, 1.0])
    values = np.clip(values, 0, 1)
    return np.stack([np.interp(values, positions, stops[:, c]) for c in range(3)], axis=-1).astype(np.uint8)


def heat_legend(draw, x, y):
    for fraction in [0, .02, .05, .15, 1]:
        color = tuple(palette(np.array(fraction)))
        draw.rectangle((x, y, x + 22, y + 12), fill=color)
        draw.text((x + 28, y), f"{fraction * 100:g}%", fill="#d6dfed")
        x += 95


def make_charts(out, rows, vertical, spatial_sum, sample_count, size, sample_fps, font_path=None):
    zh = bool(font_path)
    label = lambda chinese, english: chinese if zh else english
    font = ImageFont.truetype(str(font_path), 14) if zh else ImageFont.load_default()
    width, height = 1120, 650
    canvas = Image.new("RGB", (width, height), "#0c1422")
    d = ImageDraw.Draw(canvas)
    d.font = font
    d.text((28, 16), label("低清采样帧差：变化曲线与热图｜不是显著性，不是审美评分", "LOW-RES SAMPLED RGB FRAME CHANGE | NOT SALIENCY / NOT A QUALITY SCORE"), fill="#f5f7fb")
    d.text((28, 36), label(f"采样 {sample_fps:g}Hz；{size[0]}×{size[1]}像素；帧差 = mean(abs(RGB[t] - RGB[t-1])) / 255", f"{sample_fps:g} samples/s; {size[0]} x {size[1]}; mean(abs(RGB[t] - RGB[t-1])) / 255"), fill="#aab8ce")
    left, right, top, bottom = 74, 1088, 86, 302
    duration = max(rows[-1]["sample_time_s"] if rows else 0, 1 / sample_fps)
    max_energy = max((r["mean_abs_rgb_difference"] for r in rows), default=0)
    y_max = max(.01, math.ceil(max_energy * 100) / 100)
    d.text((left, 63), label(f"平均帧差能量（纵轴自动缩放至0–{y_max*100:g}%；不是分数）", f"Mean frame-change energy (vertical axis auto-scaled 0-{y_max*100:g}%; not a rating)"), fill="#d6dfed")
    for i in range(5):
        y = bottom - (bottom - top) * i / 4
        d.line((left, y, right, y), fill="#29364a")
        d.text((14, y - 5), f"{y_max*100*i/4:.2g}%", fill="#aab8ce")
    points = [(left + r["sample_time_s"] / duration * (right-left), bottom - r["mean_abs_rgb_difference"] / y_max * (bottom-top)) for r in rows if r["pair_valid"]]
    if len(points) > 1:
        d.line(points, fill="#68e2d3", width=2)
    elif points:
        x, y = points[0]
        d.ellipse((x-2, y-2, x+2, y+2), fill="#68e2d3")
    for i in range(6):
        x = left + (right-left) * i / 5
        d.text((x-10, bottom+9), f"{duration*i/5:.1f}s", fill="#aab8ce")
    d.text((left, 347), label("时空变化热图：横轴为时间；纵轴为画面从上到下的位置；每行沿画面宽度取平均", "Time-space change heatmap: X = same time axis; Y = image top-to-bottom; each row averages across width"), fill="#d6dfed")
    if vertical:
        heat = np.stack(vertical, axis=1)
        im = Image.fromarray(palette(heat)).resize((right-left, 158), Image.Resampling.NEAREST)
        canvas.paste(im, (left, 375))
    d.text((18, 375), label("顶", "top"), fill="#aab8ce")
    d.text((5, 519), label("底", "bottom"), fill="#aab8ce")
    d.text((left, 548), label("颜色固定表示绝对归一化RGB帧差（不按每张图单独增强）：", "Heat colors are fixed absolute normalized RGB difference (not a per-image intensity boost):"), fill="#aab8ce")
    heat_legend(d, left, 571)
    d.text((28, 610), label("本图找复看时间窗，不能证明逐帧无故障。4Hz会漏短震动/卡顿；静止不判错，切镜/闪光可能高能。", "Find review windows, NOT proof of frame-by-frame health. Brief faults can be missed. Stillness is not an error."), fill="#edc98b")
    canvas.save(out / "motion-and-change-heatmap.png")
    mean_map = spatial_sum / max(sample_count - 1, 1)
    w, h = size
    zoom = min(640 / w, 400 / h)
    map_im = Image.fromarray(palette(mean_map)).resize((round(w * zoom), round(h * zoom)), Image.Resampling.NEAREST)
    spatial = Image.new("RGB", (max(760, map_im.width + 48), map_im.height + 150), "#0c1422")
    sd = ImageDraw.Draw(spatial)
    sd.font = font
    sd.text((24, 16), label("空间平均变化｜所有相邻采样帧差的时间均值", "SPATIAL MEAN CHANGE | average of consecutive sampled frame differences"), fill="#f5f7fb")
    sd.text((24, 35), label("仅表示像素颜色在哪里变化，不表示人看哪里，也不是物体/注意力/运动向量图。", "Where pixel colors changed, not where people looked; not an object/attention/motion-vector map."), fill="#aab8ce")
    spatial.paste(map_im, (24, 62))
    heat_legend(sd, 24, map_im.height + 80)
    sd.text((24, map_im.height + 108), label("固定绝对色标与时空图相同，不按影片单独归一化。", "Fixed absolute color scale matches time-space map. No clip-specific normalization."), fill="#aab8ce")
    spatial.save(out / "spatial-mean-change.png")


def samples(ffmpeg, source, video, census, out, args):
    w, h = sample_size(video, args.sample_size)
    fps = args.sample_fps
    duration = census.get("observed_span_including_last_frame_s") or num(video.get("duration")) or 0
    thumb_step = max(args.thumbnail_every, duration / max(args.max_thumbnails - 1, 1))
    vf = f"setpts=PTS-STARTPTS,fps=fps={fps}:round=near:eof_action=pass,scale={w}:{h}:flags=area,setsar=1"
    cmd = [ffmpeg, "-nostdin", "-hide_banner", "-v", "error", *local_input_options(), "-i", str(source),
           "-map", f"0:{video['index']}", "-an", "-sn", "-dn", "-vf", vf,
           "-frames:v", str(args.max_samples + 1), "-fps_mode", "passthrough", "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"]
    rows, vertical = [], []
    previous = last_thumb = None
    spatial = np.zeros((h, w), dtype=np.float64)
    next_thumb, count = 0.0, 0
    thumb_batch, sheets = [], []
    timed_out = threading.Event()

    def save_sheet():
        if not thumb_batch:
            return
        cols = 4
        tile_w, tile_h = max(w, 160), h + 28
        sheet = Image.new("RGB", (cols * tile_w, math.ceil(len(thumb_batch)/cols) * tile_h), "#172131")
        draw = ImageDraw.Draw(sheet)
        if args.font:
            draw.font = ImageFont.truetype(str(args.font), 12)
        for j, (t, frame) in enumerate(thumb_batch):
            x, y = j % cols * tile_w, j // cols * tile_h
            sheet.paste(frame, (x + (tile_w-w)//2, y))
            draw.text((x+5, y+h+6), (f"采样 {t:.3f}秒" if args.font else f"sample {t:.3f}s"), fill="#f4f5f8")
        name = f"contact-{len(sheets)+1:03d}.jpg"
        sheet.save(out / name, quality=86)
        sheets.append({"file": name, "sample_times_s": [t for t, _ in thumb_batch]})
        thumb_batch.clear()

    log_path = out / "sampling-errors.txt"
    with log_path.open("wb") as log:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=log)
        def kill():
            timed_out.set()
            proc.kill()
        timer = threading.Timer(args.timeout, kill)
        timer.start()
        try:
            while True:
                # Buffered pipe reads may be short. Fill exactly one raw RGB frame.
                parts, remaining = [], w * h * 3
                while remaining:
                    part = proc.stdout.read(remaining)
                    if not part:
                        break
                    parts.append(part)
                    remaining -= len(part)
                raw = b"".join(parts)
                if not raw:
                    break
                if remaining:
                    raise CheckError("采样返回了不完整的原始RGB帧")
                if count >= args.max_samples:
                    raise CheckError(f"采样超过--max-samples={args.max_samples}；请增大上限或降低--sample-fps。本次不声称完成全片检查。")
                frame = np.frombuffer(raw, dtype=np.uint8).reshape(h, w, 3)
                t = count / fps
                if previous is None:
                    energy = changed = percentile = 0.0
                    vertical.append(np.zeros(h, dtype=np.float32))
                else:
                    diff = np.abs(frame.astype(np.int16)-previous.astype(np.int16)).mean(axis=2) / 255.0
                    energy, changed, percentile = float(diff.mean()), float((diff > args.pixel_threshold/255.0).mean()), float(np.percentile(diff, 95))
                    spatial += diff
                    vertical.append(diff.mean(axis=1).astype(np.float32))
                rows.append({"sample_time_s": round(t, 9), "pair_valid": previous is not None,
                             "mean_abs_rgb_difference": energy, "changed_pixel_fraction": changed,
                             "p95_pixel_rgb_difference": percentile})
                previous = frame.copy()
                if t + 1e-9 >= next_thumb:
                    thumb_batch.append((t, Image.fromarray(frame)))
                    last_thumb = t
                    next_thumb += thumb_step
                    if len(thumb_batch) == 24:
                        save_sheet()
                count += 1
            code = proc.wait()
        finally:
            timer.cancel()
            if proc.poll() is None:
                proc.kill()
                proc.wait()
            proc.stdout.close()
    log_path.write_text(cleaned(log_path.read_bytes(), source), encoding="utf-8")
    if timed_out.is_set():
        raise CheckError(f"采样超过{args.timeout}秒")
    if code or count == 0:
        raise CheckError(f"采样失败：退出码{code}，得到{count}帧；见{log_path.name}")
    last_t = (count - 1) / fps
    if last_thumb != last_t:
        thumb_batch.append((last_t, Image.fromarray(previous)))
    save_sheet()
    with (out / "motion-energy.csv").open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    make_charts(out, rows, vertical, spatial, count, (w, h), fps, args.font)
    energies = [r["mean_abs_rgb_difference"] for r in rows[1:]]
    # Descriptive counts only: never emit warnings/errors based on these thresholds.
    result = {"sample_count": count, "comparison_count": max(0, count-1), "size_px": [w, h],
              "sample_fps": fps, "last_grid_time_s": last_t, "thumbnail_interval_s": thumb_step,
              "mean_energy": float(np.mean(energies)) if energies else None,
              "max_energy": max(energies) if energies else None,
              "low_change_comparisons": sum(e <= args.low_change for e in energies),
              "high_change_comparisons": sum(e >= args.high_change for e in energies),
              "low_change_threshold": args.low_change, "high_change_threshold": args.high_change,
              "changed_pixel_threshold_8bit": args.pixel_threshold,
              "first_sample_note": "首个样本没有前帧可比较；第0行仅供绘图占位，不进入统计。",
              "threshold_policy": "阈值仅作描述，不因静止/高能画面给质量分或报错。",
              "sampling_errors_present": bool(log_path.read_text().strip()), "contact_sheets": sheets}
    return result


def audio_measure(ffmpeg, source, stream, out, timeout):
    idx = stream["index"]
    cmd = [ffmpeg, "-nostdin", "-hide_banner", "-v", "info", *local_input_options(), "-i", str(source),
           "-map", f"0:{idx}", "-vn", "-sn", "-dn", "-af", "ebur128=peak=true:framelog=verbose", "-f", "null", "-"]
    r = run(cmd, timeout)
    log = cleaned(r.stderr, source)
    name = f"audio-{idx}-ebur128.txt"
    summary = log.rsplit("Summary:", 1)[-1] if "Summary:" in log else ""
    def match(pattern):
        m = re.search(pattern, summary)
        if not m:
            return None
        return num(m[1]) if num(m[1]) is not None else m[1]
    values = {"integrated_loudness_lufs": match(r"\bI:\s+([-+\d.inf]+)\s+LUFS"),
              "loudness_range_lu": match(r"\bLRA:\s+([-+\d.inf]+)\s+LU"),
              "true_peak_dbtp": match(r"True peak:\s*\n\s*Peak:\s+([-+\d.inf]+)\s+dBFS")}
    (out / name).write_text("FFmpeg ebur128=peak=true 整轨测量；未保存容器自由文本元数据或原音。\n" + json.dumps({"returncode": r.returncode, **values}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return {"stream_index": idx, "returncode": r.returncode, "measured": r.returncode == 0 and all(v is not None for v in values.values()),
            **values, "method": "FFmpeg ebur128=peak=true测完整选定音轨；不做归一化，不写出原音文件。", "log": name}


def html_index(out, report):
    esc = html.escape
    source = report["source"]["basename"]
    limitations = "".join(f"<li>{esc(item)}</li>" for item in LIMITATIONS)
    charts = "".join(f'<figure><img src="{name}" alt="{esc(label)}"><figcaption>{esc(label)}</figcaption></figure>' for name, label in [
        ("motion-and-change-heatmap.png", "采样帧差曲线与时空图；不是显著性或质量评分。"),
        ("spatial-mean-change.png", "空间RGB变化均值；使用固定绝对色标。")] if (out/name).is_file())
    sheets = "".join(f'<figure><img loading="lazy" src="{s["file"]}" alt="时间顺序低清采样帧"><figcaption>{s["file"]}: {s["sample_times_s"][0]:.3f}–{s["sample_times_s"][-1]:.3f}s （采样网格时间）</figcaption></figure>' for s in report.get("sampling", {}).get("contact_sheets", []))
    files = "".join(f'<li><a href="{esc(p.name, quote=True)}">{esc(p.name)}</a></li>' for p in sorted(out.iterdir()) if p.is_file() and p.name != "index.html")
    summary = esc(json.dumps({k: v for k,v in report.items() if k not in ["limitations", "versions"]}, indent=2, ensure_ascii=False))
    census = report.get("frame_census", {})
    decode = report.get("full_decode", {})
    audio_rows = "".join(f"<li>音轨{m['stream_index']}：综合响度 {m.get('integrated_loudness_lufs')} LUFS；真峰 {m.get('true_peak_dbtp')} dBTP；响度范围 {m.get('loudness_range_lu')} LU；{'已测量，未听审' if m.get('measured') else '未能完成测量'}</li>" for m in report.get("audio_measurements", []))
    quick = f"<p>原始解码帧数：{census.get('decoded_video_frames', '未完成')}；首PTS：{census.get('first_pts_s', '未知')}秒；含末帧观测跨度：{census.get('observed_span_including_last_frame_s', '未知')}秒。</p><p>全量视频/音频decode：{'未报告错误' if decode.get('ok') else '未完成或有错误'}。数值均不是内容/审美质量分。</p><ul>{audio_rows}</ul>"
    document = f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>动效技术检查 — {esc(source)}</title>
<style>body{{max-width:1140px;margin:32px auto;padding:0 20px;background:#0c1422;color:#dae3f0;font:15px/1.6 system-ui,sans-serif}}h1,h2{{color:#f9fbff;line-height:1.2}}a{{color:#7ae4d2}}img{{max-width:100%;height:auto}}figure{{margin:25px 0}}figcaption{{color:#aab8ce}}pre{{white-space:pre-wrap;overflow-wrap:anywhere;background:#182438;padding:16px;border-radius:8px}}.notice{{border-left:4px solid #edc98b;padding:10px 18px;background:#202b3c}}li{{margin:.5em 0}}</style>
<h1>动效技术检查</h1><p>{esc(source)} • {esc(report['created_utc'])}</p>
<div class="notice"><strong>{esc(report['status'])}</strong><br>本图用于找复看时间窗，不能证明逐帧无故障。默认4Hz会漏短震动/卡顿。无AI或审美评分，未做播放/听审或音画同步认证；静止不判错。</div>
<h2>技术结果速览</h2>{quick}<h2>方法与局限</h2><ul>{limitations}</ul><h2>变化诊断</h2>{charts}<h2>时间顺序缩略图</h2>{sheets}
<h2>测量结果与设置（JSON键名保留英文供程序读取）</h2><pre>{summary}</pre><h2>检查文件</h2><ul>{files}</ul>
<p>纯静态离线索引：无JavaScript、外链资源、网络字体、网络调用、localhost服务器，也不内嵌原视频/原音。</p></html>'''
    (out / "index.html").write_text(document, encoding="utf-8")


def inspect(args, source, out):
    versions = {"tool": VERSION, "tool_sha256": sha256(Path(__file__)), "python": platform.python_version(), "numpy": np.__version__, "Pillow": pillow_version,
                "platform": platform.platform(), "ffmpeg": command_version(args.ffmpeg), "ffprobe": command_version(args.ffprobe)}
    report = {"status": "未完成", "created_utc": datetime.now(timezone.utc).isoformat(),
              "source": {"basename": source.name, "size_bytes": source.stat().st_size, "sha256": sha256(source)},
              "versions": versions, "limitations": LIMITATIONS, "findings": [],
              "settings": {"timeout_per_process_s": args.timeout, "max_samples": args.max_samples,
                           "sample_size_max_dimension": args.sample_size, "requested_sample_fps": args.sample_fps,
                           "pixel_threshold_8bit": args.pixel_threshold, "low_change_threshold": args.low_change,
                           "high_change_threshold": args.high_change, "requested_thumbnail_interval_s": args.thumbnail_every,
                           "max_thumbnails_target": args.max_thumbnails},
              "图中文字": "中文；使用调用者指定的本地字体，不复制字体文件" if args.font else "英文回退：未指定本地中文字体；HTML/报告说明仍为中文",
              "font_basename": Path(args.font).name if args.font else None}
    write_json(out / "versions.json", versions)
    try:
        entries = ("format=format_name,start_time,duration,size:stream=index,codec_type,codec_name,width,height,pix_fmt,"
                   "sample_aspect_ratio,display_aspect_ratio,r_frame_rate,avg_frame_rate,time_base,start_pts,start_time,"
                   "duration_ts,duration,nb_frames,sample_rate,channels,channel_layout:stream_disposition=attached_pic:stream_side_data=rotation")
        p = run([args.ffprobe, "-v", "error", *local_input_options(), "-show_entries", entries, "-of", "json", str(source)], args.timeout)
        (out / "ffprobe-errors.txt").write_text(cleaned(p.stderr, source), encoding="utf-8")
        if p.returncode:
            raise CheckError(f"ffprobe失败（退出码{p.returncode}）；见ffprobe-errors.txt")
        probe = json.loads(p.stdout)
        write_json(out / "ffprobe.json", probe)
        videos = [s for s in probe.get("streams", []) if s.get("codec_type") == "video" and not s.get("disposition", {}).get("attached_pic")]
        audio = [s for s in probe.get("streams", []) if s.get("codec_type") == "audio"]
        if not videos:
            raise CheckError("没有非封面视频流；本工具需要视频输入")
        video = videos[0]
        report["media"] = {"format": probe.get("format", {}), "selected_video_stream_index": video["index"],
                           "video_streams": videos, "audio_streams": audio, "has_audio": bool(audio),
                           "duration_policy": "容器/流时长按实际文件元数据列出，不从帧率推算；原始解码帧数与观测时段另行实测。",
                           "audio_minus_video_start_s": [{"audio_stream_index": a["index"], "offset_s": num(a.get("start_time"))-num(video.get("start_time")) if num(a.get("start_time")) is not None and num(video.get("start_time")) is not None else None} for a in audio]}
        print("正在逐帧统计原始解码帧数与时间戳……", file=sys.stderr)
        census = frame_census(args.ffprobe, source, video["index"], out, args.timeout)
        report["frame_census"] = census
        if census["returncode"] or census["errors_present"] or not census["decoded_video_frames"]:
            report["findings"].append("逐帧统计遇到错误或未得到帧；总数可能不完整。")
        if census["timestamp_regressions"]:
            report["findings"].append("选定视频流的解码时间戳发生回退，请检查逐帧统计。")
        print("正在完整decode全部视频/音频流……", file=sys.stderr)
        decoded = run([args.ffmpeg, "-nostdin", "-hide_banner", "-v", "error", *local_input_options(), "-i", str(source),
                       "-map", "0:v?", "-map", "0:a?", "-sn", "-dn", "-max_error_rate", "0", "-f", "null", "-"], args.timeout)
        decode_log = cleaned(decoded.stderr, source)
        (out / "decode-errors.txt").write_text(decode_log, encoding="utf-8")
        report["full_decode"] = {"returncode": decoded.returncode, "ok": decoded.returncode == 0 and not decode_log.strip(),
                                 "log": "decode-errors.txt", "scope": "全部视频/音频流；不含字幕/数据。不使用-xerror提前退出，收集完整过程错误。"}
        if not report["full_decode"]["ok"]:
            report["findings"].append("全量decode报告错误，详见decode-errors.txt。")
        print("正在低清采样并生成曲线、热图和缩略图……", file=sys.stderr)
        report["sampling"] = samples(args.ffmpeg, source, video, census, out, args)
        if report["sampling"]["sampling_errors_present"]:
            report["findings"].append("采样过程报告错误，详见sampling-errors.txt。")
        report["audio_measurements"] = []
        for stream in audio:
            print(f"正在测量第{stream['index']}号整音轨的响度/真峰……", file=sys.stderr)
            measurement = audio_measure(args.ffmpeg, source, stream, out, args.timeout)
            report["audio_measurements"].append(measurement)
            if not measurement["measured"]:
                report["findings"].append(f"第{stream['index']}号音轨未能得到响度/真峰测量；见对应摘要，可能缺少滤镜支持或发生解码错误。")
        report["audio_status"] = ("已测量，未听审" if all(m["measured"] for m in report["audio_measurements"]) else "部分音轨未完成测量，未听审") if audio else "无音轨；这不是错误"
        report["status"] = "技术检查已完成；仍须人工复看/听审" if not report["findings"] else "有技术问题或检查不完整；须人工复核"
        code = 0 if not report["findings"] else 1
    except (CheckError, OSError, ValueError, KeyError) as e:
        report["findings"].append(str(e))
        report["status"] = "技术检查未完成或失败"
        code = 1
    write_json(out / "report.json", report)
    html_index(out, report)
    print(json.dumps({"status": report["status"], "output": str(out), "findings": report["findings"]}, ensure_ascii=False))
    return code


def parser():
    p = argparse.ArgumentParser(description=__doc__, epilog="无AI评分；静止或高能画面不自动判错。输出需新建/空目录。退出0=技术步骤无报错，1=技术问题/未完成，2=输入/配置错误。")
    p.add_argument("video", help="已有本地视频文件，不接受URL")
    p.add_argument("--out", required=True, help="新建或空的独立报告目录")
    p.add_argument("--sample-fps", type=float, default=4.0, help="采样率，默认4Hz（0.1..30）；会漏短故障")
    p.add_argument("--sample-size", type=int, default=192, help="低清图最大边，默认192（32..640）")
    p.add_argument("--thumbnail-every", type=float, default=2.0, help="请求的缩略图间隔（秒）；长片会自动增大")
    p.add_argument("--max-thumbnails", type=int, default=240, help="缩略图近似上限，可能另加最后样本")
    p.add_argument("--max-samples", type=int, default=100000, help="采样资源上限，超限明确失败、不静默截断")
    p.add_argument("--pixel-threshold", type=float, default=8.0, help="变化像素比例的RGB均差阈值（0..255）")
    p.add_argument("--low-change", type=float, default=.003, help="低变化计数边界；不是质量规则")
    p.add_argument("--high-change", type=float, default=.10, help="高变化计数边界；不是质量规则")
    p.add_argument("--timeout", type=float, default=1800.0, help="每个媒体子进程的超时秒数")
    p.add_argument("--font", help="可选本地中文TTF/OTF/TTC字体；仅读取，不随报告复制。省略时图中文字回退英文")
    p.add_argument("--ffmpeg", default="ffmpeg")
    p.add_argument("--ffprobe", default="ffprobe")
    p.add_argument("--version", action="version", version=VERSION)
    return p


def main(argv=None):
    p = parser()
    args = p.parse_args(argv)
    source = Path(args.video).expanduser().resolve()
    out = Path(args.out).expanduser().resolve()
    if not source.is_file() or source.stat().st_size == 0:
        p.error("输入必须是已有的非空本地文件")
    if not 0.1 <= args.sample_fps <= 30 or not 32 <= args.sample_size <= 640:
        p.error("sample-fps须在0.1..30，sample-size须在32..640")
    if not math.isfinite(args.thumbnail_every) or args.thumbnail_every <= 0 or not math.isfinite(args.timeout) or args.timeout <= 0:
        p.error("thumbnail-every和timeout须为有限正数")
    if not 2 <= args.max_thumbnails <= 2000 or not 2 <= args.max_samples <= 1000000:
        p.error("max-thumbnails须在2..2000，max-samples须在2..1000000")
    if not 0 <= args.low_change < args.high_change <= 1 or not 0 <= args.pixel_threshold <= 255:
        p.error("须满足0 <= low-change < high-change <= 1，pixel-threshold在0..255")
    if args.font:
        try:
            args.font = Path(args.font).expanduser().resolve()
            ImageFont.truetype(str(args.font), 14)
        except (OSError, ValueError):
            p.error("--font必须是可读取的本地TTF/OTF/TTC字体")
    if not shutil.which(args.ffmpeg) or not shutil.which(args.ffprobe):
        p.error("需要已有ffmpeg/ffprobe可执行文件；本工具不会安装软件")
    if out.exists() and (not out.is_dir() or any(out.iterdir())):
        p.error("输出必须是新目录或空目录；不覆盖现有报告")
    try:
        out.mkdir(parents=True, exist_ok=True)
        return inspect(args, source, out)
    except (CheckError, OSError) as e:
        print(f"初始化/写入失败： {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
