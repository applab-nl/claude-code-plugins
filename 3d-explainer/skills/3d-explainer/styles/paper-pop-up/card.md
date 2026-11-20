---
id: paper-pop-up
name: Paper Pop-Up
family: Material worlds
use: story
fonts: Fraunces
reference_topic: From flower to honey jar: a bee on flowers, the hive, the jar on the breakfast table
duration: 9
samples: 56
---

# Paper Pop-Up

**Look:** A pop-up book open on a wooden table in lamplight. Every scene is built from flat die-cut card: printed in a few flat colours, creased down the middle, standing in layers on real fold mechanisms, with a pale core showing on every cut edge.

**Motion:** Only the pages move. As a page turns, the scene on the old spread is pressed flat under it and the next one is pulled up out of the gutter by its own folds, layer after layer; pieces on paper arms tremble when the page lands. A pull tab slides out to change one thing on the last spread.

**Light:** One warm desk lamp from the upper left with soft-edged shadows, so each layer throws a shadow on the one behind and the two wings of every fold take different light; a faint cool rim from behind; the table falls off into the dark.

**Materials:** Thick uncoated card with visible fibre and a slight cockle, flat matt ink with a little grain, bare cream card on cut edges and as a thin margin around each shape, cloth-covered boards, dark oiled wood.

**Camera:** A long lens looking down the gutter from about twenty-five degrees up, close enough that the spread fills the frame. One slow drift from left to right that breathes out a little for each page turn and ends in a gentle push; shallow focus on the middle layers.

**Finish:** Real depth of field, motion blur and area-light shadows from the accumulation renderer; neutral tone mapping so the inks stay true, a soft vignette, very fine grain.

**Good for:** A story or a process in a few steps: one spread per step, each with one big subject in the middle, supporting pieces at the sides and one short line of words on a paper ribbon. A pull tab can show a change on the spot (fill, reveal, move).

## Working with the reference

`reference.js` is split into parts. Treat them differently:

| Part | Lines start at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `C` palette (keep `navy`, `coral`, `cream`, `card` for the ribbon and tab), the motifs (`flower`, `stem`, `leaf`, `grass`, `hex`, `bee`, `arm`, `clump`) and `stepNo`, the `SPREADS` list (`words`, `floor(a)`, `parts`), `PULL` and the `pulled` ease |
| One schedule | `// ---- the book's clock` and the constants at the top of the content block | Replace `TURNS` (when each page turn starts; the first is already under way on frame one) and `PULL`; keep `TURN`, `flip` and `landed` as they are, since picture and sound both read them |
| The pop-up kit | `// ---- 1. paper` up to `// ---- 4. the book`: `fibre`, `speck`, `grain`, `paper`, `core`, `pen`, `widthOf`, `trace`, `simplify`, `dieCut`, `card`, `seat`, `hinge`, `solveV`, `MAKE` (`v`, `box`, `float`), `ribbon` | **Copy unchanged.** This is the look: the die-cutter and the fold geometry. Draw new pieces only through `pen` (`path`, `disc`, `box`, `line`, `ridge`, `clip`, `text`) and the three fold kinds; if a piece needs a new mechanism, add it to `MAKE` beside the others |
| The book | `// ---- 4. the book` to the end of the pull tab | Copy: `leaves` (one per entry of `TURNS`, front = right page of the old spread, back = left page of the next), `blockL`/`blockR`, `cloth` boards, `spine`, `edges`, and the pull tab `TAB`/`grip`/`tab`. Only the floors they print come from `SPREADS` |
| The table and the lamp | `// ---- 5. the table and the lamp` | Keep `wood`, `table`, the offcuts, `mug`, `pencil`, and the light rig: `K.env`, the warm `K.spot` from upper left (4096 shadow map, `soft`), the cool back `K.spot` with `shadow: false`, `K.skyLight` |
| `registerStyle({...})` metadata + `render` | | Keep `render` as is; change `topic`, `duration` |
| `build(S)` / `sound(k)` | | Rewrite for the new story. Keep the `update(t)` loop (`phi = TURNS.map(... flip)`, leaf rotation and stack heights via `riseOf`/`sinkOf`, `sp.group.visible`, `hinge(aL, aR)` then `p.pose(h, t)`), the `cam.pos`/`cam.aim` paths (retime the keys to the new `TURNS`: a small pull back at each turn, a push in at the end) and `K.look`/`K.focus` on the middle layers. In `sound`, keep the per-turn pattern (`paper`, `whoosh`, creaking `tick`s, `slap`/`thud` at `landed(s)`, a `ding`, trembling `tick`s) and the pull-tab `tape` |

Style-specific habits worth keeping:
- Words live on one paper ribbon per spread (`words: [left, right]`, built by `ribbon`, standing at `z: 1.95` in front of the subject), two to four short words split over two halves, in Fraunces. Add a numbered disc on the floor (`stepNo`) for each step; extra words should be printed on card, never an overlay title.
- Every spread has the same layering: a printed `floor`, a wide back `v` fold (alpha 76, a near-flat wall at `z: -1`), `box` folds at both sides standing in front of it, one tall `v` fold (alpha 58) in the middle as the hero, and a `float` piece such as the bee on an `arm` with `sway`, which trembles after `landed(s)`. Keep one big subject per spread.
- Scenes change only by page turn: leaf `j` shuts spread `j - 1` and opens spread `j` in one move, so the old scene is pressed flat as the next rises from the gutter. Give each new spread its own `floor` colour so the turn reads. Every piece must be connected and fit inside the closed book; the build logs a console error for any that does not.
- The one change inside a spread is the pull tab on the last page: `pulled(t)` moves both the grip (`tab`) and a `slide` card that comes up through a slit (the honey). Use `slide` for any fill, reveal or move; print the slot on the floor.
- The camera is one slow drift down the gutter at about 25 degrees up with a fixed `K.focus` near the middle layers (aperture 0.11); never cut or orbit. The accent is coral against navy and cream on warm yellows and greens; the lamp, wood table and card offcuts stay.

## Prompt differences

This style's prompt says "Tell my content as a story, not a title card" where the other styles say "as an explainer". Tell the content as a short story with a beginning, a turn and an end, one spread per beat, still with the picture doing the telling: the words on each ribbon only name what the scene shows.
