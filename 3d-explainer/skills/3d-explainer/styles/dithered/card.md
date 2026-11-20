---
id: dithered
name: Dithered
family: Filters over 3D
use: explainer
fonts: Archivo Black
reference_topic: The Pomodoro technique: 25 minutes of work, 5 minutes of rest, repeat
duration: 8
samples: 16
libs: 
---

# Dithered

**Look:** A lit 3D scene shown in one-bit: two colours only, big square pixels, every shade made of ordered dot patterns, one-pixel contours and bitmap lettering in desktop windows, like an early home computer screen with real depth behind it.

**Motion:** Crisp steps, no blur. Objects tick, snap, overshoot and rattle; interface changes are instant or a short blink of one small plate, never a full-screen flash. The camera glides while the subject keeps the same pixels, so the picture scrolls like a sprite instead of shimmering.

**Light:** One low sun through a window that is out of shot: a hard key from the upper left, long crisp shadows, and the window's edge and glazing bar falling across desk and wall. Almost no fill, so shadows go to solid ink; a little bounce from the desk and a low back light keep the shadow side readable. The subject is lit against the dark wall on one side and dark against the lit wall on the other.

**Materials:** Greys only: what counts is each surface's tone, because tone decides whether it becomes paper, ink or a dot pattern. The ground is clean paper, the hero is the one mid-tone object, small props are white with a contour. Simple round forms, a few bold printed details, one glossy surface for a hard highlight.

**Camera:** Long lens looking slightly down, fixed heading, one slow truck and pull-back that ends on the whole set-up. The pixel grid is tied to the subject, so it keeps its pixels while the wall and the props slide past it.

**Finish:** Picture reduced to 384 x 216 pixels, Bayer 4 x 4 ordered dither into ink and paper, contours from a normal-and-depth pass in whichever colour the surroundings are not. No blur, bloom, grain or vignette.

**Good for:** Any object or small set-up staged like a still life, with desktop windows carrying the numbers: a readout for the value that changes and a strip for sequence or progress. Good for routines, cycles, steps, states and anything with a clock in it.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: minutes `WORK`/`REST`, `WORDS`, `RATE`, `START`; keep `INK`, `PAPER`, `CELL` unless asked for another palette (two colours only) |
| Schedule | `schedule()`, `PHASES`, `BELL`, `AGAIN`, `WIND`, `timerAt(t)` | Rewrite for the new story, keeping the contract: one phase list that both the picture (`timerAt(t)`) and `sound(k)` read |
| Dither finish | `DITHER` shader, `ditherFinish(S, {ink, paper, cell, lo, hi, gamma})` | **Copy unchanged.** `fin.frame(t, anchor)` must be the last call in `update`; `fin.project(world)` and `fin.snap(x, y)` place overlay marks on the grid |
| Pixel kit | `GLYPHS`, `pixelKit(ctx, cell, ink, paper)` | **Copy unchanged.** Gives `u.text`, `u.rect`, `u.box`, `u.grey`, `u.win` in whole picture pixels (add glyphs to `GLYPHS` for any letter the new words need) |
| Shapes | `shell(THREE, K, {...})` | Copy; reuse or add simple round forms of the same kind for the new subject |
| `registerStyle` metadata + `render` | | Keep `render` (`samples: 16`, `shutter: 0`, `tone: 'neutral'`, no bloom/vignette/grain); change `topic`, `duration` |
| `build(S)` | | Rewrite the subject and props, keep the rig: `ditherFinish` call (`lo`, `hi`, `gamma`), `grey()` materials, the window-card sun (`setSun(minutes)` with `win`, `su`/`sv`), the back `K.spot`, the `K.env` with bright "bottom", desk and wall planes, `HEAD` and `camPos` (translate only, heading fixed), `update` ending in `fin.frame(t, anchor)` on the subject |
| `overlay(ctx, t)` | | Rewrite the windows and strip for the new data, keep the pattern: `pixelKit`, scene-anchored marks through `fin.snap`/`block`/`stroke` with a paper halo, a readout `u.win`, a progress strip drawn to scale. `sound(k)` is rewritten |

Habits that make the look:
- Every word is bitmap lettering on the 2D `overlay`, never in the 3D scene (the contour pass would see see-through planes as solid): Archivo Black is declared in `fonts`, but the visible type is the `GLYPHS` bitmap alphabet drawn by `u.text`, in whole picture pixels (`CELL` = 5 screen px).
- Interface sits in desktop windows (`u.win` with striped title bar): one readout (plate flips WORK/REST, big digits) and one strip drawn to scale that fills as the timer runs. Changes are instant or a short blink of one plate (the plate flips twice, the REPEAT key blinks twice), never a full flash.
- Motion is crisp: the dial turns in `top.rotation.y`, the bell is a decaying rattle on `timer` (`rg`), the windows jump a couple of pixels, steam and rays are blocks that flicker by whole frames. Nothing blurs; `shutter: 0`, no `K.focus`.
- Light is one hard sun through a window that is out of shot, a real card with holes in it, creeping with the clock (`setSun(s.unit)`); almost no fill, a low back spot for an edge on the shadow side. Model in greys: tone decides paper, ink or dot pattern (`hi: 0.66` is the tone that becomes clean paper).
- Camera only slides (`HEAD` fixed, `camPos` eased truck and pull-back) and the grid is anchored on the subject (`fin.frame(t, [0, CY, 0])`) so the subject keeps its pixels while the wall slides past.
