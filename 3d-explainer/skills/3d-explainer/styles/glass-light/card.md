---
id: glass-light
name: Glass and Light
family: Material worlds
use: explainer
fonts: Inter
reference_topic: How a vinaigrette comes together: 3 parts oil, 1 part vinegar
duration: 12
samples: 64
libs: 
---

# Glass and Light

**Look:** Real glassware on a dark stone table in front of a glowing backdrop: thin clear jars and bottles turned on a lathe, holding coloured liquids with a visible surface, a meniscus and sharp boundaries between layers. Every liquid throws a pool of its own coloured light, with bright caustic lines, on the table in front of it. Small white measure marks are printed on the glass.

**Motion:** Calm, with weight. Bottles lift, lean and pour a thin falling stream; levels rise against the marks while the bottle empties; rings spread where the stream lands; layers settle; a jar is shaken hard and set down. The lamp swings slowly behind the glass so the pools of light sweep across the table.

**Light:** Back-lit like glass photography: a bright horizon behind, darkness above, and a lamp behind and above the glass, so light comes through the liquids towards the camera. Softboxes give every rounded edge a white rim; the backdrop gives the glass dark and bright lines to bend.

**Materials:** Thin clear glass with real refraction and a thick foot; liquids that let the backdrop through, pale where they are thin and deep where they are thick, and turn milky when mixed; brushed steel for lids and spoons; dark matte stone with a faint sheen.

**Camera:** One slow continuous dolly: it starts wide enough for the bottles to lift and pour, then moves in on the jar as the layers form and ends close on the finished mixture, still drifting.

**Finish:** True colours (neutral tone curve), bloom on the light pools and rims, a soft vignette, fine grain. Captions are a crisp 2D overlay.

**Good for:** Recipes, mixtures, ratios, amounts, chemistry: anything that fills, pours, layers or changes colour, told with real glassware. A beat is one action on the vessel (a pour, an addition, a shake, a wait). Amounts are levels against the marks on the glass, ingredients are colours, and a change of state is a change in the liquid (layers, cloudiness, colour). Labels are the measure marks plus one short caption line per beat.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `PART`, `MARKS`, `POURS` (name, `tint`, `parts`, `pour` [from, to], `bottle`, `at`, `stream`; lowest layer first), `MIX` (what happens after the pours: spoon, drop, lid, shake times), `CAPTIONS` (`[from, to, text, dot colour]`), `DURATION`. Keep tints light: colour deepens with depth |
| Glassware | `SHAPES` | Reuse `jar`, `cruet`, `tall` or add vessels with the same contract: `glass` outline (foot up the outside, over the lip, down the inside), `liquid` outline, `radius`, `top` (the receiving vessel) or `lip` + `fill` (a pouring bottle) |
| Pour physics | `POUR_AT`, `LIFT`, `GRAVITY`, `SPOUT`, `WALL_Z`, `TABLE_BACK`, `fall`, `FLOOR`, `TOTAL`, `DELAY`, `DROP_FROM`, `PLOP`, `LANDED` | **Copy unchanged** (they derive from the content block, so `sound(k)` and the picture share them) |
| GLSL | `CAUSTIC`, `STUDIO`, `LIQUID`, `WORLD_VS`, `BLOBS` | **Copy unchanged** |
| Glass kit (sections 1 to 5 of `build`) | `K.env`, `castLight`, `renderLight`, `RECEIVE`, `backdrop`, `table`, `glass`, `steel`, `brass`, `liquid()`, `streamMat`, `outline`, `turn`, `vessel`, `leaning`, `stream` | **Copy unchanged.** `vessel(shape, a, b)` is a glass shell plus a liquid body driven through `userData.u` (`uLevel`, `uSplit`, `uRing`, `uChurn`, `uCloud`); `leaning(shape)` solves the lean at which the liquid reaches the lip; `stream(tint)` lays the falling tube |
| `registerStyle` metadata + render | | Keep `render` (`bloom: 0.55`, `bloomThreshold: 1.0`, `background: '#0a0b0d'`) and `fonts`; change `topic`; `duration: DURATION` |
| Scene and choreography | `jar`, measure `marks`, `lid`, `bottles`, `spoon`, `lump`, `update(t)` | Rewrite for the new recipe, following the same moves: bottle lift (`go`), lean (`b.angle(V)`), stream (`b.lay`), level rising `DELAY` later, ring and `uBlobs` where it lands, then the addition, lid and shake through `MIX` |
| `cam`, `sunAz`, `overlay`, `sound(k)` | | Keep `cam` (`pos`, `aim` as `K.path`, `lens` 0.02 to 0.035 through `K.focus(camera, cam.aim(t), ...)`), the `sunAz` swing with `SUN_EL`, and `overlay`; retime to the new beats. `sound`: keep the `room` bed and `pad`, the per-pour hiss, filling note and glug pops, `ding` when a level reaches its mark, tocks, the shake slaps |

Habits that make the look:
- The only words are the measure marks printed on the jar (`Inter` 700) and one short caption per beat in the 2D overlay: `Inter` 600 62px, top left in the dark corner, preceded by a dot in the liquid's colour, with a soft shadow, sliding up 14px as it fades in and out.
- Amounts are levels against the marks (`PART` per unit), ingredients are colours, and a change of state is a change in the liquid: layers with a thin dark boundary, a meniscus, rings where a stream lands, `uCloud` milk when mixed.
- Motion is calm and weighted: a bottle lifts, leans until its liquid reaches the lip, pours a gravity-shaped stream, empties as the jar fills, and goes back; the jar is shaken hard (`uChurn`) and set down with a small bounce.
- Light is back-lit: a bright horizon strip behind, dark above, white softbox panels for rims, and a slowly swinging lamp rendered by `renderLight` into coloured caustic pools on the table in front of each liquid.
- Everything coloured is opaque shader; only the clear glass (single-sided, transmission) goes over it. Do not add double-sided glass or transparent liquids.
- Camera is one slow continuous dolly, wide enough to see the bottles lift, then in on the jar to a close hold, still drifting; the set is dark, so the liquids carry the colour.
