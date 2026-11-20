---
id: toy-blocks
name: Toy Blocks
family: Material worlds
use: explainer
fonts: Fredoka, Fraunces
reference_topic: The 50/30/20 budget rule: 50% needs, 30% wants, 20% savings
duration: 8
samples: 64
libs: 
---

# Toy Blocks

**Look:** Design-shop wooden blocks on a sunlit playroom floor: maple cubes and bricks with rounded edges, chalky milk paint worn back to bare wood at the corners, and letters, numbers and simple pictures screen-printed on the faces. The stacks are the chart.

**Motion:** Blocks drop in from above with real weight: one corner hits first, the block bounces once, rocks from edge to edge and settles with a knock. A heavy block makes the whole tower teeter. Nothing eases; everything falls.

**Light:** Low, warm afternoon sun through a window to the left, so the floor carries soft stripes of window-frame shadow and every block throws a long shadow. Cool sky light fills the shade and darkens the gaps between blocks. The far wall stays in shade with one patch of window light.

**Materials:** Pale maple with drawn grain that runs the right way on every face (end grain on the ends), matte milk paint in dusty blue, coral, green, mustard and cream with chips and scratches, slightly patchy pressed-in print, an oak board floor with a soft sheen.

**Camera:** Long lens at a child's eye height. It starts close on the word spelled in alphabet blocks, cranes up to the first tower as it grows, then makes one slow arc around the stacks with a slight push, close enough that the tallest tower nearly fills the height of the frame. Shallow focus keeps the room soft.

**Finish:** Real motion blur on the falling blocks, real depth of field, colours kept true (neutral tone curve), a touch of warmth and contrast, light vignette, very fine grain. No bloom to speak of.

**Good for:** Lists, comparisons, proportions, steps and "the building blocks of X". One cube is one unit, a tower is a bar, a brick is a label, alphabet blocks spell the headline; pictures on the faces say what each unit is.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `TITLE` (spelled in alphabet blocks), `UNIT`, `TOWERS` (`name`, `paint`, `cubes` as picture names), `TITLE_INKS` |
| Toy box constants | `PAINT`, `MAPLE`, `OAK`, `EDGE`, `BASE`, `CAP`, `LETTER`, `PITCH`, `TITLE_Z`, `FIRST`, `BEAT`, `CAP_GAP`, `NEXT_GAP`, `GRAV`, `DROP_FROM`, `BOUNCE`, `towerX` | Copy; tune only `PITCH`, timing and tower spacing for a different number of towers |
| Drop physics | `schedule(K)`, `fallTime`, `bounceTime`, `rockPhase`, `dropPose`, `towerSway` | **Copy unchanged.** `schedule` is the single list of drops (`tc` = first contact) that both picture and `sound(k)` read, so the knock is on the frame of contact. Closed-form in `t - tc`, so any frame renders in any order |
| Picture kit | `poly`, `rr`, `disc`, `cut`, `PICTURES`, `picture`, `lettering`, `SANS`, `SERIF` | Copy the helpers. Replace `PICTURES` entries with icons for the new topic (drawn white in a 100 x 100 box around 0,0; `cut` punches holes), and use their names in `cubes` |
| Block maker | `makeToyBox(S)`: `wood`, `paintLayer`, `paintColour`, `printLayer`, `face`, `block`, `prism`, `turned`, `cylinder`, `shapes` | **Copy unchanged.** Every object is `toy.block({size, grain, seed, faces})`, `toy.prism(shape, depth, {paint})` or `toy.cylinder`; a face is `{paint, ink, art}` and `art` is `picture(name)` or `lettering(text, font, capH, frame)` |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0.5`, `tone: 'neutral'`, minimal bloom); change `topic`, `duration` |
| `build(S)` | | Keep the set: the window-cookie `sun` spot (`sunDir`, `sun.map` drawn panes), `K.skyLight`, `K.env`, the oak floor, wall with skirting, `rug`, the background toys (arch/wedge prisms, spare blocks, ring `stacker`, `ball`). Replace the content section (title blocks, `TOWERS.forEach` name bricks, `bodies` from `drops`) and keep `update(t)` (sway, shiver, drop pose, `m.visible`). Keep the `cam` plan (`open`, `arcPos`, `arcAim`, `focus`, `ap`, the `mix` crane) and retune keys for the new tower positions |
| `sound(k)` | | Keep `knock` and its per-drop calls (knock, bounce, rocking ticks, a xylophone note per cap, `room` bed); it already loops over `schedule(K)` |

No library is used.

Habits that make the look:
- Every word and number is printed on a block: the headline is alphabet cubes lying on the floor (Fraunces serif, `SERIF`), labels and percentages are bricks (Fredoka bold, `SANS`), facts are pictures on cube faces. No overlay type. Prints are slightly crooked and pinholed (`printLayer`).
- Things arrive by falling with real weight: free fall, one bounce, rocking from edge to edge, a settling knock; each landing sways the whole tower and shivers the blocks below. A cap on a tall stack makes it teeter.
- One unit is one cube, so counts are stacks; the percent on a cap is computed from `cubes.length * UNIT`, never typed in separately.
- Light is one low sun through a window drawn as a `cookie` (`sun.map`), giving soft window-frame stripes and long shadows, plus cool sky fill. Milk-paint colours from `PAINT` only; no bloom, neutral tone curve.
- Camera at toy eye height with a long lens: open close on the headline with shallow focus (`ap` 0.06), crane up to the first tower in ~1.3 s, then one slow arc with a slight push; the arc's last key lies past the clip end so it is still gliding on the final frame. The set is dressed with soft out-of-focus toys behind the towers.
- Sound: wood-on-wood knocks pitched by block size, a quieter bounce, rocking ticks, one xylophone note per finished tower.
