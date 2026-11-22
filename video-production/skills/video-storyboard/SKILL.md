---
name: video-storyboard
description: Use after the video brief is approved and its storyboard is on, before any final scene is built. Builds a block-out of every scene, snapshots one key frame per beat into a contact sheet, looks at it, fixes what is wrong, then shows it with one line per frame and stops for approval. Skip only when the brief says `storyboard: off`.
---

# Video storyboard

The brief is words. The video is pictures. The gap between them is where rejected cuts come from: a
layout that cannot hold the text, a camera that hides the proof, a style that reads wrong. Close it with
one frame per beat, before the polished build, so a "no" costs a block-out and not a render.

Runs after `video-brief` approval when the brief has `STORYBOARD: on`. Export the guardrails from
`hyperframes-scene` first.

## 1. Block-out every scene

- **UI scenes:** the real layout with real copy and real UI states, placeholder motion (a plain fade or
  none). Layout is what is being approved, not easing.
- **Styled scenes:** the block-out `build` / `explainer` per `video-styles`. For 3D drafts add
  `build-scene.mjs --samples 8` so lighting and framing are cheap to iterate.
- Every beat in the brief gets a time at which its frame is shown (`at`). Pick the moment the beat's
  idea is most legible, not its first frame.

## 2. Take one key frame per beat

```bash
bunx hyperframes@0.8.228 snapshot --at 0,1.5,3.2,5.8,8.4
```

`--at` takes the beat times in seconds. Snapshot also writes a contact sheet; keep its path. 6 to 12
frames for a 30 s film. Frame 0 is always one of them.

## 3. Look first, fix first

Open the contact sheet with your own eyes (Read on the image) before anyone else sees it. Fix, then
re-snapshot, until none of these is true:

- text clipped, overlapping, or under 28 px on a 1080 short side
- a frame you have to explain ("those blobs are users")
- the subject off-center or hidden by the camera move, or a safe zone broken (9:16 text outside y 170 to 1330)
- two neighbouring frames that look the same (a beat with no change)
- a style that reads wrong for the one line (wrong mood, wrong era, noise in the hero shot)

Do not show a sheet you would reject.

## 4. Show it

Publish the contact sheet with the Artifact tool if it is available; else give the absolute path. Under
it, one line per frame:

```
3.2 s | "Pick a template" | the card lifts, the grid dims | slow push-in, 6% | click tick at 3.25
```

Fields, in order: time, on-screen text (or `none`), what changes, camera, sound. Then the list of
**assumed facts**: every number, name, logo, UI state and claim you filled in without a source, one per
line, so the person can correct them now.

## 5. Stop

END THE TURN. Ask for approval or changes in one line. Do not start the build, render or voiceover
while waiting. Changes to the story go into `BRIEF.md` first, then the block-out, then a new sheet.
Approval is recorded in the brief (`STORYBOARD APPROVED: <name, date>`).

## Ratios

Other channels (`video-brief` section 2) need their own storyboard only when the layout differs
substantially (two panels side by side becoming a vertical stack). Otherwise approve at the 16:9 master
and add one tall frame check: the busiest beat at 1080x1920, looked at once.

Next step: build with `hyperframes-scene` and `video-styles`.
