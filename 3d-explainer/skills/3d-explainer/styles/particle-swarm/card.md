---
id: particle-swarm
name: Particle Swarm
family: Flat content made physical
use: explainer
fonts: Inter
reference_topic: Why popcorn pops
duration: 10
samples: 96
libs: 
---

# Particle Swarm

**Look:** Sixty thousand tiny glass beads hanging in front of a matte paper wall. They pile into plump, rounded models of things (a seed, a drop, a cell, an organ, a heap) that fill most of the frame and throw a soft shadow on the wall, change colour and strain while they hold, then let go and fly on to the next formation.

**Motion:** Beads arrive as a stream, overshoot their place and settle. A formed shape never freezes: it breathes, a colour change can run through it as a front, loose beads inside it buzz like a gas, and it can swell and tremble. When it lets go, a front crosses it or it bursts from the centre: beads are thrown outwards, curl along a flow field in ribbons and veils, then land in the next shape, with a few stragglers arriving late.

**Light:** One soft, warm key from the upper left, like a window, so every bead has a lit side, a small glint and a shadow on its neighbours, and the whole shape drops a soft shadow on the wall. Warm fill from all round. Heat is shown as light: hot beads glow by themselves and an orange lamp comes up from below.

**Materials:** Polished glass seed beads, uneven in size and shade, each with a sharp highlight and a glow on its far side: golden corn, blue water, white steam, cream popcorn. Matte paper wall in a deep, dull teal that all of them stand out from.

**Camera:** Long lens with shallow focus on the shape, so beads that fly towards the camera go soft. One slow continuous dolly: close and a little to one side of the small first shape, drifting back and round to square-on while it changes, pulled back by the burst to hold the big last shape.

**Finish:** Real motion blur and depth of field from accumulation (96 sub-renders), neutral tone mapping to keep the colours true, a touch of bloom on the glints and the hot beads only, a soft vignette, almost no grain. Captions are a crisp 2D overlay.

**Good for:** Processes where stuff flows, gathers, splits, grows, heats up or bursts, and things that are made of many units (cells, molecules, people, grains, data points). The beads are the stuff itself: a beat is either a new formation the swarm flows into or a change that runs through a formation while it holds (it warms from one side, something inside it comes loose, it swells). Populations keep their colour and identity from start to finish, so the viewer can follow where each kind of thing ends up. One short caption per beat names what is happening; the beads never form words or numbers.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `DURATION`, `WALL` (a colour every bead stands out from), `SHARE` (the populations and their bead fractions; they keep identity all clip), `T` (the turns of the story), the drawing helpers (`kernelPath`, `kernel`, `drop`, `steam`, `LOBES`, `popcorn`, `hotGlow`...), `TARGETS`, `FLIGHTS`, `DIALS`, `CAPTIONS` |
| Target format | `TARGETS` entries: `{ id, swell, parts: { <population>: { puff, body, float, restless, glow, draw } } }` or `{ id, cloud: {...} }` | Keep the format and the option names (`puff`, `body`, `float`, `restless`, `glow`, `cloud`, `swell`). Each `draw(ctx)` paints on a 960 x 540 canvas; the paint colour becomes the bead colour. Reuse the same outline in two targets so beads stay put and only change colour |
| Flights | `FLIGHTS` (`to`, `t0`, `dur`, `spread`, `waves`, `wave`, `push`, `flow`, `lift`, `swirl`, `scatter`, `late`) | Rewrite for the new story; every bead must land before the next `t0`. The first flight starts before 0 (`t0: -1.45`) so the swarm is already arriving on frame one |
| Swarm kit in `build` | `inflate`, `sample`, `pos`/`col` textures, `U` uniforms, the `motion` ShaderMaterial (simplex `snoise`, `curl`, `rest`), `posRT`, `pass`, `geo` (instanced sphere), `BU`, `head`, `body`, `beadify`, `beads` | **Copy unchanged**. It turns each target drawing into bead places, and bead position is a pure function of (bead, time), so any frame renders alone |
| Room and light | `paper` wall texture, `wall`, `K.env` (two panels), the `K.spot` key at `KEY`, `K.skyLight`, the `stove` spot | Keep the rig. `stove` is the heat-from-below lamp; drop it or recolour it if the story has no heat |
| Camera | `cam` (`pos`, `aim`, `ap`) | Keep the idea (close and to one side, drifting back and round, pull back at the burst), retime the keys to the new `T` and `DURATION` |
| `registerStyle` metadata + `render` | | Keep `render` (`samples: 96`, `shutter: 0.45`, `fov: 30`, `bloom: 0.25`, `vignette: 0.4`, `background: WALL`) and `fonts`; change `topic`, `duration` |
| `update(t)` / `overlay` / `sound(k)` | | `update` keeps the flight selection (`k`, `f`, `from`, `to`), the `U.*` assignments, the position pass `renderer.setRenderTarget(posRT)`, `stove.intensity`, `K.look` + `K.focus`; only the dial names change with `DIALS`. `overlay(ctx, t, W, H)` draws `CAPTIONS`: keep it. Rewrite `sound(k)` to the new beats |

No libs (`libs:` is empty). Keep `id: 'particle-swarm'`.

Habits that make the look:
- Words are one small caption per beat, a crisp 2D line at bottom centre in Inter from `overlay` (fade up, fade out before the next); the beads never form words or numbers.
- Formations are drawings on a 960 x 540 canvas that get blown up into rounded bulges (`puff`, `body`); several populations (`SHARE`) keep their identity from start to finish.
- Nothing freezes: each flight has a front (`wave`, `spread`) that crosses the old shape, beads shoot past their place and settle, a few stragglers (`late`) arrive after; held shapes breathe and buzz (`DIALS.swell`, `DIALS.shake`).
- Change without falling apart: reuse an outline so only colour runs through it as a front (`wave: [0, 1, 0]`); a burst uses `wave: [0, 0, 1]` (radial) with `push` and `lift`.
- Heat and energy are light: `glow` on beads (`hotGlow`) plus the `stove` lamp driven by `DIALS.heat`; key from the upper left, soft shadow of the shape on the wall.
- Long lens, shallow focus (`ap` about 0.1 down to 0.065), one slow dolly that pulls back on the burst.
