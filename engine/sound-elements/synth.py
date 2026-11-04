"""Original bounded procedural candidates, not a quality or listening certification.

No external samples, brand sounds, plugins, network or arbitrary code execution.
PCM repeatability is scoped to the same Python/libm runtime.
"""
import math
import struct
import wave

RATE = 48000
DURATIONS = {'soft-tick': 0.12, 'settle-chime': 0.8, 'air-pass': 0.6, 'low-land': 0.35, 'quiet-pulse-bed': 8.0,
             'paper-rub': 0.24, 'print-snap': 0.12, 'resonant-tap': 0.48, 'keyboard-press': 0.052}

def samples(recipe):
    n = round(DURATIONS[recipe] * RATE)
    state = 84701 if recipe == 'keyboard-press' else 1977
    low_fast = low_slow = 0.0
    for i in range(n):
        t, u = i / RATE, i / (n - 1)
        envelope = math.sin(math.pi * u) ** 2  # both endpoints zero
        if recipe == 'soft-tick':
            value = .18 * math.sin(2 * math.pi * 1100 * t) * math.exp(-45*t) * envelope
        elif recipe == 'settle-chime':
            value = .13 * (math.sin(2*math.pi*660*t) + .3*math.sin(2*math.pi*990*t)) * math.exp(-4*t) * envelope
        elif recipe == 'air-pass':
            state = (1664525 * state + 1013904223) & 0xffffffff
            value = .12 * (state / 2147483648 - 1) * envelope
        elif recipe == 'low-land':
            value = .2 * math.sin(2*math.pi*(100*t - 70*t*t)) * math.exp(-9*t) * envelope
        elif recipe in {'paper-rub', 'print-snap'}:
            # Bounded band-shaped deterministic noise. Fixed recipes, not arbitrary DSP.
            # Difference of two one-pole lowpasses; not a claimed acoustic material model.
            state = (1664525 * state + 1013904223) & 0xffffffff
            noise = state / 2147483648 - 1
            lo, hi = (450, 2500) if recipe == 'paper-rub' else (900, 6000)
            low_fast += (1 - math.exp(-2*math.pi*hi/RATE)) * (noise-low_fast)
            low_slow += (1 - math.exp(-2*math.pi*lo/RATE)) * (noise-low_slow)
            edge = min(t/.003, (DURATIONS[recipe]-1/RATE-t)/.003, 1)
            shape = (envelope * (.4+.6*math.sin(2*math.pi*41*t)**2)
                     if recipe == 'paper-rub' else math.exp(-55*t))
            value = .3 * (low_fast-low_slow) * shape * max(0, edge)
        elif recipe == 'resonant-tap':
            # Inharmonic, rapidly decaying accent; not a success chime or literal collision.
            edge = max(0, min(t/.003, (DURATIONS[recipe]-1/RATE-t)/.003, 1))
            value = .3 * edge * sum(a*math.sin(2*math.pi*f*t)*math.exp(-k*t)
                                   for f,k,a in [(420,12,.8),(913,16,.35),(1647,24,.15)])
        elif recipe == 'keyboard-press':
            # Fixed short press/body/release, not a physical keyboard model.
            state = (1664525 * state + 1013904223) & 0xffffffff
            noise = state / 2147483648 - 1
            low_fast += (1 - math.exp(-2*math.pi*6500/RATE)) * (noise-low_fast)
            low_slow += (1 - math.exp(-2*math.pi*1400/RATE)) * (noise-low_slow)
            band = low_fast-low_slow
            attack = min(t/.0015, 1)
            press = attack * math.exp(-105*t)
            body = (math.sin(2*math.pi*235*t) + .34*math.sin(2*math.pi*510*t)) * math.exp(-95*t) * attack
            release_t = max(t-.019, 0)
            release = min(release_t/.001, 1) * math.exp(-190*release_t)
            tail = max(0, min((DURATIONS[recipe]-1/RATE-t)/.004, 1))
            value = (.11*band*press + .075*body + .024*band*release) * tail
        elif recipe == 'quiet-pulse-bed':
            # 8 seconds at 60 BPM: integer cycles and modulation make a periodic source.
            pulse = .55 + .45 * math.cos(2*math.pi*t)
            value = .055 * pulse * (math.sin(2*math.pi*220*t) + .5*math.sin(2*math.pi*330*t))
        else:
            raise ValueError('Unsupported recipe')
        yield max(-32767, min(32767, round(value * 32767)))

def render(recipe, path):
    with wave.open(str(path), 'wb') as out:
        out.setparams((2, 2, RATE, 0, 'NONE', 'not compressed'))
        out.writeframes(b''.join(struct.pack('<hh', v, v) for v in samples(recipe)))
