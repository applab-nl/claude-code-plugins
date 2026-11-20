---
id: exploded-view
name: Exploded View
family: Diagrams with depth
use: explainer
fonts: IBM Plex Mono, Space Grotesk
reference_topic: What's inside a ballpoint pen
duration: 8
samples: 48
libs: 
---

# Exploded View

**Look:** A product teardown film: one object hangs over a pale seamless floor, comes apart along its axis into its parts, and every part gets a numbered callout in ink blue.

**Motion:** The object unscrews and pulls apart along its axis into sub-assemblies, they park as two tiers, then each spreads into its parts one after another; every part overshoots its place, settles and keeps a slight tilt of its own. Callouts draw on as the focus reaches each part, then everything returns in reverse and seats with a click.

**Light:** One very large soft top light, so every part drops a soft shadow on the floor, with sky light for the contact shading. Black cards in the reflections give chrome its dark streaks and clear plastic its edges.

**Materials:** Real finishes, one per part: clear plastic, chrome, turned brass, a steel spring wound as a true helix, dimpled black rubber, milky tube with blue ink, one orange moulded piece.

**Camera:** A long lens on a slow crane, looking down the axis so the row recedes: close on the object, back and up as it opens, creeping in while a shallow focus travels from part to part, then close again as it shuts. One continuous move.

**Finish:** Depth of field and motion blur from the lens itself, neutral colour, almost no bloom, a light vignette. Labels and leader lines are drawn on top so they stay sharp.

**Good for:** How something is built or what is inside it: any object made of parts. Each part is one named item, the order of the row is the order of assembly, and putting it back together shows where everything goes.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `TITLE`, `PAYOFF`, `PARTS` (id, name, `side`, `open` / `shut` label positions in the 1920 x 1080 frame), the timeline `T` with `STAGGER`, `LABEL_EVERY` and `leaveAt` / `homeAt` / `labelAt`. There is no `schedule()`: `T` is the schedule. Keep the key names the rig reads (`pull`, `stack`, `spread`, `labels`, `gather`, `unstack`, `push`, `screw`, `payoff`) and re-time them; `click`, `unscrew`, `click2` belong to the pen's own mechanism. Keep `INK` and `PAPER` |
| Turned-part kit | `turned`, `helix`, `crown` | **Copy unchanged.** `turned([[x, r, smooth?]...], {bevel})` is a lathe with flat normals per run; `helix` makes springs and threads; `crown` cuts teeth into a ring |
| Studio and finishes | `studio(S)`, `finishes()` | **Copy unchanged**, then only add finishes the new parts need (the `tube` map is pen-specific). Keep `chrome`, `clear`, `shadowOnly` and the black env cards in `studio`: they are what makes chrome and clear plastic read on a pale set |
| The object | `ballpointPen(fin)` | Replace with a new object function modelled along X, returning `{ parts, rows, live, length }`. Each `parts[id]` is `{ node, span, anchor, tilt }` (optional `openLength`, or `rides` + `off` for a part that lifts off its host); `rows` are the sub-assemblies (`parts`, `gap`, `pull`, `centre`, `lift`, optional `unscrew`); `live(t, out)` is the object's own mechanism. Every `PARTS` id needs an entry |
| Choreography | `explodeRig(root, object)` | **Copy unchanged.** Returns `{ list, pose }`; `pose(t)` does pull, park (`kb`), spread (`kc`, spring per part), the float and the reverse, and draws the dash-dot guides |
| Callouts | `callouts(S, list)` | **Copy unchanged.** Balloons (`R = 34`), leaders re-projected from each part's `anchorLocal`, names in `NAME_FONT`, all in the 2D overlay |
| `registerStyle` metadata + render | | Keep `render` (`shutter: 0.5`, `fov: 30`, `background: PAPER`) and `fonts`; change `topic`, `duration` |
| `build(S)` / `sound(k)` | | Rewrite. Keep the rig: `studio(S)`, `root` placed at `(-length / 2, 2.1, 0)`, `rig`, `labels`, the `rig.pose((T.labels + T.gather) / 2)` call that collects `spots`, `cam` (`pos` and `aim` as `K.path`, `focus` through `spots` in label order, `lens` as `K.track` from ~0.085 to ~0.11 and down to ~0.04 for the close), `heading`, and `update` = `rig.pose(t)` + `K.look` + `K.focus`. Scale the camera numbers to the object's `length`. In `sound` keep the helpers `thread` and `press`, the `room` bed, and the per-part loop on `leaveAt` / `labelAt` / `homeAt` with a pan across the row |

Habits that make the look:
- Words are 2D overlay, never 3D: a small `IBM Plex Mono` kicker (500, 6px letter-spacing) over a big `Space Grotesk` 700 title at top left that fades out as the parts park, and a two-line payoff at bottom right that fades in at `T.payoff`. Part names are `IBM Plex Mono` 600 with a paper-coloured halo behind the ink.
- Every part gets a numbered ink-blue balloon, drawn on in `labelAt(i)` order (leader line, dot on the part, balloon pops with `outBack`, name wipes out from the balloon); the label glides from its `open` to its `shut` spot as the object closes.
- Motion is staged: pull along the axis, park as two tiers (`kb`, `outBack`), then spread part by part (`kc` spring, `STAGGER` apart) so each overshoots, settles and keeps its own `tilt` plus a small float; the return is the same in reverse with a wind-up (`inBack`) and ends with a click.
- Colour is paper and ink only: pale floor, ink-blue for guides and labels, one orange moulded part as the accent; every other part is a distinct real finish (clear, chrome, brass, steel helix, rubber, milky tube).
- Camera is a long lens on a slow crane looking down the axis; the shallow focus visits each part in label order, so the sharp part is always the one being named.
- Sound is mechanical: ticks for thread, clicks and tocks when parts seat (pitch picked per material), a swish as each part leaves, a ding on the payoff.
