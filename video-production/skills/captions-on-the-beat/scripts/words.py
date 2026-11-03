"""Word timestamps and caption groups from a voice track, with local whisper or whisper.cpp. Free, offline.

    python words.py vo.wav captions.json                        # openai-whisper CLI, model small.en
    python words.py vo.wav captions.json --model medium.en      # speech over music
    python words.py vo.wav captions.json --cpp ggml-small.en.bin   # whisper.cpp (whisper-cli) instead
    python words.py vo.wav captions.json --script script.txt    # the known words, as a prompt

Writes {"words": [{text, start, end}], "groups": [{text, start, end, words: [{text, start}]}]}.
Groups: 2 to --max words (default 4), broken at sentence ends, pauses of 0.15 s or more, or the limit.
Each group holds until the next starts (or 0.3 s past its last word across a long pause); the last group
holds at least 2 s. Read the words before you use them: whisper invents text over silence.
"""
import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path

GAP, CLOSE_HOLD, TAIL = 0.15, 2.0, 0.3


def wav16k(src, dst):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000", dst], check=True)


def whisper_py(wav, tmp, model, prompt):
    cmd = ["whisper", wav, "--model", model, "--word_timestamps", "True", "--output_format", "json",
           "--output_dir", tmp, "--condition_on_previous_text", "False"]
    if not model.endswith(".en"):
        cmd += ["--language", "en"]
    if prompt:
        cmd += ["--initial_prompt", prompt]
    subprocess.run(cmd, capture_output=True, check=True)
    data = json.loads((Path(tmp) / (Path(wav).stem + ".json")).read_text())
    return [{"text": w["word"].strip(), "start": w["start"], "end": w["end"]}
            for seg in data["segments"] for w in seg.get("words", [])]


def whisper_cpp(wav, tmp, model, prompt):
    out = str(Path(tmp) / "cpp")
    cmd = ["whisper-cli", "-m", model, "-f", wav, "-ml", "1", "-sow", "-oj", "-of", out, "-np"]
    if prompt:
        cmd += ["--prompt", prompt]
    subprocess.run(cmd, capture_output=True, check=True)
    data = json.loads(Path(out + ".json").read_text())
    return [{"text": s["text"].strip(), "start": s["offsets"]["from"] / 1000, "end": s["offsets"]["to"] / 1000}
            for s in data["transcription"] if s["text"].strip()]


def clean(words):
    keep = [w for w in words if re.search(r"[A-Za-z0-9]", w["text"])]  # drops music notes and stray marks
    return [{**w, "start": round(w["start"], 3), "end": round(w["end"], 3)} for w in keep]


def group(words, max_words):
    groups, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        sentence_end = w["text"][-1] in ".?!"
        pause = nxt is not None and nxt["start"] - w["end"] >= GAP
        orphan = nxt is not None and nxt["text"][-1] in ".?!" and len(cur) < 6  # never leave one word alone
        full = len(cur) >= max_words and not orphan
        if nxt is None or full or sentence_end or (pause and len(cur) >= 2):
            groups.append(cur)
            cur = []
    out = []
    for i, g in enumerate(groups):
        start, last_end = g[0]["start"], g[-1]["end"]
        if i + 1 < len(groups):
            nxt = groups[i + 1][0]["start"]
            end = nxt if nxt - last_end < 0.6 else last_end + TAIL
        else:
            end = max(last_end + TAIL, start + CLOSE_HOLD)
        out.append({"text": " ".join(w["text"] for w in g), "start": start, "end": round(end, 3),
                    "words": [{"text": w["text"], "start": w["start"]} for w in g]})
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("out")
    ap.add_argument("--model", default="small.en"); ap.add_argument("--cpp", default=None, help="ggml model path")
    ap.add_argument("--script", default=None); ap.add_argument("--max", type=int, default=4)
    a = ap.parse_args()
    prompt = Path(a.script).read_text().strip()[:800] if a.script else None
    with tempfile.TemporaryDirectory() as tmp:
        wav = str(Path(tmp) / "voice.wav")
        wav16k(a.src, wav)
        words = clean(whisper_cpp(wav, tmp, a.cpp, prompt) if a.cpp else whisper_py(wav, tmp, a.model, prompt))
    groups = group(words, max(2, min(a.max, 6)))
    Path(a.out).write_text(json.dumps({"words": words, "groups": groups}, indent=1))
    for g in groups:
        print(f"{g['start']:7.2f} {g['end']:7.2f}  {g['text']}")
