---
id: monument-type
name: Monument Type
family: Spaces and journeys
use: title
fonts: Archivo Black
reference_topic: Done beats perfect
duration: 9.0
samples: 48
libs: text3d.js
---

# Monument Type

**Look:** Words as architecture: a short phrase stands as colossal letters on the terraces of a dark concrete monument in a flooded salt flat at sunset. One word is weathered steel and keeps the last sun; tiny people, lamps, birds and a crane give the scale.

**Motion:** The words never move. The camera starts at eye height against one giant letter, slides off the terrace as it turns to face the words, and sinks back over the water until the terraces close up into one block that reads top to bottom. Then the evening shadow climbs the monument and leaves only the hero word in the sun.

**Light:** One low sun from the front left rakes every face, picks out board marks and seams and throws long shadows; the cool sky is the only fill, so shade goes blue. At the end a far ridge shades the monument from the bottom up while lamps and windows come on.

**Materials:** Board-marked concrete with pour joints, tie holes and rain streaks; rusted steel plates with welded seams for the hero word; wet stone paving; plywood formwork and scaffold tubes on the unfinished letter; pale salt under a film of water that mirrors everything.

**Camera:** One continuous drone move with deep focus (shallow focus would turn the monument into a model): a wide lens at eye height for the start, a longer lens low over the water, looking up, for the hold.

**Finish:** Filmic contrast, a little bloom on the sun and the lamps, soft vignette, fine grain, a short shutter. No depth of field.

**Good for:** A short statement of two to five words where one word is the point: a principle, a motto, a verdict, a title. The hero word gets the top terrace, its own material and the last light; a word can be marked unfinished to put it under scaffolding.

## Working with the reference

`reference.js` is one block: a content block, a kit of generated surfaces, then the set built from the layout.

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `WORDS` (`{ text, hero, width, unfinished }`; first word is the hero, 2 to 5 words), keep `FONT` (`Archivo Black`) and `SPACING` |
| Layout | `HOLD`, `FRONT_WIDTH`, `WALK`, `BACK`, `PLINTH`, `GAP`, `PERSON`, `layout(K)` | **Copy unchanged.** The monument re-plans itself from `WORDS` and `HOLD` |
| Surface kit | `TILE`, `TN`, `around`, `concreteTex`, `steelTex`, `noiseTex`, `saltTex`, `paveTex`, `surface(THREE, tex, noise, o)` | **Copy unchanged.** World-space textured materials, so no UVs and letters of any size |
| Timing | `T = { leave, hold, end }` | Keep the shape; change the numbers only with `duration: T.end`, and `sound(k)` reads the same `T` |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0.35`, `tone: 'filmic'`, `bloom: 0.3`, `fov: 33`, no depth of field); change `topic`; `fonts: [FONT]` and `duration: T.end` stay |
| `build(S)` | | Keep the whole set: `rows = layout(K)`, `SUN`, `SHADOW`, `K.env` cool sky, `K.sun`, `sky`, the mirror water, the `dusk` track with `shadeAt` and `ridge`, `concreteMat`/`darkMat`/`steelMat`, `beams`, terraces with `paved`, the wet top terrace (`K.mirrorFloor`), `CAUSE`, the words via `K.text3d`, lamps/`poles`/`bulbs`/`halos`, `person` and the instanced figures, `streaks`, window `frames`, and the unfinished-word scaffold and `crane`. Nothing topic-specific lives here: it all follows `WORDS` |
| Camera | `cam` (`pos`, `aim`, `fov` as `K.path`) and `update(t)` | Keep: eye-height start against the hero letters, leave the terrace at `T.leave`, arrive at `HOLD` at `T.hold`; `K.look(camera, pos, cam.aim(t), cam.fov(t))` and `K.focus(camera, 40, 0)` (deep focus) |
| `sound(k)` | | Keep, adjusting times only with `T`: wind, a low D drone, `whoosh` at `T.leave + 0.3`, `impact` at `T.hold - 0.15` with a chord, last-light notes at `T.end - 1.5` |

Needs the TEXT3D library (`libs: text3d.js`): the reference calls `K.text3d(w.text, { font: FONT, size, depth, bevel, bevelSegments, letterSpacing, curveSegments })` for every word. Keep `id: 'monument-type'` in the new style file so assemble loads it.

Habits that make the look:
- Words are the architecture, not an overlay: one 3D word per terrace, Archivo Black, sized so every word has the same width at the hold camera; the hero word is weathered steel (`steelMat`) on the top terrace, the others pale concrete.
- Nothing animates but the camera and the light: the words stand still while the shadow edge `dusk(t)` climbs the monument and lamps and windows come on.
- `unfinished: true` puts one word's last letter under scaffold and a crane, the only moving machinery besides the small people.
- Scale is carried by tiny people, lamps, birds and long streak shadows; textures are in world units (board 25 cm, tie hole a hand wide).
- Light and colour: one low warm sun from front left, cool sky as the only fill so shade goes blue, a mirrored lake; end with only the hero word in the sun.
- Camera: one drone move, wide lens (fov ~50) at eye height against a letter, sliding off and sinking to a longer lens low over the water, always deep focus.
