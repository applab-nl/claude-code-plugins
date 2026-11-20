---
id: ink-toon
name: Ink and Toon
family: Filters over 3D
use: explainer
fonts: Anton, Caveat
reference_topic: Pour-over coffee in three steps: grind, bloom, pour
duration: 8
samples: 16
libs: 
---

# Ink and Toon

**Look:** Real 3D that reads as a hand-inked animation cel: flat colour in two tones, a brush line round every shape, halftone dots where light turns to shadow and pen hatching inside cast shadows, printed on warm paper inside a ruled panel.

**Motion:** Snap, not glide. Props are drawn on twos (15 drawings a second) and jump between held poses with a stretched in-between, an overshoot and a quick settle; speed lines, impact ticks and steam squiggles are drawn in for two or three frames. The camera alone moves on every frame.

**Light:** One hard sun, low and from the side, placed for the shape of the shadow rather than for realism. No fill light: the shadow colour of each material is picked by hand, shifted towards the cool ground colour.

**Materials:** No textures. Each material is a lit colour, a shadow colour and, on glossy things, one hard white glint. Paper, one ink and four spot colours do everything.

**Camera:** Long lens, looking down at a table-top from the front. It drifts slowly while a pose is held and whips to the next framing in a third of a second, one framing per step.

**Finish:** No blur, bloom or grain. A print filter lets every edge wander by a pixel and re-draws it six times a second, multiplies paper tooth through the colour and rules an ink border round the panel.

**Good for:** Steps, recipes and how-tos with a few recognisable objects: each step is one bold action on the same hero object, named by a big lettered word and a hand-written caption box.

## Working with the reference

`reference.js` is one block. Treat its parts differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `STEPS` (`{ n, word, note }` per step) and `ENDING` |
| Palette | `INK`, `PAPER`, `PAL`, `GROUNDS` | Keep `INK`/`PAPER` and the lit/shade pair structure; swap the spot colours for the new objects (paper, one ink, four spot colours, each with a hand-picked shade partner and optional `gloss`) |
| Timing and schedule | `DPS`, `F`, `at()`, `T`, `bubbleAt` | Keep `DPS = 15`, `F`, `at()` and the rule that every event time is `at(n)`; rewrite the `T` entries and `bubbleAt` for the new story |
| Ink kit | `inkKit(S, o)` returning `G, sun, fill, outline, solid, turned, crease, strokes, mark, arc, burst, lettering, badge, caption, print, frame, flat` | **Copy unchanged.** Build every object with `fill(PAL.x, {...})` + `solid(geo, mat, parent)` (fill, outline hull, shadow in one) and `turned()` profiles, `K.tube`, `K.roundedBox` |
| Build helpers | `group`, `sphere`, `pop`, `wobble`, `rig` (smear), `sprite`/`faceCam`, `label`, `spot` | Copy unchanged; they are generic. `pop` and `wobble` are the overshoot and settle; `rig(inner).set(p, p0)` stretches a fast mover along its path |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0`, `tone: 'linear'`, `bloom: 0`, `fov: 26`, `background`), `fonts`; change `topic`, `duration` |
| `build(S)` | | Rewrite the props and the `M` materials. Keep `const ink = inkKit(S)`, `ink.print()`, the dotted `ground` plus `dots` InstancedMesh, the `cam` `K.track` of `[aim x, y, z, elevation, azimuth, distance]` framings (one per step, `inOutQuint` whips, `linear` drifts) with `camPos`, `K.look(camera, cp, c)` then `ink.frame(t, camera)` every update, and `q`/`n` from `Math.floor(t * DPS + 1e-3)` so props change only on drawings |
| `sound(k)` | | Rewrite, with every time taken from `T`/`at()` so sound lands on the drawing; keep `k.music('pulse', ...)` at 120 bpm and `k.bed('room', ...)` |

Keep `id: 'ink-toon'` in the new style file.

Habits that make the look:
- Words live in the scene, not as overlay: `ink.lettering(step.word)` in Anton (cream face, ink edge, colour block), an `ink.badge` starburst with the step number and an `ink.caption` slip in Caveat, placed by `label(step, when, until, ...)` and turned to face that step's camera framing.
- Things appear by `pop(x)` (outBack overshoot) and settle with `wobble`, on whole drawings; fast movers get a smeared in-between via `rig`, never blur.
- Effect marks (speed lines, `burst` ticks, steam, `arc` arrows, stars) are `mark()` strokes shown for two or three drawings, in `PAPER` or `INK`.
- Light and colour: one hard `sun` low from the left (`inkKit` option `sun`), no fill; each `PAL` entry is lit plus a hue-shifted `shade`, gloss only on glossy props (`gloss`, `streak`); the ground is a flat teal with a field of printed dots.
- Camera: long lens (`fov: 26`) from above, one framing per step; `cam` drifts on `linear` segments while a pose holds and whips on `inOutQuint` between steps.
- Sound: a pulse bed at 120 bpm with a stamp as the first word lands, water and tock noises on the action frames.
