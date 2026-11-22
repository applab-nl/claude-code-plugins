---
name: video-styles
description: Use when a video, or one scene of it, should be made in a visual style from the style library — 86 2D canvas looks (flat-vector science, watercolor, whiteboard, film noir, papercraft, Manim-style math, pixel art, halftone pop and more) and 37 three.js 3D looks (Tiny Diorama, soft clay, voxel, paper pop-up, exploded view, studio product and more). Also for "animated explainer", "explainer video", "3D explainer", "explain X as an animation", a named AI Style Atlas style, "which styles are there", or opening the style gallery. Styled scenes become HyperFrames scenes, so they mix with UI scenes and get captions, voice and every channel ratio.
---

# Video styles

The style library: 2D canvas looks and 3D three.js looks, each with a full reference animation. A styled scene is
one file you write, `scenes/<scene>.style.js`, in the reference's shape. `scripts/build-scene.mjs` turns it into a
HyperFrames scene with its own synthesized sound, so it drops into any film next to UI scenes.

`SKILL_DIR` below is this skill's base directory. The library itself lives outside the plugin, in `STYLE_HOME`
(`$VIDEO_STYLES_HOME`, else `~/.cache/video-production/styles`): the AI Style Atlas material is never committed,
it is built on this machine.

## 0. Setup (once per machine)

```bash
cd SKILL_DIR/scripts && npm install                    # Playwright; it drives the installed Google Chrome
node SKILL_DIR/scripts/setup-styles.mjs --status       # what is installed
```

If the library is empty, build it from one of:
- an old install of the `explainer` / `3d-explainer` plugins: `--from-legacy ~/.claude/plugins` (the plugin cache), or
  a checkout of claude-code-plugins from before the merge (`git worktree add /tmp/old-plugins 662793b`, then
  `--from-legacy /tmp/old-plugins`);
- prompts copied from the AI Style Atlas site ("Copy prompt", one `.txt` per style, 2D or 3D): `--from-prompts <dir>`.

Setup ends by rendering the gallery stills (a few minutes; `--no-gallery` skips them). Ask before installing
anything; never script the Atlas site.

## 1. Pick the style

- **The gallery:** `<STYLE_HOME>/gallery/index.html`, two stills per style, filter by 2D / 3D / Product UI and family.
  Offer to open it (terminal-browser or the default browser) whenever the user is choosing.
- **Named style:** resolve it against `references/catalog.json`. Ids are `2d/<id>` and `3d/<id>`; a bare id or name
  resolves when unique. Four exist in both libraries (`low-poly`, `neon-sign`, `voxel`, `x-ray`): ask 2D or 3D.
- **Described look** ("hand-made and warm", "retro computer"): read `references/catalog.md` and suggest three, each
  with name, id, medium and one line, and point at the gallery.
- **Which medium:** 3D for physical processes, products, places and short hero moments (6–12 s per scene, GPU
  renders). 2D for longer narrated explanations, diagrams, data and anything with lots of words. UI scenes
  (`motion-system`, `product-ui-recreation`) for the real product. A film can mix all three; keep one look per film
  unless the brief asks for a deliberate change.

Record the choice in the brief (`video-brief`): a style per film, overrides per scene.

## 2. Write the scene

Read the build guide for the medium, then write `scenes/<scene>.style.js` in the reference's shape:
- 2D: `references/build-2d.md`
- 3D: `references/build-3d.md` (plus `references/stage-api.md`, `references/sound-api.md`)

Both carry a `storyboard` field (`beats: [{ at, start, end, text, change, camera, sound }]`, `assumptions`): the key
frames for the storyboard and the on-screen words `readcheck` checks.

Lint after every edit:

```bash
node SKILL_DIR/scripts/lint-style.mjs scenes/<scene>.style.js [--storyboard]
```

## 3. Build it into the HyperFrames project

```bash
node SKILL_DIR/scripts/build-scene.mjs scenes/<scene>.style.js --id <scene> --project <video dir> --size 1920x1080
```

It writes `compositions/<scene>.html`, the score as `assets/audio/<scene>.wav`, the fonts as local woff2 files, a
`data-texts` block with the storyboard words, and prints the host and audio lines to paste into `index.html` (set
`data-start`). Rebuild after every change to the style file; never edit the generated composition (it is large: 3D
scenes carry three.js inline). Options: `--samples 8` for fast 3D drafts, `--voiceover` when a voiceover runs over
the scene, `--size` per channel (each ratio is its own build, laid out for its frame).

## 4. Storyboard and checks

- Storyboard (when the brief has it on): build the block-out, then `video-storyboard` snapshots each beat's `at`.
- `hyperframes check`: a 3D scene reports three expected errors from the inlined three.js (`Math.random`,
  `performance.now`, `requestAnimationFrame`). Any other error is real. The `requestAnimationFrame` one also makes
  HyperFrames use screenshot capture with virtual time, which is what keeps 3D renders bit-identical.
- 3D purity: the `assemble` + `render --check-purity` lines in `build-3d.md`.
- Then the usual loop in `hyperframes-scene` (snapshots, render twice and compare) and `render-and-export`.

## Rendering 3D

HyperFrames' Chrome uses the GPU when it has one (its log prints `browserGpuMode probe → hardware`). A 14 s mixed
2D/3D film at 72 samples renders in under a minute on an M1 Max. Without a GPU the 3D scene throws ("WebGL is running
in software"); rebuild it with `--prerender` (renders the clip with `render.mjs` and places it as video).

## Adding a style

Use `add-style`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "style library is not set up" | step 0 |
| scene blank or frozen | the style threw while loading: build-scene prints the error; check the browser console in `hyperframes preview` |
| wrong font | the font spec must be `'<weight> <size>px "Family"'` so build-scene can fetch it; rebuild |
| purity check fails | something in `update(t)` accumulates or reads earlier state; set every value from t |
| `K.text3d` (or another helper) undefined | keep `id` equal to the base style's id so its card's `libs:` are loaded |
| 2D layout cut off in 9:16 | set `design: { w: 720, h: 1280 }` and lay the beats out for the tall frame |
