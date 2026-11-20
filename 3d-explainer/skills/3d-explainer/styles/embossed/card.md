---
id: embossed
name: Embossed
family: Flat content made physical
use: title
fonts: Fraunces
reference_topic: The saying "Measure twice, cut once." letterpressed into paper, with a foil-stamped carpenter's square
duration: 8
samples: 48
libs: 
---

# Embossed

**Look:** Words and one small mark pressed into thick cotton paper and filmed in macro: grey-blue letterpress sunk deep enough to see the walls of the impression and the shadow inside it, a ruler scale embossed blind (raised, no ink), and a copper foil stamp, on a deckle-edged sheet lying on a dark press bed.

**Motion:** You watch it being made. A brass plate with the type standing up in mirror image swings down, squeezes the sheet and lifts to show the impression; a ribbon of foil is laid over one spot, a heated die on a lever arm stamps it, and the spent foil is peeled back to leave the metal mark.

**Light:** One low, hard raking lamp from the side, so every impression has a bright far wall and a shadow inside, with dim warm fill. The lamp slides round at the end so the relief turns, and a glint runs across the foil.

**Materials:** Toothy cream cotton paper that is smoother where it was compressed, ink lying on the floor of the impression with bare paper walls and small bare specks, mirror-bright copper foil, etched brass with wet ink on the type, grey steel.

**Camera:** A long lens with shallow focus, one continuous move: low against the open plate, down with its edge to the paper, then a slow pass a few letters wide just above the sheet that arrives at the foil work, then up and back until the whole card fills the frame.

**Finish:** Real depth of field and motion blur, soft bloom only on the foil and brass glints, filmic contrast, a gentle vignette and fine grain.

**Good for:** Any quote, name, number or simple logo: it is drawn flat on a canvas and pressed into the material, so the statement arrives as a finished, tactile object. Best for one line that should feel permanent, with one small mark picked out in foil.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `LINES` (text and font per line), `PAPER`/`INK`/`FOIL`, `CARD_W`/`CARD_H`, and the art code `layout()`, `drawMark(ctx, s)`, `drawArt(ctx, layer, L)`. `drawArt` draws white on black per layer: `'ink'` (letterpress), `'blind'` (raised, no ink), `'foil'` |
| Schedule | `T` | Rewrite the moments (`hit`, `lift`, `open`, `strip`, `laid`, `stamp`, `stampLift`, `stampGone`, `peel`, `peeled`, `sweep`, `flash`, `rest`); picture and sound both read it |
| Relief kit | `reliefMaps(K, W, H, draw)`, `fibreMaps(THREE, K)`, `reliefMaterial(THREE, mat, opts)` | **Copy unchanged.** `reliefMaps` turns the flat art into `shape`/`soft`/`halo` maps; `reliefMaterial` adds parallax-occlusion relief and self-shadow to a standard material |
| Sheet, bed | `paper = reliefMaterial(...)` on the deckle-edged slab, `bed` | **Copy unchanged**; only the layout inputs change with the art |
| Plate and foil rig | `hinge`/`forme`, `steel`, `brassMat`, `plate`, `face`, `plateAngle`, `strips`, `poseStrip`, `arm` | Copy; it is the "watch it being made" machine. `MARK` and `MARK_S` come from `layout()`, so moving the mark moves the foil work |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0.4`, filmic, `background '#050403'`); change `topic`, `duration`, `fonts` |
| `build(S)` / `sound(k)` | | Rewrite to the new art, keep the rig: `world()` y-up mapping on the `table` group, `K.env` panels, the `key` spot driven by `keyPos` (slides round at the end), the weak `glint` spot (`glintOff`), `cam.pos/aim/ap`, and `update(t)` (plate hinge, `uLightL`, `uUsed`, `uInkIn`, `uFoilIn`, `uWet`, `poseStrip`, `arm`, camera, glint). Sound reads `T` |

Habits that make the look:
- Words are art, not 3D text: they are drawn white-on-black in `drawArt` at 4096 px wide in Fraunces (italic 400 for the first line, 500 for the second) and pressed in as ink; the ruler scale is the `blind` layer, the one small mark is the `foil` layer. A new quote only changes `LINES` and `layout()`.
- You watch it being made: the plate closes at `T.hit` (the impression exists from that moment, hidden by the die), a foil ribbon is laid, the hot die on its lever stamps, and the spent foil is peeled. Each layer switches on with a uniform (`uInkIn`, `uFoilIn`), ink dries over 3.5 s (`uWet`).
- One low hard lamp does all the modelling (`key`, power 28000, far to the left), so every impression has a bright far wall and a shadow inside; it slides round after `T.sweep` so the relief turns, and the weak `glint` lamp sweeps over the mirror line to flash the foil.
- Palette is quiet: cream paper, grey-blue ink, copper foil, brass and steel for the machine, dark press bed; bloom only on foil and brass glints.
- Camera is one move on a long lens: low against the open plate (aperture 0.1-0.13), down to the plate's edge on the paper, a slow low pass about 27 degrees above the sheet a few letters wide (aperture 0.06) that arrives at the foil, then up and back until the whole card fills the frame. `hinge.visible` is turned off once the low camera cannot see the plate.
