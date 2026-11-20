---
id: split-flap
name: Split-Flap Board
family: Flat content made physical
use: title
fonts: Oswald
reference_topic: How long it took to reach 100 million users, from the telephone to ChatGPT
duration: 8
samples: 40
libs: 
---

# Split-Flap Board

**Look:** A mechanical departure board: rows of black flaps with white lettering in a dark steel frame, lit like a station hall at night, with one amber row for the point that matters.

**Motion:** Every character rattles forward through the alphabet until it lands, column after column, so words resolve out of a blur of flaps. The camera starts close enough to see single flaps fall, then pulls back until the whole board reads.

**Light:** One soft overhead lamp in front of the board, so every falling flap catches a flash of light and the frame throws a soft shadow across the top row; a faint cool fill from the side; everything else falls to black.

**Materials:** Satin black plastic flaps with slightly worn off-white print, a brushed dark-steel frame, a small back-lit amber sign for the heading.

**Camera:** Long lens with shallow focus. A slow sideways track across the first rows, one continuous pull-back to the full board, then a gentle push toward the highlighted row.

**Finish:** Real motion blur on the flaps, soft bloom only on the back-lit sign, filmic contrast, a clear vignette and fine grain.

**Good for:** Lists, rankings and numbers: each row is one fact, revealed top to bottom, with the last or most important row picked out in colour.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `HEADER`, `ROWS` (`[name, value]` pairs), `HERO_ROW` (the row that turns amber), `COLS` / `NAME_COLS`. Keep every string within the `DRUM` characters and within the column counts (names <= `NAME_COLS`, values <= `COLS - NAME_COLS`) |
| Mechanism | `DRUM`, `CW`, `CH`, `PITCH_X`, `PITCH_Y`, `ROW_START`, `cellX`, `cellY`, `cellState` | **Copy unchanged.** `DRUM` order is the charm: cells can only flip forward through it. `ROW_START` may be retimed for more or fewer rows |
| Schedule | `schedule(K)` | Copy as is (one cell per `{row, c, g, t0, dt, end}`, padded to `COLS`); `sound(k)` calls the same function, so picture and sound stay locked |
| Metadata + `render` | `registerStyle({...})` | Keep `render` (`shutter: 0.6`, bloom only from the heading), `fonts`; change `topic`, `duration` |
| `build(S)` | | Keep the whole flap kit: the `atlas` glyph canvas, `flapMat` (the `aGlyph` shader hook), `half`, `mk` and the four instanced meshes `topStatic`, `botStatic`, `flapFront`, `flapBack`, the housing (`steel`, `dark`, `add`, rails, frame, wall) and `update(t)`'s per-cell loop. Rewrite only what depends on size: `BW`/`BH` follow from `COLS`/`ROWS`, and the `cam` tracks (`pos`, `aim`, `ap`) need new numbers if the board gets bigger. Keep the lights (`K.env` panels, the warm `K.spot`, the cool side `K.spot`), the amber `head` plane with its hum, and the hero colour fade (`amber`, `K.seg` from `rowEnd[HERO_ROW]`) |
| `sound(k)` | | Keep the pattern (binned `tick`/`tock` per flap fall, a `tock` per row end, `ding` + `thud` on the hero row, `room` and `hum` beds); only the row end times change with the schedule |

No library is used.

Habits that make the look:
- Words live only on flaps: Oswald caps from the `DRUM` alphabet drawn into one glyph `atlas`; names sit left, values sit right-aligned in a second block, and the heading is a back-lit amber `K.textPlane`.
- Nothing fades in: each cell rattles forward through the drum to its letter (`cellState`), rows start staggered by `ROW_START` and columns by `c * 0.022` plus a little random, so text resolves left to right, top to bottom.
- Colour is held back: white print on black, then only the `HERO_ROW` flaps lerp to amber after its last cell lands, via `setColorAt`.
- Light: a dark hall (`K.env` with two panels, one warm overhead, one cool from the left) and a warm shadow-casting `K.spot`; the falling flaps flash because they catch it.
- Camera: long lens, shallow focus (`ap` 0.06 close, 0.03 wide). Start close at the left of the top row to see single flaps fall, track right, then one `inOutQuint` pull-back from z 4.5 to ~20 to show the whole board, and a slow settle.
- Sound: tick/tock clatter synced to every flap fall, a row-end thunk, a ding on the hero row.
