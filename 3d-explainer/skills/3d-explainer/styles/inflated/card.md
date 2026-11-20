---
id: inflated
name: Inflated
family: Material worlds
use: explainer
fonts: 
reference_topic: How a hot-air balloon flies
duration: 12
samples: 48
libs: strokefont.js
---

# Inflated

**Look:** Everything is a glossy inflatable in a bright one-colour studio: here a striped hot-air balloon, its basket, a flame, arrows, clouds and small tube letters. Each skin has welded seams and is limp, flat and creased when short of air, round and mirror-smooth when full.

**Motion:** Air is the animation. Things fill in pumps that overshoot and snap taut, swell from the valve end outwards, stand up, wobble and settle. Full things float and sway, landings squash and rock, arrows and captions inflate in and deflate out. Every jolt rings out as a wobble.

**Light:** Softboxes overhead and to the left and a thin strip on the right draw long white highlights on every skin. A soft key from the upper left shapes the forms and drops soft shadows; the floor and the flame bounce their colour onto the skins.

**Materials:** Clear-coated vinyl in hot candy colours (pink, orange, yellow, red) with cream trim and a wicker-orange basket, on a cobalt sweep with just enough sheen to hold a blurred pool of colour under each object.

**Camera:** One slow, continuous crane on a long lens that stays with the main object: high over it while it lies on the floor, sinking and pulling back as it stands, looking up at it as it rises, overtaking it to look down as it sinks, level again for the last hold.

**Finish:** True colours (neutral tone curve), real motion blur on the wobble, a touch of depth of field, soft bloom on the highlights and the flame, almost no grain.

**Good for:** Any explainer or story that can be told with a few simple inflated objects and characters. It is strongest where pressure, growth, floating, squeezing or too much and too little is the point, because how full each thing is carries the meaning. A beat is one change of air (something fills, lifts, vents, sags) that causes the next one; small balloon arrows show a push or a flow; each beat gets one short caption in small tube letters at the side of the frame.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `BEATS` (`at`, `until`, `say`; one short caption per beat, STROKEFONT characters only), `ROOM`, `STRIPES`, `CREAM`, `WICKER`, `WARM`. Keep one bold studio colour and hot candy colours |
| Story in air | `BURNS`, `FILLS`, `PILOT`, `T_*`, `ALT`, `STAND`, `T_THUMP`, `fire`, `air`, `alt`, `vent`, `tilt` | Rewrite for the new story: functions of `t` that say how full, how high and how tilted things are; `build` and `sound` both read them. Keep `ring(tau, hz, damp)` (a jolt that rings out) unchanged |
| Studio | `K.env`, `SOFTBOX_FILL`, `KEY_FROM`, `key`, `sky`, the `HemisphereLight`, `K.mirrorFloor`, the curved sweep on layer 1 | **Copy unchanged** (the `ROOM` colour feeds it) |
| Vinyl kit | `vinyl(color, o)`, `solid`, `merge`, `turned` | **Copy unchanged.** `vinyl` is the one material: clear-coated, gloss from softboxes only; `o.paint`, `o.vertex`, `o.fragment`, `o.uniforms`, `o.key` patch the shader |
| Letters | `LETTER`, `balloonLines(text)`, `captions`, `CAP` | **Copy unchanged.** Tubes along `STROKEFONT.layout`, inflated by `uPuff` |
| Inflatable objects | `envelopeGeometry`, `ENV_VERT`, `ENV_FRAG`, `ENV_PAINT`, `envU`, `envelope`, `pose`, `axisAt`, basket `rig` / `car`, `flame`, `arrows`, `clouds` | Topic-specific. Replace with the new subject's objects built the same way: `vinyl` skins, a vertex shader that fills them from limp to round (`uAir`, `uPose`), `K.tube` rings, `turned` bodies. The balloon envelope can be reused if the subject is a bag or balloon |
| `registerStyle` metadata + render | | Keep `render` (`background: '#000000'`: the sweep supplies colour, empty floor mirrors nothing) and `fonts: []`; change `topic`, `duration` |
| `update(t)`, `cam`, `sound(k)` | | Rewrite per object, keeping: key and sky light following the subject (`focusAt`), `K.look` from `cam` (`aimX`, `aimY`, `dist`, `high`, `side` as `K.path`), `K.focus(..., 0.012)`, captions placed in front of the camera at fixed picture position, inflating by `K.spring` and deflating by `out`. `sound`: keep the `room` bed, rubbery blip per caption, noise roars, thuds and pops on landings, vent hiss |

Needs the STROKEFONT library (`libs: strokefont.js`): `balloonLines` uses `STROKEFONT.layout` and `STROKEFONT.length` to turn captions into tubes. Keep `id: 'inflated'` in the new style file so assemble loads it. Captions may only use A-Z 0-9 . , ! ? - + : ' / & % # @ = and line breaks.

Habits that make the look:
- Words are small tube letters in the 3D scene, not overlay: one caption block per beat at the side of the frame (`CAP`), blown up from a thin thread with a spring overshoot line by line, bobbing, and deflated when the beat ends.
- Air is the animation: fill comes in pumps that overshoot and snap taut (`air`, `FILLS` through `K.spring`), swelling from the valve end outward; limp skins are flat, wrinkled and lying on the floor, full ones round and smooth.
- Every jolt rings out (`ring`): a pump, a basket slap, a tug at lift-off, a landing, each wobbling the envelope and squashing the rig.
- Small balloon arrows show a push or flow, inflating low, rising and deflating in loops (`arrows` loop with `period`); the flame and its `PointLight` give the only coloured light.
- One material for everything (`vinyl`), hot candy colours with cream trim on one cobalt sweep that holds a blurred pool of colour under each object.
- Camera is one slow crane on a long lens, aim following the main object (`alt(t - 0.1)`): high over it while it lies down, low looking up as it rises, overtaking to look down as it sinks, level for the last hold.
