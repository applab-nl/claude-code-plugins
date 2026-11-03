"""Beat grid for cutting to music: find the drop, then b(n) = drop + n * beat in film time.

    python beats.py drop music.mp3                       # candidate drop times (biggest low-end jumps)
    python beats.py grid --bpm 124 --drop-media 38.74 --drop-film 1.20 --to 27
    python beats.py snap --bpm 124 --drop-media 38.74 --drop-film 1.20 4.1 6.95 12.3

drop-media is the drop's time inside the music file; drop-film is where it must land in the video.
The music clip then starts at media offset drop-media - drop-film (print it with grid). Confirm a
candidate drop by ear: the detector finds energy jumps, not intent. Needs ffmpeg and numpy.
"""
import argparse
import subprocess

import numpy as np

SR, HOP = 22050, 0.05


def drop(path, top=5):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-af", "lowpass=f=200",
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32)
    h = int(SR * HOP)
    rms = np.sqrt(np.array([np.mean(x[i:i + h] ** 2) for i in range(0, len(x) - h, h)]) + 1e-12)
    db = 20 * np.log10(rms)
    w = int(1.0 / HOP)  # one second before vs one second after
    score = np.array([db[i:i + w].mean() - db[i - w:i].mean() for i in range(w, len(db) - w)])
    picks = []
    for i in np.argsort(score)[::-1]:
        t = (i + w) * HOP
        if all(abs(t - p) > 4 for p, _ in picks):
            picks.append((t, score[i]))
        if len(picks) == top:
            break
    for t, s in sorted(picks):
        print(f"{t:8.2f} s   +{s:4.1f} dB low end")


def grid(a):
    beat = 60.0 / a.bpm
    offset = a.drop_media - a.drop_film
    print(f"beat {beat:.5f} s, bar {4 * beat:.4f} s, music data-media-start {offset:.3f}")
    n = int(np.floor(-a.drop_film / beat))
    while a.drop_film + n * beat <= a.to:
        t = a.drop_film + n * beat
        if t >= 0:
            print(f"b({n:+d}) = {t:7.3f}" + ("   bar" if n % 4 == 0 else ""))
        n += 1


def snap(a):
    beat = 60.0 / a.bpm
    for t in a.times:
        n = round((t - a.drop_film) / beat)
        b = a.drop_film + n * beat
        print(f"{t:7.3f} -> b({n:+d}) = {b:7.3f}   ({(b - t) * 1000:+.0f} ms)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("drop"); d.add_argument("music")
    for name in ("grid", "snap"):
        s = sub.add_parser(name)
        s.add_argument("--bpm", type=float, required=True)
        s.add_argument("--drop-media", type=float, required=True)
        s.add_argument("--drop-film", type=float, required=True)
        if name == "grid":
            s.add_argument("--to", type=float, required=True, help="film length in seconds")
        else:
            s.add_argument("times", type=float, nargs="+")
    a = ap.parse_args()
    {"drop": lambda: drop(a.music), "grid": lambda: grid(a), "snap": lambda: snap(a)}[a.cmd]()
