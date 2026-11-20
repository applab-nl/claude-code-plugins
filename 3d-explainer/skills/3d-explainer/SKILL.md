---
name: 3d-explainer
description: Use when someone wants a short 3D motion graphic, animated explainer or three.js explainer video in one of the bundled looks (Tiny Diorama and any style imported with add-style), or names one of those styles ("in the Tiny Diorama style", "a little diorama video about X"). Storyboard first as rendered stills, approval gate, then a self-contained HTML player and an MP4 rendered in headless Chrome with synthesized sound at -15 LUFS. The stage and sound kits are spliced in by script, never retyped.
---

# 3D Explainer

Short (7–12 s) 3D explainers in a fixed look, built on one rendering kit (`assets/lib/stage.js`: accumulation
rendering for real motion blur, depth of field and soft shadows) and one sound kit (`assets/lib/sound.js`). Each look
lives in `styles/<id>/`: a style card and the full source of a reference animation in that look.

**You write exactly one file per piece, `style.js`.** Scripts splice it with the kits and a page template, render
stills and video, and check it. Never paste or retype the kits; never hand-edit an assembled HTML file.

Paths below are relative to this skill's base directory, `SKILL_DIR`. Work in `./motion/<slug>/` in the user's
current directory unless they name another place.

## 0. Setup (once per machine)

```bash
cd SKILL_DIR/scripts && npm install          # Playwright only; it drives the installed Google Chrome
ffmpeg -version | head -1                     # must be on PATH
```

## 1. Intake

1. **Content.** If the user gave no topic or script, ask for it before anything else.
2. **Style.** If the user named one, use it. Otherwise read `references/styles.md` (one entry per style, grouped by
   family) and pick the one whose "Good for" fits the content; offer two or three if it's a close call. Then read only
   that style's `styles/<id>/card.md`; its `## Prompt differences` (if any) win over this file for that style.
3. **Facts.** List every fact or number the piece will show. Check the ones you can; mark the rest as assumptions.

## 2. Plan the story (in your head, then in the storyboard)

- Work out what the content needs to **show** first, then how this look would build those things. The reference
  shows the look, not the story: do not reuse its objects, layout or beats unless the content calls for them.
- An explainer, not a title card: 3–6 beats where things happen to objects or characters and each beat follows from
  the last. The picture does the telling; words are small captions and labels, never the subject of a shot. End on
  the result of the process or the end of the story, not on a headline, slogan or logo.
- Flow: when the next idea builds on the last, stay in the same world and move the camera to where it happens. When
  the story really moves on, change scene the way the look would (a turn of the set, a page, a passing object that
  wipes the frame, a change of light). No hard cuts. Fit the beat count to the content, not to the reference.
- Write one schedule object `T` with every event time. Picture and sound both read it.

## 3. Storyboard → approval gate

1. Read `styles/<id>/reference.js` in full and the card's "Working with the reference" table. Read
   `references/stage-api.md`. Open the kit source only if the sheet is not enough.
2. Write `motion/<slug>/style.js` in the reference's shape: content block, schedule `T`, the style's own builder kit
   **copied unchanged** (keep `id` = the base style's id, so assemble finds its kit version and the `libs:` its card
   lists), then `registerStyle({...})` with the reference's `render` settings, `fonts`, your `topic`,
   `duration`, and a `storyboard` field:
   ```js
   storyboard: {
     beats: [{ at: 1.2, start: 0, end: 2.4, text: 'exact on-screen text', change: 'what moves or changes to get here',
               camera: 'what the camera does', sound: 'key sounds' }],
     assumptions: ['facts or numbers you had to assume'],
   },
   ```
   `build(S)` at this stage is a block-out: the real layout and camera, simple forms in the style's materials, light
   and grade, enough that each beat's key frame (`at`) already looks like the finished piece. No sound yet.
3. Check and assemble:
   ```bash
   node SKILL_DIR/scripts/lint-style.mjs motion/<slug>/style.js --storyboard
   node SKILL_DIR/scripts/assemble.mjs motion/<slug>/style.js --mode storyboard --out motion/<slug>/storyboard.html --title "<Two To Four Words>"
   node SKILL_DIR/scripts/render.mjs motion/<slug>/storyboard.html --preview --samples 16 --out motion/<slug>/stills
   ```
   (`render.mjs` drives the storyboard page too: it grabs each beat's `at`.) **Look at `stills/contact.png` yourself**
   and fix framing, legibility and anything that reads wrong before showing it.
4. Show it: publish `storyboard.html` with the Artifact tool if you have one (the template already meets its page
   contract: title, theme tokens, pinned CDN, phone layout), otherwise give the path. Then **stop and wait** for the
   user's OK or changes. Do not build the animation before that.

## 4. Build

Same `style.js`; the storyboard's scene code is the starting point, not something to rewrite.

1. Finish the scene: real models in the style's idiom, all motion, light changes and the lens (focus band follows the
   story). Then the score in `sound(k)` from `references/sound-api.md`. Keep the `storyboard` field (the player
   ignores it) and update it if timings moved.
2. Rules for `update(t)`, which the kit calls many times per frame in any order:
   - set the whole scene for t; nothing may build up between calls (no `+=` on transforms, no state carried over)
   - no `Math.random`, `Date`, `performance.now`, timers; use `K.rng(seed)` in build and `K.hash` in update
   - everything built in code: no downloaded models, images, HDRIs, textures, addons
3. Craft: simple forms beautifully lit beat complicated models that look wrong; draw the subject accurately. It's
   video, often watched on a phone: every word the story needs is large, sharp and on screen long enough to read
   (about 0.4 s per word, 1.5 s minimum); the subject fills most of the frame; everything that matters stays in frame
   for the whole camera move; the first frame is already worth looking at; the last second holds.
4. Sound (full mix, no voiceover): each sound starts on the exact frame its event appears, read from `T`. Score the
   events that land (arrivals, labels, contacts, transitions, the key number, the result) with sounds the material
   would make: glass, plastic, paper, metal, motors. A quiet bed is welcome, music only if it suits the style. Effects
   in front, bed and music clearly under, small silences so the big hits read.
5. Check, assemble, look:
   ```bash
   node SKILL_DIR/scripts/lint-style.mjs motion/<slug>/style.js
   node SKILL_DIR/scripts/assemble.mjs motion/<slug>/style.js --out motion/<slug>/player.html --title "<Two To Four Words>"
   node SKILL_DIR/scripts/render.mjs motion/<slug>/player.html --preview --check-purity --out motion/<slug>/stills
   ```
   The purity check renders the same moments after jumping elsewhere and fails if the pictures differ. Look at the
   contact sheet; use `--at 0,3.5,9.9` for specific moments.
6. Show `player.html` (Artifact tool if available). The player has play/pause, scrub, time, a sound toggle and
   loop on by default; it renders 3 samples live and refines when paused; `window.seek(t)` renders at full quality.

## 5. Render the MP4 (when you have a shell)

```bash
node SKILL_DIR/scripts/render.mjs motion/<slug>/player.html --out motion/<slug>/<slug>.mp4
```

Every frame at the style's full sample count through ffmpeg (H.264, CRF 16), the score rendered offline and muxed with
two-pass loudnorm at -15 LUFS / -1.5 dBTP. A test pass with `--samples 4` takes well under a minute; the full one
takes several minutes at 72 samples. It fails loudly if WebGL falls back to software.

Then look at `<slug>-frames/contact.png`. Fix framing, lighting or legibility problems and render again before you
call it done. Report the MP4 path, its duration and anything you assumed.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `page error` from render/assemble output | the stack names `style.js:<line>`; fix there |
| purity check fails | something in update accumulates, or reads state set in an earlier call; set every value from t |
| software renderer | Chrome missing or GPU blocked; try `--channel chromium`, or `--allow-software` for a slow test |
| fonts look wrong | font specs must be `'<weight> <size>px "Family"'` so assemble can load them; or pass `--font "Family:wght@400;700"` |
| a style ships its own kit version | it sits in `styles/<id>/lib/`; assemble picks it up when `id` in style.js matches |
| `K.text3d` (or another helper) is undefined | the style needs an extra library: check `libs:` in its card.md and keep `id` equal to the base style's id, or pass `--lib text3d.js` |
