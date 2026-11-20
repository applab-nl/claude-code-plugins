#!/usr/bin/env python3
"""Rebuild the explainer skill's assets from prompts copied from Futurepedia's AI Style Atlas.

Usage:
    python3 -I explainer/tools/build_assets.py <prompts-dir> [--variants <variants.json>]

<prompts-dir> holds one default-option prompt per style (*.txt), as copied with each card's
"Copy prompt" button (storyboard on, voiceover off). --variants is a JSON object of
{"<name>|<mode>|<voiceover>|sb=<bool>|...": prompt} captures covering the storyboard and
voiceover switches. When given, the four templates in skills/explainer/references/rules/ are
regenerated from it; otherwise the existing ones are used.

Writes skills/explainer/assets/{lib,styles}/ and references/catalog.md, then checks that
scripts/prompt.py --full reproduces every input prompt byte for byte. Fails (exit 1) without
writing anything when the inputs don't fit the known structure: shared libraries that differ,
instructions that don't come back exactly from the template, missing sections or fields, or a
repeated styleId. Running it twice gives identical output.
"""
import argparse
import json
import re
import sys
from pathlib import Path

PLUGIN = Path(__file__).resolve().parent.parent
SKILL = PLUGIN / "skills" / "explainer"
sys.path.insert(0, str(SKILL / "scripts"))
import prompt  # noqa: E402  (the skill's own renderer; one source of truth for the format)

FENCE = re.compile(r"```js\n(.*?)\n```", re.S)
TITLE = re.compile(r'"([^"]+)" visual style \(([^)]+)\)')
FONTS = re.compile(
    r"- Load these Google Fonts before the first draw \(await document\.fonts\.load for each spec you use\): (.*)\n"
    r"  (<link [^\n]*>)\n"
)
TOPIC = re.compile(r'it explains "([^"]+)"')
SOURCE_HDR = re.compile(r"REFERENCE STYLE SOURCE \(styles/([a-z0-9-]+)\.js; W/H_ are always 1280x720\)")
CARD_FIELDS = [("name", "Name"), ("family", "Family"), ("look", "Look"), ("motion", "Motion"), ("howItExplains", "How it explains")]
NO_SOUND_SENTENCE = "`draw()` is the single hero frame of the style. "


class Bad(Exception):
    pass


def parse(s):
    """Split one copied prompt into (style fields, instructions, harness, sound, source)."""
    try:
        i_card = s.index("STYLE CARD\n")
        i_lib = s.index("H HELPER LIBRARY (")
        i_snd = s.index("SOUND KIT (lib/sound.js)")
        i_src = s.index("REFERENCE STYLE SOURCE (")
    except ValueError as e:
        raise Bad(f"missing section: {e}")
    head, card = s[:i_card], s[i_card:i_lib]
    blocks = [FENCE.search(s, i) for i in (i_lib, i_snd, i_src)]
    if not all(blocks):
        raise Bad("missing ```js block")
    harness, sound, source = (b.group(1) for b in blocks)

    style = {}
    m = SOURCE_HDR.search(s, i_src)
    if not m:
        raise Bad("cannot read the styleId")
    style["styleId"] = m.group(1)
    for key, label in CARD_FIELDS:
        m = re.search(rf"^{re.escape(label)}: (.*)$", card, re.M)
        if not m:
            raise Bad(f"style card has no {label}")
        style[key] = m.group(1)
    fm = FONTS.search(head)
    style["fonts"] = {"families": fm.group(1).split(", "), "link": fm.group(2)} if fm else None
    tm = TOPIC.search(head)
    style["demoTopic"] = tm.group(1) if tm else None
    # Every reference has sound design. The site's prompt names `explainerSound(k)` only when the
    # source defines it inline; a few sources assign a named function (explainerSound: fooSound).
    if "explainerSound" not in source:
        raise Bad("reference source has no explainerSound")
    style["inlineExplainerSound"] = prompt.SOUND_CLAUSE in head
    if style["inlineExplainerSound"] != bool(re.search(r"explainerSound\(k\)\s*\{", source)):
        raise Bad("explainerSound wording and reference source disagree")
    return style, head, harness, sound, source


def tokenize(head, style):
    """Inverse of prompt.render(): put placeholders back where a style's own fields are."""
    m = TITLE.search(head)
    if not m or m.group(1) != style["name"] or m.group(2) != style["family"]:
        raise Bad("title line does not match the style card")
    out = head[: m.start()] + '"{{NAME}}" visual style ({{FAMILY}})' + head[m.end():]
    if style["fonts"]:
        out = FONTS.sub("{{FONTS}}", out, count=1)
    if style["demoTopic"]:
        out = TOPIC.sub('it explains "{{DEMO_TOPIC}}"', out, count=1)
    if style["inlineExplainerSound"]:
        out = out.replace(prompt.SOUND_CLAUSE, "{{SOUND_CLAUSE}}", 1)
    else:
        out = out.replace(NO_SOUND_SENTENCE, "`draw()` is the single hero frame of the style{{SOUND_CLAUSE}}. ", 1)
    return out


def templates_from_variants(path):
    data = json.loads(path.read_text())
    if isinstance(data, str):
        data = json.loads(data)
    templates = {}
    for key, text in data.items():
        name, mode, vo, sb = key.split("|")[:4]
        if mode != "Explainer" or not text:
            continue  # "Style clip" mode yields the same prompt; skip it
        style, head, *_ = parse(text)
        t = tokenize(head, style)
        slot = f"{'voiceover' if vo == 'With voiceover' else 'plain'}-{'storyboard' if sb == 'sb=true' else 'direct'}"
        if templates.setdefault(slot, t) != t:
            raise Bad(f"option variant {slot} differs between styles ({name})")
    if sorted(templates) != ["plain-direct", "plain-storyboard", "voiceover-direct", "voiceover-storyboard"]:
        raise Bad(f"expected the 4 storyboard/voiceover variants, got {sorted(templates)}")
    return templates


def js_header(style):
    return "/* @explainer-style\n" + json.dumps(style, indent=2, ensure_ascii=False) + "\n*/\n"


def catalog(styles):
    lines = [
        "# Style catalog",
        "",
        f"{len(styles)} styles from the AI Style Atlas, grouped by family. Pick by `styleId`.",
        "Generated by `tools/build_assets.py`; do not edit by hand.",
        "",
    ]
    fams = {}
    for s in styles:
        fams.setdefault(s["family"], []).append(s)
    for fam in sorted(fams):
        lines += [f"## {fam}", "", "| styleId | Name | Look |", "|---|---|---|"]
        lines += [f"| `{s['styleId']}` | {s['name']} | {s['look'].replace('|', '/')} |" for s in fams[fam]]
        lines.append("")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("prompts", type=Path)
    ap.add_argument("--variants", type=Path)
    a = ap.parse_args()

    if a.variants:
        try:
            templates = templates_from_variants(a.variants)
        except Bad as e:
            sys.exit(f"variants: {e}")
    else:
        templates = {p.stem: p.read_text() for p in prompt.RULES.glob("*.txt")}
    default = templates["plain-storyboard"]

    files = sorted(a.prompts.glob("*.txt"))
    if not files:
        sys.exit(f"no *.txt prompts in {a.prompts}")
    parsed, errors, libs, seen = [], [], {}, {}
    for f in files:
        text = f.read_text()
        try:
            style, head, harness, sound, source = parse(text)
            if style["styleId"] in seen:
                raise Bad(f"styleId {style['styleId']} also used by {seen[style['styleId']]}")
            seen[style["styleId"]] = f.name
            for name, code in (("harness", harness), ("sound", sound)):
                if libs.setdefault(name, (code, f.name))[0] != code:
                    raise Bad(f"lib/{name}.js differs from {libs[name][1]}")
            if prompt.render(default, style) != head:
                raise Bad("instructions do not come back exactly from the default template")
        except Bad as e:
            errors.append(f"{f.name}: {e}")
            continue
        parsed.append((style, source, text))
    if errors:
        sys.exit("refusing to write assets:\n  " + "\n  ".join(errors))

    prompt.RULES.mkdir(parents=True, exist_ok=True)
    for slot, t in templates.items():
        (prompt.RULES / f"{slot}.txt").write_text(t)
    prompt.STYLES.mkdir(parents=True, exist_ok=True)
    for old in prompt.STYLES.glob("*.js"):
        old.unlink()
    parsed.sort(key=lambda p: p[0]["styleId"])
    for style, source, _ in parsed:
        (prompt.STYLES / f"{style['styleId']}.js").write_text(js_header(style) + source + "\n")
    prompt.LIB.mkdir(parents=True, exist_ok=True)
    for name in ("harness", "sound"):
        (prompt.LIB / f"{name}.js").write_text(libs[name][0] + "\n")
    (SKILL / "references" / "catalog.md").write_text(catalog([s for s, _, _ in parsed]))

    mismatched = [s["styleId"] for s, _, text in parsed if prompt.build(s["styleId"], full=True) != text.rstrip("\n")]
    if mismatched:
        sys.exit(f"round-trip check failed for: {', '.join(mismatched)}")
    print(f"wrote {len(parsed)} styles, 2 libs, 4 rule templates, catalog.md; all {len(parsed)} prompts round-trip")


if __name__ == "__main__":
    main()
