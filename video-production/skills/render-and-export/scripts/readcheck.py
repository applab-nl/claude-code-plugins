"""Readability check for a HyperFrames project: is every on-screen text held long enough to read?

    python3 -I readcheck.py <project-dir> [--captions captions.json ...] [--json]

Builds <project-dir>/texts.json ([{text, start, end, source, key}] in film seconds) from:
  a) every .clip element with visible text in index.html and compositions/*.html, offset by its host's data-start
  b) <script type="application/json" data-texts> blocks: [{text, start, end, key?}] in scene-local seconds
  c) --captions files: {"groups": [...]} or {"words": [...]} or a bare list, as captions-on-the-beat emits
Rule: required hold = max(1.5 s if the text is marked key, 0.5 s + 0.3 s per word). Held less is a FAIL (exit 1).
A line of more than 6 words is a WARN. Items cut off by the end of the film count with the time actually visible.
"""
import argparse
import json
import sys
from html.parser import HTMLParser
from pathlib import Path

BASE, PER_WORD, KEY_FLOOR, MAX_LINE_WORDS, EPS = 0.5, 0.3, 1.5, 6, 1e-6
VOID = {"br", "img", "hr", "input", "meta", "link", "source", "track", "wbr", "area", "base", "col", "embed"}
SKIP = {"script", "style", "audio", "video", "svg", "noscript"}


def num(v, default=None):
    try:
        return float(str(v).rstrip("s"))
    except (TypeError, ValueError):
        return default


class Scan(HTMLParser):
    """Collects clip texts, declared texts and mount hosts from one HTML document."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.clips, self.declared, self.hosts = [], [], [], []
        self.root_duration = None
        self._json, self._buf = False, []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "br":
            c = self._clip()
            if c is not None:
                c["text"].append("\n")
        if tag in VOID:
            return
        if "data-composition-src" in a:
            self.hosts.append({"src": a["data-composition-src"], "start": num(a.get("data-start"), 0.0),
                               "duration": num(a.get("data-duration"))})
        if self.root_duration is None and "data-composition-id" in a and a.get("data-duration"):
            self.root_duration = num(a["data-duration"])
        if tag == "script" and "data-texts" in a:
            self._json, self._buf = True, []
        node = {"tag": tag, "skip": tag in SKIP or "hidden" in a, "clip": None}
        if "clip" in (a.get("class") or "").split():
            node["clip"] = {"text": [], "start": num(a.get("data-start"), 0.0), "duration": num(a.get("data-duration")),
                            "key": "data-read" in a and a["data-read"] != "false"}
            self.clips.append(node["clip"])
        self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        if tag == "br":
            self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]["tag"] == tag:
                if tag == "script" and self._json:
                    self._json = False
                    try:
                        self.declared.extend(json.loads("".join(self._buf)))
                    except (ValueError, TypeError):
                        print("readcheck: unparseable data-texts block ignored", file=sys.stderr)
                del self.stack[i:]
                return

    def _clip(self):
        for n in reversed(self.stack):
            if n["skip"]:
                return None
            if n["clip"] is not None:
                return n["clip"]
        return None

    def handle_data(self, data):
        if self._json:
            self._buf.append(data)
            return
        c = self._clip()
        if c is not None:
            c["text"].append(data)


def lines_of(raw):
    return [" ".join(l.split()) for l in raw.split("\n") if l.strip()]


def scan_file(path):
    s = Scan()
    s.feed(Path(path).read_text(encoding="utf-8"))
    s.close()
    return s


def build_manifest(proj, caption_files=()):
    proj = Path(proj)
    items = []
    index = scan_file(proj / "index.html")
    film_end = index.root_duration

    def add(raw, start, end, source, key):
        ls = lines_of(raw)
        if ls:
            items.append({"text": " ".join(ls), "lines": ls, "start": round(start, 3), "end": round(end, 3),
                          "source": source, "key": bool(key)})

    def emit(scan, offset, window_end, source):
        for c in scan.clips:
            start = offset + c["start"]
            end = start + c["duration"] if c["duration"] is not None else window_end
            add("".join(c["text"]), start, min(end, window_end), source, c["key"])
        for d in scan.declared:
            if isinstance(d, dict) and "text" in d:
                start = offset + (num(d.get("start"), 0.0))
                end = offset + num(d.get("end"), window_end - offset)
                add(str(d["text"]), start, min(end, window_end), source + " (data-texts)", d.get("key"))

    inf = float("inf")
    emit(index, 0.0, film_end if film_end is not None else inf, "index.html")
    for h in index.hosts:
        f = proj / h["src"]
        if not f.is_file():
            continue
        wend = h["start"] + h["duration"] if h["duration"] is not None else (film_end if film_end is not None else inf)
        if film_end is not None:
            wend = min(wend, film_end)
        emit(scan_file(f), h["start"], wend, str(Path(h["src"])))
    for cf in caption_files:
        data = json.loads(Path(cf).read_text(encoding="utf-8"))
        segs = data if isinstance(data, list) else (data.get("groups") or data.get("segments") or data.get("words") or [])
        for g in segs:
            end = g["end"] if film_end is None else min(g["end"], film_end)
            add(g["text"], g["start"], end, Path(cf).name, False)
    for it in items:  # unbounded clips: close at the last known end
        if it["end"] == inf:
            it["end"] = max([i["end"] for i in items if i["end"] != inf] or [it["start"]])
    return items


def evaluate(items):
    out = []
    for it in items:
        words = len(it["text"].split())
        held = max(0.0, it["end"] - it["start"])
        req = max(KEY_FLOOR if it["key"] else 0.0, BASE + PER_WORD * words)
        if held < req - EPS:
            out.append({"level": "FAIL", "text": it["text"], "start": it["start"], "held": round(held, 2),
                        "required": round(req, 2), "source": it["source"], "words": words})
        for ln in it["lines"]:
            if len(ln.split()) > MAX_LINE_WORDS:
                out.append({"level": "WARN", "text": ln, "start": it["start"], "held": round(held, 2),
                            "required": round(req, 2), "source": it["source"],
                            "words": len(ln.split()), "note": f"line over {MAX_LINE_WORDS} words"})
    return out


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("project")
    p.add_argument("--captions", action="append", default=[])
    p.add_argument("--json", action="store_true")
    a = p.parse_args(argv)
    items = build_manifest(a.project, a.captions)
    (Path(a.project) / "texts.json").write_text(
        json.dumps([{k: v for k, v in i.items() if k != "lines"} for i in items], indent=2), encoding="utf-8")
    res = evaluate(items)
    fails = [r for r in res if r["level"] == "FAIL"]
    if a.json:
        print(json.dumps({"items": len(items), "findings": res, "ok": not fails}, indent=2))
    elif not res:
        print(f"readcheck: {len(items)} texts, all readable")
    else:
        print(f"{'LEVEL':5}  {'START':>7}  {'HELD':>5}  {'NEED':>5}  TEXT  [source]")
        for r in res:
            t = r["text"] if len(r["text"]) <= 48 else r["text"][:45] + "..."
            print(f"{r['level']:5}  {r['start']:6.2f}s  {r['held']:4.1f}s  {r['required']:4.1f}s  \"{t}\"  [{r['source']}]"
                  + (f"  {r['note']}" if "note" in r else ""))
        print(f"readcheck: {len(fails)} FAIL, {len(res) - len(fails)} WARN of {len(items)} texts")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
