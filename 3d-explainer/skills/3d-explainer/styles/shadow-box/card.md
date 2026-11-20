---
id: shadow-box
name: Shadow Box
family: Flat content made physical
use: explainer
fonts: Anton
reference_topic: Computers keep shrinking: a room-sized mainframe, a desktop, a laptop, a phone in your hand
duration: 8
samples: 56
libs: 
---

# Shadow Box

**Look:** A paper-cut light box: opaque paper silhouettes stand one behind another in a deep walnut frame. The back of the box glows warm and bright, every sheet nearer to you is darker, and the nearest ones are dusk-blue shapes with a thin warm line of light on their cut edges.

**Motion:** Sheets arrive one at a time and each differently: one drops into its slot from above, one is pushed in from the side, one rises from below. As each arrives, a light switches on in the slot behind it, so the light walks forward through the box.

**Light:** A warm lamp on the back wall and a pool of light in each slot between the sheets. Each pool lights the sheets behind it and leaves the sheet in front as a silhouette, so cut-out screens and years turn into bright windows. Sheets throw soft shadows on the ones behind. The only light from the front is dim blue dusk.

**Materials:** Thick cream paper with visible fibre and bright cut edges, dark walnut with open grain.

**Camera:** Long lens with a very wide aperture, like photographing a miniature. It starts close and at an angle, slides sideways so the sheets shift against each other, and pulls back in one move to a square-on view where the box fills the frame; the focus steps forward from sheet to sheet.

**Finish:** Real depth of field and motion blur, soft bloom on the lit paper, filmic contrast, a light vignette, fine grain.

**Good for:** Sequences with a natural order in depth: timelines, eras, layers of a system, before and after. Each sheet is one stage, a big silhouette with a cut-out label, and the light shows which stage we are at.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `SHEETS` (back to front; each has `name`, `enter` as `[side, time]` or `null`, `lit`, `ember`, `glow: [x, y, rx, ry, carry]`, `draw(a)`), `YEAR_PX`, `TITLE_PX`, `groundY` (outline of the front sheet). Draw each sheet on the 1920x1080 artboard with `a.paper`, `a.cut`, `a.text`, `a.limb`, `a.slot`, `a.lamps`, `a.reel`; keep the paper behind a label free of other cut-outs |
| Box and clock | `N`, `W`, `H`, `GAP`, `IN_W`, `IN_H`, `BEAM`, `DEPTH`, `FRONT`, `sheetZ`, `TRAVEL`, `arrive`, `litAt`, `offsetOf`, `lightOf` | **Copy unchanged** (`N` follows `SHEETS.length`). `offsetOf` has the three entrances (`'top'` drops and bounces, `'right'` slides with `K.ease.outBack`, `'bottom'` rises with `K.spring`); `lightOf` returns `[brightness, heat]` per light |
| Sheet cutting kit | in `build`: `MW`, `MH`, `BRIDGED`, `painter(ctx)` (the `a` object, including `a.text` with stencil bridges), `masks`, `softs` (`SW`, `SH`, `BLUR`) | **Copy unchanged**. The `a.*` helpers are the vocabulary for `draw()`; add new ones in the same style if a subject needs them |
| Paper and light shader | `fibre` texture, `L`, `U` (uniforms), `COMMON` (`pool()`), `paperMat(self, edge)`, `THICK`, `PLIES`, `planes` | **Copy unchanged**. This shader is the whole look: per-sheet lights, soft shadows, rim light on cut edges, dusk on the near sheets |
| Box | `wood`, `woodMat`, `beam(...)` x4, `linerMat`, `liner(...)`, the dark `wall`, `K.env` and the cool `K.spot` | Copy unchanged |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0.5`, `tone: 'filmic'`, `bloom: 0.3`, `grain: 0.022`, `fov: 20`, black `background`) and `fonts`; change `topic`, `duration` |
| Camera and `update(t)` | `END_Z`, `cam` (`pos`, `aim`, `focus`, `ap`), `HOT`, `COLD`, `SPILL`, the `update` loop | Keep `END_Z` (the square-on end where the box fills the frame at fov 20), the `update` loop and the colours. Rewrite the `cam.pos`, `cam.aim` and `cam.focus` keys (focus rests on each sheet's subject, then racks as its light comes on; times from the sheet `enter` and `lit`) |
| `sound(k)` | | Rewrite to the new sheets: `CHORDS` (one pad chord per light), per-side entrance sounds (`'top'`, `'right'`, `'bottom'` blocks), a `ding` per light, a closing `sparkle` |

No libs (`libs:` is empty). Keep `id: 'shadow-box'`.

Habits that make the look:
- Words are cut out of the paper in Anton (`a.text`), as a big year or label on its own sheet, lit from behind so it becomes a bright window; glyphs with counters get a stencil bridge (`BRIDGED`). There is no overlay text.
- One big subject per sheet, each lower than the one behind it with open air above its outline, listed back to front; the last sheet (`ground`) carries the closing line.
- Sheets arrive one at a time and each differently (drop with two small bounces and a rattle, push along a groove with a slight overshoot, rise from below and sway); the light for the slot behind it comes on at `litAt`, burns hot, then settles to its `ember`.
- Light lives in the shader, not in three.js lights: warm pools between sheets, blue dusk on the near ones, warm rim on cut edges, softer shadows the further they travel; real lights only light the walnut frame.
- Camera: very wide aperture (`ap` 0.3, closing to 0.07), a long lens (`fov 20`) that starts close at an angle, slides sideways and pulls back to square-on; the focus racks sheet to sheet via `cam.focus` as each light comes on. The key before time 0 means it is already moving on frame one.
- Sound: a soft pad chord per light, paper and wood sounds that match each entrance, a bell on each light.
