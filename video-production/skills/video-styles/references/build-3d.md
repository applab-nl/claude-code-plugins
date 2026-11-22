# Building a 3D style scene

A 3D style is a three.js look built on the stage kit (`K`: accumulation rendering for real motion blur, depth of field
and soft shadows) plus a reference animation. Your scene is one file, `scenes/<scene>.style.js`, in the reference's
shape. `build-scene.mjs` splices the vendored three.js, the kits and your file into a HyperFrames scene. Never paste or
retype the kits.

## Read first

- `<STYLE_HOME>/3d/styles/<id>/reference.js` in full, and the card's "Working with the reference" table in `card.md`
  (what to copy unchanged, what to replace). Its `## Prompt differences`, if any, win over this file.
- `references/stage-api.md` and `references/sound-api.md`. Open the kit source (`<STYLE_HOME>/3d/lib/stage.js`) only if
  the sheets are not enough.

## Plan the story

- Work out what the content needs to show, then how this look would build those things. The reference shows the
  look, not the story: don't reuse its objects, layout or beats unless the content calls for them.
- 3–6 beats where things happen to objects; each follows from the last. The picture tells; words are small captions
  and labels, never the subject of a shot. End on the result, not on a slogan or logo.
- When the next idea builds on the last, stay in the same world and move the camera. When the story moves on, change
  scene the way the look would (a turn of the set, a page, a passing object that wipes the frame, a light change).
  No hard cuts.
- One schedule object `T` holds every event time. Picture and sound both read it.
- 3D scenes are short: 6–12 s each. A longer film strings several scenes, or cuts to UI and 2D scenes between them.

## The file

Copy the reference's shape: content block, `T`, the style's own builder kit **unchanged** (keep `id` = the base
style's id so its kit version and extra `libs:` are found), then `registerStyle({...})` with the reference's `render`
settings, `fonts`, your `topic`, `duration`, a `storyboard` field (`{ beats: [{ at, start, end, text, change, camera,
sound }], assumptions: [] }`), `build(S)` and `sound(k)`.

For the storyboard gate, `build(S)` is a block-out: the real layout and camera, simple forms in the style's
materials, light and grade, so each beat's key frame (`at`) already reads like the finished piece. No sound yet.

## Rules for `update(t)`

The stage calls it many times per frame, in any order:
- set the whole scene for t; nothing builds up between calls (no `+=` on transforms, no state carried over)
- no `Math.random`, `Date`, `performance.now`, timers: `K.rng(seed)` in build, `K.hash` in update
- everything built in code: no downloaded models, images, HDRIs, textures or addons

## Craft

- Simple forms beautifully lit beat complicated models that look wrong. Draw the subject accurately.
- Every word the story needs is large, sharp and on long enough to read (0.5 s + 0.3 s per word, 1.5 s minimum for
  key words); the subject fills most of the frame; what matters stays in frame for the whole camera move; the first
  frame is worth looking at; the last second holds.
- Sound (`sound(k)`): each sound starts on the frame its event appears, read from `T`. Score arrivals, labels,
  contacts, transitions, the key number and the result with sounds the material would make (glass, plastic, paper,
  metal, motors). A quiet bed is welcome, music only if it suits the look. Effects in front, small silences.

## Frame shapes

`S.W`/`S.H` follow the scene size (`--size`). The reference camera is framed for 16:9: for 9:16, 1:1 or 4:5, reframe
it (pull back or raise the camera, stack the set vertically, keep labels inside the safe zones). Check every key
frame at the target size before showing the storyboard.

## Checks before the scene goes into a film

```bash
node SKILL_DIR/scripts/lint-style.mjs scenes/<scene>.style.js
node SKILL_DIR/scripts/assemble.mjs scenes/<scene>.style.js --out /tmp/<scene>/player.html --aspect 16:9
node SKILL_DIR/scripts/render.mjs /tmp/<scene>/player.html --preview --check-purity --out /tmp/<scene>/stills
```

The purity check renders the same moments after jumping elsewhere and fails if the pictures differ. Look at
`stills/contact.png`. The assembled `player.html` is also a quick standalone preview with play and scrub.
