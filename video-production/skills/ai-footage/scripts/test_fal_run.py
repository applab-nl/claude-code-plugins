"""Upload guard check for fal_run.inline(). Run: python test_fal_run.py"""
import os
import tempfile
from pathlib import Path

from fal_run import inline


def refused(value):
    try:
        inline(value)
    except SystemExit:
        return True
    return False


with tempfile.TemporaryDirectory() as tmp, tempfile.TemporaryDirectory() as outside:
    os.chdir(tmp)
    Path("still.png").write_bytes(b"png")
    Path(".env.local").write_text("SECRET=1")
    Path("cv.pdf").write_bytes(b"pdf")
    Path(outside, "photo.png").write_bytes(b"png")
    Path("alias.png").symlink_to(Path(tmp).resolve() / ".env.local")

    assert inline({"image_url": ["still.png"]})["image_url"][0].startswith("data:image/png;base64,")
    assert inline("a prompt, not a file") == "a prompt, not a file"
    assert refused({"prompt": ".env.local"})
    assert refused("cv.pdf")
    Path("source.ts").write_text("export const secret = 1")  # mimetypes calls this video/mp2t
    Path("dump.png.gz").write_bytes(b"gz")  # mimetypes calls this image/png
    assert refused("source.ts")
    assert refused("dump.png.gz")
    assert refused(str(Path(outside, "photo.png")))
    assert refused("alias.png")

print("ok")
