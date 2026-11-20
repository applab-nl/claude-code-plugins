---
id: node-network
name: Node Network
family: Diagrams with depth
use: explainer
fonts: Oswald, Fraunces
reference_topic: How word of mouth grows a small business: 1 happy customer, then 3, 9, 27
duration: 8
samples: 48
libs: 
---

# Node Network

**Look:** A physical model of a network mounted on a painted wall: glazed porcelain tokens in brass rings, joined by thin brass rods, like a museum's molecular model. Each token is two-sided and turns over to its coloured enamel face when the news reaches it.

**Motion:** It is constructed link by link: a rod extends from a token carrying an empty ring, a blank token drops into the ring with a click, a bead of light slides along the rod and the token spins over to its coloured side. Each ring of the model goes faster than the last, and a number plaque clicks on when a ring is complete.

**Light:** One warm, soft gallery spot from above, so every rod and token throws a soft shadow down the wall, longer the further it stands off. The pool of light opens as the model grows and always falls off to the corners.

**Materials:** Ivory glazed porcelain, one enamel colour (cobalt), polished brass, enamel number plaques, and a terracotta plaster wall with a hand-painted title.

**Camera:** Long lens. Starts close on the first token with the wall out of focus, then one continuous pull-back that keeps pace with the growing model while drifting from left to right. It ends with the finished model filling the frame edge to edge and keeps drifting slowly through the hold.

**Finish:** Real depth of field and motion blur, neutral tone mapping to keep the enamel colour true, light vignette, very fine grain.

**Good for:** Anything that is things and the connections between them: spread, referrals, teams, systems, flows. Nodes sit in oval rings around a centre, sized so the finished model fills a 16:9 frame; links are rods, a pulse travelling along a link is the story, and a number plaque per ring carries the count.

## Working with the reference

`reference.js` splits into parts. Treat them differently:

| Part | Starts at | What to do |
|---|---|---|
| Content block | `// ---- content` | Replace: `TITLE`, `GROUPS` (one enamel colour; more only if the story needs them), `NODES` (`id`, `off` icon, `on` icon or `label`, `group`; first node is the centre) and `LINKS` (`[a, b]` pairs). The generating loop for 1, 3, 9, 27 is topic content |
| Layout kit | `RING`, `AIR`, `TEMPO`, `ring()`, `along()`, `layout()` | **Copy unchanged** (tune `RING` radii only if the graph has more or fewer than 4 rings, and `TEMPO` per ring). `layout()` does breadth-first rings, leaf spacing from `AIR`, parents centred over children, and cross-links (thin rod, no pulse) |
| Schedule | `schedule()` | Keep the shape: per node `rod0/rod1`, `land`, `pulse0/pulse1`, `flip`, then the `g.tally` plaques (one per ring, count as text). Change the tally text and the ring count if the story differs; `sound(k)` calls the same `schedule()` |
| Icons | `ICONS` (`person`, `smile`, `heart`, `check`, `dot`) | Copy; add icons in the same -1..1 box if the topic needs them |
| Builders in `build` | `glaze`, `porcelain`, `brass`, `beadMat`, `add`, `face()`, `coin()`, `coinFor`, `rodGeo`, `ballGeo`, `makeRod()` | **Copy unchanged**: porcelain coin with domed faces, canvas face per (icon, label, colour), unit rod that grows from its base |
| Node loop and plaques | `for (const n of g.order)` brass ring + token; rod/bead loop; `g.cross` loop; the yoke on `root`; `g.tally.forEach` plaques and rail | Copy unchanged |
| `registerStyle` metadata + `render` | | Keep `render` (`shutter: 0.5`, `fov: 26`, `background: '#7c4230'`); change `topic`, `duration` |
| `build(S)` rig / `sound(k)` | | Rewrite around the same rig: `K.env` with the four panels, the `key` spot (`K.spot`, `soft: 1.0`), the plaster `wall` (`tooth` bump, per-vertex tint) and painted `title`, the `cam` paths (`pos`, `aim`, `ap`, `pool`) with the last key after the clip end, `wobble()`, `knock`, and `update(t)` (`wall.material.bumpScale`, `key.angle = cam.pool(t)`, `K.look` + `K.focus`). Retime the camera keys to the new node timings |

No libs (`libs:` is empty), so nothing extra to load. Keep `id: 'node-network'`.

Habits that make the look:
- Fonts: `Oswald` for tally numbers and token labels (`label` instead of an icon), `Fraunces` for the title painted on the wall (`paintText`, it takes light and shadow like the wall). No overlay text.
- Build link by link: rod extends carrying an empty ring (`n.rod`, `n.ring`), blank token drops in from the camera side and clicks (`fly`), bead slides on the rod, token flips with `K.spring` and overshoots. Each ring is quicker than the last (`TEMPO`).
- Counts are enamel plaques on a brass rail in the widest gap on the right, landing just after their ring's last flip; the last one is bigger and triggers a `knock` that ripples through the tokens.
- One warm gallery spot with real size (`soft`), shadows lengthen with each ring's `z`; `key.angle` opens with the model so the wall always falls off at the corners. One enamel colour keeps it true (neutral tone).
- Long lens, shallow focus (`cam.ap` aperture 0.11 falling to 0.07): start close on the centre token, one continuous pull-back that drifts left to right and ends with the model filling the frame, still drifting through the hold.
- Sound: brass slide noise per rod, click and tock when the token seats, a pentatonic `ding` on each flip (only every fifth on the crowded outer ring), `success` and `thud` on the last plaque.
