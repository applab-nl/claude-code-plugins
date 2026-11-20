---
id: x-ray
name: X-Ray
family: Filters over 3D
use: explainer
fonts: Space Grotesk, IBM Plex Mono
reference_topic: Why a vacuum flask keeps drinks hot
duration: 8
samples: 48
libs: 
---

# X-Ray

**Look:** A radiograph you can move around: the object turns into glowing film on a dark scanner bed, every wall brightest where you look through the most material, with one warm accent for the part that matters right now.

**Motion:** The object starts solid. A scanning plane sweeps along it, the cut face glows as a live cross-section, and everything behind the plane is left see-through. Then the inner parts light up one at a time as something (here heat) runs into them.

**Light:** Before the scan, a soft overhead key and long strip reflections on brushed steel. After it the room dims and the picture is made of emitted light only: film, accent and a faintly lit grid.

**Materials:** Brushed steel and black plastic for the solid; for the X-ray one material that adds up the true path length through each closed part, so edges, rims and overlaps brighten by themselves.

**Camera:** Long lens. One continuous crane from a low three-quarter view of the cut face up to a near plan view, like the plate of a radiograph, then a slow push that never stops.

**Finish:** Gentle bloom on the brightest edges and the accent, neutral tone mapping so the two colours stay true, fine grain, a soft vignette. Callouts are crisp 2D type on poles that track points on the model.

**Good for:** What is inside something and how it works: anatomy, machines, products, buildings. Up to three inner parts, each lit and named in turn, with a simple flow (heat, air, current, force) shown acting on them.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `TITLE`, `OVERLINE`, `PARTS` (up to three `{name, note, at}`), `SCAN` (sweep window), `COOL` / `ACCENT` (keep the two-colour palette), `MM` (mm per world unit; drives grid, scale bar and readout) |
| Object | `LEN`, `HALF`, `AXIS_Y`, `OUTER`, `INNER`, `CUP`, `STOPPER`, `T_OUT`, `T_IN`, `R_GAP`, `u(h)` | Topic-specific: the object as `[radius, height]` profiles of revolution lying along x. Replace with the new object's profiles; keep `u()` (height along the axis to world x) |
| Heat / flow | `HEAT` (IIFE building `rays`) | Topic-specific: one set of rays per part (`part`, `pts`, `t0`, `dur`, optional `hit`, `bar`); keep the `stop` computation. Straight ribbons for conduction, `wave()` for radiation. `sound(k)` reads the same `HEAT` |
| `registerStyle` metadata + `render` | | Keep `render` (`neutral` tone, bloom 0.5, `fov: 22`); change `topic`, `duration`; fonts stay Space Grotesk and IBM Plex Mono |
| X-ray kit | `cutPlane`, `CUT`, `REF`, `setCut`, `xray(color, density, sheet)`, `sectioned(geo, mat, capColor, capGain)`, `fine`, `offset`, `wall`, `revolve` | **Copy unchanged.** `xray` is the additive path-length film material for any closed mesh; `sectioned` clips a lit mesh by the cut plane and caps it with BackSide faces. Needs `renderer.localClippingEnabled = true` (first line of `build`) |
| Scene dressing | `K.env` (strip lights), `key` spot, `bed`, `marksTex` / `marks` (grid, plate outline, scale bar), `brush`, `steel`, `plastic` | Copy; adjust `marksTex` extents to the new object size |
| Parts | `flask`, `lit`, `film`, `X`, `part(name, geo, litMat, cap, capGain, density, color)` and its calls | Replace the calls for the new object (one `part` per closed solid, density per `WALL_K`-style constant); keep the `part` helper and the `X[name]` registry the animation reads |
| Scan and heat visuals | `sheet`, `heat`, `ribbon`, `rayMat`, `rays`, `gapLoop`, `gapBand` | **Copy unchanged** (the hatched `gapBand` shows empty space such as a vacuum; keep or drop per topic) |
| Camera | `camPath`, `camAt`, `scanX`, `flare` | Keep the shape of the move (low three-quarter on the cut face, crane to near plan view, slow push still moving at the end); retune for the object |
| `update(t)` | | Keep: camera, scan (`setCut`, `lit.visible`, `film.visible`, `sheet`), room dimming (`key.intensity`, `scene.environmentIntensity`), the camera-facing `heat.matrix` / `REF` plane, per-part `flare` colour and density changes, ray heads and stop bars. Rename the `X[...]` keys it animates |
| `overlay` | | Keep the structure: title (fades at 1.45 s), scan readout riding the plane, and `call(part, anchor, dir, len)` callouts with poles tracked by `P(x, r)`; change the `call(...)` anchors per part |
| `sound(k)` | | Keep the scanner motor (`tone` + `noise` + ticks) and `click`/`tone` per part; swap the per-ray voices to match the new `HEAT` parts |

No library is used.

Habits that make the look:
- One cut plane divides the world: solid brushed steel and black plastic on one side, glowing film on the other, with a lit cross-section cap on the cut face. The scene dims to emitted light only after the scan (`dim`).
- Two colours only: cool film (`COOL`) and one warm accent for what matters now. Parts flare to the accent when the heat reaches them, then settle to a lower `rest` so the finished frame keeps all three lit.
- Words are crisp 2D type, never in the 3D scene: Space Grotesk bold for names, lighter for notes, IBM Plex Mono for the overline and the live mm readout; callouts are a ringed pole tracked to a 3D point, name sliding in just after the pole, then the note.
- Flow is drawn as glowing ribbons with hot tips and arrow heads in one plane that turns to face the camera, ending in a small bar where the ray is stopped.
- Camera: long lens, shallow focus; low three-quarter view of the cut face, crane up to near plan view like a radiograph plate, then a slow push that never stops. The bed carries printed marks (10 mm grid, detector outline, scale bar) so it reads as an instrument.
