---
id: blueprint-build
name: Blueprint Build
family: Diagrams with depth
use: explainer
fonts: 
reference_topic: An ergonomic desk set-up: screen top at eye level, elbows at about 90 degrees, feet flat on the floor
duration: 8
samples: 28
libs: strokefont.js
---

# Blueprint Build

**Look:** A real drafting sheet: deep blueprint blue with grain and worn fold creases, a title block, a construction grid, crisp white linework in two weights with hidden edges dashed, dimension arrows and numbered notes in plotted single-stroke capitals. The drawing turns out to be a 3D wireframe, and then a solid object standing on its own plan.

**Motion:** Lines plot themselves in pen order with a hot tip. As the camera tips over, each part rises out of its own plan, which stays printed on the sheet. The numbered notes peel off the paper, turn to face the lens and are tied to the model with leaders, one by one. Then a hatched section plane climbs through the wireframe and leaves real material under it.

**Light:** One soft key from behind and to the side, so tops and one flank are lit, the near faces stay in shade and a long soft shadow falls toward the camera across the sheet. A little cool fill. At the end the desk lamp in the model switches on.

**Materials:** Uncoated blue paper that takes the light, flat white ink. The built object is restrained and real: pale oak, matt white steel, rust wool, off-white plaster, graphite plastic. The white lines stay on it as a faint ghost.

**Camera:** One continuous crane move with a long lens that opens up: it starts straight above the sheet, where the drawing reads as a flat plan, tips down to a three-quarter view as the drawing gains height, and keeps drifting in until the last frame.

**Finish:** Almost none: neutral tone curve so the blue and white stay true, light vignette, a trace of bloom on pen tips and the lamp, fine grain. Hidden lines are found by a real depth test, not drawn by hand.

**Good for:** Plans, set-ups and how-it-is-made: first the layout as a flat drawing, then the same thing as an object, with dimensions and two or three numbered pointers attached to the places they talk about.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block and schedule | `// ---- content`: `TITLE`, `BLOCK`, `NOTES`, `T` (`draw`, `lift`, `liftGap`, `liftDur`, `notes`, `fly`, `marks`, `fill`, `lamp`), `LIFT_ORDER`, `liftAt` | Replace: the title, title-block print, three two-line notes and the beat times. Keep the shape of `T` and the order of beats (plot flat, lift, notes fly, marks, section fill, lamp); `sound(k)` reads the same `T`. Keep `INK`, `PAPER` and the `HEAVY`, `LIGHT`, `FINE` weights |
| Blueprint kit | `blueprintKit(S)`: `ink`, `inkMesh`, `edgesOf`, `penOrder`, `letter`, `arrow`, `cased`, `dimension`, `buildable`, `cutShadow`, `depthOnly`, `sheet`, plus the `LINE_VS`/`LINE_FS` shaders and the uniforms in `U` (`uLift`, `uFill`, `uFillN`, `uPool`) | **Copy unchanged.** Nothing in it knows about desks. Returns `{ U, rec, ink, inkMesh, edgesOf, penOrder, letter, dimension, arrow, cased, buildable, cutShadow, depthOnly, sheet, add, sub, unit }` |
| Part builders | `part`, `pose`, `box`, `ring`, `rod`, `ball`, `woodTex`, `std`, and the `GROUPS` / `gid` / `PLACE` / `W` helpers | Copy unchanged; they are the grammar every model is written in (a solid, the edges drawn for it, a lift group, a line weight). Rename `GROUPS` entries and `LIFT_ORDER` to the new subject's parts |
| Subject | `MAT`, the `box` / `rod` / `ball` calls for desk, items, chair, lamp, figure, `EYE`, `ELBOW`, `KNEE`, `screen` | Topic-specific: model the new subject in metres from boxes, rods and balls, each with a `MAT.*` made by `std()` |
| `registerStyle` metadata + `render` | | Keep `render` (`tone: 'neutral'`, `fov: 20`, light bloom, vignette and grain); change `topic`, `duration`; keep `id: 'blueprint-build'` |
| `build(S)` / `sound(k)` | | Rewrite for the new subject. Keep the rig: `B = blueprintKit(S)`, the `rig[name]` lift groups (a solid plus its `B.depthOnly` shell per part), the three `ink()` passes made from one geometry (`wireMesh` in front, `hiddenMesh` with `hidden: true`, `planMesh` with `flat: true` as the plan left on the sheet), `B.sheet({ color: PAPER, rect, fold })` on a dark wood `table` with `edgeShade`, the `print` list (grid, border, title block, plan dimensions, centre line), the `marks` list with `ink(B.cased(marks), { onTop: true })`, `flyer()` notes, `K.env` with a warm and a cool panel, the soft shadow-casting key `K.spot` (`penumbra: 1`, `soft: 0.55`, `mapSize: 4096`) plus a shadowless cool fill `K.spot`, the `bulb` PointLight, the `CAM = K.path([...])` crane move (target, elevation, azimuth, frame height, lens as tan of half the fov) driven through `K.look`, and the `update(t)` that drives `uLift`, `uFill`, `planMesh` opacity, lamp emissive and flyers. `sound(k)` follows the schedule: pen strokes per drawn part, a click and rising tone per lift, paper and pop per note, a noise sweep for the section fill, a click and ding for the lamp |

Needs the STROKEFONT library (`libs: strokefont.js`): all lettering goes through `letter()`, which calls `STROKEFONT.layout`, and `dimension()` calls `letter()` for its figure. In `build` the reference reaches it only through `B.letter` (title, block print, `DESK` label, note text and the number inside each balloon) and `B.dimension` (the 1300, 700 and 740 figures). Keep `id: 'blueprint-build'` in the new style file so assemble loads `strokefont.js`. Characters outside A-Z, 0-9 and the punctuation the font has become spaces; `letter()` draws `°` itself.

Habits that make the look:
- Everything is a line first: each record has `at` and `dur`, and the shader draws it on from `a` to `b` with a hot pen tip (`uTipGlow`). `penOrder(list, t0, t1)` gives each part its own pen travel and time window (`T.draw`), so the plan is plotted part by part, never all at once. Letters and dimensions plot the same way, letter by letter (`per`).
- The plan becomes 3D by scaling y, not by swapping geometry: each line's group reads `uLift[group]` in the vertex shader while `rig[name].scale.y` follows the same `liftEase`, staggered by `liftGap`; `planMesh` (`flat: true`) keeps the flat plan on the sheet at about 0.34 opacity. Hidden edges come from `hiddenMesh` plus the `depthOnly` shells, never hand-drawn.
- Words live in two places: print on the sheet (title block, `DESK`, via `onSheet` maps) and the numbered notes. A note is a `flyer`: lettering plus a white disc that starts flat on the paper, then flies to `NOTE_AT` while its quaternion slerps from `FLAT` to `camera.quaternion`, so it faces the lens. Then a leader (`NOTE_TO`) and an `arrow` tie it to a mark drawn on the model (level line, right-angle arc and wedge, hatched foot patches) at `T.marks`. Marks and leaders go through `B.cased()` with `onTop: true` so they read over light surfaces.
- Dimensions are `B.dimension(a, b, { off, text, at, flip })`: witness lines, dimension line, two arrowheads, then the figure. Two sit on the plan (`1300`, `700`), one stands up in space once the model has lifted (`740`, `at: T.lift + 1.35`).
- The section fill is one shared plane (`uFill`, `uFillN`): `buildable()` materials discard above it and hatch the cut face, a blue-toned band sits just under it, and the wire lines fall to a ghost (`uGhost` 0.34, hidden 0.1) as it passes. Its time is snapped to 30 fps in `update`, and solids stay invisible until `T.fill[0]`. The last light change is the lamp: `MAT.glow.emissiveIntensity` and `bulb.intensity` rise at `T.lamp`.
- Camera: one `CAM` path that starts at elevation 89.6 degrees (flat plan), tips to about 25 over the lift and the notes, and keeps a slow drift in to the end; the long lens (`lens` 0.085 opening to 0.2) is part of the look. Colour stays blueprint: `INK` white-blue lines on `PAPER` blue, with real materials (oak, steel, wool, plaster, graphite) only on the built solids.
