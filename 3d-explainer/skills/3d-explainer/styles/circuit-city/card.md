---
id: circuit-city
name: Circuit City
family: Spaces and journeys
use: explainer
fonts: IBM Plex Mono
reference_topic: A prompt's trip across a chip: PROMPT, MEMORY, PROCESSOR, ANSWER
duration: 8
samples: 64
libs: 
---

# Circuit City

**Look:** A real circuit board filmed as a city at night: matte black chips are the buildings, aluminium capacitors the towers, gold tracks the streets, and white silkscreen print names each district. Deep green solder mask, gold and tinned metal, warm signal light.

**Motion:** A pulse of light races along the gold tracks from stop to stop and each landmark wakes as it arrives: chips glow from underneath, the processor dies light up in a diagonal wave. The camera flies low and forward after it, like a helicopter shot, and rises once over the big chip.

**Light:** Night. The signals are the main light: a warm glow that travels with the pulse and throws moving shadows from every part. A soft cool moonlight from the back left rims the parts and rakes the board so metal glints and textures read; a few tiny indicator LEDs.

**Materials:** Semi-gloss solder mask with fine grain and raised copper under it, satin gold tracks and pads, bright tinned pins, moulded black epoxy with laser-etched markings, brushed aluminium cans, iridescent bare silicon.

**Camera:** Macro lens, very shallow focus that rides with the pulse. One continuous forward flight that starts low at the edge of the board, sways gently after the pulse, cranes up over the processor and glides on to settle above the last stop.

**Finish:** Real depth of field and motion blur, bloom only on the signal and LEDs, filmic contrast with deep blacks, slight lens fringing, vignette, fine grain.

**Good for:** Journeys and pipelines: something travels through a system and each stage does its part. Every stage is a landmark with a printed label; the pulse and the camera carry the order.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `STOPS` (the landmark names), `REFS` (designators printed beside them), `CORES`, and the `T` schedule (launch, memEnd, memOut, cpu, wave, waveLen, cpuOut, answer) |
| Map | `BOARD`, `PORT_IN`/`PORT_OUT`, `MEM`, `CPU` | Re-place for the new stops (x right, z towards the camera, flight runs to -z); keep the board and the 45-degree track style |
| Track helpers | `measure`, `offset`, `run` | **Copy unchanged.** `measure(pts)` gives `{pts, cum, len, at}`, `offset` moves a polyline sideways, `run(len, t0, t1, p)` gives `timeAt`/`sAt` for a pulse that gathers speed |
| Route | `plan()` | Rewrite for the new journey, but keep what it returns: tracks as `measure()` paths each paired with a `run()`, so picture and `sound(k)` read the same times (`tapT`, `coreT`, `bus`) |
| Parts kit | `etched`, `flatTop`, `batch`, `add`, `chip`, `can`, `brick`, `inductor`, `led`, `port`, `underglow` | **Copy unchanged.** Landmarks are made by calling these: `chip(x, z, w, d, h, {mark, ref})`, `port(x, z, face)`, `led(x, z, color)`, `underglow(x, z, w, d)` |
| Labels and streets | `label()` (`STRETCH`), `track()`, `STREETS`, the `trackMat` shader patch with `uTime` | **Copy unchanged**, then call `label(STOPS[i], REFS[i], x, z, align)` per stop and add tracks from the new `plan()`. The shader lights each bit of track from the time stored in its vertices (white-hot head, amber tail) |
| Board and outskirts | `floorplan`, `paint`, `boardMap`/`boardData`, `K.mirrorFloor`, the mirrored outskirts, scatter of parts and `led`s | **Copy unchanged**; only add gold tracks for the new routes to the `gold` list so they are painted into the board |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0.5`, filmic, bloom threshold 1.3, `ca`, `background: '#010304'`); change `topic`, `duration` |
| `build(S)` / `sound(k)` | | Rewrite the topic parts, keep the rig: `FogExp2`, `K.env` panels, the moonlight `K.sun` from back left, the shadow-casting `hero` point light driven by `heroAt(t)` and `heroPower`, the `fly()` monotone-cubic flight with `cam.pos/aim/focus/ap`, and `update(t)` ending in `K.look` and `K.focus`. Sound: `zip()` for pulses, one blip per tap, ticks for the bus, a bell scale for the cores, ding for the answer |

Habits that make the look:
- Words live on the board as white silkscreen: `label()` prints `K.textPlane` in IBM Plex Mono 600, stretched 1.4x along the flight (`STRETCH`) so it reads from a low camera, with a small `REFS` designator in 500 weight beside it, and pinholes cut out of the print. No overlay text.
- Everything is driven by one pulse: each landmark wakes when the pulse reaches it (`underglow` under chips, `coreLevel` for the die wave, port glows from `portInGlow`/`portOutGlow`), so a new stop needs a time in `T` and a reaction in `update(t)`.
- Light is mostly the pulse itself: the warm `hero` point light rides on the pulse (`heroAt`) and hovers over a chip while it works; the cool moonlight is only a rim and rake. Keep signals and LEDs the only things above the bloom threshold.
- Colour is night green and black with gold and amber; one tiny green or red LED per area as punctuation (`led()`), a green one when the answer arrives.
- Camera is one continuous forward flight low over the board (keys in `fly()`), ahead of and after the pulse, rising only over the biggest part; macro lens, aperture around 0.09-0.13 (`cam.ap`), focus point (`cam.focus`) rides just ahead of the pulse.
