"""The "on set" chain: makes a clean or voice-changed line sound recorded in the room it was shot in.

High-pass 90 Hz, 2:1 compression, a gentle shelf down above 7 kHz, no presence boost, then a short
synthetic room sized to the shot, and room tone inside the line so pauses never fall to digital zero.
No loudness normalization here: level is set once on the dialogue stem, not per line.

    python onset.py line.wav out.wav --wet -12 --dist 0.3 --rt60 0.55 --tone room.wav
    python onset.py line.wav out.wav --keys "0:-9:1.0,3.2:-15:0.2"   # perspective changes over the line

--wet   room level in dB relative to the dry voice (-18 close-up, -9 wide shot)
--dist  0 to 1: pulls the top end down and the level with it (up to 4 dB quieter at 1)
--keys  time:wet:dist triples, interpolated, for a camera that moves during the line
Needs ffmpeg and numpy.
"""
import argparse
import subprocess

import numpy as np

SR = 48000


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def ff(x, chain):
    p = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", chain,
                        "-f", "f32le", "-"], input=x.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32).copy()


def room_ir(rt60, seed=7):
    """A small room: 12 ms pre-delay, a few early reflections, a tail that darkens as it decays."""
    rng = np.random.default_rng(seed)
    n = int(SR * rt60 * 1.2)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-6.9 * t / rt60)
    ir[: int(SR * 0.012)] = 0
    for ms, g in [(7, .5), (11, .35), (17, .3), (23, .22), (31, .18)]:  # walls, desks, glass
        ir[int(SR * ms / 1000)] += g * rng.choice([-1, 1])
    ir = ff(ir, "lowpass=f=4500,highpass=f=180")
    return ir / np.sqrt((ir ** 2).sum())


def curve(keys, n, col):
    return np.interp(np.arange(n), [k[0] * SR for k in keys], [k[col] for k in keys])


def onset(x, keys, rt60, tone=None, tone_db=-46):
    dry = ff(x, "highpass=f=90,acompressor=threshold=-24dB:ratio=2:attack=8:release=120:makeup=2,"
                "treble=g=-4:f=7000:t=s")
    n = len(dry)
    wet = np.convolve(dry, room_ir(rt60))[:n]
    wet *= np.sqrt((dry ** 2).mean()) / (np.sqrt((wet ** 2).mean()) + 1e-12)  # wet dB is relative to dry
    far = ff(dry, "lowpass=f=6000")  # distance loses air before it loses level
    dist = curve(keys, n, 2)
    body = (dry * (1 - dist) + far * dist) * 10 ** (-4 * dist / 20)
    out = body + wet * 10 ** (curve(keys, n, 1) / 20)
    if tone is not None:
        out += np.tile(tone, int(np.ceil(n / len(tone))))[:n] * 10 ** (tone_db / 20) / (np.sqrt((tone ** 2).mean()) + 1e-12)
    peak = np.abs(out).max()
    return out * (10 ** (-3 / 20) / peak) if peak > 10 ** (-3 / 20) else out  # only a safety trim, -3 dBFS


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--wet", type=float, default=-12); ap.add_argument("--dist", type=float, default=0.3)
    ap.add_argument("--keys", default=None); ap.add_argument("--rt60", type=float, default=0.55)
    ap.add_argument("--tone", default=None); ap.add_argument("--tone-db", type=float, default=-46)
    a = ap.parse_args()
    keys = [tuple(map(float, k.split(":"))) for k in a.keys.split(",")] if a.keys else [(0.0, a.wet, a.dist)]
    y = onset(load(a.src), keys, a.rt60, load(a.tone) if a.tone else None, a.tone_db)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", a.out],
                   input=y.astype(np.float32).tobytes(), check=True)
