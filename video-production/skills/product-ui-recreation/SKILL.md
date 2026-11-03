---
name: product-ui-recreation
description: Use when a video needs product screens (dashboards, charts, feeds, chat threads, calendars, phone notifications, terminals) and you are tempted to drop in a screenshot or screen recording. Rebuild the surface in HTML so every number, row and pixel can move on the timeline.
---

# Product UI rebuilt in code

A screenshot is one frame. It can be zoomed and panned, nothing more. A surface rebuilt in HTML
can count, scroll, fill, react and reset, all on the same timeline as the music. It also renders
sharp at any size, and the copy can be edited in a minute.

Helpers: `templates/stage-kit.js` (fit, counter, line draw, feed scroll).

## Build at 2x, scale into a window

- Build each surface on a "full screen" stage at roughly 2x the size it will occupy on the
  frame. A window that is 620x290 px on screen gets a 1240x580 stage. Type at 26 to 34 px inside
  the stage lands at 13 to 17 px on screen, which looks like real UI at real density.
- Scale the stage into its window with one script-set transform, `transform-origin: 0 0`:
  - **contain:** `k = min(bw / W, bh / H)`. The whole UI shows. Use for dashboards, threads,
    calendars.
  - **cover:** `k = max(bw / W, bh / H)`. Fills the window, crops the edges. Use for full-bleed
    kinetic panels and walkthroughs where the camera zooms anyway.
  - Center it: `translate((bw - W*k)/2, (bh - H*k)/2) scale(k)`.
- Copy the stage's background onto the window body so contain letterboxing is invisible.
- The script owns the stage transform. GSAP animates a child camera inside the stage, never the
  stage itself, or the fit scale is overwritten.
- Text a viewer must read is at least 28 px after all scaling on a 1080 short side. UI texture
  (feed rows, labels) can go smaller; it reads as density, not as words.
- `font-variant-numeric: tabular-nums` on every number that changes, so digits do not shift width.

## Surfaces that work, with the numbers

**Dashboard with counting KPIs.** Four tiles, each counting from a plausible start to its end
over 2.4 s `power2.out`, staggered 0.1 s. Format inside `onUpdate`: `"$" + Math.round(v) + "k"`,
`v.toFixed(1) + "%"`. A green delta pill (`+18%`) sits static in the corner of each tile.

**Chart line draw.** Two ways, both tween an SVG attribute:
- clip rect: wrap the line and its gradient area in `clip-path`, tween the rect's
  `attr: { width }` from 0 to full over 2.2 s `power2.inOut`. Line and area reveal together.
- stroke: `pathLength="1"`, `stroke-dasharray="1"`, tween `attr: { "stroke-dashoffset": 0 }`.
Never tween the CSS `strokeDashoffset` property; in frame capture it snapped to fully drawn.
After the draw, a hover dot plus tooltip hops between points every 0.85 s, 0.5 s `power3.inOut`.

**Live feed scrolling.** A column of 50 px rows (logo, event, "now") inside an `overflow: hidden`
box. Move the column up one row every 1.05 s, 0.45 s `back.out(1.4)`. The row that just entered
flashes a 16% tint and fades over 0.9 s. Build 4 to 6 more rows than fit, so it never runs dry.

**Terminal or agent log.** One line every 0.27 s, each fading in from `x: -14` in 0.18 s. When
`(i + 1) * lineHeight > viewHeight`, scroll the column up by the overflow. Use three line kinds:
prompt, tool call (green dot plus muted path), diff (tinted background, colored tokens). A progress
bar and an `N/600` counter run together on `power1.inOut`.

**Slack-style thread.** Sidebar in the workspace color, channel header, messages 44 px avatars.
A new message every 0.95 s from `y: 30, opacity: 0`, `back.out(1.6)`. Measure each message's
`offsetHeight` once at build time; when the running total passes the view height, scroll the
column. Reaction pills count up (1 to 24 over about 5 s `power1.out`) and pop `scale: 1.15` on
0.12 s legs. A typing indicator: three 7 px dots bouncing 5 px, 0.12 s apart. The unread badge in
the sidebar counts too.

**Calendar filling.** A 5 day by 8 hour grid: 136 px columns, 52 px rows. Events pop from
`scale: 0.2, y: -20, opacity: 0` with `back.out(2.2)` in 0.42 s, one every 0.4 s, in a scattered
order (not row by row). A "N booked" pill in the header counts in step with the pops on
`ease: "none"`.

**Phone lock screen.** A 300x600 phone, 48 px corner radius, screen inset 10 px, a dynamic island.
Notifications (72 px tall, 92% white) drop in at the top every 0.85 s from `y: -90`, `back.out(1.7)`,
0.45 s. Each one already on screen moves down 80 px at the same moment. The island stretches
`scaleX: 1.5` for 0.18 s just before each lands. The phone sways in 3D (see `motion-system`).

**Bar race.** Bars from `scaleX: 0.02` to their value, `expo.out` 1.0 s, staggered 0.1. At the
midpoint, new values on `power3.inOut` 0.8 s, and two rows swap places by moving `y` one row.

## Real things vs demo things

- **Vendor logos:** only from the vendor's official brand or press kit (SVG or PNG), unaltered,
  at their own colors. Never redraw a logo from memory, never use a colored square as an app icon.
  Store them in `assets/logos/`. Check each brand's guidelines for use in marketing.
- **People:** fictional names ("Maya Chen", "Leo Park") with generated or properly licensed
  avatars. Never a real person's photo or name without their written yes.
- **Companies:** fictional ("Acme", "Halcyon", "Northwind", "Fern Labs"). Never a real customer
  or prospect, even blurred.
- **Numbers:** plausible and clearly demo. Round-ish, internally consistent (a $412k pipeline does
  not come from 3 meetings). Never present a demo number as a real result. If the video claims a
  real metric, it comes from a source you can name in the brief.
- **Your own product:** match today's labels, colors and layout from the live app or its code. One
  invented button loses every viewer who uses the product.

## Reset for loops

A loop resets every changed thing in the last 0.3 to 0.4 s: counters run back to their start on
`ease: "none"`, scrolled columns return to `y: 0`, added messages fade out, toggles flip back. Frame
0 and the last frame must match (snapshot both and compare).

## Gotchas

- `<q>` adds its own quote marks. Use plain text or `<em>` for inline code and quotes.
- Emoji render with the render box's system emoji font. Snapshot to check, or use an SVG.
- Layout checks flag stacked panels and rows hidden until they enter. Expected; mark the wrapper
  with the narrowest opt-out (`data-layout-allow-overlap` on that block) rather than ignoring all
  warnings.
- Never measure layout in `onUpdate`. Measure once while building, store it, then tween.
