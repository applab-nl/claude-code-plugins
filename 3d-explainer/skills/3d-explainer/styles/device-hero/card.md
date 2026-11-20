---
id: device-hero
name: Device Hero
family: Products and screens
use: product
fonts: Fraunces, Inter
reference_topic: Streak, a habit tracker: ticking off today's last habit closes the ring and turns a 29-day streak into 30
duration: 8
samples: 72
libs: 
---

# Device Hero

**Look:** A phone filmed like a launch video: a titanium body with a polished frame standing on black gloss in a dark studio, its screen the brightest thing in the room. Then the screen fills the frame and the interface becomes white cards floating over the glass.

**Motion:** The phone turns to face the lens while strip lights slide across its glass. The camera dollies into the screen in one move and the interface peels off in layers, the top of each stack first. Inside, things behave the way the app would: a press sinks the card, the ring sweeps round, the digits roll.

**Light:** Studio half: nothing lights the phone directly; it is shaped by tall strip lights and a soft box reflected in metal and glass. Screen half: one large soft light from the upper left, so every floating layer drops a soft shadow down and to the right that grows with its height.

**Materials:** Satin titanium, black cover glass with a real reflection, a mirror-gloss floor. The interface is a canvas texture that glows like a display in the studio and turns into thin, bevelled white card stock once it lifts.

**Camera:** Long lens. A low, slow drift past the standing phone, one continuous push that drops below the screen and looks up along it, then a slow arc so the layers slide against each other. Focus follows the action: the checkbox, then the number.

**Finish:** Neutral tone mapping so interface colours stay exact, soft bloom only on metal highlights, shallow depth of field, a light vignette, almost no grain.

**Good for:** An app, a feature or any on-screen moment: show the device first so the viewer knows what they are looking at, then go inside and let two or three interface elements act out the one thing the feature does.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `APP` (date, title, from/to, unit, captions, week), `HABITS`, the `C` palette (one accent colour) |
| Schedule | `T` and `LIFT` | Rewrite the moments (`turnEnd`, `push`, `lift`, `touch`, `tick`, `ring`, `roll`) and the height/delay of every lifted piece; keep the rule that the top of each stack leaves first |
| Device constants | `PW`, `PH`, `PD`, `PR`, `SW`, `SH`, `PT`, `sx`/`sy`, `HERO`, `RING`, `ROW(i)` | Keep the phone; re-lay `HERO`/`RING`/`ROW` only if the interface layout changes (designed in 390-wide points, mapped by `sx`/`sy`) |
| Small builders | `rr`, `slab`, `band`, `puck`, `mesh` | **Copy unchanged** |
| Studio | `studio` (`K.env` strip lights), `wall`, `bar`/`strip`, `K.mirrorFloor`, the `sun` with `SUN`/`GLOW` | **Copy unchanged**; `sun` starts at power 0 and `update` fades it in |
| Phone | `phone`, `titanium`, `seam`, `blackGlass`, `backGlass`, the body, camera bump, `GLASS_Z` glass | **Copy unchanged** |
| Interface kit | `uiMats`, `ui()`, `sheet()`, `repaint()`, `say()`, `pill()`, `tickPath()`, `ICON`, `screenTex`, `layer()`, `decal()`, `TH` | **Copy unchanged.** `ui(base)` makes a material that glows as a display and goes lit as paper; `layer(mesh, [lift, delay], rest, opts)` registers a piece to lift off the glass; `repaint(tex, key, ...)` redraws a canvas only when its key changes |
| Interface content | `screenTex` drawing, `heroTex`, ring (`arc`, `capB`, `ripple`), `numTex`/`number`/`unit`, `rows`, `touch` | Rewrite for the new app's two or three elements, built from the same kit pieces (`slab` cards through `layer`, `band` arcs, `puck` buttons, `decal` canvases) |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0.5`, `tone: 'neutral'`, `fov: 24`, `background '#050506'`); change `topic`, `duration` |
| `build(S)` / `sound(k)` | | Rewrite the interaction, keep the rig: `yaw` track, `kick()`, `focusAt`, `mix()`, and in `update(t)` the `inside`/`paper` blend, the `layers` loop (`K.spring(t - T.lift - L.delay, 1.45, 0.6)`), then the camera as `posA`/`posB` blended by `inside` with `K.look` and `K.focus`. Sound: pad, whoosh for the push, a `pop` per lifted layer, tap, tick, rising ring tone, success chime |

Habits that make the look:
- Words live on the interface only, in two fonts: Fraunces 600 for the big digits (`numTex`) and the title, Inter 400-600 for rows, captions and the small tracked unit label (`unit`, `K.textPlane`). No overlay text.
- The interface is one canvas texture (`screenTex`) in the studio and becomes bevelled card stock when it lifts: `update` slides every `ui()` material from emissive to lit (`paper`), the `sun` comes up as the studio dims (`scene.environmentIntensity`), so the hand-over is invisible.
- Elements leave the glass in a spring with a delay each, top of each stack first (number, unit, ring, then the card, then its checkbox); cards are flat as a pixel on the screen and grow to slabs in the air (`L.thick` scales z).
- Interaction behaves like the app: the finger arrives, the card sinks under it (`press`), springs back and the box fills; the ring sweeps in `ringFill`; digits roll with `outBack`, units a beat before tens; a `kick()` ring-down plays on the ring and number when it lands.
- Camera is a long lens (fov 24): a slow drift past the standing phone, one eased push (`inside`) that drops below the screen and looks up along it, then a slow arc. Focus is pulled by `focusAt`: the checkbox, then the number; aperture 0.5 in the studio down to 0.085 inside.
- Do not rely on `+=` for z: `update` does `ring.position.z += 0.05 * pop` and `number.position.z += 0.07 * kick(...)`. In the reference this is safe only because both are registered with `layer()` and the `layers` loop assigns `L.m.position.z = L.rest + L.lift * p` just before. In a new piece, always compute a base z fresh from `t` (the lifted height from the spring, or the rest z) and assign `m.position.z = base + extra`; never add to whatever z the mesh had on the previous call, because `update(t)` can be called for any t in any order and the offset would accumulate.
