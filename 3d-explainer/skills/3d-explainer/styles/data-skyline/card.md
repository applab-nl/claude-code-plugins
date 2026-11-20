---
id: data-skyline
name: Data Skyline
family: Diagrams with depth
use: explainer
fonts: Space Grotesk, IBM Plex Mono, Fraunces
reference_topic: World population by the billion: 1 billion in 1804, 2 in 1927, 4 in 1974, 8 in 2022
duration: 8.5
samples: 48
libs: 
---

# Data Skyline

**Look:** A bar chart built as an architect's model: towers of stacked pale stone blocks on a printed plinth, with one tower in vermilion, tiny trees and people for scale, and thin drawn annotations on top.

**Motion:** Towers push up out of the plinth one after another on a heavy spring, overshoot a little and settle while their value counts up on the roof. Taller towers take longer, so size is felt as time.

**Light:** A low warm sun from the side, so every tower throws its shadow onto the next one and the last shadow runs long across the ground; cool sky light fills the shaded fronts and warm haze swallows the horizon.

**Materials:** Honed limestone with fine strata and pores, the same stone stained vermilion for the accent tower, dark printed ink for scales, footprints and labels, a mid-grey ground so the pale model stands out.

**Camera:** Starts at ground level beside the first tower, dollies along the row while the towers rise, tilts up as the tallest one climbs past the lens, then cranes up and back until the whole comparison is in frame.

**Finish:** Shallow focus at ground level like a macro photo of a model, real motion blur, gentle bloom on the sunlit faces, soft filmic contrast, light vignette and fine grain.

**Good for:** Any list of labelled values: a comparison, a ranking or a series over time. Each value is a tower, the label is printed at its foot, the unit is stacked in countable blocks and one accent colour marks the bar that matters.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `KICKER`, `TITLE`, `TAKEAWAY`, `UNIT`, `DATA` (label and value per tower), `HERO` (accent tower index), `STEP`, `GAPS`, `fmt` |
| Model constants | `N`, `VMAX`, `PITCH`, `TW`, `U`, `JOINT`, plinth sizes, `INK`/`STONE`/`PLINTH`/`ACCENT` | Keep; they derive from `DATA` (tallest tower = 4.8 high). Retune `PITCH` only if the row gets very long |
| Schedule | `DAMP`, `STARTS`, `T_WIDE`, `schedule(K)` | Rewrite `STARTS` (when each tower starts rising) and `T_WIDE` (when the camera is wide and annotations begin); keep `schedule()`'s spring maths: `freq` slows with size and `land` is when the roof first reaches full height |
| Stone and plinth kit | `stoneDraw`, `stoneTex`, `stoneMat`, `add`, floor, `plinthGeo`, the printed `topTex` sheet, sloped-face labels | **Copy unchanged.** The printed sheet, labels and value numerals are all generated from `DATA`, so nothing needs editing |
| Towers | `blockGeo`, `towers`, `drawValue` | **Copy unchanged**: stacked `K.roundedBox` blocks with `jointMat` gaps, a `collarMat` frame around each slot, and the value as cut-out numerals on a ten-plane stack, redrawn only when its text changes |
| Scale cues | `trees`, `people`, `inst()` | Copy; the scatter reads `DATA`/`N` |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0.5`, filmic, `background '#e8d5bc'`); change `topic`, `duration` (and `fonts` if the overlay fonts change) |
| `build(S)` / `sound(k)` | | Rewrite the camera keys, keep the rig: sky `dome` + `FogExp2(HAZE)`, `K.env`, the low warm `K.sun` at `SUN`, `K.skyLight`, the `cam` `K.path`/`K.track` (ground-level start, low point at the hero, `wide(d)` three-quarter finish, `fov`, `ap`), `update(t)` with `K.spring`, and `overlay(ctx, t, W, H)` for `head()` and the dimension lines via `proj()`. Sound: grind, `tock` per block, `thud` landing, extra `impact`/`stamp` on the hero |

Habits that make the look:
- Two typefaces on the plinth, one voice each: Space Grotesk 700 for the labels printed on the sloped front face and the cut-out value numerals; IBM Plex Mono 500 for the printed footprints and the kicker. Headlines are Fraunces 600 on the overlay, drawn crisply and anchored at fixed screen spots.
- Towers push up through their collar on `K.spring(t - p.t0, p.freq, DAMP)`: overshoot a few percent, settle. Taller ones get a slower spring (`freq` falls with value) so size is felt as time; the roof numerals pop in with `outBack` and count up, digits sampled at 30 Hz so they do not smear.
- Annotations come late: the `TITLE` headline fades out around 1.9-2.3 s, then `TAKEAWAY` and the architect's dimension lines (`GAPS`, tick marks) appear together once the camera is wide, each line staggered by 0.25 s.
- One accent: every tower is the same stone, only `HERO` is stained vermilion and its label and dimension line use `ACCENT`; everything else is ink on pale stone.
- Camera starts at ground level beside the first tower (aperture 0.02, macro-like), dollies along the row, drops low with a wide lens at the hero so it looms, then cranes up and back to a long-lens three-quarter view and keeps a slow push to the end. Focus is on the front faces (`K.focus(camera, [aim[0], aim[1], TW / 2], cam.ap(t))`).
