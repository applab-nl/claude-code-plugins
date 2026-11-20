---
id: voxel
name: Voxel
family: Filters over 3D
use: explainer
fonts: 
reference_topic: How a tomato plant grows: seed, sprout, plant, fruit
duration: 8
samples: 56
libs: 
---

# Voxel

**Look:** Everything is built from small cubes, like a hand-made voxel model on a display base: a short palette with every cube a shade apart from its neighbours, tiny bevels that catch the light, and the label spelled in cubes on the front of the base.

**Motion:** The cubes do the animating: things drop in column by column, grow layer by layer, swell, pop and get knocked off, each with a small bounce on arrival. Nothing slides or fades.

**Light:** One soft warm sun from the front left and an open sky that really gets blocked in corners and under things, so every cube sits in its own little shadow.

**Materials:** Matte painted cubes with a narrow chamfer, a smooth off-white plinth under the model and a plain coloured tabletop, so the cubes are the only texture.

**Camera:** A long lens looking down from about 26 degrees with a wide aperture: the model is sharp, the table in front and behind falls soft, and it reads as a miniature. One slow arc and pull-back that keeps pace with what is being built.

**Finish:** Neutral tone mapping to keep the palette true, a little bloom on the cubes that glow, light vignette, almost no grain.

**Good for:** Anything that can be shown as a small model that builds up in stages: how something grows, is made or is put together. One base, one subject in the middle, one voxel word per stage, weather or helpers as small cube events around it.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `STAGES` (one word per stage, `at` = the second it clicks on) and the `T` schedule (named event times shared by picture and sound) |
| Palette | `PAL` | Keep the grouped-palette idea and the keys the kit and floor use (`letter`, `floor`, `plinth`, base soil and grass); swap or add colours for the new subject |
| Model format | `model`, `slices`, `layers`, `shell` | **Copy unchanged.** Models are cell lists `{x, y, z, c}`; extra fields (`born`, `g`, `col`) ride along for animations |
| Voxel font | `FONT`, `textWidth`, `text(str, colour, depth)` | **Copy unchanged** (5 x 7 pixel font; add glyphs to `FONT` only if the new words need them) |
| Models of this clip | `BASE`, `GROUND`, `baseModel`, `bedFrame`, `bedSoil`, `WATERING_CAN`, `SEED_PACKET`, `TROWEL`, `SPROUT`, `TOMATO`, `fence`, `scatter`, `plantModel`, `fruitModel`, `flowerModel`, `cloudModel`, `sunModel` | Topic-specific: replace with models of the new subject, written the same way. Keep `baseModel` (display base with calm front face for the word, `shell` applied) and `scatter`; give animated models a `born`-style per-cell number |
| Renderer | `voxelKit(S, opt)` (`add`, `finish`, `update`) | **Copy unchanged.** One instanced mesh; `kit.add(cells, {at, anim, window, glow, matrix, shade})`, call `kit.finish()` once after the last add; `anim(v, t, o)` must depend on `t` only |
| Voxel motion | `fall`, `pop`, `knockOff`, `dropIn`, `waveDelay`, `SWEEP`, `sweepDelay`, `wordAnim`, `sway` | **Copy unchanged.** Every build and break is one of these three with a per-cube delay |
| `registerStyle` metadata + `render` | | Keep `render` (`fov: 16`, `tone: 'neutral'`, `background: PAL.floor`); `fonts` is empty (no type files); change `topic`, `duration` |
| `build(S)` | | Rewrite the `kit.add` list for the new set, keeping the pattern: base and dressing share the opening wave via `stamp(part, extra)` + `dropIn` + `window: OPEN`; words via `text()` + `wordAnim(s.at, tout)`; weather and props as animated parts. Keep the finish block (`kit.finish()`, `floor` + `plinth`, `K.env`, `K.sun` soft front-left, `K.skyLight`, `sunPower`) and the camera (`shot` as `K.path` of yaw, pitch, frame height, target; `aperture`; `K.focus` halfway between the word and the growing subject, `subjectY`) |
| `sound(k)` | | Rewrite events from `T` and `STAGES`; keep the voices: `tock` rattle as the base builds, `pop` on swells, `tock`/`swish` for each word, rising `pop` scale for growth, `blip`/`success`/`ding` for payoffs, `room` bed and `pad` |

No library is used.

Habits that make the look:
- Everything is cubes, even type: words are voxel letters (`text`) on the front face of the base, one word per stage; the old word is knocked off (`knockOff`) left to right while the new one flies in and clicks on (`wordAnim`). No overlay text, no font.
- Nothing fades or slides: cubes drop in with one bounce (`fall`), swell with overshoot (`pop`), grow layer by layer from a `born` value, or get knocked off. Delays come from distance or height plus `v.h` jitter, so builds read as waves.
- Short palette; each cube is a hair lighter, darker, warmer or cooler by `K.hash` (`shade`), and glowing cubes (`glow`) are the only bloom.
- One soft warm `K.sun` from front left plus an occluded `K.skyLight`: that occlusion seats every cube. Smooth plinth and plain tabletop so cubes are the only texture.
- Camera: long lens (fov 16) looking down at ~25 degrees, wide aperture (0.34 to 0.6) so the table goes soft and it reads as a miniature; one move that starts close on the bed and word and backs away and up as the subject grows, ending on a slight arc.
