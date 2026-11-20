---
id: pencil-sketch
name: Pencil Sketch
family: Filters over 3D
use: explainer
fonts: 
reference_topic: How a house goes up: foundation, frame, walls, roof
duration: 8
samples: 16
libs: strokefont.js
---

# Pencil Sketch

**Look:** A real 3D scene that reads as a graphite drawing in a designer's sketchbook: forms shaded with hatching and cross-hatching that follows the light, outlines that overshoot their corners, faint construction lines, hand lettering, toothy paper with a smudge and an eraser mark, and one red accent.

**Motion:** The drawing makes itself: setting-out lines first, then outlines stroke by stroke, then shading laid across each form in one direction and crossed in a second. Hatching is fixed to the objects and turns with them; only the line wobble boils a little, on held frames. Notes are lettered on and their leader lines follow the parts as the view turns.

**Light:** One sun from the upper left and flat fill. The light is never shown directly: it only decides how many layers of hatching a face or a cast shadow gets, so lit faces stay as bare paper and shade is cross-hatched.

**Materials:** Graphite on cream cartridge paper. Soft dark pencil for outlines and lettering, lighter pencil for hatching and construction lines, a red pencil for numbers and marks, and one wash of red marker on the part that matters.

**Camera:** One slow, continuous arc round the subject on a long lens, about 35 degrees from nearly front-on to a three-quarter view, rising and pulling back a little as the drawing grows. Everything is sharp, like a drawing. The subject sits left of centre so the notes have a clear column of paper.

**Finish:** No motion blur, bloom, grain or vignette. One paper pass: tooth that breaks up light lines, a hand smudge that drags graphite, an eraser mark, slight mottling and darker page edges.

**Good for:** How something is built or put together, step by step: parts are drawn in order, each with a numbered note. Also good for anatomy of an object, plans, exploded views and anything that benefits from seeing the structure through the surface.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `TITLE`, `STAGES` (label + `at` per stage; the first is already drawn on frame one, negative `at`), `DIMENSION`, `DURATION`, and the `PAPER`, `GRAPHITE`, `ACCENT`, `WASH` colours (keep one accent) |
| Schedule | `plan()` | Rewrite for the new stages: it derives every part's draw time from the stage times (`slab`, `plates`, `studs`, `walls`, `rafters`, `roof`, `notes`, `smoke`). `sound(k)` calls the same `plan()` |
| Pencil kit | `NOISE`, `pencilKit(S, o)` (returns `{ U, solid, strokes, line, edgeStrokes, write, hatchMaterial }`), `STROKE_VS`, `STROKE_FS` | **Copy unchanged**. `solid(geo, opts)` is a hatched form with outline, `strokes(list)` free 3D pencil lines, `line(a, b, opts)` one line, `edgeStrokes` the outline of any geometry, `write(text, opts)` single-stroke lettering |
| Paper | `PAPER_FILTER` and the `S.addFilter(PAPER_FILTER, {paper, rub, smudgeA, smudgeB})` call | **Copy unchanged**; move the smudge/eraser rectangles only if they land on the subject |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0`, `tone: 'linear'`, no bloom/vignette/grain, `fov: 30`, `background: PAPER`) and `fonts: []`; change `topic`, `duration` |
| `build(S)` rig | `K.sun(...)` from the upper left plus `THREE.AmbientLight`, the ground, the `mass` blocking-in lines, the `page` group, `onPage`, `guide`, the `notes` rows and `leaders`, the `shot` camera path, `update(t)` | Keep the rig: sun + ambient, faint setting-out lines before firm ones, title and notes lettered on the `page` group (a child of the camera, placed in pixels), leader lines moved each frame by `leaders.userData.set`, `kit.U.uTime`, `kit.U.uBoil`, the `shot` arc |
| Subject | house parts: slab, plates, studs, walls (`front`, `back`, `gable`, `ext`), panes, roof, chimney, smoke curl | Topic-specific: rebuild the new subject in stages out of `solid()` forms and `line()` strokes, each with an `at` from `plan()`; set `anchors` for the leader lines |
| `sound(k)` | `pencil`, `lines`, `scribble` helpers | Rewrite to the new stages; keep the `stroke` / `material: 'pencil'` helpers |

Needs the STROKEFONT library (`libs: strokefont.js`): `write()` calls `STROKEFONT.layout` and `STROKEFONT.length` for the single-stroke lettering. Keep `id: 'pencil-sketch'` in the new style file so assemble loads it.

Habits that make the look:
- Words are hand-lettered single strokes (no font file, `fonts: []`): the title top left and one numbered note per stage in a right-hand column, written letter by letter (`cps`), each note joined to its part by a leader line that follows the part as the view turns.
- The drawing makes itself in order: faint setting-out lines that overshoot, then the firm outline stroke by stroke (`lineDur`, `over`), then shading laid across the form in one direction (`fillAt`) and crossed in a second.
- Light is only ever turned into hatching: one sun from the upper left plus flat ambient; lit faces stay bare paper, shade gets cross-hatch, and cast shadows hatch the ground. Hatching is fixed to the object (object-space strokes) and turns with it.
- Only the line wobble boils, redrawn every fourth frame (`uBoil = floor(t * 7.5 + 0.5)`); everything else is still. One red accent: numbers, marks and one marker wash on the part that matters (`wash`, `washAt`).
- Camera: one slow arc round the subject (`shot`: yaw 6 to 42 degrees, rising and pulling back), subject left of centre so the notes have a clear column; everything sharp.
- Sound: pencil strokes only (`k.play('stroke', ..., { material: 'pencil' })`), a quick stroke per stud, scribbles for shading.
