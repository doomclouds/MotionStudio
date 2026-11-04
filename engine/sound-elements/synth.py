"""Original bounded procedural candidates, not a quality or listening certification.

No external samples, brand sounds, plugins, network or arbitrary code execution.
PCM repeatability is scoped to the same Python/libm runtime.
"""
import math
import struct
import wave

RATE = 48000
DURATIONS = {'soft-tick': 0.12, 'settle-chime': 0.8, 'air-pass': 0.6, 'low-land': 0.35, 'quiet-pulse-bed': 8.0}

def samples(recipe):
    n = round(DURATIONS[recipe] * RATE)
    state = 1977
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
