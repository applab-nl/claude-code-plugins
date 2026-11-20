---
id: layer-stack
name: Layer Stack
family: Diagrams with depth
use: explainer
fonts: Space Grotesk, Inter, IBM Plex Mono
reference_topic: What's inside an AI app: interface, agent, model, your data, chips
duration: 8
samples: 48
libs: 
---

# Layer Stack

**Look:** A system shown as a stack of thin glass sheets, each with its own diagram printed in white, floating one above the other over a dark machined plinth. Aqua edges glow like edge-lit acrylic against near-black; one amber is kept for the answer.

**Motion:** The stack starts closed as one block. Sheets lift off one at a time from the top, float a little past their place and settle, and each label draws in beside its sheet as it lands. Then a bead of light drops through the same pad on every sheet, each sheet flashing white as it passes, and climbs back in amber; the sheets cool again behind it and only the top one stays lit.

**Light:** One small key from high behind, so every sheet and its printed lines throw a crisp shadow onto the sheet below; a soft panel mirrored in the glass tops; a cool rim; the rest falls to black. The bead carries a real light that spills onto the sheets it passes.

**Materials:** Lightly frosted glass that stays clear but keeps full-strength reflections, brighter aqua edges, matt white print that takes light and shadow, dark anodised aluminium, a satin floor with a faint reflection.

**Camera:** Long lens, three-quarter view from above. It starts close on the closed block, cranes up and back with the first sheet as it rises, then keeps a very slow push toward the open stack.

**Finish:** Motion blur on the lifts, bloom only on lit edges and the bead, a neutral grade that keeps the aqua and amber true, deep blacks, a soft vignette and very fine grain.

**Good for:** Anything built in layers: a tech stack, a product teardown, how a request travels through a system. One sheet per layer with a simple diagram, a name and a short line beside it, and a pulse that shows the order things happen in.

## Working with the reference

`reference.js` is one block; this style has no kit function, its look sits in the shared set-up inside `build`. Treat the parts differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `TITLE` and `LAYERS` (`{ name, note, diagram }` per layer, top first); `N` follows |
| Timing | `LIFT`, `FREQ`, `labelAt`, `DOWN`, `STEP_DOWN`, `UP`, `STEP_UP`, `hitDown`, `hitUp`, `ANSWER` | Rewrite for the new layer count (one `LIFT`/`FREQ` entry per sheet, long trips slower), but keep the shape: lift top first, request goes down at `DOWN`, answer climbs back at `UP`, and `sound(k)` reads the same names |
| Stack geometry | `W, D, TH, GAP, BASE`, `closedY`, `openY`, `lift`, `layerY` | **Copy unchanged** (`lift` is the damped spring `K.spring(t - LIFT[i], FREQ[i], 0.78)`) |
| Diagram prints | `PAD`, `rr`, `dot`, `line`, `sheet`, `drawChat` ... `drawChips`, `DIAGRAMS` | Copy `PAD`, `rr`, `dot`, `line`, `sheet` and `drawAnswer`'s role unchanged; replace the `draw*` functions with diagrams for the new layers (white on black in a 1000 x 611 space, each ending in the round pad at `PAD`) and re-register them in `DIAGRAMS` |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0.5`, `tone: 'neutral'`, `bloom: 0.5`, `fov: 18`, `background: '#040506'`) and `fonts`; change `topic`, `duration` |
| `build(S)` | | Keep the whole rig: colours `AMBER, WHITE, AQUA, GLASS, EMBER`; `K.env` panel and the two `K.spot` lights; the `glass(m)` patch; `slabGeo`, `sheetGeo`, `flatGeo`; plinth and floor; the `seed` stochastic shadow trick; the per-sheet `layers` map with its camera-facing `label` on `camera.layers.enable(1)`; `answer` mesh; the pulse (`bead`, `wireDown`, `wireUp`, `glow`, `pulseAt`, `glide`, `yAt`); the `shot(t)` camera and `K.focus`. Only the per-layer content and the `answer` print change |
| `update` / `overlay` | | Keep `update(t)` as is; `overlay` draws `TITLE` in Space Grotesk and fades out as the first sheet lifts; change only the text and keep the fade |
| `sound(k)` | | Rewrite around the same events: one glass note per sheet (`SCALE`) at `LIFT`, thud and buzz at `hitDown(N - 1)`, `riser`, a rising note per layer at `hitUp(i)`, `success` at `ANSWER` |

Keep `id: 'layer-stack'` in the new style file.

Habits that make the look:
- Words are not overlay except the heading: each label (name in Space Grotesk bold, note in Inter) is a camera-facing group on the sheet's right edge that draws in as its sheet settles at `labelAt(i)`; only `TITLE` is a 2D `overlay`, gone by the first lift.
- Sheets move on a damped spring (`lift`), float slightly past `openY` and tip a little with their speed; no hand easing, no cuts.
- A sheet's print appears only once the sheet above has lifted away (`open`), so the closed block reads as one screen.
- One idea drives the story: a bead of light drops through the same `PAD` on every sheet (white, with a flash per sheet), then climbs back in amber; sheets cool behind it and only the top one keeps the amber answer.
- Light and colour: near-black world, aqua edge glow, one amber; a key spot from high behind throws crisp shadows layer to layer, a mirrored panel in the glass tops, a cool rim spot, a real `PointLight` (`glow`) riding the bead.
- Camera: long lens (`fov: 18`), one `K.spring` move tied to the first lift (crane up and back), a slow drift that never stops, and shallow focus on the stack via `K.focus`.
