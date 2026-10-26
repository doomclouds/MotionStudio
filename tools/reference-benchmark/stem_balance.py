#!/usr/bin/env python3
"""Experimental local float-PCM stem competition; never hearing/quality approval."""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import os
import tempfile
from pathlib import Path
import re
import struct
import sys
import numpy as np

SCHEMA = 'motionstudio.stem-balance/1'
MAX_FILE = 64 * 1024 * 1024
MAX_TOTAL = 384 * 1024 * 1024
RATE, NFFT, HOP = 48000, 3072, 1200

class ContractError(ValueError):
    pass

def require(ok, message):
    if not ok:
        raise ContractError(message)

def number(v):
    require(type(v) in (int, float), 'Expected finite number')
    try: finite = math.isfinite(v)
    except OverflowError: finite = False
    require(finite, 'Expected finite number')
    return float(v)

def local_file(root, relative):
    require(isinstance(relative, str) and 0 < len(relative) <= 512, 'Invalid local path')
    p = Path(relative)
    require(not p.is_absolute() and '..' not in p.parts and ':' not in relative, 'Only root-relative local paths')
    resolved = (root / p).resolve()
    require(resolved.is_relative_to(root) and resolved.is_file(), 'File missing or outside input root')
    require(0 < resolved.stat().st_size <= MAX_FILE, 'Input file size limit')
    return resolved

def read_wave(path, expected_hash):
    """Bounded RIFF IEEE binary32 only. No decoder, conversion or resampling."""
    require(isinstance(expected_hash, str) and re.fullmatch('[0-9a-f]{64}', expected_hash), 'Invalid SHA256')
    require(path.stat().st_size <= MAX_FILE, 'Input file size limit')
    with path.open('rb') as f:
        raw = f.read(MAX_FILE + 1)
    require(len(raw) <= MAX_FILE, 'Input file size limit')
    require(hashlib.sha256(raw).hexdigest() == expected_hash, 'Input hash mismatch')
    require(len(raw) >= 12 and raw[:4] == b'RIFF' and raw[8:12] == b'WAVE', 'Only RIFF WAVE supported')
    require(struct.unpack_from('<I', raw, 4)[0] + 8 == len(raw), 'RIFF length mismatch')
    chunks = {}; pos = 12
    while pos < len(raw):
        require(pos + 8 <= len(raw), 'Truncated chunk header')
        tag, size = struct.unpack_from('<4sI', raw, pos); pos += 8
        require(pos + size + size % 2 <= len(raw), 'Truncated chunk')
        require(tag in (b'fmt ', b'data', b'fact', b'JUNK', b'LIST'), 'Unsupported WAVE chunk')
        if tag in (b'fmt ', b'data', b'fact'):
            require(tag not in chunks, 'Duplicate WAVE chunk')
            chunks[tag] = (pos, size)
        pos += size + size % 2
    require(b'fmt ' in chunks and b'data' in chunks, 'Missing fmt/data')
    p, size = chunks[b'fmt ']
    require(size in (16, 18), 'Unsupported fmt size')
    tag, channels, rate, byte_rate, align, bits = struct.unpack_from('<HHIIHH', raw, p)
    require(tag == 3 and bits == 32 and channels in (1, 2) and rate == RATE, 'Only native 48 kHz mono/stereo IEEE float32 supported')
    require(align == channels * 4 and byte_rate == rate * align, 'Invalid PCM layout')
    require(size == 16 or struct.unpack_from('<H', raw, p + 16)[0] == 0, 'Unsupported fmt extension')
    p, size = chunks[b'data']
    require(size > 0 and size % align == 0, 'Invalid data length')
    frames = size // align
    if b'fact' in chunks:
        fp, fs = chunks[b'fact']
        require(fs == 4 and struct.unpack_from('<I', raw, fp)[0] == frames, 'Invalid fact sample count')
    x = np.frombuffer(raw, dtype='<f4', count=frames * channels, offset=p).reshape(frames, channels)
    require(np.isfinite(x).all() and np.max(np.abs(x)) <= 16, 'Nonfinite or out-of-scope amplitude')
    return x

def powers(a, b, floor_db):
    """Zeros remain distinct; floor is descriptive, never a hearing threshold."""
    a, b = float(a), float(b)
    state = 'BOTH_ZERO' if a == b == 0 else 'NO_TARGET_SIGNAL' if a == 0 else 'NO_BACKGROUND_SIGNAL' if b == 0 else 'BOTH_NONZERO'
    ad = 10 * math.log10(a) if a else None
    bd = 10 * math.log10(b) if b else None
    return {'state': state, 'target_power_fs2': a, 'background_power_fs2': b,
            'target_db_re_fs2': ad, 'background_db_re_fs2': bd,
            'difference_db': ad - bd if ad is not None and bd is not None else None,
            'target_below_analysis_floor': ad is not None and ad < floor_db,
            'background_below_analysis_floor': bd is not None and bd < floor_db}

def filterbank():
    mel = lambda h: 2595 * np.log10(1 + h / 700)
    points = 700 * (10 ** (np.linspace(mel(40), mel(20000), 50) / 2595) - 1)
    f = np.fft.rfftfreq(NFFT, 1 / RATE)
    w = np.array([np.maximum(0, np.minimum((f-a)/(b-a), (c-f)/(c-b))) for a,b,c in zip(points[:-2],points[1:-1],points[2:])])
    return w, points

def reconstruction(arrays, master):
    """Independent rounded-f32 exports of a common exact sum; conditional model."""
    maximum = rms_sum = violations = max_bound = 0
    count = master.size
    u = 2.0 ** -24; u64 = 2.0 ** -53; n = len(arrays)
    gamma64 = n * u64 / (1 - n * u64)
    for start in range(0, len(master), RATE):
        pieces = [x[start:start+RATE].astype(np.float64) for x in arrays]
        summed = sum(pieces); absolute = sum(np.abs(x) for x in pieces)
        m = master[start:start+RATE].astype(np.float64)
        error = np.abs(summed-m)
        bound = u/(1-u) * (absolute + np.abs(m)) + (n+1)*2.0**-150 + gamma64*absolute
        maximum = max(maximum, float(error.max())); max_bound = max(max_bound, float(bound.max()))
        rms_sum += float(np.sum(error**2)); violations += int(np.count_nonzero(error > bound))
    return {'status': 'WITHIN_DECLARED_ROUNDING_BOUND' if violations == 0 else 'RECONSTRUCTION_MISMATCH',
            'model': 'independent_f32_exports_of_common_sum', 'conditional_not_pipeline_verification': True,
            'formula': 'u/(1-u)*(sum(abs(stems))+abs(master))+(n+1)*2^-150+gamma_n_float64*sum(abs(stems)); u=2^-24',
            'max_abs_residual_fs': maximum, 'rms_residual_fs': math.sqrt(rms_sum/count),
            'max_bound_fs': max_bound, 'samples_over_local_bound': violations, 'sample_values_checked': count}

def evaluate(config, root):
    require(isinstance(config, dict) and config.get('schema') == SCHEMA, 'Unknown schema')
    require(not (set(config)-{'schema','rounding_model','provenance_note','analysis_floor_db','event_interval_s','stems','master','per_channel'}), 'Unknown config fields')
    root = Path(root).resolve(); require(root.is_dir(), 'Missing input root')
    require(config.get('rounding_model') == 'independent_f32_exports_of_common_sum', 'Declare supported rounding model')
    require(isinstance(config.get('provenance_note'), str) and 0 < len(config['provenance_note']) <= 2000, 'Provenance note required')
    floor = number(config.get('analysis_floor_db', -100)); require(-200 <= floor <= -20, 'Analysis floor out of range')
    a, b = map(number, config['event_interval_s']); require(0 < b-a <= 2, 'Event must be positive and <=2 seconds')
    rows = config.get('stems'); require(isinstance(rows,list) and 2 <= len(rows) <= 8, 'Need 2–8 stems')
    require(all(isinstance(r,dict) for r in rows) and isinstance(config.get('master'),dict), 'Invalid assets')
    for r in rows:
        require(not (set(r)-{'path','sha256','origin_s','channel_labels','post_gain_post_pan','group'}), 'Unknown stem fields')
    require(not (set(config['master'])-{'path','sha256','origin_s','channel_labels'}), 'Unknown master fields')
    records = rows + [config['master']]
    paths = [local_file(root, r.get('path')) for r in records]
    require(len(set(paths)) == len(paths), 'Duplicate asset paths')
    require(sum(p.stat().st_size for p in paths) <= MAX_TOTAL, 'Total byte budget exceeded')
    origins = [number(r.get('origin_s')) for r in records]
    require(len(set(origins)) == 1, 'Origins must match; no implicit shifting')
    origin = origins[0]
    arrays = [read_wave(p,r.get('sha256')) for p,r in zip(paths, records)]
    shape = arrays[0].shape; require(all(x.shape == shape for x in arrays), 'Length/channel mismatch')
    labels = ['M'] if shape[1] == 1 else ['L','R']
    require(all(r.get('channel_labels') == labels for r in records), 'Explicit channel labels required')
    require(all(r.get('post_gain_post_pan') is True for r in rows), 'Postgain/postpan declaration required')
    require(all(r.get('group') in ('target','background') for r in rows) and {r['group'] for r in rows} == {'target','background'}, 'Explicit two-group membership required')
    require(origin <= a < b <= origin + shape[0]/RATE, 'Event outside media')
    sample_a, sample_b = (a-origin)*RATE, (b-origin)*RATE
    require(abs(sample_a-round(sample_a)) < 1e-6 and abs(sample_b-round(sample_b)) < 1e-6, 'Event boundaries must align to native samples')
    ia, ib = round(sample_a), round(sample_b)
    require(0 <= ia < ib <= shape[0], 'Event must contain at least one native sample')
    require(type(config.get('per_channel',False)) is bool, 'per_channel must be boolean')
    rec = reconstruction(arrays[:-1], arrays[-1])
    # Only event and overlapping full windows enter spectral analysis; no padding.
    first = max(0, (ia-NFFT)//HOP+1); last = min((shape[0]-NFFT)//HOP, (ib-1)//HOP)
    starts = [i*HOP for i in range(first,last+1)]
    lo = min([ia]+starts); hi = max([ib]+[s+NFFT for s in starts])
    groups = {g:sum(x[lo:hi].astype(np.float64) for x,r in zip(arrays,rows) if r['group']==g) for g in ('target','background')}
    s,t = groups['target'],groups['background']
    rms = powers(np.mean(s[ia-lo:ib-lo]**2),np.mean(t[ia-lo:ib-lo]**2),floor)
    w,points = filterbank(); hann = np.hanning(NFFT+1)[:-1]; scale = RATE*np.sum(hann**2)
    def spectral(x):
        z = np.abs(np.fft.rfft(x*hann[:,None],axis=0))**2/scale
        z[1:-1] *= 2
        return w @ z * (RATE/NFFT)
    frames = []
    for start in starts:
        ps,pb = [spectral(x[start-lo:start-lo+NFFT]) for x in (s,t)]
        frame = {'support_s':[origin+start/RATE,origin+(start+NFFT)/RATE],
                 'center_s':origin+(start+NFFT/2)/RATE,
                 'crosses_event_boundary':start < ia or start+NFFT > ib,
                 'bands':[powers(x,y,floor) for x,y in zip(ps.mean(axis=1),pb.mean(axis=1))]}
        if config.get('per_channel',False):
            frame['per_channel'] = {label:[powers(x,y,floor) for x,y in zip(ps[:,j],pb[:,j])] for j,label in enumerate(labels)}
        frames.append(frame)
    coverage_start = max(ia, starts[0]) if starts else ia
    coverage_end = min(ib, starts[-1]+NFFT) if starts else ia
    uncovered = []
    if coverage_start > ia: uncovered.append([origin+ia/RATE,origin+coverage_start/RATE])
    if coverage_end < ib: uncovered.append([origin+coverage_end/RATE,origin+ib/RATE])
    return {'schema':SCHEMA, 'status':'COLLECTED_NOT_APPROVED', 'audio_listening':'NOT_LISTENED',
            'emotional_fit':'UNVERIFIED', 'final_mix_attribution':'NOT_ESTABLISHED',
            'provenance':config, 'reconstruction':rec, 'event_rms':rms,
            'analysis':{'rate_hz':RATE,'window_samples':NFFT,'hop_samples':HOP,'window':'periodic Hann',
                        'band_edges_hz':points.tolist(),'unit':'dB re 1 FS² band power; difference dB',
                        'method':'same-window native-rate PSD integrated in triangular HTK mel bands; no auditory masking model',
                        'analysis_floor_db':floor,'floor_is_not_hearing_threshold':True,
                        'boundary_windows_include_outside_event':True, 'no_padding':True,
                        'source_edge_context_incomplete': ia < NFFT or shape[0]-ib < NFFT,
                        'spectral_status':'AVAILABLE' if starts else 'UNAVAILABLE_NO_FULL_WINDOW',
                        'frame_count':len(starts), 'uncovered_event_intervals_s':uncovered,
                        'window_endpoint_zero_weight':True},
            'frames':frames,'limitations':['No binaural, temporal or critical-band masking model','No source recognition or audibility inference','No playback SPL calibration','No automatic mix changes'],
            'implementation_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), 'numpy_version':np.__version__}

def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('config',type=Path); p.add_argument('--input-root',type=Path,required=True)
    p.add_argument('--output',type=Path,required=True)
    args=p.parse_args(argv)
    try:
        require(args.config.is_file() and args.config.stat().st_size <= 65536, 'Config missing or too large')
        require(not args.output.exists() and args.output.parent.is_dir(), 'Output must be new in existing directory')
        raw=args.config.read_bytes(); require(len(raw)<=65536, 'Config too large')
        def pairs(items):
            result={}
            for k,v in items:
                require(k not in result, 'Duplicate JSON key'); result[k]=v
            return result
        def constant(value): raise ContractError('Nonfinite JSON constant: '+value)
        data=json.loads(raw,object_pairs_hook=pairs,parse_constant=constant)
        result=evaluate(data,args.input_root)
        result['config_sha256']=hashlib.sha256(raw).hexdigest()
        payload=json.dumps(result,indent=2,allow_nan=False).encode('utf8')
        require(len(payload) <= 16*1024*1024, 'Output byte budget exceeded')
        temporary=None
        try:
            with tempfile.NamedTemporaryFile(dir=args.output.parent,prefix='.stem-balance-',delete=False) as f:
                temporary=f.name; f.write(payload); f.flush(); os.fsync(f.fileno())
            os.link(temporary,args.output)  # atomic publication, refuses existing destination
        finally:
            if temporary is not None: os.unlink(temporary)
        print(result['reconstruction']['status']+'; NOT_LISTENED')
        return 0 if result['reconstruction']['samples_over_local_bound']==0 else 2
    except (ContractError,OSError,ValueError,KeyError,TypeError,OverflowError,RecursionError) as e:
        print('stem-balance: '+str(e),file=sys.stderr); return 2

if __name__=='__main__':
    sys.exit(main())
