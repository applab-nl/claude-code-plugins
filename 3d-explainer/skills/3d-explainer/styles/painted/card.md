---
id: painted
name: Painted
family: Filters over 3D
use: story
fonts: Caveat
reference_topic: From wind to bread: a gust crosses a wheat field and turns the windmill, the millstone grinds flour, and a loaf ends up on the bakery sill
duration: 12
samples: 24
libs: 
---

# Painted

**Look:** A filter, not a set: any lit 3D scene comes out as an oil painting on canvas, with thick directional brush dabs, broken colour, ridges of paint that catch a raking light, linen weave showing through the thin darks and a ragged unpainted edge. Here it carries a golden-hour countryside: a wheat field, a windmill, a bakery cottage.

**Motion:** Things happen inside the painting and each one causes the next: a gust runs through the wheat as a wave of bent stalks, reaches the sails and spins them up, the millstone turns with them, flour pours into a sack and puffs, a loaf is slid onto a sill. Brush dabs are fixed to the things they describe, so they travel with stalks, sails and sacks instead of boiling; the canvas weave stays still. Each caption is brushed on in under half a second when its beat starts and stays until the next one.

**Light:** One low golden sun from behind and to the side, long shadows, cool blue-violet sky light in every shadow, and small warm lamps (a doorway, a window, a lantern) wherever the story needs the eye. Warm light against cool shadow is the whole palette.

**Materials:** Rough simple shapes with no detail of their own, each big enough to survive a brush nine pixels wide. Every surface carries a field of brush dabs that varies its colour, tilts its shading and adds bristle streaks; the painterly filter turns that into strokes.

**Camera:** One continuous shot at walking height, like a picture book without page turns: it travels with the wind from the field toward the mill, cranes down to the door and drifts slowly across it while the stone works, then glides after the flour dust along the track and pushes in on the window sill, where it stops and holds on the thing that was made. Everything sharp, like a canvas. Each stop is composed like a painting, with the subject large in frame.

**Finish:** Anisotropic Kuwahara brush filter, then a paint-relief and canvas-weave pass lit from the upper left, which also letters the caption on a bare corner of the linen. Soft bloom on the sun and the lamps before the filter, so the glow is painted too. No grain, no vignette.

**Good for:** Stories, journeys and processes that happen in a place, told as a picture book: how something is made, where something comes from, a day in a life, a chain of cause and effect. Each beat is one stop in the landscape where one thing visibly happens and sets off the next; something that travels (wind, a road, a river, a character) leads the camera from stop to stop; one short caption per beat sits in the bare corner of the canvas and names what is happening. The filter carries any 3D scene, so the world can be a farm, a city, a workshop or a room, as long as each subject is a big simple shape.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `DURATION`, `BEATS` (`at` + one short caption each), `WRITE`, and the story's own timing constants (`GUSTS`, `GUST_SPEED`, `SAILS`, `STONE_GEAR`, `DOOR_AT`, `DOOR_LEAVE`, `STOP`, `FLOUR_ON`, `SACK_FULL`, `OVEN_ON`, `LOAF_OUT`, `LOAF_DOWN`, `BIRD_CALLS`), `sailAngle`, `sailPasses`, `cogKnocks`, `STONE_NEAR` |
| Caption lettering | `lettering()`, `CAP`, and in `build` the `words` / `capTex` / `capU` / `caption(t)` block | **Copy unchanged** (`lettering()` only reads `BEATS` and `WRITE`). Caption is brushed on word by word in the bare lower-left corner by the surface pass |
| The paint | `BRUSH` (Kuwahara pass), `SURFACE` (relief, weave, caption), `S.addFilter(BRUSH, ...)`, `S.addFilter(SURFACE, capU)` | **Copy unchanged**. This is the whole painterly look |
| Dab kit | `dabField`, `DABS` (`sweep`, `upright`), `dabScale`, `STATIONS` + the `REF` loop + `GROUND_REFS`, `paint()`, `bake()`, `add`, `group`, `box` | **Copy unchanged** except the `STATIONS` list: one station per stop of the new story (eye, aim, seen), and every object names its stop with `at:`. `paint({a, b, c, dabs, size, tilt, at, moving})` is the only material for scene surfaces |
| Wind kit | `WIND`, `gustAt` (JS), `GUST_GLSL` (same fronts in GLSL), `uTime` | Copy if the story has a travelling disturbance that bends things; replace `GUSTS` and who reads them |
| World and props | `ground`, `riverX`, `TRACK`, `inField`, wheat, grass, trees, mill, sacks, bakery, `plume` smoke, birds | Topic-specific: replace with the new place built from big simple shapes. Keep the pattern (`ground()` for height, `G()`/`local()` to stand things on it, `paint()` materials, `bake()` for static dab layout) |
| Sky and water | `SKY`, `skyU`, the sky sphere and water plane | Copy; change colours only to retune the hour |
| `registerStyle` metadata + `render` | | Keep `render` (`samples: 24`, `shutter: 0.5`, `fov: 34`, `bloom: 0.5`, `vignette: 0`, `grain: 0`, `background`); change `topic`, `duration`, `fonts` stays `[CAP.font]` |
| `build(S)` rig / `sound(k)` | | Rewrite around the same rig: `sun = K.sun(...)` with `sunDir`, `lightElev`, `discElev`, the cool `bounce` light, `lampLight()` for warm windows, the two-leg `cam` (`leg1`, `leg2` joined at the mid stop via `K.path`), and an `update(t)` that sets `uTime`, light, each beat's motion, `K.look(camera, ...)` and `caption(t)`. `sound(k)` keeps `k.bed('room')`, the `pad`, the breeze bed and a `stroke` per caption word |

No libs (`libs:` is empty). Keep `id: 'painted'`.

Habits that make the look:
- Words are one short caption per beat, brushed on word by word in Caveat in the bare lower-left corner of the canvas and wiped just before the next beat; never 3D text or overlay.
- Every subject is a big, simple, flat-shaded shape (a brush nine pixels wide eats anything thinner), with a clear tone step against what is behind it.
- Dabs are projected from a station and stay fixed to surfaces (`bake`, `moving: true` for things that move); the canvas weave stays still on screen. Nothing boils.
- Each beat causes the next through one thread (here the gust: `gustAt` drives wheat, trees, sails, dust, smoke) and things ease with `K.seg`, `K.spring` and closed-form angles (`sailAngle`) so any frame renders alone.
- Warm low sun against cool shadow, small warm lamps (`lampLight`, emissive oven) where the eye should go; the sun sinks a little over the clip.
- One continuous walking-height shot, every stop composed with the subject large; everything sharp (no depth of field), with a slow drift while a beat plays and a hold on the final result.

## Prompt differences

The prompt for this style says "Tell my content as a story, not a title card" where most styles say "as an explainer". Tell the content as a short story with a beginning, a turn and an end, still with the picture doing the telling: each beat is a place where one thing visibly happens and sets off the next, and the captions only name it.

## Fixes applied to the reference

- The caption lookup `ink()` in the SURFACE pass returned early outside the caption box, before its mipmapped `texture2D` of the caption sheet. Because `ink()` is also sampled 1.5 px to each side for the relief, pixel quads on the box edge ran that lookup in non-uniform control flow, so its derivatives and mip level were undefined. One pixel column at the box's left edge changed from render to render, and the purity check failed. The lookup now always runs and is multiplied by an in-box mask, so the look is unchanged.
