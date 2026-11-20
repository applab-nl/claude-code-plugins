---
id: soft-clay
name: Soft Clay
family: Material worlds
use: explainer
fonts: Fredoka
reference_topic: How compound interest grows your savings
duration: 8
samples: 64
libs: text3d.js
---

# Soft Clay

**Look:** Everything is modelled in plasticine and filmed like stop-motion on a small tabletop: chunky, slightly lopsided forms with fingerprints, tool marks and pits in them, in a few colours from one box of clay, in front of a seamless paper backdrop.

**Motion:** Animated on twos (15 poses a second) with no motion blur, by swapping shapes like a stop-motion animator: a ball of clay buds, hops over on an arc, lands as a thick puck, is pressed too flat and springs back into a coin. Stacks flinch when something lands on them, words are slapped onto the backdrop, and anything just touched shifts by a hair between poses. Only the camera moves smoothly.

**Light:** One big soft lamp from the upper left that pools on the backdrop and falls off to the corners, plus soft light from the whole sky that is blocked in every crease and under every object, so contact shadows are real.

**Materials:** Matte, waxy plasticine with a velvety sheen: a generated surface of fingerprints, knife drags, pits and joins bends the light, pressed spots are a little shinier, and each colour has a second colour streaked through it. The backdrop is uncoated coloured card.

**Camera:** A macro lens with shallow focus on a slow dolly: it starts close enough to read the fingerprints, travels along with the action, then pulls back in the same move until the whole set fits, and ends on a slight push-in.

**Finish:** True colours (neutral tone curve), almost no bloom, a light vignette and a little grain; a faint flicker in the lamp from pose to pose, like single frames shot one at a time.

**Good for:** Anything that can be told with a few friendly objects on a table: amounts as piles and stacks, growth and comparison, simple characters and props, a number or a few words as fat clay letters. Good for warm, non-technical topics.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: the numbers, `SIGN`, `CAPTION`, `RESULT`, the `BOX` colours in use (keep one backdrop `card` and a few clay sticks, each `[colour, streak colour]`), `FONT` |
| Stop-motion time | `POSES`, `pose`, `snap`, `since`, `nudge` | **Copy unchanged.** Clay reads `pose(t)` (15 poses a second); only the camera, lens and lamp read real `t` |
| Schedule | `schedule()` | Rewrite for the new story, but keep its contract: every event time goes through `snap()`, and `sound(k)` calls the same `schedule()` |
| Clay kit | `claySurface`, `CLAY_GLSL`, `clay()`, `lumpy()`, `part()` | **Copy unchanged.** Every object is `part(lumpy(geometry, {...}), clay(BOX.x, {...}))`; no UVs needed |
| Models | `coinGeo`, `COIN_R`, `BALL_R`... | Topic-specific: build new props the same way (a primitive or lathe, then `lumpy()` with a few `dents`) |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0`: no motion blur, by design); change `topic`, `duration` |
| `build(S)` / `sound(k)` | | Rewrite. Keep the set: `K.env` with one big warm panel, the `key` spot (power `KEY`, soft 1.3), `K.skyLight`, the seamless paper sweep (floor, `COVE`, `WALL`) with the `tooth` bump card, the `cam` paths (macro start, travel, pull back, slight push-in) and the lamp flicker `key.intensity = KEY * (1 + nudge(1, tq, 0.012))` |

Needs the TEXT3D library (`libs: text3d.js`): clay words are `K.text3d` / `K.text3dLetters` geometry run through
`lumpy()`. Keep `id: 'soft-clay'` in the new style file so assemble loads it.

Habits that make the look:
- Replacement animation, not tweening: things change shape on whole poses (`since(tq, t0)` = 0, 1, 2...): a ball buds, hops on an arc over a few poses, lands as a thick puck, is pressed too flat, springs back.
- Anything just touched shifts by a hair between poses (`nudge(id, tq, amt)`, fading out over ~5 poses); stacks flinch when something lands on them.
- Words are fat clay letters slapped onto the backdrop wall one at a time (thrown on wide and flat, spring out, settle), never overlay text.
- One box of clay: each colour has a second colour streaked through it (`marbleAmount`, `marbleSize`); the backdrop is plain coloured card.
- Macro, shallow focus on a slow dolly: start close enough to read fingerprints, travel with the action, pull back until the whole set fits, end on a slight push-in. Aperture ~0.05-0.06, then ~0.04 for the wide.
- Sound: soft clay thumps with a short pitched body that climbs a pentatonic scale, slaps and presses for the words, a quiet room bed and a gentle pad.
