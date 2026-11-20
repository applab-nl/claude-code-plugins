---
id: hero-icon
name: Hero Icon
family: Products and screens
use: title
fonts: Fredoka
reference_topic: Otto, a made-up assistant app that handles mail, calendar and notes
duration: 8
samples: 64
libs: 
---

# Hero Icon

**Look:** One big, chunky app-icon tile floats in a bright seamless studio of a single colour. A raised symbol built from thick rounded pieces sits on its face, and the whole thing looks like a toy you could pick up.

**Motion:** Tactile and mechanical. The tile winds up, flips over and clicks home a few degrees past the mark; then the parts of the new symbol slide, hinge, drop and press into place one after another, and every contact knocks the tile back a little. Each landing sends the next colour across the studio from behind the tile.

**Light:** One large soft key from the upper right, so a big soft shadow of the tile falls on the backdrop down to the left. Softboxes above and at the sides give the gloss, a dark flag behind the camera keeps the face clean, and the backdrop bounces its colour up into the white parts.

**Materials:** Clear-coated plastic for the tile and the coloured parts, matt soft-touch white for paper-like parts, a polished metal band around the waist of the tile and metal pins where a symbol has them. Every edge is rounded over.

**Camera:** Long lens, almost square on, a little above and to the right of the tile so its top and side show. A very slow push in while the symbols change, then one pull back and sideways track that leaves room for the words.

**Finish:** Clean and colour-true: neutral tone mapping, real motion blur on the flips, a faint bloom on the brightest highlights, almost no vignette or grain.

**Good for:** A tool, product or idea as one object. Each thing it does (or each option, or each step) becomes one symbol on the tile with its own colour; the last face is the brand mark or the answer, with a short line of raised lettering on the wall beside it.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `BEATS` (`symbol`, `tile`, `studio` colours, `at`, `flip` 'x' or 'y', `turns`), `BRAND`, `LINE`, `INK`. The last beat is the resolve: the brand mark |
| Per-symbol timing | `MAIL`, `CAL`, `NOTE`, `MARK`, `SNAP` | Replace with timing for the new symbols (seconds after the face has clicked home); keep `MARK.brand`, `MARK.brandStep`, `MARK.line`, `MARK.lineStep` for the words |
| Flip timing | `flipAngle`, `landOf`, `WORDS` | **Copy unchanged** |
| Cues | `cues()` | Rewrite the per-symbol entries; keep the pattern (one `{ t, name, opts, kick }` per contact, whoosh + tock + thud + click per flip, `kick` makes the tile flinch on that frame). `build` and `sound` both read it |
| `registerStyle` metadata + render | | Keep `render` (`shutter: 0.55`, `fov: 26`, `near: 2`) and `fonts`; change `topic`, `duration`; `background` should match `BEATS[0].studio` |
| Shape and material kit | `smooth`, `chunk`, `poly`, `rect`, `disc`, `arc`, `squircle`, `envGloss`, `plastic`, `soft`, `metal`, `put`, `group`, `pop`, `grow` | **Copy unchanged.** `chunk(shape, depth, bevel)` is the one shape-maker: every piece is a flat outline extruded with rounded-over edges and its back on z = 0 |
| Studio | `sweep`, `wave`, `paper`, `backdrop`, `K.env`, `K.spot`, `bounce` | **Copy unchanged** |
| Tile | `tile`, `half`, `body`, the waist band | **Copy unchanged** |
| Symbols | `SYMBOLS` | Replace: each `name(g)` builds chunks on the face group and returns `pose(s)` (s = seconds since its face clicked home, negative while it comes round). Parts slide, hinge, drop or `grow` with `pop`; one symbol per beat |
| Lettering | `raised`, `TX`, `brand`, `words` | **Copy unchanged**; only the text comes from the content block |
| `update(t)`, `sound(k)` | | Keep `update` as is (flip owner `c`, colours and the `wave` radius, `knock` from the `kicks`, the `faces` loop, brand and word `pop`s, camera `pos` / `aim` blended by `w`, `K.focus(..., 0.04)`). The code indexes the beats directly: `L[3]` for the resolve, `BEATS[0..2]` tile colours inside `mark`, and `['G4', 'B4', 'D5']` in `sound`; change these if the beat count changes. `sound` plays `cues()` plus one soft note per face and a low note on the resolve |

Habits that make the look:
- Words are raised lettering on the wall, in `Fredoka` (700 for the brand, 500 for the line): `raised()` stacks alpha-tested layers so letters have real thickness and cast shadows, each letter of the brand and each word of the line pops in turn after the final mark lands. No overlay text.
- Each beat is one flip of the tile with a damped spring (`flipAngle`): wind-up, fast through the middle, a few degrees past and back; the face that comes round carries the next symbol, built from a few chunks.
- Symbol parts arrive one after another (slide, hinge, drop, press) and every contact knocks the tile back (`kick`, `knock`) on the frame that makes a sound.
- Colour belongs to the beat: the tile changes colour on its hidden half, and the studio colour spreads from behind the tile as a wave (`wave.uRadius`), with `bounce.groundColor` following; the brand mark reuses the three beat colours.
- Light is one big soft spot from the upper right (soft shadow down-left), softboxes only for gloss (`envGloss` strips the sharp clear-coat dot), a black flag behind the camera.
- Camera is a long lens, almost square on, with a very slow push while the symbols change, then one pull back and sideways track (`w`) that makes room for the words.
