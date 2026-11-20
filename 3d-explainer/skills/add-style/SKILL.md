---
name: add-style
description: Use when the user wants to add a new look to 3d-explainer from a style prompt — the long "I want a short 3D motion graphic made with three.js in the <X> style" text with a STYLE CARD, STAGE KIT, SOUND KIT and REFERENCE STYLE SOURCE — whether they paste it, point at a file, or say "import this style", "add the <X> style", "I have another style like Tiny Diorama".
---

# Add a style to 3d-explainer

A style prompt is mostly the same every time: generic workflow text, the shared STAGE and SOUND kits, and two
style-specific parts (the card and the reference source). `import-style.mjs` splits it so only the new parts are
stored, and reports anything that differs from what is already bundled.

`MS` below is the 3d-explainer skill's directory: `../3d-explainer` from this skill's base directory.

## 1. Get the prompt into a file without retyping it

The prompt is ~1,100 lines of code; never retype it. In order of preference:

- the user points at a file → use it;
- the prompt is still on their clipboard (macOS) → `node MS/scripts/import-style.mjs --clipboard`;
- otherwise ask them to save it, for example by typing `! pbpaste > /tmp/style-prompt.txt` after copying it.

## 2. Import

```bash
node MS/scripts/import-style.mjs <prompt.txt>        # add --force to replace an existing style
```

It writes `MS/styles/<id>/`:

| File | Content |
|---|---|
| `card.md` | frontmatter (id, name, family, fonts, reference topic, duration, samples) and the card |
| `reference.js` | the reference source, verbatim |
| `source-prompt.md` | the prompt with the code blocks replaced by notes, for provenance |
| `lib/<file>.js` | only when that prompt's copy of a kit or library differs from `MS/assets/lib` |

Any other `NAME (lib/<file>.js ...)` block in the prompt (for example `TEXT3D (lib/text3d.js)`) is an extra library:
if `MS/assets/lib` doesn't have it yet it is saved there as a shared library, and the card's `libs:` line lists it
so `assemble.mjs` loads it after the stage kit for this style.

and prints two reports. Act on both:

- **Kit differs.** Read the diff. If it only adds things (new helpers, new sounds), it's probably a newer version:
  tell the user and offer to promote it to `MS/assets/lib/` once every existing style's reference still renders
  (step 4 for each). Otherwise leave it in the style's `lib/`; assemble uses it for that style only.
- **Generic sections differ** from the baseline prompt (for example `SOUND (with voiceover)`, other length limits,
  other render instructions). Write each difference into card.md under a `## Prompt differences` heading as an
  instruction, so 3d-explainer follows it for this style.

## 3. Finish card.md

Replace the TODO under "Working with the reference" by reading `reference.js` in full. Follow
`MS/styles/tiny-diorama/card.md`:
- a table of the reference's parts: the topic's content block and schedule (replace), the style's own builder kit
  (copy unchanged; name its functions), `registerStyle` metadata and `render` (keep), `build`/`sound` (rewrite,
  keeping the named rig: lights, backdrop, camera paths, lens behaviour);
- 3–5 bullets on the habits that make the look: where words live, how the camera and focus move, how light changes
  over the clip, what the one accent colour is reserved for.

## 4. Verify it renders

```bash
node MS/scripts/lint-style.mjs MS/styles/<id>/reference.js
node MS/scripts/assemble.mjs MS/styles/<id>/reference.js --out /tmp/<id>/player.html --title "<Style Name>"
node MS/scripts/render.mjs /tmp/<id>/player.html --preview --check-purity --out /tmp/<id>/stills
```

Look at `/tmp/<id>/stills/contact.png`: it should look like the style card describes. If lint flags something in
the reference itself, note it in card.md rather than editing the reference.

## 5. Ship

The new style is a change to the 3d-explainer plugin: bump the patch version in `.claude-plugin/plugin.json` and the
marketplace entry, add a CHANGELOG line, and run `node MS/scripts/index-styles.mjs` to rebuild `references/styles.md`
(how 3d-explainer picks a style) and the plugin README's style table.
