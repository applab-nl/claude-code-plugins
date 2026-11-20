---
id: marble-run
name: Marble Run
family: Machines that explain
use: explainer
fonts: Oswald
reference_topic: How your inbox sorts email
duration: 8
samples: 48
libs: 
---

# Marble Run

**Look:** A handmade wooden marble run shot like a product film: a walnut board carrying pale maple rails on brass pins, brass paddle gates, swirled glass marbles and three glass jars on a maple plinth with the labels burnt into the wood, in front of a shaded seamless backdrop.

**Motion:** Marbles are let go one at a time, pick up speed as they drop, clack against brass gates that flip to sort them, fall into their jar and settle into a pile. Nothing is eased by hand: speed comes from the height each marble has lost, and the piles are a small physics run.

**Light:** Warm daylight from the upper left, kept off the backdrop so the wall sits in soft shade behind the sunlit wood. Rails and marbles throw soft shadows onto the board, and every marble drops a small glint of its own colour into its shadow.

**Materials:** Satin maple and walnut with drawn grain, polished brass that picks up the window, coloured glass with a white vein that glows on the side away from the light, thick clear jar glass with bright edges.

**Camera:** Long lens, shallow focus, one continuous shot that stays close. It rides beside one marble from the hopper, gets to the first gate just ahead of it and waits for the clack, follows it across the second gate, then travels down as it drops into its jar, opens just far enough to hold all three jars and pushes slowly in on the jars, their counters and their names.

**Finish:** Real motion blur and depth of field, colours kept true (neutral tone curve), a small bloom on brass and glass glints, light vignette, fine grain.

**Good for:** Sorting, routing and filtering: anything where many items take different paths through the same rules. The hopper is what comes in, each gate is one rule, each jar is one outcome with a counter under it, and how full the jars end up is the result.

## Working with the reference

`reference.js` is one block. The machine is a fixed layout (hopper, two rails, two gates, three jars) and its physics is pre-computed, so most of it is kit:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `SOURCE` (hopper engraving), `BINS` (`{ label, glass }` per jar), `GATE_TAGS` (the question each gate asks), `ORDER` (one digit per marble = its jar; make the fullest jar the answer), `HERO`, `T_HERO`, `EVERY` |
| Machine constants | `R, ROD, GAUGE, Z0, RIDE, ROLL, KROLL, G, JARX, JAR, PIN, FEED, M1, GAP1, Y1, M2, GAP2, Y2, START2, y1, y2, END1, END2, PL, PT, OPEN`, `up`, `gate`, `GATE1`, `GATE2`, `plate`, `PLATE1`, `PLATE2`, `slot`, `heap`, `mkPath`, `BEND`, `rail1`, `rail2` | **Copy unchanged.** The layout fits three jars and two gates; for a different count keep this code and change only `BINS`, `ORDER` and `GATE_TAGS` |
| Run | `DUR`, `H`, `SR`, `S0`, `memo`, `schedule(K)` | **Copy unchanged.** It returns `run` (`run.bin`, `run.ev`, `run.pose(i, t, p, q)`, `run.ins`, `run.gate1`, `run.gate2`, `run.g2`, `run.n`); picture and sound both read it, so nothing is timed by hand |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0.5`, `tone: 'neutral'`, `bloom: 0.3`, `fov: 28`, `background: '#6f8a8e'`) and `fonts` (Oswald); change `topic`; `duration: DUR` |
| `build(S)` | | Copy the set unchanged: `K.env` and the warm `K.sun` (`SUN`, `AIM`) with its shadow-only flag panel, the `wood`/`maple`/`boardMat`/`brass` materials, backdrop (`YF`), plinth, `wheels` counters, `rails`, `mkGate`/`gate1`/`gate2`, `finger`, `plaque`, hopper, `jarMat`/`jarGeo`, `mkGlass`, `balls`, `spots`. Rewrite only what reads `BINS`, `SOURCE`, `GATE_TAGS`, `HERO` |
| Camera | `cam` (`lead`, `rise`, `off`, `jars`, `ap`, `mix`), `hero`, `tG`, `t2`, `GP` | Keep: ride beside the `HERO` marble, wait at gate 1 for the clack, follow across gate 2, drop into its jar, open to the three jars and push in; `ap` is the aperture track |
| `update(t)` | | Keep: poses every marble from `run.pose`, places the coloured glints in `spots`, steps the counters and gates, then the camera |
| `sound(k)` | | Keep as written: every sound is a `run.ev` event (`release`, `queue`, `land`, `glass`, `clink`, `paddle`, `plate`) plus `run.ins` and gate switches; adjust only mixing (`lead`, `pan`) |

Keep `id: 'marble-run'` in the new style file.

Habits that make the look:
- Words are physical: engraved on brass plaques (`plaque`: `SOURCE` on the hopper, `GATE_TAGS` above the gates) and burnt into the plinth under each jar, in Oswald; no overlay text. The jar counters are two-wheel mechanical digits that turn as marbles land.
- Nothing is eased: speed comes from height lost (`G`, `KROLL`), gates snap on collision, jars fill as a small rigid-body pile; the result is how full each jar ends up.
- Marble colour is the category: coloured glass with a white vein (`mkGlass`), and each marble drops a glint of its own colour into its shadow (`spots`).
- Light: one warm sun from the upper left (`SUN`), a flag panel keeps the wall in soft shade so the maple stands out, brass and glass reflect a bright `K.env`.
- Camera: long lens, shallow focus (`ap` ~0.05 narrowing to 0.035), one continuous shot that rides beside the `HERO` marble, waits for each clack, then opens just far enough to hold all jars and pushes in.
- Sound: wood, brass and glass only, scored from the run's events; a quiet `room` bed, no music.
