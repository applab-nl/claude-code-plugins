---
id: factory-line
name: Factory Line
family: Machines that explain
use: explainer
fonts: Fredoka, Inter
reference_topic: How an AI agent finishes a task: plan, search, write, check
duration: 9
samples: 48
libs: 
---

# Factory Line

**Look:** A toy-grade production line on a clean studio floor: chunky cobalt machine housings with big white labels, safety-orange moving parts, a dark rubber belt and one white page riding an orange tray.

**Motion:** The belt indexes: the tray glides to a station, stops, the machine does one heavy mechanical thing to it (a press slams, a light bar sweeps, a roller prints, a stamper punches), a lamp turns green and the belt moves on.

**Light:** One low, warm key from the front-left so light reaches under the machine heads and every tool throws a soft shadow on the page, plus a cool sky light that darkens the gaps under the housings. Working tools add their own coloured light.

**Materials:** Clear-coated enamel in cobalt, orange and cream; brushed steel rods and bolts; matte ribbed rubber; uncoated white paper with printed ink.

**Camera:** A dolly beside the line that travels with the tray, looking down at about 35 degrees so the page stays readable. It drifts from just behind the tray to just ahead of it, then drops down in front of the finished page for the hold.

**Finish:** Real motion blur (the world streaks past while the tray stays sharp), gentle depth of field, soft bloom only on lamps and the scanner light, true colours (neutral tone map), light vignette, almost no grain.

**Good for:** Any step-by-step process: the raw input rides a belt, each labelled station is one step and visibly changes the item, and the finished result is presented at the end.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace the words: `REQUEST`, `STEPS` (the four station labels), `SECTIONS`, `END_LABEL`. Keep four stations with the same four tools (the file says so): a press that stamps the outline, a scanner that fills it with sources, a roller that prints the result, an inspection lamp and stamper |
| Schedule | `DUR`, `SP`, `STATION_X`, `OUT_X`, `START_X`, `T`, `GREEN`, `LEGS` | Re-time for the new story, keeping the shape: every station has an arrive / work / leave set in `T`, `GREEN` lists when each lamp turns green, and each entry of `LEGS` is a speed curve `[time, speed]` ending at 0 on a station. `sound(k)` reads the same names |
| Belt kit | `makeRide(K)`, `dollyX` | **Copy unchanged.** It integrates `LEGS` into a position table so the tray lands exactly on each station; `dollyX` is the smoothed copy the camera follows |
| Sizes | `BELT_Y`, `TRAY`, `PW`, `PD`, `PX`, `PAGE_Y`, `HEAD_*`, `TOWER_*`, `ROLLER_R`, `SEC_Y`, `SEC_H` | **Copy unchanged** (change `SEC_*` only if the page layout changes) |
| Page drawing | `drawPage(ctx, stage, K)` | Keep the four stages (0 blank, 1 outline, 2 outline + sources, 3 written) because `pageMat` swaps between them with the `pu` uniforms. Edit the text and layout inside each stage |
| `registerStyle` metadata + render | | Keep `render` (`shutter: 0.5`, `fov: 30`, bloom on lamps only) and `fonts`; change `topic`; `duration: DUR` |
| `build(S)` kit | inside `build` | **Copy unchanged:** `ride`, `envTex`, `key`, `sky`, materials (`paint`, `cobalt`, `orange`, `cream`, `graphite`, `steel`, `rubber`, `dark`, `hazardMat`), helpers `add`, `rod`, `bolt`, `lampMat`, `setLamp`, the room (`roomMat`, `WALL_Z`, `COVE`, the safety `line`), the conveyor (`beltTex`, `drum`, rails, instanced `caps`), `housing(X, label, i)` with its `K.textPlane` label and number plate, the tilt `table`, `endText`, `endLamp`, and the item (`item`, `pageMat` + `pu`, `card`, `ticks`, `seal`) |
| Station tools | `press`, `scanner` + `beam` + `scanLight`, `roller` + `rollTex` + `inkRoller`, `lens` + `cone` + `checkLight` + `stamper` | Keep as they are; they are the four stations. Only the words they act on change |
| `update(t)`, `rig`, `sound(k)` | | `update`: keep the structure (belt and caps follow `ride(t)`, each station reads its `T` entry, lamps through `setLamp`, tray on the tilt table, `key` follows `dollyX`, `K.look` with `rig.pos` / `rig.aim` offsets from the dolly, `K.focus` on the tray at 0.02). Re-time `rig` keys to the new `T`. `sound`: rewrite per station, keeping the `room` and `hum` beds, `roller` + `tock` per `LEGS` leg, and one `ding` per green lamp stepping up the scale |

Habits that make the look:
- Words are 3D and on the machines: station names are big white `Fredoka` 700 (`K.textPlane`, lit) on the cobalt housings, with a small number plate on the rail; the page and request card carry `Inter` 800. There is no 2D overlay.
- Each station does one heavy mechanical thing: the platen winds up and falls on `pow(.., 2.4)` with a head recoil, the scanner sweeps a lit bar front to back, the roller turns geared to the feeding page, the stamper punches. The page changes through the shader stages (`uPlan`, `uScan`, `uWrite`), revealed where the tool has passed.
- Every station ends the same way: its lamp blinks amber while working (`setLamp`), turns green at `GREEN[i]`, the belt moves on; the finished page is stood up by the tilt table and held.
- Light is a low warm `key` that rides the dolly (so its shadows stay sharp) plus cool sky light; working tools add their own coloured light (scan light, check light). Colours stay cobalt, orange, cream, with hazard yellow only on the platen edge.
- Camera is a dolly beside the line at about 35 degrees down, smoothed so it glides while the tray stops and goes, ending low in front of the finished page; focus is always on the tray.
- Sound is the machine: belt motor and a clunk at each stop, an air rush then `impact` for the press, a rising scanner tone with a blip per row, print chatter, a stamp, and a servo for the tilt.
