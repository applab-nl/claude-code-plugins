#!/usr/bin/env python3
"""Print the build brief for one explainer style, as the AI Style Atlas would give it.

Usage:
    python3 prompt.py <styleId> [--voiceover] [--no-storyboard] [--full]
    python3 prompt.py --list

Default output: the instructions (for the chosen options) followed by the STYLE CARD. The
H helper library, SOUND kit and reference source are files next to this script
(../assets/lib/*.js, ../assets/styles/<styleId>.js); read them from there.
--full appends those three sections too, giving the complete pasteable prompt.
"""
import argparse
import json
import re
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
RULES = SKILL / "references" / "rules"
STYLES = SKILL / "assets" / "styles"
LIB = SKILL / "assets" / "lib"

SOUND_CLAUSE = ", and `explainerSound(k)` is its sound design"
HEADER = re.compile(r"\A/\* @explainer-style\n(.*?)\n\*/\n", re.S)


def load_style(style_id):
    path = STYLES / f"{style_id}.js"
    if not path.is_file():
        raise SystemExit(f"unknown style '{style_id}'. Run with --list, or see references/catalog.md")
    text = path.read_text()
    m = HEADER.match(text)
    if not m:
        raise SystemExit(f"{path} has no @explainer-style header")
    return json.loads(m.group(1)), text[m.end():].rstrip("\n")


def render(template, style):
    fonts = ""
    if style["fonts"]:
        fonts = (
            "- Load these Google Fonts before the first draw (await document.fonts.load for each spec you use): "
            + ", ".join(style["fonts"]["families"]) + "\n  " + style["fonts"]["link"] + "\n"
        )
    return (
        template.replace("{{FONTS}}", fonts)
        .replace("{{NAME}}", style["name"])
        .replace("{{FAMILY}}", style["family"])
        .replace("{{DEMO_TOPIC}}", style["demoTopic"] or "")
        .replace("{{SOUND_CLAUSE}}", SOUND_CLAUSE if style["inlineExplainerSound"] else "")
    )


def card(style):
    return (
        "STYLE CARD\n"
        f"Name: {style['name']}\nFamily: {style['family']}\nLook: {style['look']}\n"
        f"Motion: {style['motion']}\nHow it explains: {style['howItExplains']}\n\n"
    )


def code_sections(style_id, source):
    harness = (LIB / "harness.js").read_text().rstrip("\n")
    sound = (LIB / "sound.js").read_text().rstrip("\n")
    return (
        "H HELPER LIBRARY (lib/harness.js; the registerStyle/H.render parts are only needed by the original gallery)\n"
        f"```js\n{harness}\n```\n\n"
        f"SOUND KIT (lib/sound.js)\n```js\n{sound}\n```\n\n"
        f"REFERENCE STYLE SOURCE (styles/{style_id}.js; W/H_ are always 1280x720)\n```js\n{source}\n```"
    )


def build(style_id, voiceover=False, storyboard=True, full=False):
    style, source = load_style(style_id)
    slot = f"{'voiceover' if voiceover else 'plain'}-{'storyboard' if storyboard else 'direct'}"
    out = render((RULES / f"{slot}.txt").read_text(), style) + card(style)
    return out + code_sections(style_id, source) if full else out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("style_id", nargs="?")
    ap.add_argument("--voiceover", action="store_true", help="time the piece to a voiceover")
    ap.add_argument("--no-storyboard", action="store_true", help="skip the storyboard approval step")
    ap.add_argument("--full", action="store_true", help="append the libraries and reference source")
    ap.add_argument("--list", action="store_true", help="list styleIds with names")
    a = ap.parse_args()
    if a.list:
        for p in sorted(STYLES.glob("*.js")):
            s, _ = load_style(p.stem)
            print(f"{p.stem}\t{s['name']}\t{s['family']}")
        return
    if not a.style_id:
        ap.error("styleId required (or --list)")
    sys.stdout.write(build(a.style_id, a.voiceover, not a.no_storyboard, a.full))


if __name__ == "__main__":
    main()
