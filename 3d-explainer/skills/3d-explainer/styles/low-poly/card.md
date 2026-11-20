---
id: low-poly
name: Low-Poly
family: Filters over 3D
use: explainer
fonts: Oswald
reference_topic: The water cycle: evaporation from the sea, clouds forming, rain on the mountains, a river running back to the sea
duration: 8.5
samples: 64
---

# Low-Poly

**Look:** A miniature world of flat, faceted shapes, like folded paper or cut stone: every triangle is one tone, and neighbours differ slightly, inside a short palette of sand, coral and cream against teal water and sage greens.

**Motion:** Things grow by unfolding facet by facet from one point, or pop out of the ground with a bounce; water heaves so its facets keep catching the light, clouds drift, small cut-gem droplets rise and fall.

**Light:** One low, warm sun from the side with soft-edged shadows, a cool blue sky filling the shadow sides so every facet turns either warm or cool, and peach haze that swallows the distance.

**Materials:** Matte paper-like facets with no texture at all; only the water is slightly glossy. Colour comes per triangle from the palette, never from gradients.

**Camera:** One continuous crane move on a long lens with tilt-shift-shallow focus, so the landscape feels like a tabletop model: close on each stage in turn, then out to the whole scene.

**Finish:** True depth of field and motion blur, colours kept true (neutral tone curve), a gentle vignette and only enough grain to keep the sky from banding. No filter pass: the facets are real geometry.

**Good for:** Processes that happen in a place: cycles, journeys, supply chains, how a system of parts feeds itself. Each stage is a spot in the landscape with a paper flag, and the camera travels the route between them.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `STEPS` (the flag words), the schedule `T`, anything derived from it (`BANK_TREES`) |
| Palette | `const PAL` | Keep the families and the single `accent`; add a family only if the subject needs one, in the same muted register. `tone()` stays |
| Facet tools | `jitter`, `facet`, `merge`, `unfold`, `faceted`, `mesh`, `clock`, `WAVE` | **Copy unchanged.** Every object goes through `facet()` + `faceted()`; growth is `unfold()` + `faceted({ unfold: true })`; water is `faceted({ wave })` |
| Ground tools | `scatter`, `triangulate`, `upward`, `surface` | **Copy unchanged.** Terrain = scattered points (denser in the `hero` zone) triangulated and lifted by a hand-designed `height(x, z)` |
| Props | `rockGeo`, `pineGeo`, `treeGeo`, `cloudGeo`, `dropGeo`, `boatGeo`, `flag` | Copy the ones the story uses; build new props the same way: a jittered primitive, cut flat where it sits, faceted per triangle |
| `registerStyle` metadata + `render` | | Keep `render`; change `topic`, `duration` (the reference uses `T.end`) |
| `build(S)` / `sound(k)` | | Rewrite for the new place and process. Keep the light rig (`SUN` low from the side, `K.env` with a round sun panel, `K.sun` soft 2.2, `K.skyLight`), the haze `Fog` + sky dome shader, the one continuous `cam.pos`/`cam.aim` `K.path` crane, and the `cam.focus` track that sits on whichever flag the story is at |

Habits that make the look:
- Words live only on the paper `flag()`s: numeral in the accent, word in ink, popped out of the ground with `flag.pop(t, t0)` when the camera arrives. One flag per stage.
- Colour is per triangle from `PAL` via `tone()`; never gradients or textures. Neighbouring facets differ slightly.
- Things appear by unfolding facet by facet from one point (`unfold({ from, start, duration })`) or by springing out of the ground (`K.spring` on scale); nothing fades in.
- Shared shader clock: `update(t)` sets `clock.value = t` once; waves, unfolds and `tint` flashes read it, so they stay pure.
- The crane move never stops: close on each stage in turn, then out to the whole landscape; aperture ~0.06 → 0.05 for the final wide.
- Instanced vegetation is placed by rules (height, slope, groves, clear zones in front of flags), not sprinkled; keep flags and the subject unobstructed.
