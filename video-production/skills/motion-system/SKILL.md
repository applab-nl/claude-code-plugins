---
name: motion-system
description: Use when choosing eases, durations, staggers, kinetic type, 3D camera moves or idle motion for a video made in code (HyperFrames, GSAP, Remotion), and when a draft "looks generated", "feels like slides" or "is too static". The motion language with numbers, plus the defaults that are banned.
---

# Motion system

Generated video looks generated because every element gets the same move: fade in, slide up 20 px,
`power2.out`, 0.5 s. A motion system fixes that by giving each job its own ease, its own duration
and its own stagger, and by making sure something is always moving with intent.

Numbers below are for 30 fps. One frame is 0.033 s.

## Eases by purpose

| Job | Ease | Duration | Why |
|---|---|---|---|
| Slam (a word, a panel, a color block lands) | `expo.out` | 0.30 to 0.42 s | arrives at full speed, long soft tail |
| Camera move (pan, push, tilt, zoom to a control) | `power3.inOut` | 0.6 to 0.8 s | a body with weight starts and stops |
| Pop (a card, badge, calendar event, toast) | `back.out(1.6)` to `back.out(2.2)` | 0.35 to 0.5 s | one small overshoot, then settle |
| Scroll a feed or thread by one row | `back.out(1.4)` | 0.45 s | the list lands with a tick |
| Idle drift, float, camera sway | `sine.inOut` | 1.0 to 4.0 s per leg | no start or stop you can see |
| Exit, zoom through, collapse into a point | `power3.in` | 0.25 to 0.55 s | accelerates away |
| Counters | `power2.out` for totals, `expo.out` for a hero number | 1.0 to 2.6 s | fast early, readable at the end |
| Progress, rotation, tickers | `none` | the whole span | constant speed is the point |

Rules:
- Exits run 40 to 50% shorter than entrances.
- Overshoot (`back`) on position and scale only. Opacity and color never overshoot.
- Never use one ease for everything. If a scene has more than 3 tweens on the same ease and
  duration, change two of them.

## Stagger values

- Letters: 0.03 to 0.04 s (about 1 frame).
- Words: 0.06 to 0.12 s.
- List rows, cards, KPI tiles: 0.08 to 0.12 s.
- Grid of 12+ items collapsing: 0.03 to 0.035 s, so the whole wall moves inside 0.5 s.
- Overlap: start the next element when the previous is 30 to 50% through its move. Fully
  sequential reads robotic, all at once reads cheap.

## Kinetic type

The words are the picture. Each one is built per letter (`<span>` per character inside an
`overflow: hidden` mask) so it can enter by letter.

- **Letter mask rise:** letters from `yPercent: 110, rotation: 8` to `0, 0`, `back.out(1.6)`, 0.42 s,
  stagger 0.035. The mask hides them until they rise.
- **Slam:** the whole word from `scale: 1.7` to `1`, 0.3 s `expo.out`. Per letter variant: from
  `scale: 2.6, opacity: 0`, stagger 0.03.
- **Flip up:** letters from `rotationX: -90` with `transformOrigin: "50% 100%"`, `power3.out`, 0.4 s,
  stagger 0.04.
- **Color-block wipes:** each word sits on its own full-bleed color panel. The next panel enters
  from `xPercent` or `yPercent` 100, cycling right, bottom, left, top, so no two wipes in a row
  come from the same side. 0.32 s `expo.out`.
- Rotate the three letter entrances (`i % 3`) so no two consecutive words enter the same way.
- One beat per word. 8 words in 8 s is 1 s a word. A word under 1 s may drift `scale` 0.92 to
  1.08 linear across its beat so the panel never freezes. A line meant to be read holds still.
- Mix one serif italic word in for every 3 or 4 heavy sans words. Size by length: under 6
  characters at about 15% of frame height, longer words at 10 to 11%.
- Texture inside the panel moves on `ease: "none"`: a ring rotating 90 degrees per beat, a stripe
  sliding 120 px, a ticker crossing the bottom at constant speed with `mix-blend-mode: difference`.

## 3D camera on product UI

- Parent gets `perspective: 1600px` to `1700px`. The camera element gets `transform-style:
  preserve-3d`; so does any child that lifts.
- Sway: `rotationX` 24 to 8, `rotationY` -20 to 12, `z` -60 to 20 over 4 s `sine.inOut`, then the same
  path back over 4 s. An 8 s loop closes on itself because the camera ends where it began. For a
  phone: `rotationY` -14 to 12, `rotationX` 6 to -4, `yoyo: true, repeat: 1`.
- Keep tilt under 25 degrees on any axis. Past that, text at the far edge stops reading.
- **Lift-off:** a card rises off the surface with `z: 80, y: -10` and a deeper shadow
  (`0 30px 50px rgba(40,30,80,0.24)`), 0.6 s `power3.out`, stagger 0.12. It settles back with
  `power3.inOut`. Lift 2 to 4 things, not the whole screen.

## Idle motion: nothing is ever static

Every frame has at least one thing moving with a reason. Static is how a video reads as a slide.

- UI acts: a feed scrolls a row every 1.05 s, a hover dot hops between chart points every 0.85 s,
  a counter creeps (148 to 151 over 1.2 s after landing), a typing indicator bounces 5 px.
- Background moves slowly: camera sway, a ring rotating, a ticker. Under 5 degrees per second.
- Pulses for live things only: a badge scales 1.0 to 1.12 on `sine.inOut`, 0.2 to 0.5 s legs.
- Idle repeats are finite and sum to the scene: a 1.0 s leg with `yoyo: true, repeat: 1` is 2 s.
  Never `repeat: -1` (see `hyperframes-scene`).
- A landed headline does not breathe or float. Motion moves to the next element or the camera.

## Beat grid sync

- Beat length = 60 / BPM. At 124 BPM a beat is 0.48375 s.
- Compute each beat from its index: `b(n) = offset + n * 60 / BPM`, where offset is the time the
  first downbeat (or the drop) hits in the video. Never add a rounded beat repeatedly; it drifts
  about a frame every 16 beats.
- Cuts and slams land on beats. Layout changes land on bars (every 4 beats). Pops land on beats or
  half beats.
- Start the music file at a media offset so the drop lands on the reveal: if the drop sits at
  38.74 s in the track and the name lands at 1.20 s in the video, trim to start at 37.54 s.
- Every big move gets a sound on the same frame (`voice-and-music`): a slam gets a hit, a pop a
  click, a whip a whoosh.

## Transitions with a cause

Use 3 to 5 kinds in one video, each caused by something on screen:
- the clicked button grows past the frame and its fill becomes the next scene;
- a color panel wipes over the last one (kinetic type);
- a wall of cards collapses into one core (`power3.in`, 0.55 s), the core pops (`back.out(2.2)`),
  two burst rings scale 0.6 to 3.6 and fade, then the cards fly back out on `expo.out`;
- a whip: 0.15 to 0.3 s horizontal move, the arriving element lands and sharpens.
Hard cuts belong on the beat. Never crossfade two worlds into each other.

## Banned defaults

- Generic fade-in plus slide-up on every element.
- Everything on the same ease and the same 0.5 s.
- A centered wall of logo tiles that just sits there. Logos either work (cards that collapse into
  the engine, rows in a live feed) or they are cut.
- Three feature cards in a row.
- Glow, lens flare, floating particles as decoration.
- A small UI window in the middle of a dark empty frame.
- Titles that keep sliding or scaling after they land.
- Bounce on opacity or color.
- The same transition between every scene.

After every review, name the defaults the draft fell into and add them to the brief's BANNED line.
