"""TTS round trip: transcribe every generated line with whisper and compare it with the script.

    python tts_check.py vo/                                   # Kokoro output: reads vo/manifest.json
    python tts_check.py vo/ --script lines.json --lang nl     # ElevenLabs or other: <id>.wav/.mp3 per line
    python tts_check.py vo/ --cpp ggml-small.bin              # whisper.cpp (whisper-cli) instead

Uses the same transcribers as captions-on-the-beat/scripts/words.py: the openai-whisper CLI (default model
small.en for English, small otherwise) or whisper.cpp. Text is compared after normalising case, punctuation,
hyphens and apostrophes; English numbers are compared as words, so "42" matches "forty-two".
Prints OK or MISMATCH with a word diff (-missing +extra) per line.
Exit 0 all OK, 1 any mismatch, 2 no whisper installed or bad input. Needs ffmpeg.
"""
import argparse
import difflib
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

AUDIO = (".wav", ".mp3", ".m4a", ".flac", ".ogg")
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen " \
       "sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def die(msg, code=2):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)


def say(n):
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    for size, word in ((10**9, "billion"), (10**6, "million"), (1000, "thousand"), (100, "hundred")):
        if n >= size:
            rest = n % size
            return say(n // size) + " " + word + ("" if rest == 0 else " " + say(rest))


def number_words(m):
    whole, frac = m.group(1).replace(",", ""), m.group(2)
    if len(whole) > 12:
        return m.group(0)
    out = say(int(whole))
    if frac:
        out += " point " + " ".join(ONES[int(d)] for d in frac)
    return " " + out + " "


def normalise(text, english):
    t = text.lower().replace("’", "'")
    if english:
        t = t.replace("%", " percent").replace("&", " and ")
        t = re.sub(r"\$(\d)", r"\1", t)  # "$5" reads as "five dollars"; whisper writes either, keep the number
        t = re.sub(r"(\d[\d,]*)(?:\.(\d+))?", number_words, t)
    t = t.replace("'", "")
    t = re.sub(r"[^\w\s]|_", " ", t)
    return t.split()


def load_script(path):
    p = Path(path)
    if p.suffix == ".json":
        return [{"id": str(i["id"]), "text": str(i["text"])} for i in json.loads(p.read_text())]
    rows = [r.strip() for r in p.read_text().splitlines()]
    rows = [r for r in rows if r and not r.startswith("#")]
    return [{"id": f"line-{n:02d}", "text": t} for n, t in enumerate(rows, 1)]


def whisper_lang(lang):
    # kokoro-onnx codes (en-us, fr-fr, pt-br, cmn) and plain ISO codes -> whisper language
    return {"cmn": "zh"}.get(lang, lang.split("-")[0].lower())


def transcribe(src, tmp, lang, model, cpp):
    wav = str(Path(tmp) / "in16k.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vn", "-ac", "1", "-ar", "16000", wav],
                   check=True)
    if cpp:
        out = str(Path(tmp) / "cpp")
        subprocess.run(["whisper-cli", "-m", cpp, "-f", wav, "-l", lang, "-otxt", "-of", out, "-np"],
                       capture_output=True, check=True)
        return Path(out + ".txt").read_text()
    cmd = ["whisper", wav, "--model", model, "--output_format", "txt", "--output_dir", tmp,
           "--condition_on_previous_text", "False", "--fp16", "False"]
    if not model.endswith(".en"):
        cmd += ["--language", lang]
    subprocess.run(cmd, capture_output=True, check=True)
    return (Path(tmp) / "in16k.txt").read_text()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("dir", help="directory with one audio file per line, named <id>.wav (or .mp3 ...)")
    ap.add_argument("--script", help="lines.txt or lines.json; default: <dir>/manifest.json")
    ap.add_argument("--lang", help="language (en, nl, fr-fr ...); default: from the manifest, else en")
    ap.add_argument("--model", help="openai-whisper model (default small.en for English, small otherwise)")
    ap.add_argument("--cpp", help="whisper.cpp ggml model file; uses whisper-cli instead of openai-whisper")
    a = ap.parse_args()

    if not shutil.which("ffmpeg"):
        die("ffmpeg not found (brew install ffmpeg)")
    if a.cpp and not shutil.which("whisper-cli"):
        die("whisper-cli not found. Install whisper.cpp: brew install whisper-cpp")
    if not a.cpp and not shutil.which("whisper"):
        die("whisper not found. Install one of:\n"
            "  uv tool install openai-whisper        (then: python tts_check.py DIR)\n"
            "  brew install whisper-cpp              (then: python tts_check.py DIR --cpp ggml-small.bin)")

    d = Path(a.dir)
    manifest = d / "manifest.json"
    if a.script:
        lines = load_script(a.script)
    elif manifest.exists():
        lines = json.loads(manifest.read_text())
    else:
        die(f"no {manifest}; pass --script")
    lang = whisper_lang(a.lang or (lines[0].get("lang") if lines else None) or "en")
    english = lang == "en"
    model = a.model or ("small.en" if english else "small")

    bad = 0
    with tempfile.TemporaryDirectory() as tmp:
        for ln in lines:
            src = next((d / (ln["id"] + ext) for ext in AUDIO if (d / (ln["id"] + ext)).exists()), None)
            if src is None:
                print(f"MISSING   {ln['id']}: no audio file in {d}")
                bad += 1
                continue
            heard = transcribe(src, tmp, lang, model, a.cpp).strip()
            want, got = normalise(ln["text"], english), normalise(heard, english)
            if want == got:
                print(f"OK        {ln['id']}: {heard}")
                continue
            bad += 1
            diff = []
            for op, i1, i2, j1, j2 in difflib.SequenceMatcher(a=want, b=got, autojunk=False).get_opcodes():
                if op == "equal":
                    diff += want[i1:i2]
                else:
                    diff += ["-" + w for w in want[i1:i2]] + ["+" + w for w in got[j1:j2]]
            print(f"MISMATCH  {ln['id']}: {' '.join(diff)}\n          script: {ln['text']}\n          heard:  {heard}")
    print(f"{len(lines) - bad}/{len(lines)} lines OK")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
