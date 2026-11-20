---
name: explainer
description: Make an animated explainer video in one of 86 visual styles from the AI Style Atlas (flat-vector science, watercolor, whiteboard, film noir, papercraft, Manim-style math, pixel art, halftone pop and more) as a single self-contained HTML canvas animation with synthesized sound, optionally timed to a voiceover and rendered to MP4. Use when someone asks for an "animated explainer", "explainer video", "explain X as an animation", names one of the Atlas styles, or pastes a Style Atlas prompt. Not for product walkthroughs or launch videos with real UI (use video-production for those).
---

# Explainer

Each style comes with a complete reference animation in that style (`assets/styles/<styleId>.js`),
a shared drawing library (`assets/lib/harness.js`, the `H` helpers) and a synthesized sound kit
(`assets/lib/sound.js`, `SOUND`). You rebuild the reference around the user's content: same
medium, new story. `scripts/prompt.py` prints the build brief for the chosen style and options,
word for word as the Style Atlas gives it. **That brief is the spec. Follow it exactly.** This file
only covers what happens around it.

Paths below are relative to this skill's directory. Put output in `explainers/<topic-slug>/`
under the current working directory unless the user says otherwise.

## 1. Pick the style

- Named style ("watercolor", "Film Noir", `flat-space`): match it against
  `python3 scripts/prompt.py --list` (styleId, name, family). If several match or none do, show
  the closest few and ask.
- A description instead ("something hand-made and warm", "retro computer"): read
  `references/catalog.md` and suggest **three** styles, each with its name, family and one-line
  look. Let the user choose.
- Pasted Style Atlas prompt: the style name is in its first line. Use the bundled files, not the
  paste.

## 2. Collect the content and options

Ask for whatever is missing, in one message:
- **Content:** the topic, or a script. This replaces the brief's `MY CONTENT` placeholder.
- **Storyboard first** (default **on**): a still storyboard approved before building.
- **Voiceover** (default **off**). When on, the user gives SRT or word-level timestamps
  (`MY VOICEOVER TIMING`). If they attach audio but no timing, transcribe it with word-level
  timestamps when a tool is available (e.g. `whisper` / `whisper.cpp` if installed); otherwise ask
  for the timing.

Don't ask about anything the brief already settles (length, size, controls, sound mix).

## 3. Load the brief and the style

```bash
python3 scripts/prompt.py <styleId> [--voiceover] [--no-storyboard]
```

Then read, in full: `assets/styles/<styleId>.js` (its header comment is the style card; the rest
is the reference source), `assets/lib/harness.js` and `assets/lib/sound.js`. You need all three
to write code against `H` and `SOUND`.

How the brief maps onto these files:
- "the H helper library and the SOUND kit below" → `assets/lib/harness.js` and
  `assets/lib/sound.js`.
- "the reference" / "REFERENCE STYLE SOURCE" → `assets/styles/<styleId>.js`.
- "Include … unchanged": **never retype the libraries.** Put the marker lines
  `<!-- @lib harness -->` and `<!-- @lib sound -->` where they belong (before your own script) and
  run `python3 scripts/inline_libs.py <file.html>`. That copies them in byte for byte, then checks
  that `window.seek`, `window.DURATION`, `window.scoreSound`, `explainer()` and `SOUND.live` are
  present and that nothing uses `Math.random`. Fix anything it reports.
- "show it as an artifact if you can": write the file, then show it however this environment
  can (publish it as an artifact if that tool exists, otherwise give the path and offer to open it).

## 4. Storyboard (when on): a hard stop

Write `storyboard.html` exactly as the brief describes: still canvas panels drawn with the
style's own functions, the notes under each panel, and the assumed facts below the grid. Use the
same `@lib` markers and run `inline_libs.py` on it too (its explainer checks may fail on a
storyboard; only the library inlining matters there). Show it, then **end your turn and wait** for
approval or changes. Don't start the animation in the same turn.

## 5. Build

Write `explainer.html` as the brief specifies, reusing the storyboard's drawing code, then run
`inline_libs.py` until it passes. Before showing it, open it in a browser if you can (or render a
few frames with step 6 using `--fps 2`) and look at the frames: text size, framing, the texture
and finishing passes, nothing off-canvas.

## 6. Render (offer it; don't assume)

The brief's render paragraph is implemented by `scripts/render.mjs`:

```bash
node scripts/render.mjs explainers/<slug>/explainer.html --out explainers/<slug>/explainer.mp4 \
  [--voiceover voice.wav] [--fps 30]
```

It checks for ffmpeg and puppeteer first and says what to install. It seeks every frame, encodes
H.264, renders the effects offline with `SOUND.renderOffline` (in voiceover mode when
`--voiceover` is given) and, with a voiceover, applies the brief's loudnorm/sidechain mix.
Don't install anything without the user's OK.
