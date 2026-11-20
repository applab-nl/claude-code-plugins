---
id: studio-product
name: Studio Product
family: Products and screens
use: product
fonts: Inter, Space Grotesk
reference_topic: Launch film for "Tide", a made-up insulated steel water bottle: cold for 24 hours
duration: 8
samples: 96
libs: 
---

# Studio Product

**Look:** One physical product in a near-black seamless studio, filmed like a flagship launch: the object is carved out of the dark by strip softboxes and stands on a black mirror floor, with a single restrained line of type beside it.

**Motion:** The product stays still and the light moves: a tall strip light glides across its surfaces again and again, changing colour as it goes, while the lens travels over the details in macro and then pulls back to the whole object. A counter ticks with the light and lands on the number in the copy.

**Light:** Softboxes only, placed relative to the lens: a graded key strip that sweeps from side to side, two thin rim strips from behind that draw the outline, a soft box overhead for the top. Everything they do not touch stays black.

**Materials:** Real product finishes with small precise details: powder coat with a fine orange-peel texture, turned steel with lathe lines and bevelled edges, a diamond-knurled ring, black anodised flutes with a bright cut chamfer, a laser-etched mark, a seam and a rubber foot.

**Camera:** A long lens on a slider, one continuous move: two macro passes with very shallow focus (the collar, then the etched mark), a pull-back to the full product standing off-centre, and a slow push that never quite stops.

**Finish:** True depth of field and motion blur, a soft bloom only where polished metal catches a strip light, filmic contrast with deep blacks, a light vignette and very fine grain.

**Good for:** One product and one claim. The macro passes show what it is made of, the moving light and the counter act out the claim (here: a full day passes, it is still cold), and the lock-up states it in one line.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `COPY` (`mark`, `line` with `#` as the counter slot, `count`, `unit`, `spec`) and `FINISH` colours |
| Schedule | `DAY`, `SWEEPS`, `LOCK`, `hoursAt` | Retime for the new claim; keep the idea (the light is the clock: key-strip passes while its colour runs through a day, counter lands inside the lock-up at `DAY[1]`). `sound(k)` reads the same constants |
| Softbox rig | `softboxRig(S, boxes, aim)` | **Copy unchanged.** Per-pixel rectangle lights; `rig.light(mat, {coat, coatRoughness, diffuse, specular})` on every material, `rig.update(t, lensAz)` each frame |
| Machined-parts kit | `turned(THREE, corners, uvR, seg)`, `knurl(THREE, r, y0, y1, n, depth, rows)`, `wave(ctx, ...)` | **Copy unchanged.** `turned` takes `[radius, y, fillet]` corners bottom to top; `knurl` with `rows > 0` is the diamond knurl, `rows = 0` flutes |
| Studio | `seamlessStudio(S)` | **Copy unchanged.** Glow backdrop, `K.mirrorFloor`, additive contact-shadow `pool`; returns `tint(rgb, level)` |
| Product | `buildProduct(S, rig)` | Replace for a new product (the only object-specific part): same method, a `M` material set through `rig.light`, parts from `turned()` profiles via `part()`, `K.tube` for handles, laser `etch()` patches for the mark. Keep it standing on y = 0 at the origin, mark facing +z, and update the `C0` / camera heights to its size |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0.5`, `fov: 24`, tight bloom threshold); change `topic`, `duration`, and `fonts` if the type changes |
| `build(S)` | | Rewrite the numbers, keep the structure: `cam` (`pos`, `aim`, `focus` as `K.path`; `ap` as `K.track`), `dayColor`, `hero`, the four-box `rig` (sweeping key strip, two rim strips, overhead box), the dim `K.env`, `studio`, `buildProduct`, then `update(t)` (look, focus, `rig.update`, `studio.tint`) and `overlay(ctx, t, W, H)` with its `counter` and `rise` helpers (copy those two as they are) |
| `sound(k)` | | Keep the pattern: `room` bed, a `pad`, a `whoosh` per key-strip pass, a `tick` per counted unit, a high tone on the etching, `thud` + `ding` at the landing |

No library is used.

Habits that make the look:
- The product never moves or changes; the light does the acting. The key strip (`SWEEPS`, per-box `az` as a `K.track`) crosses it again and again while its colour (`dayColor`) tells the story.
- Type is 2D, drawn in `overlay` so it stays sharp: Inter for the counter and the one line of copy, Space Grotesk for the unit and wordmark. Lines rise out of their own baseline with a clip (`rise`, `outQuint`); the counter rolls like an odometer. Only a mark etched on the product is 3D.
- Everything is near black: `K.env` very dim, a glow backdrop, a black mirror floor. Only softboxes carve the object out, with fine bevels (`fillet` in `turned`) to catch the strips; bloom only on polished metal.
- Camera is one continuous `K.path` move: macro on a detail with very shallow focus (`ap` ~0.036), a second macro on the etched mark, a pull-back that leaves the product off-centre to make room for the lock-up, then a slow push that never stops. `focus` has its own path and the lens stops down as it leaves.
- Hero beat: during the macro passes the rim lights are weak; `hero(t)` brings them and the key strip up once the whole product is in frame.
