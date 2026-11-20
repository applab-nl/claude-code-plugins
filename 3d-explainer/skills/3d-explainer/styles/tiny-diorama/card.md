---
id: tiny-diorama
name: Tiny Diorama
family: Spaces and journeys
use: explainer
fonts: Fredoka
reference_topic: How your parcel gets to you
duration: 8
samples: 72
---

# Tiny Diorama

**Look:** A whole little world on one floating tile, like a designer's model on a desk: chunky rounded buildings, a toy van, peg people and lollipop trees in a few matte paint colours, on a thick slab of ground whose cut sides show soil, clay and rock.

**Motion:** Small life at small scale: one vehicle drives the route with weight (it squats, leans and nods when it brakes), doors roll and swing, smoke puffs, peg people hop, lights come on, and each stop's sign flips to the accent colour when its part is done. The tile turns slowly the whole time.

**Light:** One soft warm sun from the front left that sinks and warms through the clip, a cool sky that darkens every crease and contact, and a few tiny lamps that take over at the end.

**Materials:** Matte painted-model surfaces, flocked grass with a soft sheen, a hand-painted cross-section of earth with real stones pressed into it, card signs. One accent colour is kept for the thing the story follows.

**Camera:** Long lens, three-quarter view from above, close enough that the tile fills the frame. The tile turns on its turntable to show each stop in order while the camera makes one slow rise and push-in; neither ever stops.

**Finish:** Strong tilt-shift: a wide-open lens keeps a thin band sharp around the action and melts the near and far edges of the tile, which is what makes it read as a miniature. The band travels with the story and the lens stops down a little for the final picture. True colours, slightly rich, light vignette, almost no grain.

**Good for:** Places, systems and journeys: anything with a few stops and something that travels between them (a supply chain, a commute, how a request moves through a company). Each stop is a little building with a sign; the traveller links them in order.

## Working with the reference

`reference.js` is split into three parts. Treat them differently:

| Part | Lines start at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: stops, sign words, tile size, road, palette accent use |
| One schedule | `// ---- one schedule for picture and sound` | Replace with your own `T` and `FLIPS` |
| The diorama kit | `// ---- the diorama kit` up to `registerStyle(` | **Copy unchanged.** `ring`, `loft`, `lip`, `prism`, `paint`, `lampPaint`, `put`, `box`, `decal`, `tile`, `ribbon`, `gable`, `windowPane`, `peg`, `tree`, `sign`, `van`, `puffs`, `trap`, `hop` are the look. Add new builders beside them in the same idiom |
| `registerStyle({...})` metadata + `render` | | Keep `render` as is; change `topic`, `duration` |
| `build(S)` / `sound(k)` | | Rewrite for the new story, keeping the light rig, backdrop paper, painted shadow, turntable `turn(t)`, `cam.orbit`/`cam.aim` paths and the travelling focus band |

Style-specific habits worth keeping:
- Everything on the tile lives in `land` (inside `world`), so the turntable rotation carries it; use `toWorld(p, th)` for anything that needs world coordinates (focus, sign facing).
- The focus subject moves with the story (`subject` in `update`), aperture ~0.36 → ~0.24 for the last picture.
- Signs are the captions: one per stop, numbered, flipping to the accent on completion. Extra words should also be card signs or labels in the world, not overlay titles.
- Dusk runs from ~1/3 to ~4/5 of the clip; lamps and windows take over at the end.
