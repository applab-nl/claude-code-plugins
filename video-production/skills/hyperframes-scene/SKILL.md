---
name: hyperframes-scene
description: Use when writing or editing any HyperFrames scene (HTML + GSAP rendered to video), setting up a new video project, or debugging a render that flickers, freezes, comes out blank or differs between runs. Holds the render contract, the determinism rules and the CLI loop.
---

# HyperFrames scenes that render the same every time

HyperFrames does not record a browser playing. It seeks a paused timeline to frame N, takes a
screenshot, and repeats. So every pixel must be a pure function of timeline time. Anything that
depends on the wall clock, on play order or on async work renders differently on each run, or not
at all.

Starter files: `templates/index.html` (root) and `templates/scene.html` (one scene). Copy both,
rename `hero`, replace the font file.

## HyperFrames guardrails (from a security audit, 2026-11-01)

Export these before any `hyperframes` command. Use `bunx hyperframes@0.8.228` in place of every
`npx hyperframes` below and in the other video skills; move the pin only after re-reading the new version.

```
export HYPERFRAMES_NO_TELEMETRY=1 HYPERFRAMES_NO_UPDATE_CHECK=1 HYPERFRAMES_NO_AUTO_INSTALL=1 HYPERFRAMES_SKIP_SKILLS=1
```

- Without these the CLI sends usage telemetry to PostHog, updates itself in the background, and `init`
  installs HeyGen's skills from GitHub into `~/.claude/skills` and other agents' home folders.
- Never run `hyperframes usage`. It reads the Claude login from the macOS Keychain. HeyGen's own skills
  ask for it; these skills do not need it.
- Never run `hyperframes auth`, `cloud` or `snapshot --describe`: they send work to HeyGen or Gemini.
- Demo data only: seeded or synthetic accounts and fixtures. Never a real user's data, and nothing
  from test fixtures that hold personal data.

## Project setup

```
npx hyperframes init my-video          # scaffold
cd my-video
npx hyperframes check --json           # lint + layout audit; fix every error
npx hyperframes snapshot --at 0,1.5,3  # stills at exact seconds; LOOK at them
npx hyperframes preview                # scrub in the browser
npx hyperframes render --quality delivery --output out/video.mp4
```

- Pin the CLI version once it works: `npx hyperframes@<x.y.z> render ...`, and write that version
  in the project's README, so a CLI update cannot change a render halfway through a project.
- `out/` holds renders. Gitignore it. Renders are disposable, the HTML is the source.

## The render contract

1. **Timed elements.** Anything that appears and disappears gets `class="clip"`,
   `data-start` and `data-duration` in seconds. It shows over `[start, start + duration)`, so an
   end state that lands exactly on the end frame is never seen. Land it 1 frame (0.034 s at 30 fps)
   early.
2. **Length.** The video is as long as the root's `data-duration`. Overrun is cut off.
3. **One paused timeline per composition.** `gsap.timeline({ paused: true })`, every tween added
   to it, then registered last: `window.__timelines["<data-composition-id>"] = tl`. The key, the
   scene root's `data-composition-id` and the host's `data-composition-id` are the same string.
   A mismatch shows as a scene that waits about 45 s, then renders frozen.
4. **Pad the timeline.** End the script with `tl.set({}, {}, D)` where D is the scene length, so
   the timeline duration matches the slot even when the last tween ends early.
5. **No clocks.** No `Date.now()`, `performance.now()`, `new Date()` for anything visible,
   `setTimeout`, `setInterval`, `requestAnimationFrame`, CSS `@keyframes` or `transition`.
6. **No infinite repeats.** `repeat: -1` has no defined state at frame N. Use a finite `repeat`
   that fills the scene: a 1.5 s yoyo with `repeat: 3` is 4 legs, 6.0 s, and ends where it began.
7. **Seeded randomness only.** Unseeded `Math.random()` moves every confetti piece on every
   render. Use mulberry32 with a fixed seed (in the template). Reset the seed before each
   generated system so editing one does not reshuffle the next.
8. **Never tween `display`, `visibility` or `autoAlpha`** on a `.clip`. The runtime owns those.
   Tween `opacity` or animate a child.
9. **No CSS `transform` on anything GSAP transforms.** GSAP overwrites it, or the two fight. Set
   the start state in `fromTo`. If a script sets a transform once (a fit scale, see
   `product-ui-recreation`), GSAP animates a child of that element, never the element itself.
10. **Animate transforms, not layout.** Tween `x`, `y`, `scale`, `rotation`, `opacity`. Tweening
    `left`, `top`, `width`, `height` forces reflow per frame and jitters at subpixel sizes.
11. **SVG draws tween attributes.** Use `attr: { "stroke-dashoffset": 0 }` or a clip rect's
    `attr: { width }`. Tweening the CSS property `strokeDashoffset` snapped to fully drawn in frame
    capture on our renders.
12. **Fonts are local files.** Every family gets `@font-face` with `src: url("assets/fonts/x.woff2")`.
    A font that only exists on your laptop renders as a fallback on the render box.
13. **Root-relative asset paths.** `assets/logos/slack.svg`, in sub-compositions too. Never
    `../`, never absolute, never `http` for images, fonts or media.
14. **Media is never driven by script.** No `play()`, `pause()` or `currentTime`. A `<video>` is
    `muted playsinline`, or keeps its sound with `data-has-audio="true"`. Every `<audio>` has an
    `id` or it is dropped from the mix. Trim with `data-media-start`.
15. **Build synchronously, then register.** Create generated DOM, measure `offsetHeight`, then add
    tweens, then register. A timeline registered before an async build is a blank scene.

## Scene files

- One scene per file in `compositions/`. Styles, markup and script all go inside `<template>`;
  anything outside it is dropped.
- Style the scene root by its id (`#hero-root { position: absolute; inset: 0; }`), never by a
  class, and never with fixed pixel sizes on the root.
- Prefix every id with the scene name (`#hero-title`). Ids must be unique across the whole
  assembled page. A scene's script cannot reach elements in another scene.
- The root `index.html` holds only scene hosts, media and audio. Paint order is `z-index`;
  `data-track-index` is only a lane in the editor.
- Use `fromTo`, not `from`. The host re-seeks a scene every time it shows, and `from` records its
  start state once, then drifts on a backward seek.
- Second tween on the same property later in the timeline: pass `immediateRender: false` on the
  later `fromTo`, or its start values get written at time 0 and overwrite the first state.
- Set every changing element's frame 0 state with `tl.set(el, {...}, 0)` at the top of its block.
  Seeking backward then always restores it.
- Never `add()` a scene timeline into the root timeline. The runtime drives each scene.
- Text that counts or changes: write it in `onUpdate` from the tween's value, or with
  `tl.set(el, { textContent: "2" }, t)`. Never from a counter variable that increments.

## When to use one big file instead

A short loop (6 to 10 s) with many small windows can live in one root composition, one
`/* W1 */` block per window, all on one timeline. It is easier to sync. The trade: `check`
warns about nested structure and hidden-until-shown items. Per-scene files are better above
about 15 s or when batch renders need per-scene variables.

## Generated projects

When a video has more than about 10 timed pieces (a dialogue cut list, word-timed captions),
write a small `build.py` that emits `index.html` from lists of `(clip, media_in, media_out, line)`.
Edit the lists, never the generated HTML, and put a comment at the top of the output saying so.

## The check loop

1. `npx hyperframes check --json`. Fix every error. Read every warning and decide; layout
   warnings on stacked kinetic panels or items hidden until shown are expected.
2. `snapshot` at every beat boundary from the brief, plus 0.1 s either side of each cut.
   Open the PNGs. A blank frame, a font fallback, or a jump at a seam shows here first.
3. Render twice and compare a few frames (`ffmpeg -ss 3.2 -i out/a.mp4 -frames:v 1 a.png`). If
   any pixel differs, something reads a clock or an unseeded random.
4. Then `video-review` for the full pass and `render-and-export` for delivery sizes.

## Fault table

| You see | Usual cause |
|---|---|
| Scene blank, or one frozen frame | timeline key differs from `data-composition-id`, or registered before the DOM was built |
| Element visible at frame 0 that should enter later | a later `fromTo` without `immediateRender: false` |
| Line drawn fully from the first frame | CSS `strokeDashoffset` tween instead of `attr:` |
| Different confetti each render | unseeded `Math.random()` |
| Fit scale lost, window content huge | GSAP tweened the element whose transform the fit script set |
| Wrong font | missing `@font-face`, or the file path is relative to the scene file |
| Scene ends early, holds a still | timeline shorter than the slot; pad with `tl.set({}, {}, D)` |
