#!/usr/bin/env python3
"""Offline, evidence-only report renderer for MotionStudio reference benchmark.

This file does not analyse source movies, contact a service or certify quality.
It consumes the versioned JSON profiles exported by benchmark.py. Browser audio
controls are exclusively A/B; exercising a control never upgrades listening status.
"""
from __future__ import annotations

import argparse
import base64
import html
import io
import json
import math
import mimetypes
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

COLORS = {"bg": "#0b1119", "panel": "#111c29", "ink": "#e9eef5", "muted": "#a5b2c3", "grid": "#29384a", "reference": "#6edac6", "candidate": "#f2b773"}
LABELS = ("原片基准", "候选成片")
FONT_PATH = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"


def _s(value):
    return html.escape(str(value), quote=True)


def _num(value, digits=3, signed=False):
    if value is None:
        return "未测"
    try:
        n = float(value)
    except (ValueError, TypeError):
        return _s(value)
    if not math.isfinite(n):
        return "未测"
    return (f"{n:+.{digits}f}" if signed else f"{n:.{digits}f}")


def _finite(value):
    try:
        return math.isfinite(float(value))
    except (TypeError, ValueError):
        return False


def _asset(out, relative):
    """Read only an existing, relative output asset, never a private input path."""
    if not relative or not isinstance(relative, str):
        return None
    target = (out / relative).resolve()
    if Path(relative).is_absolute() or not target.is_relative_to(out.resolve()):
        return None
    return target if target.is_file() else None


def _uri(path):
    if path is None:
        return ""
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return "data:" + mime + ";base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def _img_uri(out, relative, max_side=640, quality=86):
    path = _asset(out, relative)
    if path is None:
        return ""
    with Image.open(path) as im:
        im = im.convert("RGB")
        im.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=quality, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def _series(profile, section, field):
    return [(float(row["t_s"]), float(row[field]) if _finite(row.get(field)) else None) for row in profile.get(section, {}).get("samples", []) if _finite(row.get("t_s"))]


def _bounds(series, explicit=None):
    if explicit is not None:
        return explicit
    values = [y for line in series for _, y in line if y is not None]
    if not values:
        return (0., 1.)
    low, high = min(values), max(values)
    if high - low < 1e-12:
        padding = max(abs(high) * .08, .01)
    else:
        padding = (high - low) * .08
    return low - padding, high + padding


def _chart(title, unit, lines, duration, chart_id, note="", bounds=None, heights=180):
    """Inline SVG: common scales, explicit units and exact unwarped time."""
    w, h, left, right, top, bottom = 700, heights, 62, 14, 14, 29
    low, high = _bounds(lines, bounds)
    duration = max(duration, .01)
    scale_x = lambda x: left + x / duration * (w - left - right)
    scale_y = lambda y: top + (high - y) / max(high - low, 1e-15) * (h - top - bottom)
    body = []
    for val in np.linspace(low, high, 4):
        y = scale_y(float(val))
        label = f"{val:.0f}" if abs(val) >= 100 else (f"{val:.2f}" if abs(high-low) < 2 else f"{val:.1f}")
        body.append(f'<line x1="{left}" y1="{y:.2f}" x2="{w-right}" y2="{y:.2f}" class="grid"/><text x="{left-9}" y="{y+4:.2f}" text-anchor="end">{label}</text>')
    for val in np.linspace(0, duration, 5):
        x = scale_x(float(val))
        body.append(f'<text x="{x:.2f}" y="{h-7}" text-anchor="middle">{val:g}</text>')
    body.append(f'<text x="{w-right}" y="{h-7}" text-anchor="end" class="axis-unit">秒</text>')
    for i, line in enumerate(lines):
        if not line:
            continue
        parts=[]; move=True
        for x,y in line:
            if y is None:
                move=True; continue
            parts.append(("M" if move else "L") + f"{scale_x(x):.2f},{scale_y(y):.2f}"); move=False
        d=" ".join(parts)
        body.append(f'<path d="{d}" fill="none" stroke="{COLORS["reference" if i==0 else "candidate"]}" stroke-width="1.7"{" stroke-dasharray=\"6 3\"" if i else ""}/>')
    if not any(lines):
        body.append(f'<text x="{w/2}" y="{h/2}" text-anchor="middle">没有可用测量</text>')
    body.append(f'<line class="crosshair" x1="0" y1="{top}" x2="0" y2="{h-bottom}" hidden/><rect class="hit" x="{left}" y="{top}" width="{w-left-right}" height="{h-top-bottom}" fill="transparent"/>')
    chart_data = _s(json.dumps({"lines": lines, "duration":duration, "left":left, "right":w-right,"width":w,"low":low,"high":high,"height":h}, separators=(",",":")))
    return f'''<figure class="chart" id="{chart_id}" data-chart='{chart_data}'><figcaption><span>{_s(title)}</span><small>{_s(unit)}</small></figcaption><svg viewBox="0 0 {w} {h}" role="img" aria-label="{_s(title)}，原片与候选同时间同纵轴对照"><title>{_s(title)} · {_s(unit)}</title>{''.join(body)}</svg><div class="chart-readout" aria-live="off">原始时间 · 横向移动查看数值</div><p class="note">{_s(note)}</p></figure>'''


def _waveform(profile, color, duration, label, suffix):
    rows = profile.get("audio", {}).get("samples", [])
    w, h, left, right, top, bottom = 1400, 152, 62, 18, 19, 25
    pw = w-left-right
    out = [f'<text x="12" y="16">{_s(label)}</text>']
    for ch, center in (("l", 49), ("r", 105)):
        out.append(f'<text x="30" y="{center+4}">{ch.upper()}</text><line x1="{left}" y1="{center}" x2="{w-right}" y2="{center}" class="grid"/>')
        valid = [r for r in rows if _finite(r.get("t_s")) and _finite(r.get("peak_min_"+ch)) and _finite(r.get("peak_max_"+ch))]
        if valid:
            upper = [(left+float(r['t_s'])/duration*pw, center-float(r['peak_max_'+ch])*24) for r in valid]
            lower = [(left+float(r['t_s'])/duration*pw, center-float(r['peak_min_'+ch])*24) for r in reversed(valid)]
            d='M'+' L'.join(f'{x:.2f},{y:.2f}' for x,y in upper+lower)+' Z'
            out.append(f'<path d="{d}" fill="{color}" fill-opacity=".8"/>')
    for val in np.linspace(0,duration,9):
        x=left+float(val)/duration*pw
        out.append(f'<text x="{x:.2f}" y="{h-4}" text-anchor="middle">{val:g}s</text>')
    wave_data = _s(json.dumps({'rows':rows,'duration':duration,'color':color,'label':label},separators=(',',':')))
    return f'''<svg class="waveform" data-wave='{wave_data}' viewBox="0 0 {w} {h}" role="img" aria-label="{_s(label)}左右声道峰值包络，共同振幅尺度正负一"><title>{_s(label)} · decoded PCM peak envelope · ±1 FS</title>{"".join(out)}</svg>'''


def _mel_image(profile, display=(-100.,0.), width=1300, height=210, duration=None):
    mel = profile.get("audio",{}).get("mel",{})
    data = np.asarray(mel.get("power_db", []), dtype=float)
    if data.ndim != 2 or not data.size:
        return None
    # Fixed joint dB reference, never per-film normalization.
    low, high = display
    times=np.asarray(mel.get('times_s',[]),dtype=float)
    if duration is None:
        duration=profile.get('timeline',{}).get('duration_s')
    if duration is None or len(times)!=data.shape[1] or len(times)<2 or not np.all(np.isfinite(times)) or not np.all(np.diff(times)>0):
        return None  # Missing timestamps are not permission to stretch an image.
    target=np.linspace(0,float(duration),width)
    missing=(target<times[0]) | (target>times[-1])
    typical_hop=float(np.median(np.diff(times)))
    for a,b in zip(times[:-1],times[1:]):
        if b-a>typical_hop*1.5:
            missing |= (target>a+typical_hop*.5) & (target<b-typical_hop*.5)
    data=np.vstack([np.interp(target,times,row,left=low,right=low) for row in data])
    scaled = np.clip((np.nan_to_num(data, nan=low)-low)/(high-low),0,1)
    # Explicit, stable scientific colormap implemented locally (no matplotlib web deps).
    stops = np.array([[7,15,30],[32,42,87],[81,54,119],[151,70,113],[214,113,85],[251,190,100],[254,244,183]],float)
    x=scaled*(len(stops)-1)
    i=np.minimum(x.astype(int),len(stops)-2)
    f=(x-i)[...,None]
    rgb=(stops[i]*(1-f)+stops[i+1]*f).astype(np.uint8)
    im=Image.fromarray(rgb[::-1],"RGB").resize((width,height),Image.Resampling.BILINEAR)
    pixels=np.asarray(im).copy()
    yy,xx=np.indices((height,width))
    stripes=((xx+yy)//7)%2
    uncovered=np.broadcast_to(missing[None,:],(height,width))
    pixels[uncovered & (stripes==0)]=[42,53,66]
    pixels[uncovered & (stripes==1)]=[58,70,82]
    return Image.fromarray(pixels,'RGB')


def _image_data(im):
    if im is None:
        return ""
    b=io.BytesIO(); im.save(b,"PNG",optimize=True)
    return 'data:image/png;base64,'+base64.b64encode(b.getvalue()).decode('ascii')


def _read(out, filename):
    return json.loads((out / filename).read_text(encoding="utf-8"))


def _loud(profile, field):
    return profile.get('audio',{}).get('loudness',{}).get(field)


def _font(size):
    try:
        return ImageFont.truetype(FONT_PATH, size)
    except OSError:
        return ImageFont.load_default()


def _pil_chart(draw, box, lines, duration, title, unit, bounds=None):
    x,y,w,h=box
    draw.text((x,y),title,font=_font(25),fill=COLORS['ink'])
    draw.text((x+w-5,y+5),unit,font=_font(18),fill=COLORS['muted'],anchor='ra')
    low,high=_bounds(lines,bounds); lx=x+64; ty=y+45; ph=h-78; pw=w-76
    for val in np.linspace(low,high,4):
        yy=ty+(high-float(val))/(high-low)*ph
        draw.line((lx,yy,lx+pw,yy),fill=COLORS['grid'],width=1)
        draw.text((lx-10,yy-10),f'{val:.2f}' if high-low<2 else f'{val:.1f}',font=_font(16),fill=COLORS['muted'],anchor='ra')
    for t in np.linspace(0,duration,5):
        xx=lx+t/duration*pw
        draw.text((xx,ty+ph+8),f'{t:g}s',font=_font(16),fill=COLORS['muted'],anchor='ma')
    for j,line in enumerate(lines):
        xy=[]
        for t,v in line+[(0,None)]:
            if v is None:
                if len(xy)>1: draw.line(xy,fill=COLORS['reference' if j==0 else 'candidate'],width=3)
                xy=[]
            else: xy.append((lx+t/duration*pw,ty+(high-v)/(high-low)*ph))


def _overview_keyframes(profile, limit=3):
    """Use available evidence, once per native frame; never assume reference-specific times."""
    visual=profile.get('visual',{})
    rows=visual.get('keyframes') or visual.get('thumbnails') or []
    unique=[]; seen=set()
    for row in sorted(rows,key=lambda r:float(r.get('t_s',0))):
        identity=('frame',row['frame_index']) if row.get('frame_index') is not None else ('time',row.get('t_s'))
        if identity not in seen:
            seen.add(identity);unique.append(row)
    if not unique or limit<1: return []
    return [unique[i] for i in np.linspace(0,len(unique)-1,min(limit,len(unique)),dtype=int)]


def _overview_thumbnail_samples(profile, duration):
    """Return sparse index images placed on the common raw-time axis, not per-film width."""
    thumbs=profile.get('visual',{}).get('thumbnails',[])
    if not thumbs: return []
    ids=np.linspace(0,len(thumbs)-1,min(12,len(thumbs)),dtype=int)
    return [(thumbs[i],168+round(float(thumbs[i].get('t_s',0))/max(duration,.1)*1455)) for i in ids]


def _overview(out, ref, cand, comp, labels, mel_bounds):
    """A compact image of actual source/candidate evidence, not a fake UI shot."""
    W,H=1800,2530
    im=Image.new('RGB',(W,H),COLORS['bg']); d=ImageDraw.Draw(im)
    d.text((68,46),'参考基准 × 候选差异',font=_font(51),fill=COLORS['ink'])
    d.text((70,117),'同一份导出格式 · 原始时间 · 不给美学总分',font=_font(27),fill=COLORS['muted'])
    d.rounded_rectangle((1300,50,1735,102),radius=24,fill='#352c23')
    d.text((1517,76),'诊断证据 ≠ 复刻通过',font=_font(23),fill=COLORS['candidate'],anchor='mm')
    duration=max(float(ref.get('timeline',{}).get('duration_s',0)),float(cand.get('timeline',{}).get('duration_s',0)),.1)
    # Native-derived key images are presentation thumbnails, not transformed comparisons.
    profiles=[ref,cand]
    for j,p in enumerate(profiles):
        x=70+j*850
        label=labels[j]
        d.rectangle((x,179,x+6,218),fill=COLORS['reference' if j==0 else 'candidate'])
        d.text((x+20,179),label,font=_font(30),fill=COLORS['ink'])
        selected=_overview_keyframes(p)
        for k,row in enumerate(selected):
            use_full=k==0
            path=_asset(out,(row.get('preview_path') or row.get('path')) if use_full else (row.get('crop_path') or row.get('path')))
            if path:
                with Image.open(path) as img:
                    img=img.convert('RGB'); img.thumbnail((250,250),Image.Resampling.LANCZOS)
                    px=x+k*274; im.paste(img,(px+(250-img.width)//2,237+(250-img.height)//2))
                d.text((x+k*274,500),f"{float(row.get('t_s',0)):g}s  {'全帧预览' if use_full else '指定原生 ROI'}",font=_font(19),fill=COLORS['muted'])
        vi=p.get('input',{}).get('video',{})
        d.text((x,543),f"{vi.get('width','?')} × {vi.get('height','?')}  |  {_num(vi.get('duration_s'),2)}s  |  LUFS {_num(_loud(p,'integrated_lufs'),1)}",font=_font(22),fill=COLORS['ink'])
    d.text((70,596),'全片缩略图索引（不是正常速观看）',font=_font(27),fill=COLORS['ink'])
    for j,p in enumerate(profiles):
        thumbs=p.get('visual',{}).get('thumbnails',[])
        if not thumbs: continue
        d.text((70,676+j*127),'原片' if j==0 else '候选',font=_font(20),fill=COLORS['reference' if j==0 else 'candidate'])
        for row,px in _overview_thumbnail_samples(p,duration):
            path=_asset(out,row.get('path'))
            if not path: continue
            with Image.open(path) as src:
                src=src.convert('RGB'); src.thumbnail((90,98),Image.Resampling.LANCZOS)
                im.paste(src,(px+(90-src.width)//2,642+j*127))
            d.text((px,744+j*127),f"{float(row.get('t_s',0)):g}s",font=_font(15),fill=COLORS['muted'])
    d.text((70,905),'同纵轴测量  —  实线 原片 / 虚线 候选（HTML）',font=_font(25),fill=COLORS['ink'])
    metrics=[('luma_mean','平均亮度','0–1',None),('edge_density','边缘比例','0–1',None),('frame_difference','低频帧间变化','0–1',None),('motion_p90_px_s','有效块位移第 90 百分位','分析像素 / 秒',None)]
    for i,(key,title,unit,bounds) in enumerate(metrics):
        _pil_chart(d,(70+(i%2)*850,958+(i//2)*265,800,240),[_series(ref,'visual',key),_series(cand,'visual',key)],duration,title,unit,bounds)
    d.text((70,1515),'音频：共同 dB 基准的 Log-mel 功率图',font=_font(29),fill=COLORS['ink'])
    for j,p in enumerate(profiles):
        mel=_mel_image(p,mel_bounds,1540,200,duration)
        d.text((70,1548+j*246),'原片' if j==0 else '候选',font=_font(20),fill=COLORS['reference' if j==0 else 'candidate'])
        if mel:
            im.paste(mel,(190,1572+j*246))
            centers=p.get('audio',{}).get('mel',{}).get('centers_hz',[])
            if centers:
                for idx in [0,len(centers)//2,len(centers)-1]:
                    yy=1572+j*246+(1-(idx+.5)/len(centers))*200-8
                    d.text((92,int(yy)),f'{centers[idx]:.0f} Hz',font=_font(15),fill=COLORS['muted'])
        else: d.text((190,1630+j*246),'无可用音轨测量',font=_font(25),fill=COLORS['muted'])
    d.text((190,2026),f'0 → {duration:g}s  |  频率向上升高  |  固定 {mel_bounds[0]:g} → {mel_bounds[1]:g} dB  |  灰色斜纹：无时间覆盖',font=_font(20),fill=COLORS['muted'])
    _pil_chart(d,(70,2084,800,240),[_series(ref,'audio','rms_dbfs'),_series(cand,'audio','rms_dbfs')],duration,'RMS 包络','dBFS')
    _pil_chart(d,(920,2084,800,240),[_series(ref,'audio','lr_balance'),_series(cand,'audio','lr_balance')],duration,'左右能量平衡','−1 左 / +1 右',(-1,1))
    d.text((70,2367),'听审 UNVERIFIED  ·  材质真实感 UNVERIFIED  ·  相机 / 物体运动未分离',font=_font(24),fill=COLORS['candidate'])
    d.text((70,2411),'波峰不是音效标签；静止不自动算差；低层相似不等于复刻正确。详见可交互报告与 JSON。',font=_font(22),fill=COLORS['muted'])
    d.text((70,2452),'背景占多数可让位移中位数近零 ≠ 对象没动；P90 也可能漏小主体。频谱纵轴为 Mel 频带，非线性 Hz。',font=_font(20),fill=COLORS['muted'])
    im.save(out/'overview.png',optimize=True)


def render_report(output: Path):
    out=Path(output).resolve()
    ref=_read(out,'reference.profile.json'); cand=_read(out,'candidate.profile.json'); comp=_read(out,'comparison.json')
    profiles=[ref,cand]
    labels=comp.get('labels',{})
    if isinstance(labels,dict): labels=(labels.get('reference',ref.get('label',LABELS[0])),labels.get('candidate',cand.get('label',LABELS[1])))
    else: labels=LABELS
    duration=max(float(p.get('timeline',{}).get('duration_s',0)) for p in profiles)
    duration=max(duration,.1)
    # Contract fixes this reference; differing exporter displays are not normalized independently.
    minima=[p.get('audio',{}).get('mel',{}).get('display_db_min',-100) for p in profiles]
    maxima=[p.get('audio',{}).get('mel',{}).get('display_db_max',0) for p in profiles]
    mel_bounds=(min(float(x) for x in minima),max(float(x) for x in maxima))
    if mel_bounds[1]<=mel_bounds[0]: mel_bounds=(-100,0)
    _overview(out,ref,cand,comp,labels,mel_bounds)

    summary=[]
    for j,p in enumerate(profiles):
        vi=p.get('input',{}).get('video',{}); au=p.get('audio',{})
        loud=au.get('loudness',{})
        stats=f"{vi.get('width','?')}×{vi.get('height','?')} · {_num(vi.get('duration_s'),2)} 秒 · {_s(vi.get('fps','?'))} fps"
        sha=p.get('input',{}).get('sha256','')
        summary.append(f'<section class="identity"><h2><i class="swatch {"ref" if j==0 else "cand"}"></i>{_s(labels[j])}</h2><p>{stats}</p><dl><div><dt>整片响度</dt><dd>{_num(loud.get("integrated_lufs"),1)} <small>LUFS</small></dd></div><div><dt>真峰</dt><dd>{_num(loud.get("true_peak_dbfs"),1)} <small>dBTP</small></dd></div><div><dt>实际合听</dt><dd class="unverified">UNVERIFIED</dd></div></dl><details><summary>输入身份与证据状态</summary><p class="mono">{_s(p.get("input",{}).get("basename",""))}<br>SHA-256 {sha}</p><pre>{_s(json.dumps(p.get("evidence",{}),ensure_ascii=False,indent=2))}</pre></details></section>')

    clips=[]
    embed_bytes=0
    for clip in comp.get('clips',[])[:3]:
        a=_asset(out,clip.get('reference_path')); b=_asset(out,clip.get('candidate_path'))
        if not a or not b: continue
        if float(clip.get('end_s',0))-float(clip.get('start_s',0))>10.001: continue
        # Deliberately never embed full copyrighted source movies.
        if embed_bytes+a.stat().st_size+b.stat().st_size>10_500_000: break
        embed_bytes+=a.stat().st_size+b.stat().st_size
        clips.append(dict(label=clip.get('label',f"{clip['start_s']:g}–{clip['end_s']:g}s"),start_s=clip['start_s'],end_s=clip['end_s'],reference=_uri(a),candidate=_uri(b)))
    buttons=''.join(f'<button type="button" class="window-button{" active" if i==0 else ""}" data-window="{i}" aria-pressed="{"true" if i==0 else "false"}">{_s(c["label"])} <small>{c["start_s"]:g}–{c["end_s"]:g}s</small></button>' for i,c in enumerate(clips))
    playback=f'''<section class="section playback" id="playback"><div class="section-title"><div><span class="eyebrow">PAIRED PLAYBACK</span><h2>先看、再听差别</h2></div><span class="badge">仅短窗 · 不含整片</span></div><div class="window-tabs">{buttons}</div><div class="video-pair"><figure><figcaption><i class="swatch ref"></i>{_s(labels[0])}</figcaption><video id="reference-video" playsinline preload="metadata" aria-label="原片短窗"></video></figure><figure><figcaption><i class="swatch cand"></i>{_s(labels[1])}</figcaption><video id="candidate-video" playsinline preload="metadata" muted aria-label="候选短窗"></video></figure></div><div class="transport"><button type="button" id="play-button" class="primary">同步播放</button><input id="seek" type="range" min="0" max="10" step="0.01" value="0" aria-label="短窗进度"><output id="play-time">0.00s</output></div><div class="audio-controls"><fieldset><legend>只听一路</legend><label><input type="radio" name="listen" value="reference" checked> A 原片</label><label><input type="radio" name="listen" value="candidate"> B 候选</label><label><input type="radio" name="listen" value="none"> 静音对照</label></fieldset><label class="level"><input type="checkbox" id="level-match"> 试听电平匹配 <small>只衰减较响一路，原始数据不变</small></label></div><p id="gain-note" class="note">原始电平 · A 0.0 dB / B 0.0 dB。播放按钮不会把听审状态改成已验。</p><p class="note">同步以原片短窗为时钟；HTML 播放器不是逐帧精密同步仪。准确 PTS 见 JSON。短窗为缩小转码预览，不是原生像素证据。</p><p id="play-error" role="status"></p></section>''' if clips else '<section class="section"><h2>片段播放未提供</h2><p>本报告仅展示测量与静帧，不能替代播放或听审。</p></section>'

    thumbs=[p.get('visual',{}).get('thumbnails',[]) for p in profiles]
    timeline=''
    for j,rows in enumerate(thumbs):
        cells=[]
        for row in rows:
            uri=_img_uri(out,row.get('path'),140,75)
            if not uri: continue
            cells.append(f'<figure><img loading="lazy" src="{uri}" alt="{_s(labels[j])} {_num(row.get("t_s"),2)} 秒缩略图"><figcaption>{_num(row.get("t_s"),1)}s</figcaption></figure>')
        shots=profiles[j].get('visual',{}).get('shots',[])
        shotlabels=', '.join(_num(r.get('t_s'),2)+'s' for r in shots[:30]) or '无候选 / 未测'
        timeline+=f'<div class="strip-label"><i class="swatch {"ref" if j==0 else "cand"}"></i>{_s(labels[j])}<small>切换候选：{shotlabels}</small></div><div class="filmstrip">{"".join(cells)}</div>'

    metrics=[
      ('luma_mean','平均亮度','编码 RGB 推导 Y′ · 0–1','亮度是显示编码值代理，不是物理照度或材质质量。'),
      ('saturation_mean','平均饱和度','HSV S · 0–1','平均颜色会掩盖空间排列差异；相近不表示画面相似。'),
      ('edge_density','边缘比例','阈值边缘像素 / 总像素','受纹理、压缩和尺寸影响，不是构图、清晰度或美感分。'),
      ('laplacian_variance','局部纹理响应','Laplacian 方差','噪声也可能增加该值；不能据此判定玻璃、金属或厚度。'),
      ('frame_difference','粗时间变化包络','平均绝对帧差 · 0–1','固定低频采样可能漏短闪、微切或单帧错误；切镜与运动混合。'),
      ('motion_median_px_s','块匹配位移中位数','分析像素 / 秒','局部平移估计；静态背景占多数可令中位数接近零，不等于对象没动。相机/物体未分离；不是 RAFT 光流。'),
      ('motion_p90_px_s','有效块位移第 90 百分位','分析像素 / 秒','只在通过纹理/残差/歧义阈值的块内计算；比中位数敏感，但仍可能漏小主体或超搜索窗运动。'),
      ('motion_valid_fraction','块匹配有效比例','有效块 / 全部采样块','有效只表示通过该工程匹配阈值，不代表动作或相机估计正确；其余块不补零。')]
    visual_charts=''.join(_chart(title,unit,[_series(ref,'visual',field),_series(cand,'visual',field)],duration,'v-'+field,note) for field,title,unit,note in metrics)
    flow=[]
    for j,p in enumerate(profiles):
        for row in p.get('visual',{}).get('flow_panels',[])[:3]:
            uri=_img_uri(out,row.get('path'),600)
            if uri: flow.append(f'<figure><img loading="lazy" src="{uri}" alt="{_s(labels[j])} 块位移诊断 {_num(row.get("t_s"),2)} 秒"><figcaption>{_s(labels[j])} · {_num(row.get("t_s"),2)}s · {_s(row.get("method","块匹配"))}</figcaption></figure>')
    palettes=[]
    for j,p in enumerate(profiles):
        pal=p.get('visual',{}).get('palette',{})
        sw=[]
        for rgb,prop in zip(pal.get('colors_rgb',[]),pal.get('proportions',[])):
            if len(rgb)<3: continue
            color='#' + ''.join(f'{int(max(0,min(255,v))):02x}' for v in rgb[:3])
            sw.append(f'<span style="background:{color};flex:{max(float(prop),.005)}" title="{color} · {float(prop)*100:.1f}%"></span>')
        other=pal.get('other_proportion',0)
        if _finite(other) and float(other)>0:
            sw.append(f'<span style="background:#536171;flex:{float(other)}" title="其他 RGB 量化颜色 · {float(other)*100:.1f}%"></span>')
        palettes.append(f'<div><p>{_s(labels[j])}</p><div class="palette">{"".join(sw)}</div></div>')

    keyframes=''
    # Pair by labels/times without inventing a semantic alignment.
    keys=[p.get('visual',{}).get('keyframes',[]) for p in profiles]
    for i in range(max(len(k) for k in keys) if keys else 0):
        pair=[]
        for j,rows in enumerate(keys):
            if i>=len(rows): pair.append('<div class="missing">未采集</div>'); continue
            row=rows[i]; uri=_img_uri(out,row.get('crop_path') or row.get('path'),780,90)
            full_uri=_img_uri(out,row.get('preview_path') or row.get('path'),640,87)
            target=row.get('path',''); native=_asset(out,target)
            link=f'<a href="{_s(target)}" target="_blank" rel="noopener">原生 PNG ↗</a>' if native else ''
            pair.append(f'<figure><figcaption><i class="swatch {"ref" if j==0 else "cand"}"></i>{_s(labels[j])} · {_s(row.get("label","关键帧"))} · {_num(row.get("t_s"),3)}s</figcaption><div class="detail-images"><div><span>全帧预览</span><img loading="lazy" src="{full_uri}" alt="{_s(row.get("label","关键帧"))}全帧"></div><div><span>指定 ROI</span><img loading="lazy" src="{uri}" alt="{_s(row.get("label","关键帧"))}局部细节"></div></div><p class="note">PTS {_num(row.get("pts_s"),6)}s · 解码帧 {_s(row.get("frame_index","?"))} · {_s(row.get("crop_box_native","全画面"))} {link}</p></figure>')
        keyframes+='<div class="key-pair">'+''.join(pair)+'</div>'

    waveform=''.join(_waveform(p,COLORS['reference' if i==0 else 'candidate'],duration,labels[i],str(i)) for i,p in enumerate(profiles))
    audio_charts=_chart('RMS 包络','dBFS',[_series(ref,'audio','rms_dbfs'),_series(cand,'audio','rms_dbfs')],duration,'audio-rms','未做响度归一化；静音/低能量与响度不同，包络相近不等于音色相同。')
    audio_charts+=_chart('左右能量平衡','−1 左 / +1 右',[_series(ref,'audio','lr_balance'),_series(cand,'audio','lr_balance')],duration,'audio-lr','(ER−EL)/(ER+EL)。低能量置空；这不是声音对象的位置。',(-1,1))
    fluxlines=[]
    for p in profiles:
        flux=p.get('audio',{}).get('flux',{})
        fluxlines.append([(float(t),float(v)) for t,v in zip(flux.get('times_s',[]),flux.get('values',[])) if _finite(t) and _finite(v)])
    audio_charts+=_chart('正向频谱变化 / 起音线索','工程特征单位',fluxlines,duration,'audio-flux','起音候选不是已识别的 SFX；音乐鼓点、纹理突变也会产生峰。',heights=220)
    mels=[]
    for j,p in enumerate(profiles):
        mel=p.get('audio',{}).get('mel',{}); centers=mel.get('centers_hz',[])
        lowfreq=_num(centers[0],0) if centers else '?'; highfreq=_num(centers[-1],0) if centers else '?'
        img=_image_data(_mel_image(p,mel_bounds,duration=duration))
        mels.append(f'<figure class="mel"><figcaption><i class="swatch {"ref" if j==0 else "cand"}"></i>{_s(labels[j])}<small>{lowfreq} → {highfreq} Hz · mel 频带（向上升高）</small></figcaption>{f"<img loading=\"lazy\" src=\"{img}\" alt=\"{_s(labels[j])}全片 log-mel 功率图\">" if img else "<p>无可用测量</p>"}<div class="mel-axis"><span>0 秒</span><span>{duration/2:g} 秒</span><span>{duration:g} 秒</span></div></figure>')
    tempo=''
    tempo_conf=[p.get('audio',{}).get('tempo',{}).get('confidence') for p in profiles]
    tempo_note='自相关 tempo 只是周期候选，存在倍 / 半拍歧义；不是确认 BPM。'
    if all(_finite(v) and float(v)<.2 for v in tempo_conf):
        tempo_note='本对照自相关峰较弱（'+ ' / '.join(_num(v,3) for v in tempo_conf) +'），tempo 只作为低支持的周期候选，非确认 BPM；置信不是校准概率。'
    for j,p in enumerate(profiles):
        a=p.get('audio',{}); te=a.get('tempo',{})
        candidates=' / '.join(f'{_num(c.get("bpm"),1)} BPM (AC {_num(c.get("autocorrelation"),3)})' for c in te.get('candidates',[])[:5]) or '未形成可靠候选'
        tempo+=f'<section><h3>{_s(labels[j])}</h3><p>{candidates}</p><p class="note">状态 {_s(te.get("status","NOT_RUN"))} · 置信描述 {_s(te.get("confidence_label","未校准"))} · {_s(te.get("confidence","未测"))}</p><p class="note">{_s(te.get("limitations","倍拍、半拍与非稳态音乐存在歧义；BPM 不是情绪。"))}</p><details><summary>起音候选（{len(a.get("onsets",[]))}）</summary><p class="mono">{', '.join(_num(r.get('t_s'),3)+'s' for r in a.get('onsets',[])) or '未检测'}</p></details></section>'

    deltas=''
    for key,row in comp.get('deltas',{}).items():
        if not isinstance(row,dict) or key=='ssim': continue
        deltas+=f'<tr><th scope="row">{_s(key)}</th><td>{_num(row.get("mean_signed"),4,True)}</td><td>{_num(row.get("mean_absolute"),4)}</td><td>{_num(row.get("rmse"),4)}</td><td>{_s(row.get("unit",""))}</td></tr>'
    ssim=comp.get('deltas',{}).get('ssim',{})
    ssim_note=f'逐时空间结构 SSIM 均值 {_num(ssim.get("mean_signed"),3)}（不是差值，也不是美学分）。'+str(ssim.get('note','')) if ssim else 'SSIM 未运行。'
    audio_delta_labels={'integrated_lufs':'整片综合响度 Δ / LU','true_peak_dbtp':'真峰 Δ / dB','true_peak_db':'真峰 Δ / dB','rms_db':'平均 100ms 窗 RMS dB 均差（非整片 RMS）','mean_bin_rms_db_delta':'平均 100ms 窗 RMS dB 均差（非整片 RMS）','global_rms_db':'整片 PCM 功率 RMS Δ / dB','rms_dbfs':'整片 PCM RMS Δ / dB','lr_balance':'平均左右能量比 Δ / 无量纲'}
    audio_delta_rows=''.join(f'<tr><th>{_s(audio_delta_labels.get(k,k))}</th><td>{_num(v,3,True)}</td></tr>' for k,v in comp.get('audio_deltas',{}).items() if (_finite(v) or v is None) and not (k=='rms_db' and 'mean_bin_rms_db_delta' in comp.get('audio_deltas',{})))
    offsets=''
    for key,row in comp.get('offset_estimates',{}).items():
        if not isinstance(row,dict): continue
        offsets+=f'<tr><th>{_s(key)}</th><td>{_s(row.get("status","NOT_RUN"))}</td><td>{_num(row.get("offset_s"),3,True)}</td><td>{_num(row.get("correlation"),3)}</td><td>{_num(row.get("uncertainty_s"),3)}</td></tr>'
    events=''
    for row in comp.get('events',[]):
        events+=f'<tr><th>{_s(row.get("label",""))}</th><td>{_s(row.get("cause",""))}</td><td>{_s(row.get("source_certainty","UNKNOWN"))}</td><td>{_num(row.get("expected_lag_s"),3)}</td><td>{_num(row.get("candidate_planned_visual_s"),3)}</td><td>{_num(row.get("candidate_planned_audio_s"),3)}</td><td>{_num(row.get("reference_lag_s"),3)}</td><td>{_num(row.get("candidate_lag_s"),3)}</td><td>{_num(row.get("lag_error_s"),3,True)}</td><td>{_num(row.get("visual_shift_s"),3,True)}</td><td>{_num(row.get("audio_shift_s"),3,True)}</td><td>{_s(row.get("status","UNVERIFIED"))}</td></tr>'
    if not events: events='<tr><td colspan="12">尚无经确认的逐事件声画标注；不从音频波峰自动编造原因、音效名称或声画对齐结论。</td></tr>'
    models=''
    model_names=set(ref.get('optional_models',{}))|set(cand.get('optional_models',{}))
    for name in sorted(model_names):
        r=ref.get('optional_models',{}).get(name,{})
        c=cand.get('optional_models',{}).get(name,{})
        models+=f'<tr><th>{_s(name)}</th><td>{_s(r.get("status","NOT_RUN"))}</td><td>{_s(c.get("status","NOT_RUN"))}</td><td>{_s(r.get("reason",c.get("reason","未安装或未授权")))}</td></tr>'
    refs=''
    for r in comp.get('references',[]):
        url=r.get('url',''); safe_url=url if str(url).startswith(('https://','http://')) else '#'
        refs+=f'<li><a href="{_s(safe_url)}" target="_blank" rel="noopener noreferrer">{_s(r.get("title","方法来源"))}</a><p>{_s(r.get("role",""))}</p><p class="note">{_s(r.get("limitations",""))}</p></li>'
    limitations=[]
    for p in profiles:
        for note in p.get('limitations',[]):
            if note not in limitations: limitations.append(note)
    limitations+=comp.get('notes',[])
    notes=''.join('<li>'+_s(n)+'</li>' for n in limitations)
    title=comp.get('title','视听基准对照')
    owner_rejected=cand.get('evidence',{}).get('owner_acceptance')=='USER_REJECTED'
    owner_badge='已被否决的候选基线' if owner_rejected else '分析导出 · 非质量结论'
    config=json.dumps({'clips':clips,'labels':labels,'lufs':[_loud(p,'integrated_lufs') for p in profiles]},ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    body=f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>{_s(title)}</title><style>{CSS}</style></head><body><main><header><div><span class="eyebrow">MOTIONSTUDIO / REFERENCE BENCHMARK</span><h1>{_s(title)}</h1><p class="lead">把参考与候选放进同一套视听坐标，定位差别，而不是制造一个“通过”分数。</p></div><span class="badge warning">{owner_badge}</span></header><div class="status-line"><span>原始时间 RAW_TIME</span><span>自动对齐：未应用</span><span>模型特征：按项列出未运行</span><span>私有研究 · 离线报告</span></div><div class="identities">{''.join(summary)}</div>{playback}<section class="section"><div class="section-title"><div><span class="eyebrow">FULL TIMELINE</span><h2>全片 {duration:g} 秒，在同一时间轴上看</h2></div><span class="badge">缩略图 / 切换候选</span></div><p class="note">横向展开全部索引。切换时间是低层变化候选，尚非人工确认镜头；缩略图不是完整观看证据。</p>{timeline}</section><section class="section"><div class="section-title"><div><span class="eyebrow">VISUAL PROFILE</span><h2>外观与运动包络</h2></div><div class="legend"><span><i class="swatch ref"></i>原片 · 实线</span><span><i class="swatch cand"></i>候选 · 虚线</span></div></div><div class="chart-grid">{visual_charts}</div><div class="palette-grid">{''.join(palettes)}</div><p class="note">固定 RGB 量化色块 · 按全片采样占比展示；灰色余量为其他颜色。不是“主色设计分”或材质真实感判断。</p><details><summary>块匹配位移诊断图（相机与物体未分离）</summary><div class="flow-grid">{''.join(flow) or '<p>未导出局部位移图。</p>'}</div></details></section><section class="section"><div class="section-title"><div><span class="eyebrow">NATIVE DETAIL EVIDENCE</span><h2>指定时刻：回到原生帧细节</h2></div><span class="badge">明确裁切 / 非配准</span></div><p class="note">这里是相同原始时刻的原生帧或 ROI 展示，显示尺寸有缩放。完整原生 PNG 单独保留；仅打开单页或紧凑包时，原生 PNG 链接需另附完整 assets 目录。裁切框见下方与 JSON。纹理数值不能替代材料、形状、层次与动作判断。</p>{keyframes}</section><section class="section"><div class="section-title"><div><span class="eyebrow">AUDIO PROFILE</span><h2>先保留原始电平，再比较声音结构</h2></div><span class="badge warning">未实际合听 · UNVERIFIED</span></div><h3>解码后左右声道波形</h3><p class="note">两片、两个声道均使用 ±1 FS 振幅尺度。细小波形不代表没有声音；峰值包络不是声源分类。</p>{waveform}<div class="chart-grid">{audio_charts}</div><h3>共享色阶 Log-mel 功率图</h3><p class="note">{_s(ref.get('audio',{}).get('mel',{}).get('unit','dB re 1 FS²'))} · 固定 {mel_bounds[0]:g} 至 {mel_bounds[1]:g} dB；没有对每片分别拉满颜色。灰色斜纹 = 无时间覆盖，区别于低能量 / 静音。</p>{''.join(mels)}<div class="colorbar"><span>{mel_bounds[0]:g} dB</span><i></i><span>{mel_bounds[1]:g} dB</span></div><div class="tempo-grid">{tempo}</div><p class="note">{_s(tempo_note)} BPM 不是情绪，起音不是 SFX，音轨存在不等于实际听过。</p></section><section class="section"><div class="section-title"><div><span class="eyebrow">DIFFERENCES & CAUSAL EVENTS</span><h2>差异量与因果时间，不合成总分</h2></div></div><p class="note">所有差值均为 候选 − 原片。相似度高只代表该观测接近，不自动证明复刻成立。静止与低运动不自动判差。</p><div class="table-wrap"><table><thead><tr><th>原始时间特征</th><th>平均有符号差</th><th>平均绝对差</th><th>RMSE</th><th>单位</th></tr></thead><tbody>{deltas}</tbody></table></div><p class="note">{_s(ssim_note)}</p><h3>音频原始测量差值</h3><div class="table-wrap"><table><thead><tr><th>测量（LUFS / dBTP / dBFS / 能量比）</th><th>候选 − 原片</th></tr></thead><tbody>{audio_delta_rows}</tbody></table></div><h3>包络相关的偏移假设（未用于消除相位误差）</h3><div class="table-wrap"><table><thead><tr><th>信号</th><th>状态</th><th>偏移 / 秒</th><th>相关系数</th><th>近峰 lag 范围 / 秒</th></tr></thead><tbody>{offsets}</tbody></table></div><p class="note">正值表示候选事件包络更晚。它不是同步认证；不同音乐、静止与重复节拍可导致偶然相关。近峰范围不是校准置信区间。它不等于音画同步误差；DTW / 自动 registration 未应用。</p><h3>逐事件标注接口</h3><div class="table-wrap"><table><thead><tr><th>事件</th><th>原因 / 职责</th><th>原片确定性</th><th>计划目标 lag/s</th><th>候选计划画面/s</th><th>候选计划音频/s</th><th>原片 lag/s</th><th>候选 lag/s</th><th>lag 误差/s</th><th>画面相位差/s</th><th>声音相位差/s</th><th>状态</th></tr></thead><tbody>{events}</tbody></table></div><p class="note">计划时间不是实际观测，目标 lag=0 不等于同步已验。实际 lag = 音频事件时间 − 视觉事件时间；误差 = 候选实际 lag − 原片实际 lag。画面/声音相位差各自等于候选时间减原片时间，避免音画一起迟到却内部 lag=0 掩盖错误。先行声音可能有意设计，不机械要求每次同帧。</p></section><section class="section"><div class="section-title"><div><span class="eyebrow">METHODS & EVIDENCE</span><h2>哪些已测，哪些没有证据</h2></div></div><div class="table-wrap"><table><thead><tr><th>可选方法</th><th>原片</th><th>候选</th><th>原因</th></tr></thead><tbody>{models}</tbody></table></div><ul class="limits">{notes}</ul><details><summary>论文与方法边界</summary><ol class="references">{refs}</ol></details><details><summary>导出算法 / 配置</summary><pre>{_s(json.dumps(ref.get('algorithm',{}),ensure_ascii=False,indent=2))}</pre></details><p class="note">本页不联网、不上传、不回传播放行为。外部论文链接只有主动点击才打开。源片只嵌入所列短窗和研究帧，没有整片复制。技术、视觉、实际合听与 OWNER 艺术接受是独立证据门。</p></section><footer><span>MotionStudio · 本地优先 / 研究诊断</span><span>同 schema 的 reference.profile.json / candidate.profile.json / comparison.json 与本页共同保留</span></footer></main><script id="report-config" type="application/json">{config}</script><script>{JS}</script></body></html>'''
    (out/'benchmark.html').write_text(body,encoding='utf-8')
    return {'html':str(out/'benchmark.html'),'overview':str(out/'overview.png'),'embedded_clip_count':len(clips),'html_bytes':(out/'benchmark.html').stat().st_size}


CSS=r'''
:root{color-scheme:dark;--bg:#0b1119;--panel:#111c29;--ink:#e9eef5;--muted:#a5b2c3;--grid:#29384a;--ref:#6edac6;--cand:#f2b773}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,"Noto Sans CJK SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif;font-size:15px;line-height:1.6}main{max-width:1460px;margin:auto;padding:52px 42px 30px}header{display:flex;justify-content:space-between;gap:28px;align-items:flex-start}.eyebrow{display:block;font:600 11px/1.5 system-ui,sans-serif;letter-spacing:.16em;color:var(--ref);margin-bottom:9px}h1{font-size:clamp(29px,3.3vw,46px);line-height:1.2;letter-spacing:-.04em;margin:0 0 16px;font-weight:650}h2{font-size:25px;line-height:1.3;margin:0;font-weight:600}h3{font-size:18px;margin:24px 0 9px;font-weight:550}p{margin:8px 0}.lead{color:var(--muted);max-width:790px}.badge{font-size:11px;white-space:nowrap;border:1px solid var(--grid);border-radius:40px;padding:6px 12px;color:var(--muted)}.warning{background:#352c23;color:var(--cand);border-color:#5b4631}.status-line{display:flex;flex-wrap:wrap;gap:8px 24px;font-size:12px;color:var(--muted);margin:28px 0 24px;padding:13px 0;border-top:1px solid var(--grid);border-bottom:1px solid var(--grid)}.identities{display:grid;grid-template-columns:1fr 1fr;gap:36px}.identity{min-width:0}.identity h2{font-size:21px}.identity>p{font-size:12px;color:var(--muted)}.identity dl{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:12px;margin:18px 0}.identity dt{font-size:12px;color:var(--muted)}.identity dd{font-size:24px;margin:2px 0;font-variant-numeric:tabular-nums}.identity dd small{font-size:12px;color:var(--muted)}.identity dd.unverified{font-size:14px;line-height:2.4;color:var(--cand)}.swatch{display:inline-block;width:18px;height:3px;vertical-align:middle;margin-right:8px;background:var(--ref)}.swatch.cand{background:var(--cand)}details{font-size:13px;margin-top:13px}summary{cursor:pointer;color:var(--muted);padding:6px 0}pre{font-size:11px;line-height:1.65;overflow:auto;max-height:370px;background:#081019;padding:18px;border-radius:6px}.mono{font:11px/1.7 ui-monospace,SFMono-Regular,monospace;overflow-wrap:anywhere;color:var(--muted)}.section{margin-top:44px;padding-top:31px;border-top:1px solid var(--grid)}.section-title{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:19px}.section-title .eyebrow{margin-bottom:6px}.note{font-size:12px;color:var(--muted);line-height:1.65}.window-tabs{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}button,input{font:inherit}button{cursor:pointer;border:1px solid var(--grid);background:var(--panel);color:var(--ink);border-radius:7px;padding:10px 17px;font-size:13px}button.active{border-color:var(--muted);background:#233143}button small{font-size:11px;color:var(--muted);margin-left:6px}.primary{background:var(--ink);color:var(--bg);border-color:var(--ink);font-weight:600;white-space:nowrap}.video-pair{display:grid;grid-template-columns:1fr 1fr;gap:24px}figure{margin:0;min-width:0}.video-pair figcaption,.key-pair figcaption{font-size:13px;margin:0 0 9px}video{display:block;width:100%;max-height:540px;aspect-ratio:1;background:#05080c;object-fit:contain;border-radius:7px}.transport{display:flex;gap:18px;align-items:center;margin:17px 0}input[type=range]{flex:1;min-width:0;accent-color:var(--ref)}output{font-size:12px;font-variant-numeric:tabular-nums;min-width:120px;text-align:right}.audio-controls{display:flex;gap:24px;align-items:center;flex-wrap:wrap}fieldset{display:flex;gap:20px;margin:0;padding:10px 15px;border:1px solid var(--grid);border-radius:7px;font-size:13px}legend{font-size:11px;color:var(--muted);padding:0 5px}input[type=radio],input[type=checkbox]{accent-color:var(--ref);margin-right:6px}label{cursor:pointer}.level{font-size:13px}.level small{display:block;font-size:11px;color:var(--muted);margin-left:24px}#play-error{font-size:13px;color:var(--cand)}.strip-label{display:flex;gap:5px;align-items:center;margin:20px 0 9px;font-size:13px}.strip-label small{font-size:11px;color:var(--muted);margin-left:auto;max-width:78%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.filmstrip{display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;scrollbar-color:var(--grid) transparent}.filmstrip figure{flex:0 0 100px}.filmstrip img{width:100px;height:100px;object-fit:contain;background:#05080c;border-radius:3px;display:block}.filmstrip figcaption{text-align:center;font-size:11px;color:var(--muted);margin-top:4px}.legend{display:flex;gap:18px;font-size:12px;white-space:nowrap}.chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px 30px}.chart{min-width:0;padding:12px 0 0;position:relative}.chart figcaption{display:flex;justify-content:space-between;gap:10px;font-size:15px;margin-bottom:9px}.chart figcaption small{font-size:11px;color:var(--muted);text-align:right}.chart svg{width:100%;height:auto;overflow:visible;display:block}.chart svg text,.waveform text{font:11px system-ui,sans-serif;fill:var(--muted)}.chart svg .axis-unit{visibility:hidden}.grid{stroke:var(--grid);stroke-width:.7}.chart-readout{font:11px/1.6 ui-monospace,SFMono-Regular,monospace;color:var(--muted);min-height:18px;padding-left:9%}.crosshair{stroke:var(--ink);stroke-opacity:.5;stroke-width:1}.chart .note{font-size:11px;margin:4px 0 0}.palette-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:27px}.palette-grid p{font-size:12px}.palette{display:flex;overflow:hidden;height:25px;border-radius:5px;gap:0}.palette span{min-width:1px}.flow-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.flow-grid img{width:100%;height:auto}.flow-grid figcaption{font-size:11px;color:var(--muted)}.key-pair{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin:26px 0 35px}.key-pair img{width:100%;max-height:540px;object-fit:contain;background:#05080c;display:block;border-radius:6px}.key-pair .note{font-size:11px}.detail-images{display:grid;grid-template-columns:1fr 1fr;gap:10px}.detail-images span{display:block;font-size:11px;color:var(--muted);margin-bottom:6px}.waveform{display:block;width:100%;height:auto;margin:12px 0 18px}.mel{margin:20px 0 26px}.mel figcaption{display:flex;align-items:center;font-size:13px;gap:2px;margin-bottom:9px}.mel figcaption small{font-size:11px;color:var(--muted);margin-left:auto}.mel img{display:block;width:100%;height:auto;max-height:220px}.mel-axis{display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:5px}.colorbar{display:flex;align-items:center;gap:15px;font-size:11px;color:var(--muted);max-width:360px;margin:0 0 22px auto}.colorbar i{height:9px;flex:1;background:linear-gradient(to right,rgb(7,15,30),rgb(32,42,87),rgb(81,54,119),rgb(151,70,113),rgb(214,113,85),rgb(251,190,100),rgb(254,244,183))}.tempo-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px}.tempo-grid h3{margin-top:10px}.tempo-grid p{font-size:13px}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:12px;min-width:650px}th,td{text-align:left;padding:12px 10px;border-bottom:1px solid var(--grid);font-variant-numeric:tabular-nums}thead th{font-size:11px;color:var(--muted);font-weight:500}tbody th{font-weight:500}a{color:var(--ref);text-underline-offset:3px}.limits{font-size:13px;color:var(--muted);padding-left:20px}.limits li{padding:4px 0}.references{padding-left:20px}.references li{margin:15px 0}.references p{margin:3px 0}footer{display:flex;justify-content:space-between;gap:25px;color:var(--muted);font-size:11px;border-top:1px solid var(--grid);padding-top:18px;margin-top:38px}.missing{padding:60px;text-align:center;color:var(--muted)}
@media(max-width:800px){main{padding:28px 18px 22px}header{display:block}header>.badge{display:inline-block;margin-top:12px}.identities{gap:22px}.identity dl{grid-template-columns:1fr 1fr}.identity dl>div:last-child{grid-column:1/-1}.identity dd{font-size:21px}.identity dd.unverified{line-height:1.5}.section{margin-top:31px;padding-top:25px}.section-title{display:block}.section-title>.badge,.section-title>.legend{display:inline-flex;margin-top:12px}.chart-grid{grid-template-columns:1fr;gap:12px}.video-pair{gap:12px}.audio-controls{gap:14px}fieldset{gap:12px}.key-pair{gap:12px}.key-pair figcaption{font-size:11px}.key-pair .note{font-size:11px}.detail-images{grid-template-columns:1fr;gap:12px}.transport{gap:10px}.transport button{padding:9px 12px}output{min-width:94px;font-size:11px}.strip-label small{max-width:50%}.flow-grid{grid-template-columns:1fr 1fr}.tempo-grid{grid-template-columns:1fr;gap:5px}.mel figcaption{align-items:flex-start;flex-wrap:wrap}.mel figcaption small{width:100%;margin-left:0}.mel img{min-height:115px;object-fit:fill}.waveform{min-height:130px}.waveform text{font-size:13px}footer{display:block}footer span{display:block;margin:5px 0}.chart figcaption small{max-width:55%}.identity h2{font-size:17px}.identity>p{font-size:11px}.palette-grid{gap:15px}.key-pair img{max-height:320px}.legend{gap:12px}h2{font-size:22px}button:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid var(--ref);outline-offset:4px}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
'''

JS=r'''
(()=>{'use strict';const cfg=JSON.parse(document.getElementById('report-config').textContent);const A=document.getElementById('reference-video'),B=document.getElementById('candidate-video');let chosen='reference',matching=false,active=0,playing=false,locked=false;const finite=x=>typeof x==='number'&&Number.isFinite(x);const dbv=x=>Math.pow(10,x/20);if(A&&B&&cfg.clips.length){const play=document.getElementById('play-button'),seek=document.getElementById('seek'),time=document.getElementById('play-time'),error=document.getElementById('play-error'),gain=document.getElementById('gain-note');function gains(){const valid=cfg.lufs.every(finite);let g=[0,0];if(matching&&valid){let target=Math.min(...cfg.lufs);g=cfg.lufs.map(v=>target-v);}return g;}function enforce(){if(locked)return;locked=true;let g=gains();A.muted=chosen!=='reference';B.muted=chosen!=='candidate';A.volume=Math.min(1,dbv(g[0]));B.volume=Math.min(1,dbv(g[1]));locked=false;gain.textContent=(matching?'整片 LUFS 匹配（仅试听）':'原始电平')+' · A '+g[0].toFixed(1)+' dB / B '+g[1].toFixed(1)+' dB。播放不会改变 UNVERIFIED 听审状态。';}function pause(){playing=false;A.pause();B.pause();play.textContent='同步播放';}function update(){let clip=cfg.clips[active];seek.value=Math.max(0,A.currentTime||0);time.textContent=(clip.start_s+(A.currentTime||0)).toFixed(2)+'s / '+clip.end_s.toFixed(2)+'s';if(playing&&Math.abs(B.currentTime-A.currentTime)>.09&&B.readyState>=2){B.currentTime=A.currentTime;}if(playing)requestAnimationFrame(update);}function load(i){pause();active=i;let c=cfg.clips[i];A.src=c.reference;B.src=c.candidate;A.currentTime=0;B.currentTime=0;seek.max=c.end_s-c.start_s;document.querySelectorAll('[data-window]').forEach(b=>{const yes=Number(b.dataset.window)===i;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});error.textContent='';enforce();update();}play.addEventListener('click',async()=>{if(playing){pause();return;}try{if(A.ended||A.currentTime>=Number(seek.max)-.01){A.currentTime=0;B.currentTime=0;}B.currentTime=A.currentTime;enforce();playing=true;play.textContent='暂停';await Promise.all([A.play(),B.play()]);requestAnimationFrame(update);}catch(e){pause();error.textContent='浏览器未能播放内嵌片段。请尝试本地 Chrome / Safari，或查看随包短窗文件。';}});seek.addEventListener('input',()=>{A.currentTime=Number(seek.value);B.currentTime=Number(seek.value);update();});document.querySelectorAll('input[name=listen]').forEach(el=>el.addEventListener('change',()=>{chosen=el.value;enforce();}));document.getElementById('level-match').addEventListener('change',e=>{matching=e.target.checked;enforce();});if(!cfg.lufs.every(finite)){document.getElementById('level-match').disabled=true;document.getElementById('level-match').parentElement.title='整片 LUFS 未测，无法进行电平匹配';}document.querySelectorAll('[data-window]').forEach(b=>b.addEventListener('click',()=>load(Number(b.dataset.window))));[A,B].forEach(v=>{v.addEventListener('volumechange',enforce);v.addEventListener('ended',()=>{pause();update();});v.addEventListener('error',()=>{pause();error.textContent='内嵌视频解码失败；这不改变测量证据状态。';});});A.addEventListener('timeupdate',update);window.addEventListener('pagehide',pause);load(0);}
function svgEl(name,attrs={},text=null){let n=document.createElementNS('http://www.w3.org/2000/svg',name);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==null)n.textContent=text;return n;}
function interpolate(line,t){if(!line.length)return null;if(t<line[0][0]||t>line[line.length-1][0])return null;let lo=0,hi=line.length-1;while(lo+1<hi){let m=(lo+hi)>>1;if(line[m][0]<=t)lo=m;else hi=m;}let a=line[lo],b=line[hi];if(a[1]===null||b[1]===null)return null;return b[0]===a[0]?a[1]:a[1]+(t-a[0])/(b[0]-a[0])*(b[1]-a[1]);}
document.querySelectorAll('[data-chart]').forEach(fig=>{const data=JSON.parse(fig.dataset.chart),svg=fig.querySelector('svg'),readout=fig.querySelector('.chart-readout');let guide;function draw(){const w=Math.max(270,fig.clientWidth),h=w<480?200:180,left=58,right=w-12,top=14,bottom=h-30;data.width=w;data.left=left;data.right=right;svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.replaceChildren();const yy=v=>top+(data.high-v)/(data.high-data.low)*(bottom-top),xx=t=>left+t/data.duration*(right-left);for(let i=0;i<4;i++){let v=data.low+(data.high-data.low)*i/3,y=yy(v);svg.append(svgEl('line',{x1:left,y1:y,x2:right,y2:y,class:'grid'}));let txt=Math.abs(v)>=100?v.toFixed(0):(data.high-data.low<2?v.toFixed(2):v.toFixed(1));svg.append(svgEl('text',{x:left-8,y:y+4,'text-anchor':'end'},txt));}let nt=w<480?3:5;for(let i=0;i<nt;i++){let t=data.duration*i/(nt-1);svg.append(svgEl('text',{x:xx(t),y:h-7,'text-anchor':i===0?'start':i===nt-1?'end':'middle'},t.toFixed(0)+'s'));}data.lines.forEach((line,i)=>{let move=true,d='';line.forEach(([t,v])=>{if(v===null){move=true;return;}d+=(move?'M':'L')+xx(t).toFixed(2)+','+yy(v).toFixed(2)+' ';move=false;});svg.append(svgEl('path',{d,fill:'none',stroke:i===0?'#6edac6':'#f2b773','stroke-width':1.6,...(i?{'stroke-dasharray':'6 3'}:{})}));});guide=svgEl('line',{x1:0,y1:top,x2:0,y2:bottom,class:'crosshair',visibility:'hidden'});svg.append(guide);svg.append(svgEl('rect',{x:left,y:top,width:right-left,height:bottom-top,fill:'transparent'}));}function show(e){const rect=svg.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*data.width,clamped=Math.max(data.left,Math.min(data.right,x)),t=(clamped-data.left)/(data.right-data.left)*data.duration;guide.setAttribute('x1',clamped);guide.setAttribute('x2',clamped);guide.setAttribute('visibility','visible');const vals=data.lines.map(line=>interpolate(line,t));readout.textContent=t.toFixed(2)+'s  |  原片 '+(vals[0]===null?'—':vals[0].toFixed(4))+'  |  候选 '+(vals[1]===null?'—':vals[1].toFixed(4));}svg.addEventListener('pointermove',show);svg.addEventListener('pointerdown',show);svg.addEventListener('pointerleave',()=>guide.setAttribute('visibility','hidden'));new ResizeObserver(draw).observe(fig);draw();});
const strips=[...document.querySelectorAll('.filmstrip')];strips.forEach(s=>s.addEventListener('scroll',()=>strips.forEach(o=>{if(o!==s&&Math.abs(o.scrollLeft-s.scrollLeft)>1)o.scrollLeft=s.scrollLeft;})));
document.querySelectorAll('[data-wave]').forEach(svg=>{const data=JSON.parse(svg.dataset.wave);function draw(){let w=Math.max(280,svg.clientWidth),h=155,left=30,right=w-10,pw=right-left;svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.replaceChildren();svg.append(svgEl('text',{x:2,y:13},data.label+' · ±1 FS'));[['l',49],['r',105]].forEach(([ch,center])=>{svg.append(svgEl('text',{x:5,y:center+4},ch.toUpperCase()));svg.append(svgEl('line',{x1:left,y1:center,x2:right,y2:center,class:'grid'}));const rows=data.rows.filter(r=>finite(r.t_s)&&finite(r['peak_min_'+ch])&&finite(r['peak_max_'+ch]));let up=rows.map(r=>[left+r.t_s/data.duration*pw,center-r['peak_max_'+ch]*24]),down=rows.slice().reverse().map(r=>[left+r.t_s/data.duration*pw,center-r['peak_min_'+ch]*24]);let path='M'+up.concat(down).map(([x,y])=>x.toFixed(2)+','+y.toFixed(2)).join(' L')+' Z';if(rows.length)svg.append(svgEl('path',{d:path,fill:data.color,'fill-opacity':.85}));});let n=w<500?3:9;for(let i=0;i<n;i++){let t=data.duration*i/(n-1);svg.append(svgEl('text',{x:left+t/data.duration*pw,y:h-5,'text-anchor':i===0?'start':i===n-1?'end':'middle'},t.toFixed(0)+'s'));}}new ResizeObserver(draw).observe(svg);draw();});})();
'''

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output',type=Path)
    args=parser.parse_args()
    print(json.dumps(render_report(args.output),ensure_ascii=False,indent=2))
