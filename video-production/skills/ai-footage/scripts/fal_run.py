"""One paid fal call, priced first, capped, and logged to a spend ledger before and after.

    python fal_run.py <endpoint> --usd 2.85 --args args.json [--kind video] [--out takes/shot-04]
    python fal_run.py spent

args.json is the endpoint's input. Any string value that is a path to a local file is sent inline as a
data URI (fal storage uploads can fail with 403 on some keys; inline always works for stills and short clips).
Env: FAL_KEY (required, never printed), VIDEO_CAP_USD (default 50), VIDEO_LEDGER (default ./spend.jsonl).
Every result URL goes to results.jsonl next to the ledger before the download, so a dropped download
can be fetched again without paying twice.
"""
import argparse
import base64
import json
import os
import sys
import time
import urllib.request
import uuid
from pathlib import Path

LEDGER = Path(os.environ.get("VIDEO_LEDGER", "spend.jsonl"))
CAP = float(os.environ.get("VIDEO_CAP_USD", "50"))
MEDIA_TYPES = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
    ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm",
    ".wav": "audio/wav", ".mp3": "audio/mpeg", ".m4a": "audio/mp4",
}


def rows():
    return [json.loads(l) for l in LEDGER.read_text().splitlines() if l.strip()] if LEDGER.exists() else []


def spent():
    """A call counts from its start row: an unknown outcome may still have billed. A failed row refunds it."""
    failed = {r["id"] for r in rows() if r["state"] == "failed"}
    return sum(r["usd"] for r in rows() if r["state"] == "start" and r["id"] not in failed)


def log(**row):
    LEDGER.parent.mkdir(parents=True, exist_ok=True)
    with LEDGER.open("a") as f:
        f.write(json.dumps({"t": time.strftime("%Y-%m-%dT%H:%M:%S"), **row}) + "\n")


def inline(v):
    if isinstance(v, dict):
        return {k: inline(x) for k, x in v.items()}
    if isinstance(v, list):
        return [inline(x) for x in v]
    if isinstance(v, str) and len(v) < 1024 and Path(v).is_file():
        # Local change after audit: only media under the cwd may leave this machine, never .env, keys or CVs.
        # resolve() first, so a symlink named shot.png cannot point at a secret.
        real = Path(v).resolve()
        # A fixed list, not mimetypes: that maps .ts to video/mp2t and x.png.gz to image/png.
        mime = MEDIA_TYPES.get(real.suffix.lower())
        if not (mime and real.is_relative_to(Path.cwd().resolve())):
            sys.exit(f"refusing to upload {v}: only image, video or audio files under the current directory")
        return f"data:{mime};base64," + base64.b64encode(real.read_bytes()).decode()
    return v


def urls(obj):
    """Every media URL in a fal result, wherever the endpoint puts it (video, images[], audio)."""
    if isinstance(obj, dict):
        if isinstance(obj.get("url"), str) and obj["url"].startswith("http"):
            yield obj["url"]
        for v in obj.values():
            yield from urls(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from urls(v)


def save(url, dest):
    with (LEDGER.parent / "results.jsonl").open("a") as f:
        f.write(json.dumps({"url": url, "dest": str(dest)}) + "\n")
    dest.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(4):
        try:
            urllib.request.urlretrieve(url, dest)
            print(dest)
            return
        except Exception as e:  # large files truncate or drop now and then
            print(f"retry {attempt + 1}: {e}")
            time.sleep(3)
    print(f"download failed, URL kept in results.jsonl: {url}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("endpoint")
    p.add_argument("--usd", type=float, help="your price estimate for this one call")
    p.add_argument("--args", help="JSON file with the endpoint input")
    p.add_argument("--kind", default="call")
    p.add_argument("--out", default="out/fal")
    a = p.parse_args()
    if a.endpoint == "spent":
        sys.exit(print(f"${spent():.2f} of ${CAP:.2f}"))
    if not os.environ.get("FAL_KEY"):
        sys.exit("FAL_KEY is not set")
    if a.usd is None or a.args is None:
        sys.exit("--usd and --args are required: price the call before you make it")
    if spent() + a.usd > CAP:
        sys.exit(f"stop: ${spent():.2f} spent + ${a.usd:.2f} passes the ${CAP:.2f} cap")
    import fal_client  # pip install fal-client

    args = inline(json.loads(Path(a.args).read_text()))
    cid = uuid.uuid4().hex[:8]
    log(id=cid, kind=a.kind, endpoint=a.endpoint, usd=a.usd, state="start")
    try:
        res = fal_client.subscribe(a.endpoint, arguments=args)
    except Exception as e:
        log(id=cid, kind=a.kind, endpoint=a.endpoint, usd=a.usd, state="failed", error=str(e)[:300])
        sys.exit(f"fal call failed (logged): {e}")
    found = list(dict.fromkeys(urls(res)))
    log(id=cid, kind=a.kind, endpoint=a.endpoint, usd=a.usd, state="done", outputs=len(found))
    stamp = time.strftime("%H%M%S")
    for i, u in enumerate(found):
        ext = Path(u.split("?")[0]).suffix or ".bin"
        save(u, Path(a.out) / f"{stamp}-{cid}-{i}{ext}")
    print(f"${a.usd:.2f} on {a.endpoint}; total ${spent():.2f} of ${CAP:.2f}")


if __name__ == "__main__":
    main()
