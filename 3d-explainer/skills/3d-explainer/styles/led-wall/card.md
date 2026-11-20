---
id: led-wall
name: LED Wall
family: Flat content made physical
use: story
fonts: 
reference_topic: The Tortoise and the Hare, as a pixel cartoon playing on the lamp wall
duration: 12
samples: 80
libs: 
---

# LED Wall

**Look:** A giant outdoor screen made of real lamps: thousands of frosted round LEDs in black louvred cabinets on a steel gantry at night. From far away it is a crisp bright picture; close up it falls apart into single glowing lamps, each with a red, a green and a blue chip under its lens.

**Motion:** The wall plays pixel animation at one pixel per lamp and 30 pictures a second: characters built from a few flat colours with a dark outline walk, run, stop and react in real cycles, the ground scrolls under them lamp by lamp with slower hills behind, and one short caption per beat pushes up into a ticker strip along the bottom. The camera does the opposite of the content: one slow continuous pull from a single lamp to the whole wall, still drifting at the end.

**Light:** The wall is the light. Its own colours spill onto the louvres and the black plastic between the lamps, glow in the haze around it, tint the steel and paint the wet ground, and all of it changes when the picture changes. One cold floodlight from behind gives the steel a rim; everything else is night.

**Materials:** Frosted dome lenses in black collars, satin black louvres and cabinet faces with seams and screws, galvanised lattice steel, rubber cable, wet tarmac with dry patches and a painted line.

**Camera:** Long lens. Starts as a macro shot at a low angle across the lamps with very shallow focus, pulls back and swings round to face the wall while the story waits on its opening pose, has the wall in frame by the time the first story event happens, and then keeps drifting back and across, low over the wet ground, to the last frame.

**Finish:** Soft bloom from the lamps, true-colour (neutral) tone mapping so the LED colours stay saturated, light vignette, very little grain. No scanline or pixel filters: the dots are real geometry.

**Good for:** Any 2D animation, diagram or story that can be drawn at lamp resolution: a fable with two characters, a process with parts that move along a track, a chart that grows, a map with a route, a game-like sequence. Draw it on a small canvas with one pixel per lamp. A beat is something happening in that picture (a character sets off, stops, is overtaken, arrives); a label is one short dot-font line in the ticker strip; what moves is the pixel picture, while the wall, its housing and the light it throws stay the same and take their colour from whatever is playing.

## Working with the reference

`reference.js` is one block, and the split is clean: everything above `registerStyle` is the story drawn on a tiny canvas, everything inside `build` is the wall.

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `COLS`, `ROWS`, `CAB` (keep `CAB = 18`, `COLS`/`ROWS` multiples of it), `REFRESH`, the story times (`T_GO` ... `T_WAKE`), places (`X_START` ...), `CAPTIONS`, `HERO`, row constants (`HORIZON`, `TRACK`, `LANE`, `STRIP`...), `scrollAt`, and the motion functions (`plodded`, `sprint`, `hareNose`) |
| Pixel tools | `hex`, `mixHex`, `wrap`, `blob`, `pixmap`, `DOTS`, `dotText`, `dotWidth` | **Copy unchanged.** All drawing lands on whole lamps; text is only the 5 x 7 `dotText` |
| Puppet kit | `makeSprite`, `stamp`, `mixPose` | **Copy unchanged**; a character is a grid of colour numbers drawn by a `drawX(sp, P)` function, posed by numbers, stamped with a one-lamp outline (`pal[0]`) |
| Characters and world | `HARE`, `hareRun`, `drawHare`, `hareNow`, `drawTortoise`, `tortoiseNow`, `CUP`, `ZS`, `CONFETTI`, `scenery` | Replace with the new cast and scenery, built the same way (palette array plus named indices, `makeSprite(w, h)`, anchor `AX`/`AY`, a `...Now(t)` function that returns the pose) |
| `drawContent(ctx, t)` | | Rewrite for the new story; keep the contract: a pure function of `t`, scenery first, then characters, then the caption strip |
| `registerStyle` metadata + `render` | | Keep `render` (`samples: 80`, `shutter: 0.5`, `tone: 'neutral'`, `bloom: 0.46`, `fov: 30`, `far: 400`, near-black `background`), `fonts: []`; change `topic`, `duration` |
| `build(S)` | | **Copy unchanged** apart from the references to `HERO`, `DEAD` and `SPILL`: the content canvas `cv`/`ctx`/`content`, `U`, `wallMat`, `K.env` and the two `K.spot` floodlights, cabinets, `lampGeo`/`lampMat` (`cellsHi`/`cellsLo`), louvre `fins`, cabinet `faces`, gantry (`mast`, `struts`), cables, wet `tarmac` with `patches` and `line`, haze `sheets`, the twelve spill `zones`, and `show(t)` |
| Camera | `cam` (`dist`, `swing`, `rise`, `wide`, `lens`, `gain`) and `update(t)` | Keep the single pull-back structure and `K.look` + `K.focus`; retime the keys so the whole wall is in frame by the first story event, and keep the last key after the end |
| `sound(k)` | | Rewrite the events; keep the switch-on (`neon`, `click` run, `tock`, `whoosh`), `k.bed('hum')`/`k.bed('room')`, the chip tune via `k.music('chip', ...)` with tempo following the story, a `tick` per caption, and `panAt` for placing sounds on the wall |

Keep `id: 'led-wall'` in the new style file.

Habits that make the look:
- Everything the viewer reads is drawn on the one canvas at one pixel per lamp: characters as `makeSprite` puppets with a dark outline, scenery layers scrolling at different speeds, words only as `dotText` in the caption strip (no web font, so `fonts: []`).
- Each caption is one short line that pushes up into the strip as its beat begins (`CAPTIONS` entries `[start, text, optional word times]`); a tick sounds with it.
- Characters move by real cycles (walk/run phases, `mixPose` blends, held poses, a skid on stops), never by sliding a still sprite; steady things keep a constant speed (`PLOD`).
- The picture is a pure function of `t` at 30 pictures a second, so the lamps never smear; colour spill, haze and gantry all read the same canvas.
- The camera does the opposite of the content: one macro start on the `HERO` lamp, a long continuous pull and swing, drifting at the end, with `lens` aperture opening up as it pulls back.
- Sound is the wall's own chip tune at tempos matching the story (fast sprint, slow nap, bright finish) over a hum and room bed.

## Prompt differences

The prompt says "Tell my content as a story, not a title card" where most styles say "as an explainer". Tell the content as a short story with a beginning, a turn and an end, still with the picture doing the telling: characters and events on the wall carry the story, and the captions only name each beat.
