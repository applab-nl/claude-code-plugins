---
name: render-and-export
description: Use when a HyperFrames video is ready to render, or needs delivery files: the check gate, contact sheets, the final render, cuts per channel (16:9, 9:16, 1:1, 4:5), loop rotation for the thumbnail, MP4 and GIF exports, and batch renders of personalized versions.
---

# Render and export

The render is the cheap part. What goes wrong is everything around it: a warning nobody read, a loop whose
first frame is empty, a GIF that plays 11% fast, a vertical cut that is a crop of the wide one. Run this
after `hyperframes-scene` builds the scenes and before `video-review` signs off on the file.

## Pin the version

HyperFrames ships releases daily. Pin it for the whole project and write the version in the project's
README or CLAUDE.md: `npx --yes hyperframes@<version> ...`. A render made with a different version is a
different render.

## 1. The check gate

```bash
npx hyperframes check --json > out/check.json
```

- Fix every error. An error is a defect until a snapshot proves otherwise. If a layering is intentional
  (stacked kinetic panels, items hidden until shown), mark it with the matching `data-layout-allow-*`
  attribute and say why in the README.
- Weigh every warning. Each is a question: fix it, or keep it and write down why. Common ones:
  `line_unread` (text on screen too short to read), `dead_stretch` (3 s with nothing changing),
  `first_frame_empty` (a blank thumbnail), `nested_structure_needs_subcomposition`.
- A warning you keep on purpose goes in the README's "Known" list, so the next person does not fix it back.

## 2. Contact sheets before the render

```bash
npx hyperframes snapshot --review          # beat sheet, a strip around every cut, the phone-width sheet
npx hyperframes snapshot --range 3:5 --frames 8   # the hero move, frame by frame
```

Open every sheet and look. A clipped label looks fine in your head and wrong on the sheet. The full
checklist lives in `video-review`.

## 3. Render

```bash
npx hyperframes render --quality draft --output out/draft.mp4       # while iterating
npx hyperframes render --quality delivery --output out/film.mp4     # the master
```

- Frame rate: `--fps 24` when the film carries AI footage (the models generate at 24), 30 for pure motion
  design. 60 doubles the render time; use it only for fast UI scrolling.
- After every render: the file is non-empty and its duration matches the root `data-duration`
  (`scripts/export.sh info out/film.mp4`). Then look at decoded frames, not only the preview.
- Renders go to `out/`, and `out/` is gitignored. Never commit a render.

## 4. One layout per channel

| Channel | Size | Notes |
|---|---|---|
| YouTube, website hero, X landscape | 1920x1080, 16:9 | the master |
| Reels, Shorts, TikTok | 1080x1920, 9:16 | its own layout, not a crop |
| LinkedIn feed | 1080x1350, 4:5 | takes the most feed height on a phone |
| Square posts, ads | 1080x1080, 1:1 | |

A vertical cut is a re-layout: type re-sized, UI re-stacked, captions moved above the platform UI zone
(`captions-on-the-beat`). Build each size as its own root composition that shares the scenes, and render
each one. Cropping the 16:9 master loses the edges and leaves the type too small.

## 5. Loops: frame 0 is the thumbnail

Feeds show frame 0 before anyone presses play. A loop that opens on an empty frame looks broken. Render
the loop, then rotate it so it starts at its busiest moment:

```bash
scripts/export.sh rotate out/loop-raw.mp4 3.5 out/loop.mp4   # trim + concat, the seam moves to 3.5 s
```

The loop must already close cleanly (the last frame flows into the first) before you rotate it. The old seam
becomes a cut in the middle, so check it on the strip.

## 6. Exports

```bash
scripts/export.sh mp4 out/film.mp4 out/film-web.mp4    # H.264 crf 16, yuv420p, +faststart
scripts/export.sh gif out/loop.mp4 out/loop.gif 720 25 # GIF for docs, READMEs, email
scripts/export.sh poster out/loop.mp4 3.5 out/cover.jpg
```

- **MP4:** H.264, `crf 16`, `yuv420p` (anything else breaks playback in some browsers and phones),
  `-movflags +faststart` so it plays before it finishes downloading. AAC 256k at 48 kHz.
- **GIF:** `palettegen=stats_mode=diff` builds the palette from what moves, `paletteuse=dither=sierra2_4a`
  keeps gradients smooth. Use 25 fps. GIF delays are whole centiseconds: 25 fps is exactly 4 cs, while 30 fps
  rounds to 3 cs and plays 11% fast. 10, 20, 25 and 50 fps are the clean rates.
- Master the audio once, after the last picture change (`voice-and-music`).

**Sizes to expect** (measured on our renders, motion-heavy content):

| File | Size |
|---|---|
| 8 s loop, 1080x1350, 30 fps, MP4 crf 16 | about 2.4 MB |
| the same as GIF, 720 wide, 25 fps | about 21 MB |
| the same as GIF, 1080 wide, 25 fps | about 36 MB |
| 27 s motion design, 1920x1080, MP4 | about 7.5 MB |
| 73 s film with AI footage, 1920x1080, MP4 delivery | about 66 MB |

A GIF runs 9 to 15 times the MP4. Where an MP4 can autoplay muted, ship the MP4.

## 7. Batch renders for personalized versions

One composition, one row of variables per version ("Here's what we made for {company}"):

1. Declare the variables on the `<html>` root with `data-composition-variables` (id, type, default) and
   read them in scripts with `window.__hyperframes.getVariables()`.
2. Write `rows.json`: `[{"company": "Acme", "brand": "#2B59C3", "logo": "assets/leads/acme.png"}, ...]`.
3. Render:

```bash
npx hyperframes render --batch rows.json --quality delivery --strict-variables --output "out/{company}.mp4"
```

- `--batch` sets only the root composition's variables. A sub-composition does not see them unless you pass
  them on through `data-variable-values`. Simplest: keep every personalized beat in the root.
- `--strict-variables` aborts before any render if a row has a wrong or unknown key.
- It writes `manifest.json`: done means no failed rows and every output non-empty with the right duration.
- Design for the longest value: a 20-character company name must fit. Size the type from the string length.
- About 20 s per 27 s version on a recent laptop. Keep `--batch-concurrency` at 1 or 2; each render
  already uses several workers.

## Done when

- `check` shows no errors, and every kept warning is written down.
- Every channel's file exists, matches its duration and size, and passed `video-review`.
- The loop's frame 0 is a busy, readable frame. The GIF is at 25 fps.
