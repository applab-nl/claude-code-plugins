---
id: domino-chain
name: Domino Chain
family: Machines that explain
use: explainer
fonts: Anton, Oswald, Fraunces
reference_topic: Small starts, big finishes: a domino can knock over one 1.5 times its size, so 13 dominoes take you from 5 mm to 65 cm
duration: 8
samples: 40
libs: 
---

# Domino Chain

**Look:** A row of hand-made dominoes on a polished walnut table: bone faces riveted to ebony backs, each engraved and paint-filled with one step of the story, the last one in red. When a domino falls its label lies down the right way up, so the fallen row reads like a chart.

**Motion:** Each domino hesitates, tips, accelerates, strikes the next at the right moment and comes to rest leaning on it. Small ones go in quick ticks and big ones fall slowly, so the run has a natural ritardando that ends on one heavy landing.

**Light:** One low warm lamp behind the start of the row, so every domino throws a long soft shadow up the face of the next one and across the table, and its own face brightens as it tips; a faint cool fill from the camera side; the table falls off into darkness.

**Materials:** Bone with a soft lacquer and black or red paint in the engraving, ebony backs, a French-polished walnut top that reflects the row, and one matchstick for scale.

**Camera:** A long lens that travels with the falling front like a tracking shot and backs away as the dominoes grow, rising from table height to a high three-quarter view. Shallow focus on the domino that is falling.

**Finish:** Real motion blur and depth of field, long soft shadows, filmic contrast, a warm vignette and fine grain.

**Good for:** Cause and effect, chain reactions, step-by-step plans and anything that compounds: every domino is one step, printed with a word or a number, and the fall carries the story from the first to the last. Sizes can grow, the row can bend and branch.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `STEPS` (one per domino: `label`, `sub`, optional `size`, `turn`, `from`, `hero`), `GROW`/`FIRST_MM`/`COUNT`, `CAPTION` (opening and closing line), `MATCH` |
| Chain physics | `WIDE`, `THICK`, `GAP`, `START`, `TIP`, `fallCurve`, `BOUNCE`, `sideView`, `overlap`, `leanOn`, `makeChain(steps)` | **Copy unchanged.** `makeChain` lays the row out and returns `{dom, angles, line, last}`; each `d` has `hit` (when struck), `land`, `T`, `x`, `z`, `yaw`, `h`, `parent`, `kids`. The schedule is computed here from `STEPS`: do not write times by hand |
| Table shader | `WOOD` GLSL and the `onBeforeCompile` patch on `K.mirrorFloor` with `frame` (`uFrame`) | **Copy unchanged** (multi-scale walnut grain that stays sharp as the shot grows 130x) |
| Domino builder | `FW`/`FH`, `fit`, `CAP`, `printFace`, `bone`/`ebony` materials, the `for (const d of dom)` loop making `d.face`, `d.pivot`, `d.tilt` | **Copy unchanged**; label type size is fitted across all steps, so just change `STEPS` |
| Match | the `MATCH` block | Keep (scale reference) or drop with `MATCH = false` |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0.5`, filmic, `far: 900`); change `topic`, `duration`, and `fonts` only if type changes |
| `build(S)` / `sound(k)` | | Rewrite the shot if the row shape changes, keep the rig: the `world` group (scaled and slid each frame so lamp, shadows and focus stay tuned), `K.env` with the three panels, the low warm `K.spot` behind the row and the cool fill `K.spot`, `follow` (`K.path` through each `d.hit`), `cam.pos/aim/lens` in units of the falling domino, `update(t)` setting `d.tilt.rotation.z = -lean[d.i]`, and `overlay` with `say()`. Sound: noise clack plus tone per strike, whoosh and impact on `last.land` |

Habits that make the look:
- Words are engraved on the domino faces and fall with them: Anton for the big label up the face (one fitted size for the whole row), Oswald for the small `sub` line, numbered ring at the foot; the last domino prints in red (`hero`). When the row has fallen, the labels read like a chart.
- Only two overlay lines of Fraunces italic (cream, soft shadow, a short copper rule): the opening line fades out around 2.0-2.5 s and the closing line appears at `last.land + 0.1`. No other text on screen.
- Motion is physical, not keyframed: each domino hesitates, passes its balance point and strikes at the time `makeChain` computes; time scale goes with `sqrt(h)`, so small ones tick and big ones fall slowly. Branches (`from`) and bends (`turn`) are data.
- Light is a low warm lamp behind the start of the row so shadows run up the next domino's face, a faint cool fill from camera side, everything else falls into darkness; polished walnut mirrors the row.
- Camera follows the falling front on a long lens: it works in units of the current domino (`Math.log(d.h)` in `follow`), starts at table height, backs away as sizes grow, then rises to a high three-quarter view as the last domino lands. Focus (`K.focus(camera, aim, cam.lens(t))`) stays on the domino that is falling; lens aperture 0.036 down to 0.01.
