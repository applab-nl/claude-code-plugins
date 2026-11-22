#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12,<3.14"
# dependencies = [
#     "kokoro-onnx==0.6.1",
#     "onnxruntime==1.32.0",
#     "numpy==2.5.5",
#     "soundfile==0.14.0",
# ]
# ///
"""Kokoro TTS, free and local: one 24 kHz WAV per script line, plus manifest.json.

    uv run scripts/tts_kokoro.py lines.txt --out vo/                       # one line per row
    uv run scripts/tts_kokoro.py lines.json --out vo/ --voice bm_george --lang en-gb --speed 0.95
    uv run scripts/tts_kokoro.py --list-voices

lines.txt: one spoken line per row; blank rows and rows starting with # are skipped; ids are line-01, line-02...
lines.json: [{"id": "hook", "text": "..."}, ...]
Writes <out>/<id>.wav and <out>/manifest.json ([{id, text, voice, lang, duration_s}]).

The Kokoro v1.0 model and voices (about 350 MB) are downloaded once to
${XDG_CACHE_HOME:-~/.cache}/video-production/kokoro/ and checked against pinned SHA-256 values on every run.
On a mismatch the file is deleted and nothing is generated.
"""
import argparse
import hashlib
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

RELEASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"
FILES = {
    "kokoro-v1.0.onnx": "7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5",
    "voices-v1.0.bin": "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d",
}
# kokoro-onnx language code -> voice-name prefix of the voices made for it
LANGS = {
    "en-us": "a", "en-gb": "b", "es": "e", "fr-fr": "f", "hi": "h",
    "it": "i", "pt-br": "p", "ja": "j", "cmn": "z",
}
SR = 24000


def die(msg, code=1):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)


def cache_dir():
    base = os.environ.get("XDG_CACHE_HOME") or str(Path.home() / ".cache")
    d = Path(base) / "video-production" / "kokoro"
    d.mkdir(parents=True, exist_ok=True)
    return d


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch(name, want, d):
    dst = d / name
    if dst.exists():
        got = sha256(dst)
        if got == want:
            return dst
        dst.unlink()
        die(f"{dst} failed its checksum (got {got}, want {want}). Deleted it; run again to re-download.")
    part = d / (name + ".part")
    print(f"downloading {name} (one time) to {d}", file=sys.stderr)
    try:
        with urllib.request.urlopen(f"{RELEASE}/{name}") as r, open(part, "wb") as f:
            total = int(r.headers.get("Content-Length") or 0)
            done = 0
            for chunk in iter(lambda: r.read(1 << 20), b""):
                f.write(chunk)
                done += len(chunk)
                if total:
                    print(f"\r  {done >> 20} / {total >> 20} MB", end="", file=sys.stderr)
        print(file=sys.stderr)
    except Exception as e:
        part.unlink(missing_ok=True)
        die(f"download of {name} failed: {e}")
    got = sha256(part)
    if got != want:
        part.unlink()
        die(f"{name} failed its checksum (got {got}, want {want}). Deleted it; nothing generated.")
    part.rename(dst)
    return dst


def load_lines(path):
    p = Path(path)
    if not p.exists():
        die(f"script file not found: {p}")
    if p.suffix == ".json":
        items = json.loads(p.read_text())
        lines = [{"id": str(i["id"]), "text": str(i["text"]).strip()} for i in items]
    else:
        rows = [r.strip() for r in p.read_text().splitlines()]
        rows = [r for r in rows if r and not r.startswith("#")]
        lines = [{"id": f"line-{n:02d}", "text": t} for n, t in enumerate(rows, 1)]
    if not lines:
        die(f"no lines in {p}")
    ids = [ln["id"] for ln in lines]
    for i in ids:
        if not re.fullmatch(r"[A-Za-z0-9._-]+", i):
            die(f"bad line id {i!r}: use letters, digits, '.', '_' or '-'")
    if len(set(ids)) != len(ids):
        die("line ids must be unique")
    if any(not ln["text"] for ln in lines):
        die("every line needs text")
    return lines


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("script", nargs="?", help="lines.txt (one per row) or lines.json ([{id, text}])")
    ap.add_argument("--out", help="output directory")
    ap.add_argument("--voice", default="af_heart", help="voice id (default af_heart); see --list-voices")
    ap.add_argument("--lang", default="en-us", help="kokoro-onnx language code (default en-us)")
    ap.add_argument("--speed", type=float, default=1.0, help="0.5 to 2.0 (default 1.0)")
    ap.add_argument("--list-voices", action="store_true")
    a = ap.parse_args()

    if a.lang not in LANGS:
        die(f"Kokoro does not support language {a.lang!r}. Supported: {', '.join(LANGS)}.\n"
            "Use ElevenLabs (fal-ai/elevenlabs/tts/eleven-v3) for Dutch and other unsupported languages, "
            "and record the engine in the brief.")
    if not a.list_voices and (not a.script or not a.out):
        ap.error("a script file and --out are required (or use --list-voices)")
    if not 0.5 <= a.speed <= 2.0:
        die("--speed must be between 0.5 and 2.0")
    lines = load_lines(a.script) if not a.list_voices else []

    d = cache_dir()
    paths = {name: fetch(name, want, d) for name, want in FILES.items()}

    from kokoro_onnx import Kokoro
    import soundfile as sf

    tts = Kokoro(str(paths["kokoro-v1.0.onnx"]), str(paths["voices-v1.0.bin"]))
    voices = sorted(tts.get_voices())
    if a.list_voices:
        for prefix in dict.fromkeys(LANGS.values()):
            langs = [k for k, v in LANGS.items() if v == prefix]
            print(f"{'/'.join(langs)}: {' '.join(v for v in voices if v.startswith(prefix))}")
        return
    if a.voice not in voices:
        die(f"unknown voice {a.voice!r}; run --list-voices")
    if not a.voice.startswith(LANGS[a.lang]):
        print(f"warning: voice {a.voice} is not a {a.lang} voice; the accent will be off", file=sys.stderr)

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    manifest = []
    for ln in lines:
        samples, sr = tts.create(ln["text"], voice=a.voice, speed=a.speed, lang=a.lang)
        if sr != SR:
            die(f"expected {SR} Hz from Kokoro, got {sr}")
        sf.write(out / f"{ln['id']}.wav", samples, sr, subtype="PCM_16")
        dur = round(len(samples) / sr, 3)
        manifest.append({**ln, "voice": a.voice, "lang": a.lang, "duration_s": dur})
        print(f"{ln['id']}.wav  {dur:6.2f} s  {ln['text']}")
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {len(manifest)} lines and manifest.json to {out}")


if __name__ == "__main__":
    main()
