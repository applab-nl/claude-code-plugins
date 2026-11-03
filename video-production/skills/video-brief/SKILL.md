---
name: video-brief
description: Use before building any launch video, feature drop, product walkthrough or social clip, and whenever someone says "make a video about X". Turns the request into a one-page brief (one line, audience, length, aspect ratios, beats with second marks, shown vs said) that gets approved before a single scene is written.
---

# Video brief

A video made from code is cheap to change and expensive to rethink. Every rejected cut we have
seen failed on story, not on pixels: the motion was fine and nobody could say what the video was
for. So the brief comes first, in words, and the person approves it before any HTML exists.

Write it to `BRIEF.md` in the video's folder (starter: `templates/BRIEF.md`). Keep it to one page.

## 1. The one line

- Write what the video says in one sentence of 12 words or fewer. "You can now ship a launch video
  the day the feature merges." Not "Introducing v2.4".
- A release with eight features is not one line. Pick the headline feature. The rest go in the
  changelog, not the video.
- Write the one thing the viewer remembers, in their words, not the brand's slogan.

## 2. Audience and channel

- Name the viewer by role and situation: "a RevOps lead scrolling LinkedIn between calls", not
  "B2B decision makers".
- Name every channel the cut goes to. Each channel decides size, length and safe zones:

| Channel | Size | Length | Notes |
|---|---|---|---|
| Website hero, YouTube, X landscape | 1920x1080 (16:9) | 20 to 60 s | sound often on |
| LinkedIn feed | 1080x1350 (4:5) | 8 to 30 s | takes the most screen in the feed; autoplays muted |
| Instagram feed, X square | 1080x1080 (1:1) | 8 to 30 s | muted |
| Reels, Shorts, TikTok, Stories | 1080x1920 (9:16) | 10 to 45 s | text only between y 170 and y 1330; keep 140 px clear on the right for the action rail |
| Inside a page or a product tour | match the container | 6 to 15 s loop | muted, loops, no audio dependency |

- Pick one master ratio and plan the others as recompositions, not crops. A 16:9 layout with two
  panels side by side becomes a vertical stack at 9:16. Say in the brief which scenes change layout.
- 30 fps unless the source footage is 24 or 60.

## 3. Length

- Length follows the beats, not a target. A feature drop is 15 to 30 s. A launch film 30 to 60 s.
  A walkthrough 20 to 45 s. A feed loop 6 to 10 s.
- Count frames: seconds x fps. Write it down. `8 s x 30 = 240 frames`.
- If the brief cannot fill the length with something new every 2 to 3 s, cut the length.

## 4. Beats with second marks

One row per beat. Every row has a start and end in seconds, what is shown, what is said or written
on screen, and the sound. A launch of about 30 s usually looks like this:

| Beat | Share | Job |
|---|---|---|
| Hook | 0 to 2 s | the result already working, or the problem in one picture |
| Tension | about 10% | the old way failing on screen |
| Reveal | 20 to 30% in | the product named, once |
| Proof | about 40% | the real task in the real UI as 3 to 5 verbs: pick, click, watch it build, ship |
| Payoff | 60 to 80% in | the output arrives; the biggest motion moment, used once |
| End card | last 2 to 3 s | the mark carried in, the call to action held at least 2 s |

A loop for a feed has no end card. It has a reset in the last 0.3 to 0.5 s that returns every
element to frame 0's state (see `hyperframes-scene`).

## 5. Shown vs said

Two columns, never the same words in both.

- **Shown** is the picture: the UI acting, a number counting, a card landing.
- **Said** is the voiceover or the on-screen line. If there is no voice, the on-screen line is
  the only "said".
- If a voiceover says "it books meetings", the screen shows the calendar filling. It does not
  print "it books meetings".
- Read the said column alone: a stranger gets the pitch. Watch the shown column alone: it tells
  the same story. If either half fails alone, rewrite that half.

## 6. The first second

- Frame 0 is the thumbnail on every platform and the hook in the feed. It is never black, never a
  logo alone, never an empty UI waiting to be typed into.
- Put the busiest, most legible moment at frame 0. For a loop, render it, then rotate it so frame
  0 lands mid-action (`render-and-export` has the ffmpeg command).
- The viewer decides in about 1 s. The change, the result or the question is on screen by 1.0 s.

## 7. Muted viewing

- Assume 80% of feed views are muted. The picture carries the hook with the sound off.
- Speech gets captions burned in (`captions-on-the-beat`). Music is a bonus, never the message.
- Test: watch the draft with sound off. If a beat only works with sound, add a picture to it.

## 8. Words on screen

- 6 words per line max, one line on screen at a time, no trailing period on titles.
- Hold a line 0.5 s plus 0.3 s per word. A 5 word line holds 2.0 s. The last line holds 2 s or more.
- Minimum size: 28 px on a 1080 short side for anything meant to be read; titles 5 to 9% of frame
  height. Too many words: cut words, never shrink type.
- Banned words on screen: "Introducing" as the first word, "seamless", "unlock", "revolutionize",
  "in seconds" (unless measured), "game changer".
- Every number on screen is real and sourced, or clearly a demo value (see
  `product-ui-recreation`).

## 9. Approval gate

- Show the brief and stop. The person approves the one line, the beats and the shown/said table,
  word by word if the video has a voiceover.
- A change to the story after footage exists costs a rebuild. A change to the brief costs a
  sentence. Get the "no" early.
- Once approved, the brief is the spec. When a review changes the video, update the brief first,
  then the scenes.

## What a good brief rules out

Write a `BANNED` line with the defaults this video must not fall into: a dark void with small UI
floating in the middle, everything fading in and sliding up, three feature cards in a row, a logo
docked in a corner, a title over a dimmed screenshot, glow and particles as decoration. Add to it
after every review.

Next step: `hyperframes-scene` to set up the project, `motion-system` for the motion language.
