#!/usr/bin/env python3
"""Local, evidence-labelled reference profiles. No network, quality gate, or listening claim."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from fractions import Fraction

import numpy as np
import scipy
from PIL import Image, ImageDraw, ImageFont
from PIL import __version__ as PIL_VERSION
from scipy import ndimage, signal

VERSION = "1.0.0"
SCHEMA = "motionstudio.reference-profile/1.0"
ROOT = Path(__file__).resolve().parent
CONFIG = {
    "sample_period_s": .25, "analysis_width": 192,
    "rgb_conversion": "FFmpeg RGB24; declared/unknown color metadata retained; no color-managed reference claim",
    "luma": "0.2126 R' + 0.7152 G' + 0.0722 B' (gamma-encoded, not linear luminance)",
    "edge": "Sobel magnitude / 8 > 0.08 on gamma luma [0,1]",
    "texture": "variance of 4-neighbour Laplacian on gamma luma [0,1]",
    "block_matching": {"block_px": 24, "search_radius_px": 8, "grid_step_px": 32,
                       "min_texture_std": .025, "max_rmse": .15, "min_nonlocal_margin": .003},
    "audio_decode_rate_hz": 48000, "audio_bin_s": .1,
    "spectral_analysis_rate_hz": 16000, "stft_n_fft": 1024, "stft_hop": 400,
    "mel_bands": 48, "mel_min_hz": 40, "mel_max_hz": 8000,
    "mel_display_db": [-100, 0], "onset_refractory_s": .15,
    "tempo_bpm_range": [40, 240], "offset_search_s": 5,
}


class BenchmarkError(Exception):
    pass


def run(args, **kwargs):
    result = subprocess.run([str(a) for a in args], stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, check=False, **kwargs)
    if result.returncode:
        raise BenchmarkError(f"{Path(str(args[0])).name} failed (exit {result.returncode}): " +
                             result.stderr.decode(errors="replace")[-1800:])
    return result


def sha256(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def rounded(v, n=6):
    if v is None or not math.isfinite(float(v)):
        return None
    return round(float(v), n)


def write_json(path, data):
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False), encoding="utf-8")


def algorithm():
    return {"name": "motionstudio-local-reference-benchmark", "version": VERSION,
            "source_sha256": sha256(__file__), "config": CONFIG,
            "report_source_sha256": sha256(ROOT/"report.py") if (ROOT/"report.py").exists() else None,
            "method_references_sha256": sha256(ROOT/"method-references.json") if (ROOT/"method-references.json").exists() else None,
            "python_version": sys.version.split()[0], "numpy_version": np.__version__,
            "scipy_version": scipy.__version__, "pillow_version": PIL_VERSION,
            "ffmpeg_version": run(["ffmpeg", "-version"]).stdout.decode().splitlines()[0]}


def probe(path):
    raw = json.loads(run(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", path]).stdout)
    video = next((s for s in raw["streams"] if s["codec_type"] == "video"), None)
    audio = next((s for s in raw["streams"] if s["codec_type"] == "audio"), None)
    if video is None:
        raise BenchmarkError("Input must have a video stream")
    if any(x.get("rotation", 0) for x in video.get("side_data_list", [])):
        raise BenchmarkError("Rotated source requires an explicitly documented display transform; this version refuses implicit rotation")
    frames = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_frames",
        "-show_entries", "frame=pts,pts_time,best_effort_timestamp,best_effort_timestamp_time,duration_time,pkt_duration_time",
        "-of", "json", path]).stdout)["frames"]
    if not frames:
        raise BenchmarkError("No decoded video frame timestamps")
    rows = []
    for i, frame in enumerate(frames):
        if "pts_time" not in frame:
            raise BenchmarkError("Missing native presentation timestamp; best-effort reconstruction is not silently accepted")
        pts = float(int(frame["pts"]) * Fraction(video["time_base"])) if "pts" in frame else float(frame["pts_time"])
        rows.append({"frame_index": i, "pts": frame.get("pts"), "pts_s": pts,
                     "duration_s": float(frame.get("duration_time", frame.get("pkt_duration_time", 0)))})
    pts = np.array([r["pts_s"] for r in rows])
    if not np.isfinite(pts).all() or np.any(np.diff(pts) <= 0):
        raise BenchmarkError("Missing, duplicate or nonmonotonic native video PTS")
    last_duration = rows[-1]["duration_s"]
    if last_duration <= 0:
        end = float(video.get("start_time", pts[0])) + float(video.get("duration", 0))
        last_duration = end - pts[-1]
    if last_duration <= 0:
        raise BenchmarkError("Unknown final frame duration")
    rows[-1]["duration_s"] = last_duration
    for i in range(len(rows) - 1):
        rows[i]["duration_s"] = pts[i + 1] - pts[i]
    return video, audio, rows, float(pts[-1] - pts[0] + last_duration)


def choose_frames(frames, requested_s):
    pts = np.array([r["pts_s"] for r in frames])
    origin = pts[0]
    end = pts[-1] + frames[-1]["duration_s"] - origin
    if any(t < 0 or t >= end for t in requested_s):
        raise BenchmarkError("Requested time outside displayed video intervals")
    indices = np.searchsorted(pts, np.array(requested_s) + origin + 1e-8, side="right") - 1
    return [{"t_s": rounded(t), "pts_s": rounded(pts[i]), "frame_index": int(i),
             "request_delta_s": rounded(pts[i] - origin - t)} for i, t in zip(indices, requested_s)]


def decode_selected(path, indices, width, height):
    unique = sorted(set(int(i) for i in indices))
    # AVExpr has a recursion limit: a long left-associated sum fails on full films.
    def balanced(terms):
        if len(terms) == 1:
            return terms[0]
        middle = len(terms) // 2
        return "(" + balanced(terms[:middle]) + "+" + balanced(terms[middle:]) + ")"
    select = balanced([f"eq(n\\,{i})" for i in unique])
    buf = run(["ffmpeg", "-v", "error", "-noautorotate", "-i", path, "-map", "0:v:0",
               "-vf", f"select={select},scale={width}:{height}:flags=area", "-fps_mode", "passthrough",
               "-pix_fmt", "rgb24", "-f", "rawvideo", "-"]).stdout
    expected = len(unique) * width * height * 3
    if len(buf) != expected:
        raise BenchmarkError(f"Frame extraction byte mismatch: {len(buf)} != {expected}")
    values = np.frombuffer(buf, np.uint8).reshape((-1, height, width, 3))
    by_index = dict(zip(unique, values))
    return np.stack([by_index[int(i)] for i in indices])


def block_motion(previous, current, dt, config=None):
    """Sparse template translation proxy, not dense flow or a camera estimator."""
    cfg = config or CONFIG["block_matching"]
    block, radius, step = cfg["block_px"], cfg["search_radius_px"], cfg["grid_step_px"]
    h, w = previous.shape
    vectors = []
    for y in range(radius, h - block - radius + 1, step):
        for x in range(radius, w - block - radius + 1, step):
            template = previous[y:y + block, x:x + block]
            area = current[y - radius:y + block + radius, x - radius:x + block + radius]
            std = float(template.std())
            sums = signal.correlate(area * area, np.ones((block, block)), mode="valid", method="fft")
            cross = signal.correlate(area, template, mode="valid", method="fft")
            error = np.maximum(0, (sums + np.sum(template * template) - 2 * cross) / (block * block))
            iy, ix = np.unravel_index(np.argmin(error), error.shape)
            best = float(np.sqrt(error[iy, ix]))
            rival = error.copy()
            rival[max(0, iy - 1):iy + 2, max(0, ix - 1):ix + 2] = np.inf
            margin = float(np.sqrt(np.min(rival)) - best)
            valid = std >= cfg["min_texture_std"] and best <= cfg["max_rmse"] and margin >= cfg["min_nonlocal_margin"]
            vectors.append({"x": x + block / 2, "y": y + block / 2,
                            "dx_px": float(ix - radius), "dy_px": float(iy - radius),
                            "rmse": rounded(best), "nonlocal_margin": rounded(margin),
                            "texture_std": rounded(std), "valid": bool(valid)})
    magnitudes = [math.hypot(v["dx_px"], v["dy_px"]) / dt for v in vectors if v["valid"]]
    return {"median_px_s": rounded(np.median(magnitudes)) if magnitudes else None,
            "p90_px_s": rounded(np.percentile(magnitudes, 90)) if magnitudes else None,
            "valid_fraction": rounded(len(magnitudes) / len(vectors)) if vectors else 0,
            "status": "ESTIMATED" if magnitudes else "UNINFORMATIVE", "vectors": vectors}


def frame_features(rgb, previous=None, dt=None):
    f = rgb.astype(np.float32) / 255
    gray = f @ np.array([.2126, .7152, .0722], np.float32)
    saturation = (f.max(axis=2) - f.min(axis=2)) / np.maximum(f.max(axis=2), 1e-9)
    edge = np.hypot(ndimage.sobel(gray, axis=0), ndimage.sobel(gray, axis=1)) / 8
    out = {"luma_mean": rounded(gray.mean()), "luma_std": rounded(gray.std()),
           "rgb_mean": [rounded(x) for x in f.mean(axis=(0, 1))],
           "saturation_mean": rounded(saturation.mean()), "edge_density": rounded(np.mean(edge > .08)),
           "laplacian_variance": rounded(ndimage.laplace(gray).var()),
           "frame_difference": None, "motion_median_px_s": None, "motion_p90_px_s": None,
           "motion_valid_fraction": 0}
    motion = None
    if previous is not None:
        prev = previous.astype(np.float32) / 255 @ np.array([.2126, .7152, .0722], np.float32)
        out["frame_difference"] = rounded(np.mean(np.abs(gray - prev)))
        if dt is not None and dt > 0:
            motion = block_motion(prev, gray, dt)
            out.update(motion_median_px_s=motion["median_px_s"], motion_p90_px_s=motion["p90_px_s"],
                       motion_valid_fraction=motion["valid_fraction"])
    return out, motion


def ssim_local(a, b):
    """Wang-style Gaussian SSIM on explicitly resized gamma luma, valid 11x11 area."""
    a, b = a.astype(np.float64), b.astype(np.float64)
    filt = lambda x: ndimage.gaussian_filter(x, 1.5, truncate=3.5, mode="reflect")
    ma, mb = filt(a), filt(b)
    va = np.maximum(0, filt(a*a) - ma*ma)
    vb = np.maximum(0, filt(b*b) - mb*mb)
    cov = filt(a*b) - ma*mb
    score = ((2*ma*mb + .01**2) * (2*cov + .03**2)) / ((ma*ma + mb*mb + .01**2)*(va + vb + .03**2))
    return score[5:-5, 5:-5], float(np.mean(score[5:-5, 5:-5]))


def palette(frames):
    bins = (frames.astype(np.int32) // 32)
    idx = bins[..., 0] * 64 + bins[..., 1] * 8 + bins[..., 2]
    hist = np.bincount(idx.ravel(), minlength=512)
    top = np.argsort(hist)[::-1][:8]
    return {"method": "fixed 8x8x8 RGB bins, pooled over sampled frames; not object/material segmentation",
            "colors_rgb": [[int(i//64)*32+16, int(i//8%8)*32+16, int(i%8)*32+16] for i in top],
            "proportions": [rounded(hist[i]/hist.sum()) for i in top],
            "other_proportion": rounded(1-hist[top].sum()/hist.sum()),
            "histogram_512": [rounded(x/hist.sum(), 8) for x in hist]}


def mel_filterbank(sr, nfft, count):
    hz_to_mel = lambda hz: 2595 * np.log10(1 + np.asarray(hz) / 700)
    mel_to_hz = lambda mel: 700 * (10 ** (np.asarray(mel) / 2595) - 1)
    points = mel_to_hz(np.linspace(hz_to_mel(CONFIG["mel_min_hz"]), hz_to_mel(CONFIG["mel_max_hz"]), count+2))
    freqs = np.fft.rfftfreq(nfft, 1/sr)
    weights = np.array([np.maximum(0, np.minimum((freqs-a)/(b-a), (c-freqs)/(c-b)))
                        for a, b, c in zip(points[:-2], points[1:-1], points[2:])])
    return weights, points[1:-1]


def audio_features(pcm, sr, origin=0):
    """PCM is samples x channels; display bins preserve each channel, analysis averages powers."""
    if pcm.ndim != 2 or pcm.shape[1] != 2:
        raise BenchmarkError("Internal audio analysis expects explicit decoded stereo")
    hop = int(CONFIG["audio_bin_s"] * sr)
    samples = []
    for i in range(0, len(pcm), hop):
        a = pcm[i:i+hop]
        power = np.mean(a.astype(np.float64)**2, axis=0)
        rms = np.sqrt(power)
        samples.append({"t_s": rounded(origin + (i + len(a)/2) / sr),
                        "rms_l": rounded(rms[0], 8), "rms_r": rounded(rms[1], 8),
                        "rms_dbfs": rounded(10*np.log10(max(power.mean(), 1e-12))),
                        "peak_min_l": rounded(a[:, 0].min()), "peak_max_l": rounded(a[:, 0].max()),
                        "peak_min_r": rounded(a[:, 1].min()), "peak_max_r": rounded(a[:, 1].max()),
                        "lr_balance": rounded((power[1]-power[0])/power.sum()) if power.sum() > 1e-12 else None})
    target = CONFIG["spectral_analysis_rate_hz"]
    g = math.gcd(sr, target)
    dec = signal.resample_poly(pcm, target//g, sr//g, axis=0)
    nfft, step = CONFIG["stft_n_fft"], CONFIG["stft_hop"]
    if len(dec) < nfft:
        dec = np.pad(dec, ((0, nfft-len(dec)), (0, 0)))
    f, times, density = signal.spectrogram(dec, fs=target, window="hann", nperseg=nfft,
                                          noverlap=nfft-step, detrend=False, scaling="density", axis=0)
    # Shape frequency x channels x time; channel mean of power avoids antiphase cancellation.
    psd = density.mean(axis=1)
    weights, centers = mel_filterbank(target, nfft, CONFIG["mel_bands"])
    power = weights @ psd * (target/nfft)
    db = 10 * np.log10(np.maximum(power, 1e-12))
    flux = np.r_[0, np.maximum(0, np.diff(db, axis=1)).mean(axis=0)]
    # Quiet spectral-floor fluctuations are not considered onset evidence.
    energy = power.sum(axis=0)
    flux[energy < 1e-8] = 0
    mad = np.median(np.abs(flux-np.median(flux)))
    threshold = np.median(flux) + max(.3, 2*mad)
    peaks, _ = signal.find_peaks(flux, height=threshold, prominence=max(.15, mad),
                                 distance=max(1, int(CONFIG["onset_refractory_s"]*target/step)))
    onsets = [{"t_s": rounded(origin+times[i]), "strength": rounded(flux[i]), "status": "ESTIMATED",
               "timestamp_convention": "STFT window center, not a verified acoustic event start",
               "window_support_s": [rounded(origin+times[i]-nfft/target/2), rounded(origin+times[i]+nfft/target/2)],
               "localization_uncertainty_s": rounded((nfft+step)/target/2),
               "uncertainty_note": "Window+hop support bound for display, not calibrated statistical interval or semantic-event accuracy"} for i in peaks]
    tempo = tempo_hypotheses(flux, step/target)
    # Store 100 ms mean-power bands, not per-image-normalized colors.
    group = 4
    out_db, out_t = [], []
    for i in range(0, power.shape[1], group):
        out_db.append(10*np.log10(np.maximum(power[:, i:i+group].mean(axis=1), 1e-12)))
        out_t.append(origin+times[i:i+group].mean())
    global_power = np.mean(pcm.astype(np.float64)**2,axis=0)
    return {"global_rms_dbfs": rounded(10*np.log10(max(global_power.mean(),1e-12))),
            "global_rms_l": rounded(np.sqrt(global_power[0]),8), "global_rms_r": rounded(np.sqrt(global_power[1]),8),
            "global_rms_note": "Whole decoded PCM mean power, including silence; not gated perceptual loudness",
            "samples": samples, "onsets": onsets,
            "flux": {"times_s": [rounded(t+origin) for t in times], "values": [rounded(x) for x in flux],
                     "unit": "mean positive log-mel band change, dB / analysis hop", "status": "ESTIMATED",
                     "method": "Ellis-inspired positive log-mel spectral flux; no DP beat tracking",
                     "window_s": nfft/target, "hop_s": step/target},
            "tempo": tempo,
            "mel": {"times_s": [rounded(t) for t in out_t], "centers_hz": [rounded(x, 2) for x in centers],
                    "power_db": np.round(np.array(out_db).T, 2).tolist(), "unit": "dB re 1 FS² band power",
                    "display_db_min": -100, "display_db_max": 0, "analysis_window_s": nfft/target,
                    "analysis_hop_s": step/target, "display_bin_s": group*step/target,
                    "method": "Hann PSD integrated in triangular HTK-mel bands; stereo mean power; no per-clip normalization"}}


def tempo_hypotheses(flux, hop_s):
    x = np.asarray(flux, float)
    if len(x) < 8 or np.std(x) < 1e-5 or np.count_nonzero(x > .3) < 4:
        return {"status": "UNINFORMATIVE", "candidates": [], "confidence": None,
                "confidence_label": "Insufficient recurrent onset evidence", "limitations": "No BPM is inferred from silence/static envelope"}
    x = x - x.mean()
    ac = signal.correlate(x, x, mode="full", method="fft")[len(x)-1:]
    ac /= max(ac[0], 1e-12)
    lo = max(1, int(60/CONFIG["tempo_bpm_range"][1]/hop_s))
    hi = min(len(ac)-1, int(60/CONFIG["tempo_bpm_range"][0]/hop_s))
    peaks, _ = signal.find_peaks(ac[lo:hi+1])
    indices = [int(i+lo) for i in peaks if ac[i+lo] > 0]
    indices.sort(key=lambda i: ac[i], reverse=True)
    candidates = [{"bpm": rounded(60/(i*hop_s), 2), "autocorrelation": rounded(ac[i])} for i in indices[:5]]
    return {"status": "ESTIMATED" if candidates else "UNINFORMATIVE", "candidates": candidates,
            "confidence": candidates[0]["autocorrelation"] if candidates else None,
            "confidence_label": "Peak normalized autocorrelation; not calibrated probability",
            "limitations": "Half/double-tempo alternatives possible; whole-clip stationarity assumed. No DP beat tracking, beat grid, mood, SFX or genre claim."}


def loudness(path, out):
    res = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-map", "0:a:0", "-vn",
               "-af", "ebur128=peak=true", "-f", "null", "-"])
    log = res.stderr.decode(errors="replace").replace(str(path), Path(path).name)
    out.write_text(log, encoding="utf-8")
    summary = log.rsplit("Summary:", 1)[-1]
    def value(pattern):
        m = re.search(pattern, summary)
        return rounded(float(m.group(1)), 2) if m else None
    integrated = value(r"I:\s+(-?[\d.]+) LUFS")
    peak = value(r"Peak:\s+(-?[\d.]+) dBFS")
    return {"integrated_lufs": integrated, "lra_lu": value(r"LRA:\s+(-?[\d.]+) LU"),
            "true_peak_dbfs": peak, "true_peak_dbtp": peak, "true_peak_unit": "dBTP",
            "status": "OBSERVED" if integrated is not None else "UNINFORMATIVE",
            "method": "FFmpeg ebur128=peak=true; integrated gated loudness and oversampled true-peak estimate",
            "note": "No delivery target selected. Measured loudness is not a listening approval."}


def audio_timing(path, video_origin, sample_rate, time_base=None):
    rows = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_frames",
        "-show_entries", "frame=pts_time,nb_samples,sample_rate", "-of", "json", path]).stdout)["frames"]
    if not rows or "pts_time" not in rows[0]:
        raise BenchmarkError("Audio native PTS missing")
    times = [float(r["pts_time"]) for r in rows]
    if any(b <= a for a,b in zip(times, times[1:])):
        raise BenchmarkError("Audio PTS are nonmonotonic")
    # Containers such as Matroska quantize PTS to 1ms. That is not a real PCM gap.
    tolerance=max(2/sample_rate, 1.1*float(Fraction(time_base)))+1e-6 if time_base else 2/sample_rate+1e-6
    for i in range(len(rows)-1):
        expected = int(rows[i]["nb_samples"]) / sample_rate
        if abs((times[i+1]-times[i])-expected) > tolerance:
            raise BenchmarkError("Audio PTS gap/overlap requires explicit gap-aware PCM alignment; this version refuses concatenation")
    return {"first_pts_s": times[0], "origin_s": times[0]-video_origin,
            "decoded_frame_count": len(rows), "pts_quantization_tolerance_s":tolerance, "frames": rows}


def extract_profile(path, out, role, label=None, key_times=None, rois=None):
    video, audio, native, duration = probe(path)
    period = CONFIG["sample_period_s"]
    requests = np.arange(0, duration-1e-7, period).tolist()
    selected = choose_frames(native, requests)
    w = CONFIG["analysis_width"]
    h = max(16, int(round(int(video["height"])/int(video["width"])*w/2))*2)
    rgb = decode_selected(path, [s["frame_index"] for s in selected], w, h)
    media = out / "assets" / role
    media.mkdir(parents=True)
    visual_rows, motions = [], []
    for i, (frame, sample) in enumerate(zip(rgb, selected)):
        dt = native[sample["frame_index"]]["pts_s"] - native[selected[i-1]["frame_index"]]["pts_s"] if i else None
        features, motion = frame_features(frame, rgb[i-1] if i else None, dt)
        visual_rows.append({"t_s": sample["t_s"], "native_dt_s": rounded(dt) if dt is not None else None, **features})
        motions.append(motion)
    thumbs = []
    for i in range(0, len(selected), max(1, round(2/period))):
        dest = media / f"thumb-{selected[i]['t_s']:06.2f}.jpg"
        Image.fromarray(rgb[i]).save(dest, quality=82)
        thumbs.append({**selected[i], "path": str(dest.relative_to(out))})
    keys = []
    if key_times is None:
        key_times = [("重点 12s", 12), ("重点 40s", 40), ("重点 68s", 68), ("重点 72s", 72)]
    wanted = [(label, t) for label, t in key_times if 0 <= t < duration]
    selected_keys = choose_frames(native, [t for _, t in wanted])
    full = decode_selected(path, [s["frame_index"] for s in selected_keys], int(video["width"]), int(video["height"])) if wanted else []
    for (key_label, _), sample, image in zip(wanted, selected_keys, full):
        dest = media / f"native-{sample['t_s']:06.2f}.png"
        Image.fromarray(image).save(dest)
        ww, hh = int(video["width"]), int(video["height"])
        roi = (rois or {}).get(sample["t_s"], [.25,.25,.75,.75])
        if len(roi)!=4 or any(not math.isfinite(x) or not 0<=x<=1 for x in roi) or roi[0]>=roi[2] or roi[1]>=roi[3]:
            raise BenchmarkError("ROI must be normalized x0,y0,x1,y1, with increasing edges in [0,1]")
        box = [int(ww*roi[0]), int(hh*roi[1]), int(ww*roi[2]), int(hh*roi[3])]
        crop = media / f"crop-{sample['t_s']:06.2f}.jpg"
        # Fixed central native-pixel ROI, no semantic subject identification.
        Image.fromarray(image).crop(box).save(crop, quality=88)
        preview = media / f"key-{sample['t_s']:06.2f}.jpg"
        Image.fromarray(image).resize((360, max(1, round(hh/ww*360)))).save(preview, quality=85)
        keys.append({"label": key_label, **sample, "path": str(dest.relative_to(out)),
                     "preview_path": str(preview.relative_to(out)), "crop_path": str(crop.relative_to(out)),
                     "crop_box_native": box, "crop_box_normalized": roi,
                     "crop_note": "Explicit operator-selected normalized ROI, original pixel resolution; not automatic subject detection" if rois and sample["t_s"] in rois else "Fixed center 50% ROI, original pixel resolution; not a detected subject/material crop"})
    flow_panels = []
    for _, t in wanted:
        i = min(len(motions)-1, max(1, round(t/period)))
        motion = motions[i]
        if not motion:
            continue
        im = Image.fromarray(rgb[i]).resize((w*3, h*3))
        draw = ImageDraw.Draw(im)
        for v in motion["vectors"]:
            x, y = v["x"]*3, v["y"]*3
            dx, dy = v["dx_px"]*3, v["dy_px"]*3
            color = (58, 237, 201) if v["valid"] else (150, 150, 150)
            draw.line((x, y, x+dx, y+dy), fill=color, width=2)
            draw.ellipse((x+dx-2, y+dy-2, x+dx+2, y+dy+2), fill=color)
        dest = media / f"blocks-{t:06.2f}.jpg"
        im.save(dest, quality=85)
        flow_panels.append({"t_s": selected[i]["t_s"], "path": str(dest.relative_to(out)),
                            "method": "SPARSE_BLOCK_TRANSLATION_PROXY", **motion})
    diff = np.array([r["frame_difference"] or 0 for r in visual_rows])
    median = float(np.median(diff)); mad = float(np.median(np.abs(diff-median)))
    peaks, props = signal.find_peaks(diff, height=max(.08, median+4*mad), distance=max(1, round(.5/period)))
    shots = [{"t_s": selected[i]["t_s"], "strength": rounded(diff[i]), "status": "ESTIMATED",
              "method": "sampled luma-change peak; not verified cut/shot"} for i in peaks]
    visual = {"analysis_width": w, "analysis_height": h, "samples": visual_rows,
              "feature_status": "ENGINEERED_PROXY", "palette": palette(rgb), "shots": shots,
              "thumbnails": thumbs, "keyframes": keys, "flow_panels": flow_panels,
              "evidence_classes": {"pixel_statistics":"OBSERVED_PROGRAM_MEASUREMENT",
                                   "block_translation":"ESTIMATED_ENGINEERED_PROXY",
                                   "shot_boundaries":"ESTIMATED_CANDIDATES",
                                   "keyframe_labels_and_roi":"OPERATOR_ANNOTATED",
                                   "material_realism":"UNVERIFIED"},
              "camera_motion": {"status": "NOT_RUN", "reason": "No background masks or world-anchor decomposition"}}
    audio_data = {"status": "ABSENT", "samples": [], "onsets": [], "listening_status": "UNVERIFIED"}
    pcm = None
    if audio:
        timing = audio_timing(path, native[0]["pts_s"], int(audio["sample_rate"]),audio.get("time_base"))
        sr = CONFIG["audio_decode_rate_hz"]
        raw = run(["ffmpeg", "-v", "error", "-i", path, "-map", "0:a:0", "-vn", "-ac", "2",
                   "-ar", sr, "-f", "f32le", "-"]).stdout
        pcm = np.frombuffer(raw, np.float32).reshape((-1, 2))
        audio_data = {"status": "OBSERVED", "sample_rate": sr, "channels": 2,
                      "original_channels": int(audio.get("channels", 0)), "duration_s": rounded(len(pcm)/sr),
                      "origin_s": rounded(timing["origin_s"]), "timing": timing,
                      "channel_policy": "FFmpeg -ac 2 channel remix; mono/>2ch conversion may include mix gain. RMS/mel describe this decoded stereo, not untouched native-channel amplitudes",
                      "listening_status": "UNVERIFIED", "loudness": loudness(path, media/"loudness.log"),
                      **audio_features(pcm, sr, timing["origin_s"])}
        original_channels=int(audio.get("channels",0))
        audio_data["stereo_balance"]={"status":"NOT_APPLICABLE" if original_channels==1 else "ENGINEERED_PROXY",
                                      "note":"Mono input has no native stereo image; displayed L/R are conversion outputs" if original_channels==1 else "L/R mean-power ratio is not source localization; >2ch input is a stereo downmix"}
        if original_channels==1:
            for row in audio_data["samples"]:
                row["lr_balance"]=None
        if audio_data["global_rms_dbfs"]<=-119.999:
            audio_data["loudness"].update(integrated_lufs=None,status="UNINFORMATIVE",
                                          note="Silent/below numerical floor; no finite integrated loudness is claimed")
    fps_text = video.get("avg_frame_rate", "0/1")
    n,d = fps_text.split("/")
    vmeta = {"width": int(video["width"]), "height": int(video["height"]), "duration_s": rounded(duration),
             "fps": rounded(float(n)/float(d)) if float(d) else None, "fps_rational": fps_text,
             "time_base": video.get("time_base"), "first_pts_s": native[0]["pts_s"],
             "codec_name": video.get("codec_name"), "pixel_format": video.get("pix_fmt"), "sample_aspect_ratio": video.get("sample_aspect_ratio", "unknown"),
             "color_space": video.get("color_space", "unknown"), "color_transfer": video.get("color_transfer", "unknown"),
             "color_primaries": video.get("color_primaries", "unknown"), "color_range": video.get("color_range", "unknown")}
    profile = {"schema_version": SCHEMA, "algorithm": algorithm(), "label": label or role,
               "input": {"basename": Path(path).name, "sha256": sha256(path), "bytes": Path(path).stat().st_size,
                         "video": vmeta, "audio": {k: audio.get(k) for k in ["channels", "sample_rate", "start_time", "codec_name"]} if audio else None},
               "evidence": {"measurement_status": "OBSERVED", "visual_semantics": "UNVERIFIED",
                            "audio_listening": "UNVERIFIED", "owner_acceptance": "UNVERIFIED"},
               "timeline": {"duration_s": rounded(duration), "sample_period_s": period,
                            "origin": "first native video PTS; t_s is requested raw time, PTS-selected displayed frame",
                            "samples": selected, "frames": native}, "visual": visual, "audio": audio_data,
               "optional_models": {name: {"status": "NOT_RUN", "reason": reason} for name,reason in [
                   ("LPIPS", "Optional learned perceptual model; no torch/weights installed"),
                   ("DISTS", "Optional texture/structure model; no torch/weights installed"),
                   ("RAFT", "Dense learned flow not installed; sparse block translation is not RAFT"),
                   ("dense_optical_flow", "Not implemented; block matching is a separate proxy"),
                   ("CLAP", "Semantic audio embedding not installed; not listening certification"),
                   ("Synchformer", "AV model not installed; offset/synchronizability is not causal or artistic correctness"),
                   ("FAD", "Not applicable to a single pair as an overall quality score; no background distribution"),
                   ("model_assisted_semantic_review", "Separate approval/credentials/interface required; no media upload performed")]},
               "limitations": ["4 Hz samples can miss short cuts, flashes and motion; thumbnail strip is not full playback.",
                               "Color/luma/edge/Laplacian/block vectors are low-level proxies, not material realism or artistic quality.",
                               "Sparse block vectors confound camera/object/lighting/occlusion and search-window limits.",
                               "Unknown color metadata and compression can affect measured image statistics.",
                               "Onsets are mixture-energy candidates, not SFX labels. Tempo is ambiguous, not mood.",
                               "Fixed spectral floor, threshold and refractory competition can change ambiguous onset candidates under gain; neither gain invariance nor event identity is guaranteed.",
                               "No normal-speed full-viewing or actual-hearing evidence was created by this export."]}
    return profile, rgb, pcm


def offset_estimate(reference, candidate, step_s, max_offset_s=5):
    """Diagnostic envelope correlation; positive means candidate later. Never applies shift."""
    a,b = np.asarray(reference,float), np.asarray(candidate,float)
    n=min(len(a),len(b)); a,b=a[:n],b[:n]
    if n < 8 or np.std(a)<1e-5 or np.std(b)<1e-5:
        return {"status": "UNINFORMATIVE", "offset_s": None, "correlation": None,
                "uncertainty_s": None, "definition": "positive candidate later; constant envelopes provide no offset evidence"}
    maxlag=min(int(max_offset_s/step_s), n//3)
    results=[]
    for lag in range(-maxlag,maxlag+1):
        aa,bb=(a[:n-lag],b[lag:]) if lag>=0 else (a[-lag:],b[:n+lag])
        corr=float(np.corrcoef(aa,bb)[0,1]) if np.std(aa)>1e-8 and np.std(bb)>1e-8 else -1
        results.append((lag,corr))
    lag,best=max(results,key=lambda x:x[1])
    near=[l for l,c in results if c>=best-.05]
    uncertainty=max(step_s, (max(near)-min(near))*step_s/2)
    return {"status": "ESTIMATED", "offset_s": rounded(lag*step_s), "correlation": rounded(best),
            "uncertainty_s": rounded(uncertainty), "definition": "positive means candidate feature envelope later than reference; diagnostic only, not applied",
            "confidence_note": "Uncertainty is near-peak lag spread, not calibrated confidence interval; unrelated envelopes can correlate by chance"}


FEATURE_UNITS = {"luma_mean":"normalized gamma luma", "luma_std":"normalized gamma luma",
                 "saturation_mean":"fraction", "edge_density":"fraction", "laplacian_variance":"normalized luma²",
                 "frame_difference":"mean absolute normalized gamma luma", "motion_median_px_s":"analysis pixels/s",
                 "motion_p90_px_s":"analysis pixels/s", "motion_valid_fraction":"fraction"}


def compare_profiles(ref, cand, ref_rgb=None, cand_rgb=None):
    deltas = {}
    a,b=ref["visual"]["samples"],cand["visual"]["samples"]
    n=min(len(a),len(b))
    for feature,unit in FEATURE_UNITS.items():
        valid=[float(b[i][feature])-float(a[i][feature]) for i in range(n) if a[i][feature] is not None and b[i][feature] is not None]
        values=np.array(valid)
        deltas[feature]={"unit":unit,"mean_signed":rounded(values.mean()) if len(values) else None,
                         "mean_absolute":rounded(np.abs(values).mean()) if len(values) else None,
                         "rmse":rounded(np.sqrt(np.mean(values**2))) if len(values) else None,
                         "paired_samples":len(values),"status":("ESTIMATED" if feature.startswith("motion_") else "OBSERVED") if len(values) else "UNINFORMATIVE",
                         "note":"Candidate minus reference at raw time. Difference magnitude is not a quality judgement."}
    pairs=[]
    if ref_rgb is not None and cand_rgb is not None and ref_rgb.shape[1:]==cand_rgb.shape[1:]:
        weights=np.array([.2126,.7152,.0722])
        for i in range(n):
            ar=ref_rgb[i]/255@weights; br=cand_rgb[i]/255@weights
            _,ssim=ssim_local(ar,br)
            pairs.append({"t_s":a[i]["t_s"],"ssim":rounded(ssim),"luma_mae":rounded(np.mean(np.abs(ar-br)))})
        scores=np.array([r["ssim"] for r in pairs])
        deltas["ssim"]={"unit":"structural index (not aesthetic quality)","mean_signed":rounded(scores.mean()),
                        "mean_absolute":None,"rmse":None,"status":"OBSERVED","paired_samples":len(scores),
                        "note":"Wang-style SSIM on 192px-wide gamma luma; Gaussian sigma1.5,11x11, K1=.01,K2=.03,L=1; valid 5px border excluded. No spatial registration."}
    audio_delta={}
    for key in ["integrated_lufs","true_peak_dbtp"]:
        av=ref["audio"].get("loudness",{}).get(key); bv=cand["audio"].get("loudness",{}).get(key)
        audio_delta[key]=rounded(bv-av) if av is not None and bv is not None else None
    av=ref["audio"].get("global_rms_dbfs"); bv=cand["audio"].get("global_rms_dbfs")
    audio_delta["global_rms_db"]=rounded(bv-av) if av is not None and bv is not None else None
    aa=ref["audio"].get("samples",[]); ba=cand["audio"].get("samples",[])
    raw_audio=[]
    if aa and ba:
        # Common raw-time bin centers, with no inferred audio offset applied.
        bt=np.array([x["t_s"] for x in ba])
        for r in aa:
            if bt[0]<=r["t_s"]<=bt[-1]:
                j=int(np.argmin(np.abs(bt-r["t_s"])))
                raw_audio.append((r,ba[j]))
        audio_delta["rms_db"]=rounded(np.mean([b["rms_dbfs"]-a["rms_dbfs"] for a,b in raw_audio])) if raw_audio else None
        audio_delta["mean_bin_rms_db_delta"]=audio_delta["rms_db"]
        audio_delta["rms_db_note"]="Legacy rms_db is the mean of 100ms-bin dB differences, including a -120dB silence floor; not global RMS or LUFS"
        balances=[b["lr_balance"]-a["lr_balance"] for a,b in raw_audio if a["lr_balance"] is not None and b["lr_balance"] is not None]
        audio_delta["lr_balance"]=rounded(np.mean(balances)) if balances else None
    motion_offset=offset_estimate([r["frame_difference"] or 0 for r in a],[r["frame_difference"] or 0 for r in b],CONFIG["sample_period_s"])
    audio_offset=offset_estimate([r["rms_dbfs"] for r in aa],[r["rms_dbfs"] for r in ba],CONFIG["audio_bin_s"]) if aa and ba else {"status":"NOT_RUN","offset_s":None,"correlation":None,"uncertainty_s":None,"definition":"No paired audio"}
    if audio_offset.get("offset_s") is not None:
        audio_offset["offset_s"]=rounded(audio_offset["offset_s"]+cand["audio"].get("origin_s",0)-ref["audio"].get("origin_s",0))
    return {"schema_version":"motionstudio.reference-comparison/1.0","algorithm":algorithm(),
            "inputs":{"reference_sha256":ref["input"]["sha256"],"candidate_sha256":cand["input"]["sha256"]},
            "alignment":{"mode":"RAW_TIME","applied_offset_s":0,"dtw":"NOT_RUN","spatial_registration":"NOT_RUN",
                         "note":"Time zero is each input's first native video PTS. Raw phase errors remain visible; offsets below are not applied."},
            "deltas":deltas,"audio_deltas":audio_delta,"visual_pairs":pairs,
            "offset_estimates":{"audio_envelope":audio_offset,"visual_motion":motion_offset},
            "events":[],"clips":[],"references":[],
            "notes":["No overall score, automatic aesthetic grade, or technical-pass substitute for owner judgement.",
                     "Two inputs can intentionally differ. A large or small feature delta does not establish good/bad.",
                     "Actual hearing and audiovisual semantic verification remain UNVERIFIED."]}


def load_events(path, ref, cand):
    """Annotations are data, not evidence that an event occurred. Explicit hash binding prevents stale imports."""
    data=json.loads(Path(path).read_text(encoding="utf-8"))
    if data.get("schema_version")!="motionstudio.reference-events/1.0":
        raise BenchmarkError("Unknown events schema")
    for role,p in [("reference",ref),("candidate",cand)]:
        if data.get("inputs",{}).get(role+"_sha256")!=p["input"]["sha256"]:
            raise BenchmarkError("Annotation hash binding mismatch: "+role)
    if not isinstance(data.get("events"),list) or len(data["events"])>200:
        raise BenchmarkError("Invalid annotation event list")
    out=[]
    for row in data["events"]:
        if not isinstance(row,dict): raise BenchmarkError("Invalid event")
        r={key:row.get(key) for key in ["label","cause","source_certainty","expected_lag_s",
             "reference_visual_s","reference_audio_s","candidate_visual_s","candidate_audio_s",
             "candidate_planned_audio_s","candidate_planned_visual_s"]}
        for field in ["label","cause","source_certainty"]:
            if not isinstance(r[field],str) or len(r[field])>2000: raise BenchmarkError("Invalid event annotation text")
        for key in ["expected_lag_s","reference_visual_s","reference_audio_s","candidate_visual_s","candidate_audio_s",
                    "candidate_planned_audio_s","candidate_planned_visual_s"]:
            v=r[key]
            if v is not None and (type(v) not in (int,float) or not math.isfinite(v)):
                raise BenchmarkError("Invalid event time")
            if key!="expected_lag_s" and v is not None:
                duration=(ref if key.startswith("reference") else cand)["timeline"]["duration_s"]
                if not 0<=v<=duration: raise BenchmarkError("Event outside input duration")
        delta=lambda role: rounded(r[role+"_audio_s"]-r[role+"_visual_s"]) if r[role+"_audio_s"] is not None and r[role+"_visual_s"] is not None else None
        r.update(reference_lag_s=delta("reference"),candidate_lag_s=delta("candidate"),status="ANNOTATED")
        r["lag_error_s"]=rounded(r["candidate_lag_s"]-r["reference_lag_s"]) if r["candidate_lag_s"] is not None and r["reference_lag_s"] is not None else None
        r["visual_shift_s"]=rounded(r["candidate_visual_s"]-r["reference_visual_s"]) if r["candidate_visual_s"] is not None and r["reference_visual_s"] is not None else None
        r["audio_shift_s"]=rounded(r["candidate_audio_s"]-r["reference_audio_s"]) if r["candidate_audio_s"] is not None and r["reference_audio_s"] is not None else None
        r["note"]="Annotation/plan values, not automatic visual-event or sound-source verification; null means unverified/missing, not zero"
        out.append(r)
    return out


def make_clips(ref_path,cand_path,ref,cand,out,windows):
    if len(windows)>3: raise BenchmarkError("At most three private excerpt windows")
    clips=[]
    duration=min(ref["timeline"]["duration_s"],cand["timeline"]["duration_s"])
    for start,end in windows:
        if not math.isfinite(start) or not math.isfinite(end) or start<0 or end<=start or end-start>10.000001:
            raise BenchmarkError("Each excerpt must be >0 and <=10 seconds")
        if end>duration: continue
        row={"label":f"{start:g}–{end:g} 秒", "start_s":start,"end_s":end,
             "purpose":"Private diagnostic excerpt; not full source film; re-encoded 320px preview, not native fidelity evidence"}
        for role,path,profile in [("reference",ref_path,ref),("candidate",cand_path,cand)]:
            dest=out/"assets"/role/f"clip-{start:g}-{end:g}.mp4"
            # Seek absolute input timestamp relative to first video PTS; all outputs begin at excerpt time 0.
            seek=start+profile["input"]["video"]["first_pts_s"]
            args=["ffmpeg","-v","error","-seek_timestamp","1","-ss",f"{seek:.9f}","-i",path,"-t",f"{end-start:.9f}",
                  "-map","0:v:0","-map","0:a:0?","-vf","scale=320:-2:flags=lanczos","-c:v","libx264",
                  "-preset","fast","-crf","29","-pix_fmt","yuv420p","-c:a","aac","-b:a","64k",
                  "-movflags","+faststart","-map_metadata","-1",dest]
            run(args)
            check=json.loads(run(["ffprobe","-v","error","-show_streams","-of","json",dest]).stdout)
            stream=next((s for s in check.get("streams",[]) if s.get("codec_type")=="video"),None)
            if stream is None or int(stream.get("nb_frames",0))==0 or abs(float(stream.get("duration",0))-(end-start))>.15:
                raise BenchmarkError("Excerpt verification failed: missing/empty video or wrong duration")
            row[role+"_path"]=str(dest.relative_to(out))
            row[role+"_sha256"]=sha256(dest)
        clips.append(row)
    return clips


def ensure_out(path, inputs):
    out=Path(path).expanduser().resolve()
    if out.exists(): raise BenchmarkError("Output already exists; use a new directory (no overwrites)")
    if any(out==p or out in p.parents for p in inputs): raise BenchmarkError("Output must not contain input media")
    repo=ROOT.parent.parent
    if repo==out or repo in out.parents:
        check=subprocess.run(["git","check-ignore","--no-index",str(out)+"/probe"],cwd=repo,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        if check.returncode!=0: raise BenchmarkError("Inside-repository output must already be Git-ignored")
    return out


def finalize_manifest(out):
    manifest={"schema_version":"motionstudio.reference-artifacts/1.0",
              "files":[{"path":str(p.relative_to(out)),"bytes":p.stat().st_size,"sha256":sha256(p)}
                       for p in sorted(out.rglob("*")) if p.is_file() and p.name!="manifest.json"]}
    write_json(out/"manifest.json",manifest)


def export_pair(reference,candidate,out,events=None,windows=None,title=None,owner_rejected=False,render=True,key_times=None,rois=None,labels=None):
    paths=[Path(reference).expanduser().resolve(),Path(candidate).expanduser().resolve()]
    if any(not p.is_file() for p in paths): raise BenchmarkError("Both inputs must be existing local files")
    out=ensure_out(out,paths)
    out.mkdir(parents=True)
    print("Extracting reference profile",flush=True)
    ref,ref_rgb,_=extract_profile(paths[0],out,"reference","原片基准",key_times,rois)
    write_json(out/"reference.profile.json",ref)
    print("Extracting candidate profile",flush=True)
    cand,cand_rgb,_=extract_profile(paths[1],out,"candidate","候选成片",key_times,rois)
    if owner_rejected:
        ref["evidence"]["owner_acceptance"]="REFERENCE_ONLY_NOT_CANDIDATE_APPROVAL"
        cand["evidence"]["owner_acceptance"]="USER_REJECTED"
    write_json(out/"reference.profile.json",ref); write_json(out/"candidate.profile.json",cand)
    comparison=compare_profiles(ref,cand,ref_rgb,cand_rgb)
    comparison["title"]=title or "视听参考基准 · 同条件差异面板"
    comparison["created_at_utc"]=datetime.now(timezone.utc).isoformat()
    comparison["labels"]={"reference":"原片基准", "candidate":"候选成片 · 已否决基线" if owner_rejected else "候选成片", **(labels or {})}
    if events:
        comparison["events"]=load_events(events,ref,cand)
        comparison["annotation_source"]={"basename":Path(events).name,"sha256":sha256(events),"status":"ANNOTATED"}
    references=ROOT/"method-references.json"
    if references.exists(): comparison["references"]=json.loads(references.read_text())
    comparison["clips"]=make_clips(paths[0],paths[1],ref,cand,out,windows if windows is not None else [(8,18),(36,46),(64,74)])
    write_json(out/"comparison.json",comparison)
    if render:
        from report import render_report
        render_report(out)
    finalize_manifest(out)
    print(json.dumps({"output":str(out),"reference_sha256":ref["input"]["sha256"],
                      "candidate_sha256":cand["input"]["sha256"],"status":"COLLECTED_NOT_APPROVED"},ensure_ascii=False))
    return out


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--reference",required=True); p.add_argument("--candidate",required=True)
    p.add_argument("--out",required=True); p.add_argument("--events",help="Optional local, hash-bound annotation JSON; never executes contents")
    p.add_argument("--window",action="append",help="Private <=10s excerpt START:END, at most three; defaults 8:18,36:46,64:74")
    p.add_argument("--no-clips",action="store_true"); p.add_argument("--no-render",action="store_true")
    p.add_argument("--title"); p.add_argument("--owner-rejected",action="store_true",help="Annotate the candidate as user rejected; never inferred from metrics")
    p.add_argument("--reference-label"); p.add_argument("--candidate-label")
    p.add_argument("--keyframe",action="append",help="Native evidence frame TIME:LABEL; repeat. Labels are operator annotations, not model observations")
    p.add_argument("--roi",action="append",help="Explicit same normalized ROI TIME:X0:Y0:X1:Y1; repeat. Default center50%%")
    args=p.parse_args()
    try:
        windows=[] if args.no_clips else [tuple(map(float,x.split(":"))) for x in args.window] if args.window else None
        if windows is not None and any(len(w)!=2 for w in windows): raise BenchmarkError("Window needs START:END")
        keys=[(s.split(":",1)[1],float(s.split(":",1)[0])) for s in args.keyframe] if args.keyframe else None
        rois={float(s.split(":")[0]):list(map(float,s.split(":")[1:])) for s in args.roi} if args.roi else None
        labels={role:value for role,value in [("reference",args.reference_label),("candidate",args.candidate_label)] if value}
        export_pair(args.reference,args.candidate,args.out,args.events,windows,args.title,args.owner_rejected,not args.no_render,keys,rois,labels)
        return 0
    except (BenchmarkError,ValueError) as e:
        print("reference-benchmark: "+str(e),file=sys.stderr)
        return 2


if __name__=="__main__":
    sys.exit(main())
