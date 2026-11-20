---
id: floating-screens
name: Floating Screens
family: Products and screens
use: explainer
fonts: Fraunces, Inter
reference_topic: Ordering bread online from a small bakery in three steps: choose the loaf, check the basket, order confirmed
duration: 8
samples: 96
libs: 
---

# Floating Screens

**Look:** Screens as objects: white cards printed with a real interface, each backed by a block of clear glass, hanging one in front of the other in a bright, warm room. The newest card is always nearest and sharpest; the ones before it stay behind it, softly out of focus.

**Motion:** A card swings in from the side like a heavy door, slides to its place and settles. Buttons sink when pressed and the whole card gives a little. A thin cable draws itself from the pressed button to the edge of the next card, and at the end one highlight runs through the whole chain.

**Light:** One big soft window light from the upper right in front, so every card throws a soft shadow onto the card behind it and a softer one onto the wall, and every raised button and tile has its own small shadow. A bright room fills the shadows: nothing goes dark.

**Materials:** Matt printed card stock on thick glass with polished, slightly green edges; raised interface pieces in the same card; a painted plaster wall. Warm paper, dark ink and exactly one accent colour.

**Camera:** Long lens on a dolly that rolls past the row at one steady speed and never stops. It pans to stay on the newest card, hands over to the next one as it flies in, and finally cranes back until the whole sequence is in frame. Focus always sits on the newest card.

**Finish:** Neutral tone mapping so interface colours stay exact, real depth of field and motion blur, a faint vignette, almost no grain. Bloom is set so that only a glass edge that lights up glows.

**Good for:** Anything made of steps or screens: an app flow, a workflow, a process, a set of stats or quotes. One card per step, the action on each card acted out, a cable from each step to the next.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `SHOP`, `ITEM`, `ORDER`, `STEPS` (the corner tag on each card), `money`, the palette `C` (keep warm paper, dark ink and exactly one `accent`, plus `wall`), the schedule `T`, `LINK`, `HOP`, `FLASH`. Every word on a card comes from here |
| Card constants | `PT`, `CW`, `CH`, `RAD`, `PX`, `SHEET`, `GLASS`, `RIM`, `STEP`, `YAW`, `FROM`, `BTN`, `PORT_Y` | **Copy unchanged.** For more or fewer cards, extend `STEP`, `YAW`, `T`, `LINK`, `FLASH` and `kicks` to match |
| Canvas helpers | `say`, `pill`, `mix`, `tick` | **Copy unchanged.** `loaf`, `basketIcon`, `wordmark` are topic art: replace with the new product's drawings and logo |
| Piece kit | `button(label, done)`, `chip(n, label)` | **Copy unchanged.** A piece is `(c, state, w, h)` drawn on its own canvas; state is what it animates, so the face never repaints |
| Screens | `drawProduct`, `drawPhoto`, `drawBadge`, `drawBasket`, `drawItem`, `drawTotal`, `drawPickup`, `drawDone`, `drawTick`, `drawWhen` | Rewrite for the new story: one static face per card plus a few raised pieces |
| Set and card kit | `K.env` `room`, `K.sun`, `wallTex`, `wall`, `slab`, `solid`, `paper`, `printed`, `cardEdge`, `glass`, `makeCard`, `cable` | **Copy unchanged.** `makeCard(i, drawFace)` returns `{ group, rim, rest, at, world, piece }`; `cable(...)` returns `{ mesh, curve, shape(a, da, b, db, p) }` |
| Scene assembly | `cards`, `chips`, `sockets`, every `piece(...)`, `links` | Rewrite for the new screens; keep one chip per card, one socket per card after the first, one link between each pair |
| Motion helpers | `pressed`, `kicks`, `q`, `pose` | **Copy unchanged** (`pose(card, i, t)` is the heavy-door arrival: position spring damping 1, rotation spring 0.5), updating `kicks` to the new press times |
| `registerStyle` metadata + render | | Keep `render` (`samples: 96`, `fov: 28`, `near: 0.5`, `shutter: 0.5`) and `fonts`; change `topic`, `duration`; keep `background` equal to `C.wall` |
| `update(t)`, `cam`, `sound(k)` | | Rewrite `update` per piece (press = `lift` + `show`, count-ups, tick, ring) and keep its tail: connectors via `L.cable.shape`, chip nods, `K.look`, and `K.focus` lerped to the newest card with `cam.ap`. Keep `cam` as `pos` (`K.path`), `aim` (`K.track`) and `ap` (aperture that drops to 0 during a hand-over); retime to `HAND` and `T.wide`. `sound`: keep the `room` bed, `pad`, whoosh + thud + tock per card, click + pop per press, one rising line and a note per cable |

Needs no library (`libs:` is empty); fonts are `Fraunces` for headlines and `Inter` for all UI text.

Habits that make the look:
- Words live on the cards as canvas texture, never as overlay: `Fraunces` 600 for the wordmark and headlines, `Inter` for labels, prices and buttons, with small spaced caps for tags. One accent colour only, used for "the thing you press" and "done".
- A card arrives like a heavy door: position springs in without bounce, rotation swings past and settles; the older cards stay behind and soft. Buttons sink (`pressed`), ripple, and their label swaps to the done state; numbers roll and totals count up.
- Raised pieces each have their own thickness, `lift` and shadow; the card gives a little (`kicks`) on every touch.
- A cable draws from the pressed button to the next card's socket, with a bead at its head; at the end one `glint` runs through the chain while each glass rim flashes (`FLASH`, `rim.emissiveIntensity` 0.22 up to ~5) and the chips nod.
- Light is bright and warm: window sun from the upper right, a pale room so nothing goes dark; neutral tone so interface colours stay exact.
- Camera is a long-lens dolly that never stops; aperture closes to 0 for each hand-over so the pan streaks, focus sits on the newest card, and it cranes back at `T.wide` to show the whole chain.
