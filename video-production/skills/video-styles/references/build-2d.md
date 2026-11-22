# Building a 2D style scene

A 2D style is a canvas drawing library plus a full reference explainer in one look. Your scene is one file,
`scenes/<scene>.style.js`, written in the reference's shape: you keep its medium and replace its story.
`build-scene.mjs` wraps it into a HyperFrames scene. Never retype the `H` library or the `SOUND` kit; they are
spliced in.

## Read first

- The reference: `<STYLE_HOME>/2d/styles/<id>.js`, in full. Its header comment is the style card (look, motion, how it
  explains, fonts). `draw(ctx, W, H, t)` is the hero frame; `explainer(ctx, W, H, t)` is a complete explainer;
  `explainerSound(k)` is its score.
- `<STYLE_HOME>/2d/lib/harness.js` (the `H` helpers: seeded random, noise, easing, shapes, text) and `2d/lib/sound.js`
  (the `SOUND` kit). Read them once; write against them.
- If `<STYLE_HOME>/2d/rules/` or `2d/prompts/<id>.txt` exists, it holds the style's original build notes. The rules
  below cover the same ground; read those only when a style behaves unexpectedly.

## The file

```js
{
  // content block: the facts, numbers and words of THIS scene
  // one schedule object T with every event time (picture and sound both read it)
  // the reference's own drawing helpers and finishing passes, copied unchanged
  registerStyle({
    id: '<base style id>', name: '<scene title>',
    fonts: ['800 64px "Nunito"', ...],          // every font spec you draw with; the adapter waits for them
    design: { w: 1280, h: 720 },               // the box you draw in; 720x1280 for a vertical cut (see below)
    explainerDuration: T.end,
    storyboard: { beats: [{ at, start, end, text, change, camera, sound }], assumptions: [] },
    explainer(ctx, W, H_, t) { /* draw the whole frame for t */ },
    explainerSound(k) { /* schedule every sound from T */ },
  });
}
```

## Staying in the style

- Keep the medium, change the story. Reuse the reference's palette, textures, lettering, line quality, arrows, label
  and number treatment, transitions and timing. Replace the subject, the words and what is drawn.
- Don't carry the reference's props (its characters, mascots, icons) into a topic they don't belong to. Draw the real
  subject correctly and check every fact you show.
- The finishing passes are the style: grain, paper, ink bleed, misregistration, glow, scanlines. Copy those functions
  and run them on every frame at full strength. A scene without them reads as a generic vector animation.
- Pure function of t: randomness only from `H.rng(seed)` / `H.makeNoise(seed)`, created inside the draw or cached once
  at load. Never `Math.random`, `Date`, timers. Cached static textures are fine.

## Story and pacing

- A hook that clears within about 2 s, then a change every 1–2 s. Arrows draw on to show cause and flow. Labels land
  on what they name. One emphasis move on the key moment. End on the takeaway, held about 1 s.
- When the next idea builds on the last, stay in the same picture and transform it (a label becomes the next heading,
  a counter grows into a chart, the view travels). When the story really moves on, change scene the way the medium
  would, as the reference does. Neither a cut on every beat nor one forced continuous shot.

## Legibility (in the 1280x720 design box)

- Headlines ≥ 44 px, any label the story needs ≥ 28 px, key numbers ≥ 64 px. Each beat fills most of the frame.
- Every word on screen is in `storyboard.beats[].text` with its real start and end: `readcheck` reads them, and
  holds shorter than 0.5 s + 0.3 s per word fail.
- With a voiceover, a visual appears at most 0.2 s before the word that names it.
- Keep a frame under about 100 ms to draw.

## Sound (`explainerSound(k)`)

- A sound starts on the exact time of its event, read from `T`.
- Score what lands: things arriving, labels, arrows completing, scene changes, the key number (biggest hit), the
  takeaway (a resolving sound). Drawing makes its medium's noise while it draws (pen, chalk, typing). Counters tick
  at most about 12 times a second, slowing as they settle.
- A quiet bed suited to the medium is welcome; music only if it suits the style (gain 0.6 or less).
- Effects in front, bed and music underneath, at most about 3 sounds at once, small silences before big hits.
- With a voiceover, build with `--voiceover`: beds and music drop out and minor sounds play quieter.

## Other aspect ratios

The reference is laid out for 1280x720. For 9:16 set `design: { w: 720, h: 1280 }` and lay the beats out again for
the tall frame: stack instead of side by side, bigger subject, text in the upper and lower thirds, inside the safe
zones from `render-and-export`. Never scale a landscape layout into a tall frame. For 1:1 use 1080x1080, for 4:5
1080x1350, each laid out for its frame.
