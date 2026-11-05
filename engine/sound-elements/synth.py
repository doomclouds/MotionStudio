"""Original bounded procedural candidates, not a quality or listening certification.

No external samples, brand sounds, plugins, network or arbitrary code execution.
PCM repeatability is scoped to the same Python/libm runtime.
"""
import math
import struct
import wave

RATE = 48000
DURATIONS = {'soft-tick': 0.12, 'settle-chime': 0.8, 'air-pass': 0.6, 'low-land': 0.35, 'quiet-pulse-bed': 8.0,
             'paper-rub': 0.24, 'print-snap': 0.12, 'resonant-tap': 0.48, 'keyboard-press': 0.052,
             'keyboard-soft': 0.04}

# Finite authored alternatives, not unbounded randomization or an acoustic model.
# (noise seed, body frequency multiplier, release onset in seconds)
# Variant zero preserves the original default PCM in the same runtime.
KEYBOARD_VARIANTS = ((84701, 1.0, .019), (45047, .985, .018),
                     (13337, 1.015, .020), (96731, .995, .0185))

# (seed, upper Hz, lower Hz, body Hz, press decay, body decay,
#  release seconds, press gain, body gain, release gain).
# 0/1: alternate letter keys; 2: wider space key; 3: enter key.
# These are authored synthesis roles, not measured hardware or a realism claim.
SOFT_KEYBOARD_VARIANTS = (
    (104729, 4200, 1150, 780, 235, 200, .012, .23, .23, .031),
    (130363, 3900, 1050, 820, 250, 210, .011, .22, .24, .029),
    (155921, 3300, 900, 490, 185, 155, .014, .19, .33, .036),
    (196613, 3900, 1100, 620, 205, 175, .013, .24, .29, .033),
)

def validate_variant(recipe, variant):
    if recipe not in DURATIONS:
        raise ValueError('Unsupported recipe')
    count = (len(KEYBOARD_VARIANTS) if recipe == 'keyboard-press' else
             len(SOFT_KEYBOARD_VARIANTS) if recipe == 'keyboard-soft' else 1)
    if type(variant) is not int or not 0 <= variant < count:
        raise ValueError(f'{recipe}: variant must be an integer from 0 to {count-1}')

def samples(recipe, variant=0):
    validate_variant(recipe, variant)
    n = round(DURATIONS[recipe] * RATE)
    state, body_ratio, release_at = (KEYBOARD_VARIANTS[variant] if recipe == 'keyboard-press'
                                     else (1977, 1.0, .019))
    if recipe == 'keyboard-soft':
        (state, upper, lower, body_hz, press_decay, body_decay, release_at,
         press_gain, body_gain, release_gain) = SOFT_KEYBOARD_VARIANTS[variant]
    low_fast = low_slow = low_body = 0.0
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
            # Explicitly selected short press/body/release, not a physical keyboard model.
            state = (1664525 * state + 1013904223) & 0xffffffff
            noise = state / 2147483648 - 1
            low_fast += (1 - math.exp(-2*math.pi*6500/RATE)) * (noise-low_fast)
            low_slow += (1 - math.exp(-2*math.pi*1400/RATE)) * (noise-low_slow)
            band = low_fast-low_slow
            attack = min(t/.0015, 1)
            press = attack * math.exp(-105*t)
            body = (math.sin(2*math.pi*235*body_ratio*t) + .34*math.sin(2*math.pi*510*body_ratio*t)) * math.exp(-95*t) * attack
            release_t = max(t-release_at, 0)
            release = min(release_t/.001, 1) * math.exp(-190*release_t)
            tail = max(0, min((DURATIONS[recipe]-1/RATE-t)/.004, 1))
            value = (.11*band*press + .075*body + .024*band*release) * tail
        elif recipe == 'keyboard-soft':
            # Short band-shaped noise only: no oscillator, bell, carriage return,
            # metallic resonator, reverb or pitch slide. No auto key selection.
            state = (1664525 * state + 1013904223) & 0xffffffff
            noise = state / 2147483648 - 1
            low_fast += (1 - math.exp(-2*math.pi*upper/RATE)) * (noise-low_fast)
            low_slow += (1 - math.exp(-2*math.pi*lower/RATE)) * (noise-low_slow)
            low_body += (1 - math.exp(-2*math.pi*body_hz/RATE)) * (noise-low_body)
            attack = min(t/.0008, 1)
            press = attack * math.exp(-press_decay*t)
            body = attack * math.exp(-body_decay*t)
            release_t = max(t-release_at, 0)
            release = min(release_t/.0007, 1) * math.exp(-330*release_t)
            tail = max(0, min((DURATIONS[recipe]-1/RATE-t)/.003, 1))
            value = (press_gain*(low_fast-low_slow)*press + body_gain*low_body*body
                     + release_gain*(low_fast-low_slow)*release) * tail
        elif recipe == 'quiet-pulse-bed':
            # 8 seconds at 60 BPM: integer cycles and modulation make a periodic source.
            pulse = .55 + .45 * math.cos(2*math.pi*t)
            value = .055 * pulse * (math.sin(2*math.pi*220*t) + .5*math.sin(2*math.pi*330*t))
        else:
            raise ValueError('Unsupported recipe')
        yield max(-32767, min(32767, round(value * 32767)))

def render(recipe, path, variant=0):
    validate_variant(recipe, variant)  # Reject before creating an output file.
    with wave.open(str(path), 'wb') as out:
        out.setparams((2, 2, RATE, 0, 'NONE', 'not compressed'))
        out.writeframes(b''.join(struct.pack('<hh', v, v) for v in samples(recipe, variant)))
