---
id: spotlight-stage
name: Spotlight Stage
family: Spaces and journeys
use: story
fonts: Oswald, Playfair Display
reference_topic: The first powered flight: from the Wright brothers' bicycle shop in Dayton to 12 seconds and 120 feet at Kitty Hawk on 17 December 1903
duration: 12
samples: 40
libs: 
---

# Spotlight Stage

**Look:** A toy theatre at night: crimson velvet, a worn timber stage and a painted world of flat card cut-outs standing in layers, with an easel card at the front for the caption. The room is dark; whatever the story is about is picked out by shafts of light cutting through haze.

**Motion:** It plays like a show. Scenery flats slide in from the wings, pieces are flown in from above on thin rods, actors and props are cut-outs pushed along slots in the floor with a small wobble. Scene changes happen in view: flats part, others glide in, the easel card is pulled and the light changes colour.

**Light:** Only stage lamps, each a real spot light with a matching visible beam: two follow spots from the house that stay on the actors, two wide front washes that set the colour of the scene, a top light that drops a shaft on the centre of the action, a small special on the easel card and a row of horizon lights behind the last flat. No fill: what no lamp touches stays black.

**Materials:** Thick matt card painted in flat gouache colours with a fine ink line and paper grain, bare card on the sawn edges, thin steel rods and wires, deep-pile velvet with gold braid, dark stained boards with a satin reflection.

**Camera:** One slow continuous move from a seat in the stalls: it starts a little left on the first scene, eases back and across as the stage changes, then drifts in and up with the action. Long lens, the whole stage picture sharp.

**Finish:** Beams are ray-marched cones with drifting haze and dust that only shows inside them; soft shadows from each layer onto the one behind, bloom on the brightest card, filmic contrast, heavy vignette, fine grain.

**Good for:** Stories, history, fables and step-by-step scenes. One scene per beat: each beat is a stage picture built from flat cut-out scenery and cut-out actors, and the change between beats is shown, not cut. The follow spot says where to look, the colour of the wash says where and when we are, and one short line on the easel card names the scene (it can carry a running number).

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `CARDS` (one easel card per scene: `place` plus one or two short `lines`, or `count` for running numbers), `SHOP_SIGN`, the `CUE` prompt book (every move of scenery, actors and lamps on one clock), `D` |
| Stage kit | `CURTAIN_Z`... `Z`, `HAZE_GAIN`, `gateU`, depth pre-pass (`depthRT`, `pre`, `probe`), `BEAM_VS`/`BEAM_FS`/`HAZE`, `makeLamp()`, dust `Points`, `velvetMap`, `velvetMat()`, `makeCurtain()`, valance, `boards`, `K.mirrorFloor`, `drape`, `groove` | **Copy unchanged.** The beams, haze, dust, proscenium gate and velvet frame are the look; do not simplify them |
| Cut-out kit | `INK`, `CARD`, `ell`, `rect`, `round`, `strip`, `limb`, `hull`, `place`, `label`, `cutout()`, `hung()`, `onSlot()` | **Copy unchanged.** Every piece of scenery is `cutout(items)`, then `hung()` (flown on rods) or `onSlot()` (pushed along a floor slot) |
| Easel kit | `EASEL`, `fit`, `drawCard()`, `easel`, `cards`, the `counter` redraw | **Copy unchanged**, apart from the `CARDS` it reads |
| Art | `manArt`, `benchArt`, `frameArt`, `bicycleArt`, `paintWall`, `flyerArt`, `propArt`, `duneArt`, `tuft`, `sky`, `FLAT` | Topic-specific: replace with the new story's flats and actors, drawn with the same item lists. `manArt` (a profile figure from two arms and a stride) and `duneArt` (a layered flat with tonal bands) can be reused for any person or landscape |
| `registerStyle` metadata + `render` | | Keep `render`; change `topic`, `duration` (`D`). Keep `fonts` |
| `build(S)` / `sound(k)` | | Rewrite. Keep the rig: the `lamps` (`follow`, `follow2`, two `wash`, `top`, `cardLamp`, `horizon` row) and their `.set(aim, level, { color, angle, reach })` calls in `update(t)`; the open `curtains` with their swinging `lag` and the valance; the `Z` layers; the `camera` as `cam.pos` / `cam.aim` paths with `K.look` and `K.focus(camera, [0, 2.5, -1.5], 0.01)`; the `washLevel`/`washTint`/`horizonLevel`/`horizonTint` tracks; scene changes done by `seg()` against `CUE` times |

Keep `id: 'spotlight-stage'` in the new style file so assemble loads it.

Habits that make the look:
- Scene changes happen in view, never as a cut: the old flats part (`wallL`/`wallR` slide apart on `part`), sliders and the bench run off, hung pieces are flown out on `flyOut`, then the new flats slide in from the right (`far`, `mid`, `front` on `CUE.dunes`, `E.outQuint`) and the next piece is flown in on its rods (`flyerAt`'s `drop`). Time every move in `CUE`, and let picture and `sound()` both read it.
- Words live on the easel, not as overlay text: one card per scene in Oswald (`place` in 700, `lines` in 500, running numbers in 700 with the unit in 500, right-aligned on a fixed line so nothing jumps), sized with `fit()`. The front card is pulled away to the right (`cards[i].position.x` on `CUE.card`) to reveal the next. A `count` card redraws only when a whole number changes. Playfair Display 800 is for one painted sign inside the set (`SHOP_SIGN` in `paintWall`), never for captions.
- Actors and props are cut-outs on sliders with a small physical wobble: a pushed `onSlot` figure rocks by its own speed (`rotation.z` from velocity), a piece lowered onto the bench settles with a decaying sine (`exp(-k * ts) * sin`), hung pieces sway a hair. Nothing tweens without weight.
- Light says where to look and when we are. Follow spots (`follow`, `follow2`) travel with the actors via `mix3` between positions; the `wash` pair is crossed and changes colour per scene through `washTint`/`washLevel` (amber indoors, cold blue, then sun); `top` drops a shaft on the centre of the action; `horizon` only comes up for outdoor scenes. Dim the lamp you are leaving as the strike happens. There is no fill: what no lamp touches stays black.
- Depth comes from layers, not parallax tricks: everything sits on its `Z` plane and casts real shadows onto the one behind, so a moving journey is the flats sliding left at different speeds (`FLAT.*.pan` times `pan(t)`) while the hero barely moves.
- The camera stays in the stalls: one slow move (`cam.pos`, `cam.aim`) with a long lens (`fov: 30`) and the whole stage sharp (`K.focus` at a tiny aperture). Do not cut or swing it to follow action; the lamps do that job.
- Sound is stagecraft: a held pad chord per scene (`k.music('pad', ...)`, via `bar()`), sliders as `roller`, hung pieces landing as `tock` and `thud`, the card pull as `paper`, and one counting `tick` per running number.

## Prompt differences

This style's prompt says "Tell my content as a story, not a title card" where most styles say "as an explainer". Write the prompt that way: tell the content as a short story with a beginning, a turn and an end, one stage picture per scene, and still let the picture do the telling. The easel card names the place or the moment in a few words; it does not carry the explanation.
