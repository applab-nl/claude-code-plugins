---
id: white-model
name: White Model
family: Diagrams with depth
use: explainer
fonts: Inter, IBM Plex Mono
reference_topic: How rooftop solar powers a home: sunlight, panels, inverter, home, and the surplus going out to the grid
duration: 8
samples: 64
libs: 
---

# White Model

**Look:** An architect's presentation model: everything is matte white card and foam on a white site board, and one saturated accent colour is reserved for the thing being explained.

**Motion:** Nothing in the model moves. Only the accent moves: it starts at the source and travels through the model along thin conduits, switching each part on as it arrives, and a numbered label with a thin leader line draws in at every stop.

**Light:** Soft daylight from one side plus sky light with real occlusion, so creases, window reveals and the ground under things darken gently and form does the work colour normally does. The accent glows a little and throws its own colour onto the white around it.

**Materials:** Four slightly different whites (warm card, cool foam, bright paper, rough plaster) with a fine paper grain and a tiny bevel on every edge; scored pencil lines on the board; a mid-grey table behind, so the white reads as white.

**Camera:** Long lens with shallow focus, like a photograph of a small model. One slow continuous crane: it starts low and close on the source and rises and pulls back until the whole path is in frame.

**Finish:** Neutral tone mapping so the whites stay clean and the accent stays true, a light bloom on the accent only, soft vignette, almost no grain.

**Good for:** How something flows through a system: energy, water, money, data, people. Build the system as a white model, lay the path through it as conduits, and let the accent travel the path in the right order while labels name each stop.

## Working with the reference

`reference.js` splits into parts. Treat them differently (inside `build(S)` the sections are numbered in comments):

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `ACCENT` (the one colour), `TITLE`, the schedule `T` (when the accent reaches each part), `STEPS` (`key`, `name`, `note`, `at`, `off` pixel offset), `TITLE_OUT`, `COLS`/`ROWS`, `panelAt` |
| `registerStyle` metadata + `render` | | Keep `render` (`tone: 'neutral'`, bloom on the accent only); change `topic`, `duration`; `fonts` stay Inter and IBM Plex Mono |
| 1. The kit | `grain`, `white`, `M` (`card`, `foam`, `paper`, `plaster`), `put`, `box`, `cyl`, `cut`, `K.env` / `K.sun` / `K.skyLight`, the grey table and the `BOARD` with its `scored` pencil-line canvas | **Copy unchanged**, except the scored lines drawn on the board (plot, roof outline, road, hill contours, tree rings): redraw those to match the new site |
| 2. The accent rule | `runs`, `run(curve, t0, t1, radius)`, `conduit(pts, r)`, `hang(a, b, sag)`, `glow(mat, base)`, `bead`, `beadLight` | **Copy unchanged.** `run` fills a tube with the accent from one end and then pulses; `glow(material)` returns `set(k, flash)`; the bead rides the live run's front |
| 3. The model | house group (`cut` walls, floors, roof, chimney), solar array (`panels` with `glow`), `sign`, inverter and meter box, `lamps` + `roomLights`, poles and wires, sun on its `SUN` stand, contour `hill`, trees, `figure`, car | Topic-specific: rebuild for the new system out of the same `box` / `cyl` / `cut` helpers and the four whites, keeping scale cues (figures, trees, a car) and the source object visible from frame one |
| 4. The path | `rays` and `dashes` (instanced sunlight), the `run(...)` calls with `T` times | Rewrite: one `run` per leg of the new flow, timed from `T`; keep the dash/bead mechanism |
| 5. Labels | `anchors`, `INK`, `px`, `halo`, `label(ctx, step, i, t, W, H)` | **Copy `px`, `halo`, `label` unchanged.** Replace `anchors` (a world point per `STEPS.key`) |
| 6. Camera | `cam` (`K.path` of `[azimuth, elevation, distance, aim x, y, z, aperture, focus depth]`), `m4`, `sc`, `ps` | Keep the form, retune keys to the new model. The last key lies past the end so the crane never stops |
| `update(t)` + `overlay` | | Keep the order: rays, sun pulse, panels' `glow`, run heads and bead, signs, lamps, camera + `K.focus`; then `overlay` draws `STEPS.forEach(label)` and the title block that fades at `TITLE_OUT` |
| `sound(k)` | | Rewrite events from `T` and `STEPS`; keep the voices: `room` bed, `pad`, steady DC note vs beating AC note, `click`/`tock` at hand-offs, `ding` per room, `whoosh` along the line, `success` at the end, a `pop` per label |

No library is used.

Habits that make the look:
- The model is white and never moves; one saturated colour (`ACCENT`) means "the thing being explained" and appears nowhere else. Parts are white until the accent arrives, then switch via `glow` or a `run` fill.
- Light does the work of colour: soft `K.sun` from the left, an occluded `K.skyLight` so creases and window reveals darken, four slightly different whites with paper grain, tiny bevels (`K.roundedBox`).
- Words are overlay labels in Inter (names, bold caps with tracking) and IBM Plex Mono (the step number in a circle), each with a thin leader line that grows from the model point to the label and a white halo for legibility. Labels appear in the order the accent reaches the parts. The title sits top right and fades before the last label.
- The path is thin conduits that fill from one end with a bright bead and pulsing dashes; sources send dashed rays; consumers (panels, lamps) flash then hold.
- Camera: long lens, shallow focus (`aperture` ~0.08), one slow crane that starts low and close on the source and rises and pulls back until the whole path is in frame; focus aimed at the model's front (`FZ` depth).
