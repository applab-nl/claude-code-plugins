---
name: video-review
description: Use before any video made from code is shown to anyone or shipped, and again after every edit that changes timing or layout. The eyes-on gate: snapshot the beats and every cut, look at every frame, run the defect checklist, and write REVIEW.md.
---

# Video review

You wrote the timeline, so you know what is supposed to happen. The viewer sees it once, at full speed, on
a phone, often muted. Most defects in a video made from code are invisible in the source and obvious in
one frame. This gate is the frames. Nothing ships on "the check passed" or "the render finished".

Run it after `render-and-export` step 2 (contact sheets) and again on the rendered file.

## 1. Capture

```bash
npx hyperframes check --json                       # errors fixed, warnings weighed
npx hyperframes snapshot --review                  # every scene, every data-beat, a strip around every cut, phone sheet
npx hyperframes snapshot --range 3:5 --frames 8    # each hero move, frame by frame
scripts/frames.sh out/film.mp4 out/review 0 1.2 3.5 7.99   # the same moments from the RENDERED file
scripts/frames.sh out/loop.mp4 out/review-seam seam        # last frame next to frame 0
scripts/frames.sh out/film.mp4 out/review-cut cut 4.2      # -0.2 to +0.2 s around one cut
```

Capture at minimum: frame 0, every beat in the brief (`video-brief`), 0.1 s before and after every cut,
the middle of every scene, the last frame. For a 30 s film that is 30 to 60 frames. That is the job.

## 2. Look at every frame

Open each PNG and sheet with your own eyes (the Read tool on an image shows it to you). Describe each beat
frame in one sentence as a stranger would. If you have to explain an object ("those bars are agents"),
that is a defect. Snapshots and the rendered file can differ: the render is the truth.

## 3. The checklist

Go through the frames once per line. Each line names the cause we have actually shipped and the fix.

| Defect | What you see | Cause and fix |
|---|---|---|
| Text clipped or overlapping | a cut-off descender, a label under a card, two lines on top of each other | a fixed-height box or `overflow: hidden` on scaled text; two items placed at the same time. Size boxes from content, `overflow: visible` on type, stagger the entries. |
| Empty glyphs, emoji boxes | a hollow square where an icon or emoji should be | the headless browser has no emoji font and your web font did not load. Use inline SVG icons; self-host fonts with `@font-face` and wait for `document.fonts.ready`. |
| Doubled quote marks | ""Ship it"" | `<q>` adds its own quote marks. Use `<em>` or a `<span>` and type the quotes yourself. |
| Line that snaps instead of drawing | a path that is blank, then fully drawn, with no in-between frames | tweening the CSS `stroke-dashoffset` property does not survive frame capture. Set `pathLength="1"`, `stroke-dasharray="1"`, and tween the attribute: `tl.to(path, { attr: { "stroke-dashoffset": 0 } })`. |
| From-state flashes at frame 0 | an element visible at its end state, or at the wrong start, before its entrance | `fromTo` renders its from-state at build time (`immediateRender` defaults to true), and a later `fromTo` on the same element overwrites an earlier one. Set `immediateRender: false` on every `fromTo` after the first on an element, and look at frame 0. |
| Counter shows the final value at frame 0 | "1,284" before the count starts | the text was set at build time. Set the initial text to the start value and make the text a pure function of the tween value: `tl.to(o, { v: to, onUpdate: () => node.textContent = fmt(o.v) })`. |
| Moves that differ between preview and render | an element ends in a different place, or jumps | relative `"+="` values resolve from wherever the element is when the tween first runs, and the renderer seeks frames out of order. Use absolute values. Replace `Math.random()` with a seeded generator so every seek sees the same numbers. |
| Blank or black video panel | an empty rectangle where a clip should play | wrong path, wrong `data-media-start` past the clip's end, or an unsupported codec. Snapshot every scene with footage. |
| Loop seam jumps | the last frame and frame 0 do not flow | the end state does not equal the start state. Animate back to the opening values by the last frame, then check the `seam` sheet. |
| Weak thumbnail | frame 0 is empty, half-built or a fade from black | rotate the loop (`render-and-export`), or build frame 0 as a finished, busy frame. |
| Low contrast | grey on cream, white on a pale photo | body text needs 4.5:1, large type 3:1. Darken the accent for text (an ember used as fill may need a darker shade as text). |
| Unreadable on a phone | type that is a smudge on the 360 px sheet | anything meant to be read must survive 360 px wide. Make it bigger or cut it. |
| Line too short to read | a caption gone before you finish it | 0.3 s per word, 0.8 s minimum, headlines 1.6 s, the closing line 2 s (`captions-on-the-beat`). |
| AI footage tells | a prop that changes between shots, plastic skin, a robot | see the slop list in `ai-footage`. Reroll or cut the shot. |

Then the whole-film questions: do the beat frames alone, with the words covered, tell the story? Is there a
stretch of 3 s or more where nothing changes? Does anything pop on with no move? Is any default look on
screen that you did not choose (`motion-system`)?

Sound you cannot hear from a terminal. Measure it (`voice-and-music`: loudness, peaks, hits on the picture)
and say that it was measured, not heard.

## 4. Fix, then look again

Rank each defect: **P0** breaks the read (unreadable, wrong, broken, a tell in the hero shot), **P1**
weakens it (dead stretch, soft payoff, jumpy seam), **P2** polish. Fix every P0 and the P1s worth the time,
text first, then timing, then detail. Re-snapshot only what you changed and look at those frames. When a
fix does not hold, compare the frames either side of the problem and change only the line that causes it.

## 5. Write REVIEW.md

At the project root, short, one line per defect:

```markdown
# Review 2026-10-27, render out/film.mp4

| t | Where | Defect | Fix | Status |
|---|---|---|---|---|
| 0.00 | counter, W5 | showed 148 at frame 0 | start text "0", onUpdate formats the tween value | fixed |
| 2.40 | check mark | snapped drawn | attr: stroke-dashoffset with pathLength 1 | fixed |
| 7.97 | loop seam | brain graph jumps | animate lines back to dashoffset 1 by 7.6 s | fixed |

Kept on purpose: `line_unread` on signal rows (texture inside a 1.9 s panel; headlines hold 1.6 s).
Measured, not heard: master at -14.1 LUFS, -1.2 dBTP.
Weakest shot: 12 to 14 s, the stack collapse; with more time, slow it by 4 frames.
```

The next person reads REVIEW.md before changing anything.

## Done when

- Every frame in the capture list was opened and looked at, on the rendered file, not only the preview.
- No P0 is open. Every kept warning and every P1 left open is written down with its reason.
- REVIEW.md exists, and its short form is in your reply.
