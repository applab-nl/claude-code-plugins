---
id: museum-gallery
name: Museum Gallery
family: Spaces and journeys
use: explainer
fonts: DM Serif Display, Oswald, Space Mono
reference_topic: Four moments that led to AI today: Turing's question, Deep Blue, AlphaGo and ChatGPT
duration: 9
samples: 40
libs: 
---

# Museum Gallery

**Look:** A dark gallery hall at night: gilt-framed posters on a deep green damask wall, each in its own tight pool of warm spotlight with the beam hanging in the air, a brass plaque beside every frame, a rope barrier and a polished stone floor that mirrors it all.

**Motion:** One unbroken dolly move in three kinds of shot: it opens wide and oblique on the first exhibit with the others waiting down the wall, tracks past the middle ones at medium distance, and ends pushing in on the last. Each exhibit's lamps click on just before the gaze leaves for it, and the ones already seen sink back to a glow.

**Light:** One tight ceiling spot per artwork and a smaller one per plaque, warm, with deep shadow between the pools and no ambient light. Lamps that are off still glow faintly so the frames ahead read in the dark. The last exhibit swells to one and a half times the light of the others during the final push-in.

**Materials:** Flat poster-style prints (drawn in 2D) in black-and-gold frames with real depth, engraved brushed brass, brass posts with velvet rope, woven wall fabric, dark polished stone.

**Camera:** A long lens on a low dolly, shallow focus pulled from exhibit to exhibit. The gaze lingers on each exhibit and travels quickly between them while the dolly itself never stops; the frame and its plaque fill most of the picture, with a strip of mirror floor underneath.

**Finish:** Real depth of field and soft shadows, gentle bloom on the brightest print, filmic contrast with true blacks, a clear vignette and fine grain.

**Good for:** Lists and timelines of three to five points: each point is one framed poster with a plaque (a year or number, plus a few words), visited in order, with the last one as the conclusion.

## Working with the reference

`reference.js` is one block. The exhibit count is `N = EXHIBITS.length`; the walk timing arrays must match it.

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `EXHIBITS` (`{ year, lines: [two caption lines], art }` per point; 3 to 5, last = the conclusion) |
| Walk timing | `DUR`, `N`, `LAST`, `GAP`, `PASS`, `LINGER`, `LIGHT_ON`, `LABEL_LAG`, `SWELL`, `STANDBY`, `exX`, `lamp(dt)` | Rewrite `PASS` (one entry per exhibit; first = when the gaze leaves it, last = when it arrives) and `DUR` for the new count; **copy unchanged** `LINGER`, `LIGHT_ON`, `LABEL_LAG`, `SWELL`, `STANDBY`, `exX`, `lamp` (the click-flicker-settle curve) |
| Poster kit | `CREAM`, `INK`, `RED`, `LIGHT_PAPER`, `drawPoster(K, name, index)`, `drawPlaque(K, ex)` | **Copy unchanged**: the keyline, series numeral, ink speckle and the engraved brass plaque |
| Posters | `king`, `gear`, `bubble`, `POSTERS` | Replace: one flat 2D poster per exhibit in `POSTERS` (keys match `art`, canvas 1024 x 1280, three or four inks, one big simple symbol); list a pale-ground poster in `LIGHT_PAPER`. Helper functions are optional |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0.25`, `tone: 'filmic'`, `bloom: 0.35`, `fov: 30`, `background: '#020203'`) and `fonts` (DM Serif Display, Oswald, Space Mono); change `topic`; `duration: DUR` |
| `build(S)` set | | Keep: the almost-dark `K.env` (`envMap` given to metals only), the `night` moon light, `damask` wall, `wood`, `stone` + `K.mirrorFloor`, the frame kit (`ART_W`, `ART_H`, `FRAME`, `PLQ_W`, `gilt`, `lacquer`, `brass`, `ring`, `beam`, `plate`), `exhibits` map (frame, print, plaque, `key` and `label` spots), rope barrier (`post`, `velvet`, `ROPE_Z`) |
| Camera and update | `camKeys`, `gazeKeys`, `cam`, `gaze`, `update(t)` | Rewrite the keys for the new `N`: wide oblique start, medium tracking shots past the middle exhibits (three gaze keys each: just before, on, just after), push-in on the last; keep `K.look(camera, cam(t), [g[0], g[1], 0])` and `K.focus(camera, ..., 0.13 - 0.06 * open)`; keep the lamp logic `lamp(t - LIGHT_ON[i])`, `STANDBY` glow and the final `SWELL` |
| `sound(k)` | | Rewrite the note list (`notes`: one per exhibit, stacking into a chord) and loop over `EXHIBITS`; keep the relay/filament/thud on each `LIGHT_ON`, `room` and `hum` beds and the brown-noise dolly roll |

Keep `id: 'museum-gallery'` in the new style file.

Habits that make the look:
- Words live on the brass plaque beside each frame: the year in DM Serif Display, two caption lines in Oswald, engraved by `drawPlaque`; the posters carry no text beyond a small series numeral in Space Mono.
- The art is flat poster-style canvas drawing in a few inks inside real 3D gilt frames; nothing on the wall moves.
- Exhibits are revealed by light, not motion: each lamp pair clicks on (`lamp(dt)`: fast rise, one flicker, overshoot) just before the gaze leaves for it, the plaque lamp following by `LABEL_LAG`; unlit ones keep `STANDBY` glow; the last swells to 1.5 times during the push-in.
- Light and colour: no ambient light, deep green damask, warm `#ffdfb8` spots with visible beams, black-and-gold frames, a polished mirror floor.
- Camera: one unbroken `K.path` dolly (never stops) while the gaze path lingers on each exhibit and travels fast between; shallow focus tracks the gaze, aperture `0.13 - 0.06 * open`.
- Sound: a hushed room and hum, a relay click plus filament for every lamp, one soft note per exhibit building into a chord on the last.
