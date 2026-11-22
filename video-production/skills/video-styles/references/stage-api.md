# STAGE kit API (assets/lib/stage.js)

Globals after the kit runs: `K` (helpers), `registerStyle(style)`, `STYLES`. Needs `window.THREE` (core only).
Read the kit source only when this sheet is not enough.

## The style object

```js
registerStyle({
  id, name, family, topic,          // id = the base style's id (assemble uses it to find a per-style kit)
  duration: 9,                      // seconds
  fonts: ['600 160px "Fredoka"'],   // CSS font specs; K.run awaits them; assemble turns them into a Google Fonts link
  render: { samples, shutter, tone, exposure, bloom, bloomThreshold, bloomRadius, vignette, grain, ca,
            saturation, contrast, lift, fov, near, far, background, shadows, shadowType, fps },  // copy from the reference
  storyboard: { samples: 16, beats: [{ at, start, end, text, change, camera, sound }], assumptions: [] },
  build(S) { /* make everything once */ return { update(t) { /* set everything for t */ }, overlay(ctx, t, W, H) {} }; },
  sound(k) { /* schedule the score; see sound-api.md */ },
});
```

`render` defaults: samples 32, shutter 0.5 (fraction of a frame), fps 30, tone `'filmic'` (also `'neutral'`, `'agx'`,
`'linear'`), bloom 0.25, bloomThreshold 1.0, vignette 0.25, grain 0.03, fov 35, background `'#000000'`.

## S (the stage, passed to build)

| Field | Meaning |
|---|---|
| `S.THREE`, `S.K` | the libraries |
| `S.scene`, `S.camera`, `S.renderer` | three.js objects (camera is a PerspectiveCamera with `render.fov`) |
| `S.W`, `S.H` | 1920, 1080 |
| `S.duration`, `S.samples`, `S.R` | resolved settings |
| `S.seek(t, n?)` | render the finished frame at t with n samples (default full) |
| `S.addFilter(fragBody, uniforms)` | full-screen pass on the graded 8-bit image; gets `tex`, `res`, `time`, `vUv` |

Every frame is the average of N sub-renders; each calls `update(t')` with t' spread across the shutter, jitters the
camera across the aperture (depth of field), moves soft lights across their surface and sky lights across the dome.
So **update(t) must set the entire scene from t alone**.

## Time and easing

| Helper | Use |
|---|---|
| `K.clamp(x, a=0, b=1)`, `K.lerp(a, b, t)`, `K.map(x, a, b, c, d)` | basics (map clamps) |
| `K.smooth(a, b, x)` | smoothstep of x through [a, b] |
| `K.seg(t, a, b, ease?)` | progress 0..1 of t through [a, b], optionally eased. The workhorse for schedules |
| `K.ease.*` | `linear in out inOut outQuint inOutQuint outExpo inExpo outBack inBack outElastic outBounce` |
| `K.spring(t, freq=2.2, damp=0.45)` | damped spring 0→1 from t=0 (pass `t - t0`) |
| `K.track([[t, v], [t, v, ease], ...])` | keyframes (numbers or arrays); the ease shapes the move into that key; stops at each key |
| `K.path([[t, v], ...])` | like track but flows through middle keys (Hermite). Use for camera moves |

## Random and noise (seeded; never Math.random)

`K.rng(seed)` → `r()` plus `r.range(lo, hi)`, `r.int(lo, hi)`, `r.pick(arr)`, `r.chance(p)`, `r.gauss()`, `r.sign()`.
Make it in build, consume it in build. Inside update use `K.hash(x, y, z)` (stable 0..1) or noise.
`K.noise(seed)` → `{ n2(x, y), n3(x, y, z), fbm(x, y, z, oct) }`. `K.halton(i, base)`.

## Geometry, text, textures

| Helper | Returns |
|---|---|
| `K.roundedBox(w, h, d, r=0.05, seg=6)` | BufferGeometry, centred, flat UVs per side |
| `K.roundedRect(w, h, r=0.05, seg=8)` | flat ShapeGeometry in XY facing +Z, UVs 0..1 |
| `K.tube(points, radius, { closed, segments, radial })` | TubeGeometry; `geo.userData.curve` to move along |
| `K.canvasTex(w, h, (ctx, w, h) => {...}, { repeat:[x,y], data })` | sRGB CanvasTexture; `tex.redraw(fn)` (build-time only) |
| `K.textPlane(text, { font, color, height, align, lineHeight, glow, lit, letterSpacing, pad })` | Mesh; `height` = world height of the font size; `userData.size` = [w, h] |
| `K.place(instancedMesh, i, pos, rot?, scale?)` | set instance i; then `mesh.instanceMatrix.needsUpdate = true` |

## Camera and lens

- `K.look(camera, pos, target, fov?, roll?)` — set every update.
- `K.focus(camera, distanceOrPoint, aperture?)` — focus distance (or world point) and aperture radius in world units.
  Aperture 0 = all sharp. Depth of field only shows when samples > 1.

## Light

| Helper | Notes |
|---|---|
| `K.env(S, { top, horizon, bottom, panels:[{pos, size, color, power, round, aimY}], intensity, blur, background, backgroundBlur, backgroundIntensity })` | code-built environment (no HDRI). Metal/glass need bright panels to reflect |
| `K.sun(S, { pos, target, color, power=3, size=8, soft, mapSize, far, bias, normalBias })` | directional light with shadow; `soft` = penumbra size (0.3–1.5) |
| `K.spot(S, { pos, target, color, power=80, angle, penumbra, soft, mapSize, near, far, decay })` | shadowed spot with real size |
| `K.skyLight(S, { color, power=1.5, size, center, mapSize, spread, dist })` | dome light with real occlusion: darkens creases and contacts |
| `K.mirrorFloor(S, { y, size, color, roughness, strength, fresnel, fade, metalness, material, resolution })` | real reflection that still takes light and shadow |

All return the three.js light/mesh; animate its `.intensity`, `.color`, `.position` inside update (set, don't add).

## Extra libraries

Some styles list more libraries in their card's `libs:` line; assemble loads them after the stage kit.
`text3d.js` adds `K.text3d(text, { font, size, depth, bevel, bevelSegments, align, lineHeight, letterSpacing })`
(one merged geometry), `K.text3dLetters(text, opts)` (one geometry per letter, origin at its centre, with `x, y`)
and `K.textShapes(text, opts)` (THREE.Shape outlines). The font must be in `style.fonts` so it is loaded first.
`strokefont.js` is a built-in single-line drawing font (no web font needed); read its header comment for the API.

## Overlay

`overlay(ctx, t, W, H)` (optional, returned from build) draws on a crisp 2D canvas composited after grading, grain
and filters: for small captions only. Most styles put words in the world (signs, cards, `K.textPlane`) instead.
