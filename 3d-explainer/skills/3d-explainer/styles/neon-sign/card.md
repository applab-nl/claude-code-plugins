---
id: neon-sign
name: Neon Sign
family: Flat content made physical
use: explainer
fonts: 
reference_topic: How a rainbow forms
duration: 11.5
samples: 36
libs: strokefont.js
---

# Neon Sign

**Look:** A line drawing bent out of real glass tube and mounted on a painted brick wall at night: bright cores, coloured gas, black-painted returns into rubber boots, clear standoffs, every unlit tube waiting as milky glass. Small tube lettering for captions. Wet ground at the foot of the wall mirrors the end of it.

**Motion:** Neon never fades and never slides. A section snaps on, drops out and snaps again before it holds a touch over-bright and settles; one tube buzzes with the glow crawling along the glass before it catches. Things move the way real animated signs do it: by swapping between sets of tubes (pose A, pose B, pose C) and by lighting the segments of a path one after another, so light appears to travel.

**Light:** The tubes are the only real light: each one throws its own colour on the brick, hot right behind the glass and falling off across the wall, and every flicker moves the whole scene. A faint cold street light keeps the unlit glass readable.

**Materials:** Milky glass tube, semi-gloss paint over rough brick with soot and rain streaks, black rubber and matte blockout paint, clear acrylic standoffs, galvanised conduit, wet asphalt with puddles.

**Camera:** Long lens, one slow continuous crane. It starts a little oblique so the glass stands off the wall, drifts in on the part of the drawing that is lighting, then follows the light down the wall and settles low and square on the result, over its reflection in the wet ground. It is still drifting on the last frame.

**Finish:** Wide soft bloom from the over-bright cores, filmic contrast with deep blacks, slight depth of field, light vignette, fine grain, a trace of chromatic aberration.

**Good for:** How something works, as a diagram that switches on in the order it happens: light, electricity, signals, water, traffic, money, a recipe, a journey. A beat is a group of tubes that strikes on because the one before it did. Outlines are the things, a chase of short segments is whatever flows between them, alternating poses are whatever repeats (rain, flames, wheels, a heartbeat), and colour carries meaning, so use it for the part of the idea that really is about colour, state or category. One small tube caption per beat names what just lit; the last thing to light is the result, and it holds.

## Working with the reference

`reference.js` splits into parts. Treat them differently (notes written from the reference as it stood while another pass was repairing its shaders; any "Fixes applied" section below is authoritative where it differs):

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `CAPTIONS` (one short line per beat; the last may be an array of two), `DURATION`, `SPECTRUM`, `COLORS` (`[gas colour, hot core, wall-light colour]` per name: keep the three-entry form), `T` (event times shared by picture and sound), the layout constants `DROP`, `CLOUD`, `SUN`, `BOW`, `NOTE`, `FAN_STEP`, `FAN_LEN`. Keep the `registerStyle` `duration: DURATION` |
| Physics helper | `rainbowRay(c, R, n)` | Topic-specific (Snell's law for the rainbow): delete for other topics, or replace with the topic's own geometry helper |
| Drawing | `drawing(K)` with its helpers `sec`, `tube`, `arc`, `ring`, `poly`, `along`, `note` | Copy the helpers (`sec(name, colourKey, opts)` makes a section = everything that switches together; `tube(section, pts, {closed, cut})` adds a centre-line). Rewrite the body: one block per beat, with `on` strike times from `T`, `cycle: [start, step, poses, pose]` for repeating poses (rain, rays), `snap` + `order` for chase segments, `struggle` for the one tube that buzzes before catching, `lamp` names, `thump`, `chime`, `feet`, `tick`. Captions use `STROKEFONT.layout(text, {size, align, step})`; the closing loop computing `s.box`, `s.x`, `s.y`, `s.length` must stay |
| Neon timing | `schedule(K)`, `level(s, t)` | **Copy unchanged.** `schedule` turns each section's `on` into strike steps (snap, drop, snap, then `hold` over-bright), builds the `worm` window for `struggle` and the `zaps` list `sound(k)` reads; `level` adds the running pulse once `t >= T.pulse` using each section's `order` |
| `registerStyle` metadata + `render` | | Keep `render` (`filmic`, `bloom: 0.75`, `ca: 0.0012`, `fov: 30`, near-black background); change `topic`; `fonts` is empty (captions are tube lettering, not canvas text) |
| Night set | `K.env`, the cold `K.spot`, `scene.fog`, the wall (`wallMap`, `wallBump`, `wallRough`, `wallMat`, `bricks`) | **Copy unchanged** |
| Wall light map | `GLOW`, `glowRT`, `glowScene`, `glowCam`, per-section sprite loop (`s.spill`) | **Copy unchanged**; `update` renders it each frame and the wall reads it. Needs `S.renderer` (destructured in `build`) |
| Wet ground | the `K.mirrorFloor` block and the puddle patch after it | **Copy unchanged**; it patches the kit's mirror shader by name and falls back to a plain mirror if those names are missing |
| Glass | `glass(key)` (one material per section, `userData.u`: `uOn`, `uWorm`, `uPhase`), `bend(tb)`, the tube loop with `K.tube`, `inst`, `zCyl`, `legs` / `boots` / `collars`, acrylic `stems` / `bases` / `clips`, conduit with leads for sections marked `feet` | **Copy unchanged.** Every `tb` in `tubes` becomes lifted glass with returns into rubber boots and standoffs; closed loops are cut at `tb.cut` (or the lowest point) because a real tube has two ends |
| Lamps | `lamps` (shared point lights per `lamp` name) | **Copy unchanged**; just make the `lamp` names in `drawing` match |
| `cam` | `pos`, `aim` (`K.path`) | Rewrite keys: oblique and high at the start, drift in on the part that is lighting, follow the light down the wall, settle low and square; keep the last key past `DURATION`. `K.focus(camera, aim, 0.025)` stays |
| `update(t)` | | **Copy unchanged**: per-section `level` with a small flicker, glass uniforms, wall `spill`, lamp sums, glow render pass, camera |
| `sound(k)` | | Keep the pattern: `room` bed, a `hum` that thickens with each held section, one `neon` crack + `tick` per entry in `plan.zaps`, a `thud` and `ding` for sections with `thump` / `chime`, `buzz` for the `struggle` tube, relay ticks for cycles and chases, a closing `pad`. Rewrite only the beat-specific calls (cloud, rain relay, `T.bow`) |

Library: uses `STROKEFONT` from strokefont.js (`STROKEFONT.layout` for caption strokes, `STROKEFONT.length` for tube lengths); the new file must keep `id: 'neon-sign'` so assemble loads it.

Habits that make the look:
- The drawing is the content: outlines are the things, short chasing segments are what flows, alternating poses (`cycle`) are what repeats, and colour is used only where the idea is about colour or category. Everything is a line (a flat centre-line), no filled shapes.
- Neon never fades or slides: a section strikes with snap, drop, snap (`strikes`), then `hold` over-bright and settles; one tube may `struggle`, buzzing with a crawling glow before it catches. Captions are small strokefont tube lettering (dimmer, `gain` ~0.6) and only one burns at a time (`off`).
- Beats light in story order: each beat strikes because the one before did, the light path then carries a brighter running pulse (`T.pulse`, `order`), and the result (here the bow, band by band) lights last and holds.
- Light comes only from the tubes: the near wall glow is the summed blurred sprites in `glowRT`, the far glow is shared point lights (`lamps`), plus a faint cold street light and fog. The wall is rain-streaked painted brick, the ground a wet mirror with puddles.
- Camera: long lens, one slow continuous crane down the tall drawing from a slightly oblique start, following the light to the ground; focus fixed on the aim point with a modest aperture (0.025).

## Fixes applied to the reference

- The wall bump map drew every brick (about 900 fills) with `ctx.filter = 'blur(3px)'` on a 4096 x 2048 canvas. Chrome draws each filtered fill as its own GPU layer, and on ANGLE Metal this reset the GPU process. Every WebGL program then failed to link with an empty log ("VALIDATE_STATUS false"), and the context was lost. The bricks are now drawn sharp onto a scratch canvas and blurred once with a single filtered `drawImage`, which looks the same.
