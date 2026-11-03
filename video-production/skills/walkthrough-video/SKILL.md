---
name: walkthrough-video
description: Use when making a product walkthrough, feature demo, onboarding clip or "how it works" video in code, where a cursor clicks through real UI states. Covers cursor paths, clicks, zoom punch-in math, spotlight, numbered steps, state changes, the success moment and the loop reset.
---

# Walkthrough video

A walkthrough shows one task from start to result in the product's own UI: the viewer watches a
cursor do it and understands they could do it too. It fails in two ways: too many steps, so
nothing reads, or too little camera, so the click happens in a 14 px corner of a wide shot.

Helpers: `templates/walkthrough-kit.js` (init, zoomTo, moveCursor, click, step, confetti). UI
surfaces themselves: `product-ui-recreation`.

## Pacing

- 3 to 5 steps per 10 seconds, max. Our reference loop does 3 steps in 8 s.
- One step is about 2 s: camera and cursor travel 0.7 to 0.8 s, spotlight and tooltip 0.3 s,
  click, the state change, 0.4 to 0.6 s to see the result.
- One verb per step: turn on, pick, publish. If a step needs two clicks, it is two steps or one
  click is cut.
- Delete what the cursor never touches. Rebuild only the panel the task lives in.

## Layers

Order from back to front, all inside one stage:
1. `#cam`: the app UI. Everything that zooms. `transform-origin: 0 0`.
2. `#spot`: the spotlight, fixed at screen center.
3. `#tip`: the numbered tooltip.
4. Toast and confetti.
5. `#cursor`: on top, outside `#cam`, so it stays the same size at every zoom.

## Zoom punch-in math

With `transform-origin: 0 0`, a point `p` in the app lands on screen at `cam + p * s`. To put
point `p = (px, py)` at the screen point `c = (cx, cy)` at scale `s`:

```
x = cx - px * s
y = cy - py * s
tl.to("#cam", { scale: s, x, y, duration: 0.7, ease: "power3.inOut" }, at)
```

- Use the screen center as `c` for every step. Then the cursor's destination is always the same
  point, the spotlight never moves, and only the camera travels.
- Compute `p` from the layout: the app's offset in the stage plus the control's offset in the
  app plus half its size. Write the arithmetic in the code (`40 + 726 - 31`) so it can be checked.
- Scales: 1.4 to 1.7 for a control, 1.0 to return to the overview. Above 2.0 the UI goes soft
  and the viewer loses where they are.
- Zoom out to `scale: 1, x: 0, y: 0` once, after the last step, over 0.6 s.
- Zooming between two controls: go directly from one zoomed state to the next. No zoom out between.

## Cursor

- Size: 3 to 5% of the frame's short side, dark fill with a 1.6 px white stroke, so it reads on
  light and dark UI.
- Path: `power3.inOut`, 0.6 to 0.8 s, timed to the camera so both arrive together. A cursor that
  arrives before the camera looks lost.
- Enter from off-screen or a far corner in the first 0.3 s. Park it in a corner at the end.
- Hover on a dropdown: step it down one option every 0.3 s, highlighting each row for that time.

## Click

- Cursor `scale: 0.85`, 0.08 s, `yoyo: true, repeat: 1` (0.16 s total).
- One ripple ring at the click point: `scale` 0.4 to 2.2, `opacity` 0.6 to 0, 0.45 s `power2.out`.
  One ring per click. No ring on hovers.
- The UI reacts 0.05 s after the press starts, so cause reads before effect.
- Press the button too: `scale: 0.9`, 0.08 s yoyo, starting 0.05 s after the cursor.

## Spotlight and tooltip

- Spotlight: a 120 px circle at screen center with `box-shadow: 0 0 0 2400px rgba(19,18,16,0.22)`.
  The giant spread dims everything else. 22% is enough; 50% reads as a modal.
- Fade it in 0.3 s after the camera lands, out 0.2 s at the click result.
- Tooltip: a yellow pill with a dark numbered badge ("1 Turn it on"), 18 px bold at stage scale,
  max 4 words. Pops from `scale: 0.6` with `back.out(2)` 0.35 s. Change its number and text with
  `tl.set(el, { textContent })`, never by recreating it.
- Place the tooltip beside the control, never over it, and inside the title-safe 80% of the frame.

## State changes

- **Toggle:** track color to the "on" color in 0.2 s; knob `x` by track width minus knob minus 6
  px (62 - 28 - 6 = 28) in 0.25 s `back.out(2)`.
- **Dropdown:** menu from `opacity: 0, y: -10` in 0.25 s `power3.out`; hover rows; on click set
  the field text with `tl.set`, close the menu in 0.2 s. Nudge the camera down 80 px while open so
  the menu is in frame.
- **Publish / submit:** button press, spotlight off, zoom back to overview, then the result.
- Every state change is a tween or a `tl.set` at a time. No class toggles from callbacks.

## Success moment

- Toast from `y: 120, opacity: 0` to `y: 0`, `back.out(1.8)`, 0.5 s, starting 0.2 s after the
  zoom out begins. 3 to 5 words: "Published to 3 channels".
- Confetti: 40 to 60 pieces, seeded (`mulberry32`, fixed seed), from the click point. Burst 0.7 s
  `power3.out` to a random angle at 140 to 400 px, spin up to 360 degrees either way, then fall 200 to
  400 px over 1.1 s `power1.in` while fading. Same seed, same confetti, every render.
- Confetti once per video, for the payoff only.

## Return and reset

- After the success, hold the overview 1 to 1.5 s so the result reads.
- For a loop, reset everything in the last 0.4 s: toast out, toggle back (0.2 s), field text back
  with `tl.set`, highlighted rows cleared, cursor to its start position. Frame 0 and the last frame
  must match; snapshot both.
- Set every touched element's frame 0 state with `tl.set(..., 0)` at the top (`initWalkthrough`).
  Then seeking anywhere in the preview works.

## Checklist

- [ ] 3 to 5 steps per 10 s, one verb each.
- [ ] Each step centered with the zoom formula, scale 1.4 to 1.7.
- [ ] Cursor outside the camera, arrives with the camera, presses before the UI reacts.
- [ ] Tooltip text 4 words max, numbered, beside the control.
- [ ] One ripple per click, one confetti per video, seeded.
- [ ] Last frame matches frame 0 (loop) or holds the result 2 s (end card follows).
- [ ] Snapshot at each click time plus 0.3 s: the state change is visible and legible.
