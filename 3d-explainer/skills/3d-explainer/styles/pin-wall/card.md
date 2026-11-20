---
id: pin-wall
name: Pin Wall
family: Flat content made physical
use: explainer
fonts: Oswald, Inter
reference_topic: How a volcanic island is born
duration: 10
samples: 40
libs: 
---

# Pin Wall

**Look:** A pin-art toy the size of a wall, laid out like a relief model: tens of thousands of steel pins with rounded heads in a tight honeycomb, held in a dark bolted frame. The pin heights form a landscape you could put your hand on, and groups of pins carry a tint for what they stand for (here blue for sea, warm for rock, glowing orange for lava).

**Motion:** The relief never stops moving. It is one height field that changes over time: swell travels across it, shapes push up from below, rings run outwards, and every pin follows a moment late with a little bounce, so anything sudden shivers and settles. What is finished stands still, what is alive keeps moving.

**Light:** One low raking light from the far left, so every height difference throws a long soft shadow and every lit head carries a glint; a blue light from the opposite side fills the shadows; a small warm light sits wherever the relief glows.

**Materials:** Satin steel pins with polished domed heads and darker shafts, tinted like anodised metal; a powder-coated black frame with bolts.

**Camera:** One slow continuous crane seen from a raised three-quarter angle: it starts low, looking across the pin heads with shallow focus, and rises and drifts round the subject until the whole relief reads. The relief fills the frame the whole time.

**Finish:** Real motion blur on the pins, depth of field in the low pass, bloom on the glints and on anything hot, filmic contrast, vignette, fine grain.

**Good for:** Anything that can be shown as a moving relief or a moving greyscale picture: terrain, waves, growth, charts that rise, shapes that morph into each other. The content is one height function, relief(pin, time), which says how far each pin stands out and which tint it carries. A beat is a change in the relief that follows from the one before (calm, something rises, it breaks through, the result). Words are one short caption per beat on a small plate at the bottom; the pins never form words.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `DURATION`, `WALL_W`, `WALL_H` (keep the aspect near 4:3 so the wall fills the frame), `BEATS` (`at`, `say`, optional `note`), `TINTS` (`deep`, `pale`, `land`, `hot`) and the topic constants (`SEA`, `VENT`, `SWELL`, `BUILD`, `ERUPTIONS`, `CONE`, `CRATER`, `FRONT`) |
| Relief functions | `setup(x, y)`, `moment(t)`, `relief(p, m, t, o)` | Rewrite for the new topic, keeping the contract: `setup` once per pin, `moment` once per moment, `relief` fills `o.lift`, `o.land`, `o.pale`, `o.hot`. They must be pure functions of `t` (no state kept), because every frame is built from many moments. To show a drawn picture instead, read a greyscale canvas back with `getImageData` and return its grey as `o.lift` |
| Pin mechanism | `PITCH`, `patch()`, `U`, `pinGeo` lathe profile, `cols`/`rowH`/`rows`/`count`, `state` (`aPin`), `pins` InstancedMesh, the placement loop, `show(t)` | **Copy unchanged**. The honeycomb, domed heads, per-pin four numbers per moment and the tint shader |
| Frame and room | `coat`, `add`, `FB`, `FRONT_Z`, `FD`, frame bars, `bolt`/`boltMat`, the black back plane | Copy; `FRONT_Z = SEA + 0.3` ties the frame to the resting height, so change it with `SEA` |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0.55`, `tone: 'filmic'`, `bloom: 0.4`, `vignette: 0.4`, `grain`, `fov: 28`, near-black `background`) and `fonts`; change `topic`, `duration` |
| `build(S)` rig / `overlay` / `sound(k)` | | Keep the lights: `K.env` (two dim panels), the low raking `key` sun from the far left, the blue fill `K.sun` with `shadow: false`, the `lava` point light. Keep the `cam` paths (`pos`, `aim`, `ap`), including `camera.up.set(0, 0, 1)` and `K.focus`. Keep `overlay` (caption plate from `BEATS`). Rewrite the `update(t)` lines that drive `lava` and the `sound(k)` to the new beats |

No libs (`libs:` is empty). Keep `id: 'pin-wall'`.

Habits that make the look:
- Words live on one small caption plate at the bottom (Oswald main line in capitals, optional Inter `note` after a divider, two screws), drawn in `overlay`; fades in and out per beat. The pins never form words.
- Everything is one height field: sea and rock are both just `o.lift = max(sea, land)`; a story beat is a change in that function (a rising mound, an eruption that lifts the cone and sends a ring outwards).
- Pins answer a moment late with a small bounce (`K.spring` on `tau = t - e.at - p.r / FRONT - p.rnd * 0.05`): sudden things shiver and settle; finished things stand still, living things keep moving (swell, lapping).
- Tint is a property of the pin, by data: `o.land` picks the second tint, `o.pale` lightens the first, `o.hot` makes the head glow, with the `lava` point light driven by `now.glow`.
- Light is raking: key from the far left (it drifts a little with `t` so shadows are never still), blue fill from the opposite side, dark room and black backing.
- Camera: one crane from a low pass across the pin heads (aperture 0.1) up to a three-quarter view (aperture 0.028), always focused near the vent; the relief fills the frame.
