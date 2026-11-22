---
name: add-style
description: Use when the user wants a new look added to the video style library from an AI Style Atlas prompt, 2D ("I want an animated explainer made in the <X> visual style", with an H HELPER LIBRARY, SOUND KIT and REFERENCE STYLE SOURCE) or 3D ("a short 3D motion graphic made with three.js in the <X> style", with a STYLE CARD, STAGE KIT and SOUND KIT), whether pasted, in a file, or "import this style", "add the <X> style".
---

# Add a style to the library

A style prompt is mostly the same every time: generic instructions, the shared kits and two style-specific parts
(the card and the reference source). The importers keep only the new parts, in the local style library
(`STYLE_HOME`, see `video-styles`). Nothing from the prompt goes into the plugin repo: only a catalog entry written
in our own words.

`VS` below is the video-styles skill's directory: `../video-styles` from this skill's base directory.

## 1. Get the prompt into a file without retyping it

The prompt is about 1,100 lines of code; never retype it. In order of preference:
- the user points at a file: use it;
- the prompt is on their clipboard (macOS): ask them to run `! pbpaste > /tmp/style-prompt/new.txt`;
- otherwise ask them to save it as a `.txt` file.

## 2. Import

```bash
node VS/scripts/setup-styles.mjs --from-prompts /tmp/style-prompt --no-gallery      # --force to replace a style
```

It detects 2D or 3D. For 3D it runs `import-style.mjs`, which prints two reports. Act on both:
- **Kit differs:** read the diff. If it only adds things (new helpers, new sounds), it is probably a newer kit: tell
  the user and offer to promote it to `<STYLE_HOME>/3d/lib/` once every existing style still renders (step 4).
  Otherwise leave it in the style's `lib/`; it is used for that style only.
- **Generic sections differ** from the baseline prompt (another length, other sound rules): write each difference
  into the style's `card.md` under `## Prompt differences` as an instruction.

For 2D a differing `lib/harness.js` or `lib/sound.js` is reported and the installed one kept; tell the user.

## 3. Finish the card (3D)

Replace the TODO under "Working with the reference" in `<STYLE_HOME>/3d/styles/<id>/card.md` by reading
`reference.js` in full: a table of the reference's parts (the topic's content block and schedule: replace; the
style's own builder kit: copy unchanged, name its functions; `registerStyle` metadata and `render`: keep;
`build`/`sound`: rewrite, keeping the named rig), then 3–5 bullets on the habits that make the look.

## 4. Verify it renders

3D:
```bash
node VS/scripts/lint-style.mjs <STYLE_HOME>/3d/styles/<id>/reference.js
node VS/scripts/assemble.mjs <STYLE_HOME>/3d/styles/<id>/reference.js --out /tmp/<id>/player.html
node VS/scripts/render.mjs /tmp/<id>/player.html --preview --check-purity --out /tmp/<id>/stills
```
2D: `node VS/scripts/lint-style.mjs <STYLE_HOME>/2d/styles/<id>.js`, then the stills in step 6.

Look at the stills: they should look like the card describes. If lint flags the reference itself, note it in the
card instead of editing the reference.

## 5. Catalog entry (this is the only change to the plugin)

Add one object to `VS/references/catalog.json` and one line to `VS/references/catalog.md`, in the family's section:
`id` (`2d/<id>` or `3d/<id>`), `medium`, `family`, `name`, `look` (≤ 18 words), `goodFor` (≤ 14 words), `motion`
(≤ 12 words). **Write these in your own words** after looking at the stills; never copy sentences from the prompt.

## 6. Gallery stills

```bash
node VS/scripts/gallery.mjs --ids <medium>/<id>
```

It renders the stills and rewrites the gallery page. Open the page and check the new card.

## 7. Ship

A catalog change is a change to `video-production`: bump its patch version in `.claude-plugin/plugin.json` and the
marketplace entry, add a CHANGELOG line. The style itself stays local; tell the user that teammates import the same
prompt on their machines.
