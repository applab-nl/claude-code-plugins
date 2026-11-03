---
name: captions-on-the-beat
description: Use when a video needs word-timed captions from a voice track, or when cuts, scene changes and pops should land on the music. Covers whisper word timestamps, caption grouping and hold rules, safe areas, and the beat grid b(n) = drop + n * beat.
---

# Captions on the beat

Two clocks drive a video made from code: the voice and the music. Captions follow the voice to the word.
Cuts and pops follow the music to the beat. Both are numbers you compute, never times you eyeball.
Build the scenes with `hyperframes-scene`; get the voice and the bed from `voice-and-music`.

## Muted first

Most feeds autoplay muted. Design every frame to work with the sound off: the captions and the pictures
carry the story, the sound adds to it. A caption is not a transcript dump. It is type that is part of
the design (`motion-system`).

## Word timestamps

Run whisper locally. It is free, offline, and good enough when you give it the script.

```bash
python scripts/words.py vo.wav captions.json --script script.txt           # openai-whisper, small.en
python scripts/words.py vo.wav captions.json --model medium.en             # speech over music
python scripts/words.py vo.wav captions.json --cpp models/ggml-small.en.bin   # whisper.cpp
```

- Transcribe the clean VO stem, never the mix. If you only have the mix, use `medium.en`.
- Pass the script as the prompt. It fixes product names and spelling, which is most of the errors.
- For dialogue cut from many clips, transcribe each line's stretch of the render on its own, padded
  0.25 s each side, with that line as the prompt. Then subtract the pad.
- Match whisper's words to your caption words in order, by normalized text, taking the first match
  for each. If the count does not match, fall back to even spacing for that line and flag it.
- Whisper invents "Thank you." over silence and repeats lines over a silent tail. Read every group
  before you use it. Drop tokens with no letters or digits.
- `.en` models are English only. For other languages use `small` or `medium` and pass the language.
- Re-run after every VO change. A time from a replaced read is wrong by definition.

## Groups and holds

| Rule | Number |
|---|---|
| Words per group | 2 to 3 for hype, 3 to 5 conversational. Never 1 alone unless it is the punch. |
| Break a group at | a sentence end, a pause of 0.15 s or more, or the word limit |
| Groups on screen | one at a time |
| Group opens | at its first word's start (0.0 to 0.05 s early is fine) |
| Each word pops | on its own start: opacity 0 to 1 with a scale from 0.9, 0.10 to 0.15 s, ease `back.out(2)` |
| Group holds | until the next group starts; across a pause over 0.6 s, end 0.3 s after its last word |
| Shortest line | 0.3 s per word, never under 0.8 s on screen |
| Headlines | 1.6 s or more |
| Closing line | at least 2 s |
| First caption | never at exactly 0 s: start 0.1 to 0.3 s in, or it looks like it was already there |

`scripts/words.py` applies the grouping and hold rules and writes `groups` with each word's start.
Build the caption timeline from that JSON, every value a function of the data:

```js
groups.forEach((g, i) => {
  g.words.forEach((w, k) => tl.fromTo(`#g${i} .w${k}`, { opacity: 0, scale: 0.9 },
    { opacity: 1, scale: 1, duration: 0.12, ease: "back.out(2)", immediateRender: false }, w.start));
  tl.set(`#g${i}`, { opacity: 1 }, g.start);
  tl.set(`#g${i}`, { opacity: 0, visibility: "hidden" }, g.end);   // hard kill, no stale group
});
```

Every group gets that hard kill at its end. Fade the group or its words, never both: the opacities multiply.

## Safe areas and size

- 16:9 at 1920x1080: caption baseline 80 to 120 px above the bottom, 44 to 56 px type, inside the
  central 80% of the width.
- 9:16 at 1080x1920: keep text out of the top 250 px, the bottom 420 px and the right 140 px (platform
  buttons and the description). Captions sit around y = 1150 to 1450.
- 4:5 at 1080x1350 and 1:1: 120 px clear at the bottom, 60 px at the sides.
- Never over a face. Over footage, a scrim sized to the text (about 60% black, 10 px radius), never a
  full-width bar.
- Check at phone size. A word that is not readable 360 px wide is too small (`video-review`).
- Use a full-width container with centered text. `left: 50%; transform: translateX(-50%)` clips at the edges.

## The beat grid

1. **Find the drop.** `python scripts/beats.py drop music.mp3` lists the biggest jumps in low-end energy.
   Confirm the one you want by ear, or with `npx hyperframes beats` if the track has a steady beat.
2. **Get the beat length.** beat = 60 / BPM. If you generated the music, you prompted the BPM; verify it
   against two drops or two bar starts. 124 BPM gives 0.48387 s; a measured 0.48375 s is 124.03 BPM.
   Use the measured value, to 5 decimals. Calling that track 124 drifts 10 ms after about 80 beats,
   and a cut 2 frames off the beat reads as late.
3. **Place the drop.** Choose where the drop lands in the film (on the product name, the reveal). Start
   the music clip at media offset `drop_media - drop_film`. A drop at 38.74 s in the file landing at
   1.20 s in the film means the clip starts at 37.54 s.
4. **Put every scene boundary on the grid:** b(n) = drop_film + n * beat.
   `python scripts/beats.py grid --bpm 124.03 --drop-media 38.74 --drop-film 1.20 --to 27` prints it;
   `beats.py snap ... 4.1 6.95` moves your rough times to the nearest beat and shows the error.
5. **Pops, counters landing, badges and slams go on beats too.** Big moves on bar lines (every 4 beats).
6. **To extend the bed, repeat whole bars** (4 bars = 16 beats) starting on a bar line, so the grid holds.

When voice and beat disagree, the voice wins for the word that says the thing. Snap the cut if the nearest
beat is within 80 ms of the word. Otherwise keep the word, and land the next cut on the grid.

## Done when

- Every caption word appears on its own start, from a whisper run on the final VO.
- No group is on screen under 0.8 s, the closing line holds 2 s, and nothing sits in a platform UI zone.
- Every cut and pop is on b(n), and the snap error on each is under one frame (33 ms at 30 fps).
