#!/usr/bin/env python3
"""Inline the H helper library and SOUND kit into an explainer HTML file, unchanged, and lint it.

Usage:
    python3 inline_libs.py <file.html>

Write the HTML with these two marker lines where the libraries go (before your own script):
    <!-- @lib harness -->
    <!-- @lib sound -->
Each marker becomes a <script> holding the exact file from ../assets/lib/. Running it again on an
already-inlined file refreshes the libraries in place (between the @lib begin/end comments).
Then a few cheap checks run on your own code; problems are printed and exit code is 1.
"""
import re
import sys
from pathlib import Path

LIB = Path(__file__).resolve().parent.parent / "assets" / "lib"
MARKER = re.compile(r"<!-- @lib (harness|sound) -->")
BLOCK = re.compile(r"<!-- @lib (harness|sound) begin -->.*?<!-- @lib \1 end -->", re.S)


def block(name):
    code = (LIB / f"{name}.js").read_text()
    return f"<!-- @lib {name} begin -->\n<script>\n{code}</script>\n<!-- @lib {name} end -->"


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    path = Path(sys.argv[1])
    html = path.read_text()
    html = BLOCK.sub(lambda m: block(m.group(1)), html)
    html = MARKER.sub(lambda m: block(m.group(1)), html)
    path.write_text(html)

    problems = []
    for name in ("harness", "sound"):
        if html.count(f"<!-- @lib {name} begin -->") != 1:
            problems.append(f"lib {name}: expected exactly one '<!-- @lib {name} -->' marker")
    own = BLOCK.sub("", html)
    checks = [
        (r"window\.seek\s*=", "window.seek is not exposed"),
        (r"window\.DURATION\s*=", "window.DURATION is not exposed"),
        (r"window\.scoreSound\s*=", "window.scoreSound is not exposed"),
        (r"function\s+explainer\s*\(|explainer\s*=\s*(\(|function)", "no explainer(ctx, W, H_, t) function"),
        (r"SOUND\.live\(", "the player never calls SOUND.live(...)"),
    ]
    problems += [msg for pat, msg in checks if not re.search(pat, own)]
    if re.search(r"Math\.random\s*\(", own):
        problems.append("Math.random() used: frames must be a pure function of t (use H.rng / H.makeNoise)")
    size = len(html.encode()) / 1024
    if problems:
        print(f"{path} ({size:.0f} KB) has problems:\n  - " + "\n  - ".join(problems))
        sys.exit(1)
    print(f"{path}: libraries inlined, checks passed ({size:.0f} KB)")


if __name__ == "__main__":
    main()
