# Design: `explainer` plugin

## Source analysis (what a copied prompt contains)

Captured from https://www.futurepedia.io/resources/ai-style-atlas/view on 2026-11-20: 86 default prompts, plus every switch combination for two styles.

| Part | Size | Varies by |
|---|---|---|
| Intro + `MY CONTENT` placeholder | ~0.5 KB | style name + family |
| Build rules (storyboard, what to build, staying in the style, structure, flow, sound, MP4 render) | ~6 KB | the **storyboard** and **voiceover** switches, plus 2 per-style quirks (below) |
| Style card (name, family, look, motion, how it explains) | ~1 KB | style |
| `lib/harness.js` (H helper library) | 6 KB | nothing: identical in all 86 |
| `lib/sound.js` (SOUND kit, Web Audio) | 21 KB | nothing: identical in all 86 |
| Reference source `styles/<styleId>.js` | 30–84 KB | style |

Switches in the site's dialog:
- **Explainer / Style clip** only changes the preview video. The copied prompt is byte-for-byte the same, so it's left out.
- **Storyboard first** (default on) adds the "STORYBOARD FIRST" block.
- **Voiceover** (default off). Turning it on:
  - adds a `MY VOICEOVER TIMING` input (SRT or word timestamps, or transcribe an attached audio file)
  - adds a "Load voiceover" control; once a file is loaded, the audio drives the playback clock
  - sets `DURATION` to the end of the last voiceover line plus 1 s
  - replaces STRUCTURE with TIMING FROM THE VOICEOVER (a BEATS table, visuals land on their word, no subtitles)
  - replaces the SOUND rules with voiceover-mode rules (`{ minor: true }`, `{ voiceover: true }`)
  - adds an ffmpeg sidechain/loudnorm mix command

Per-style quirks inside the build rules:
- 6 styles (Glassmorphism UI, Hidden-Line Wireframe, Isometric Pastel, Low-Poly Faceted, Soft 3D Clay, Voxel Diorama) do have sound design but attach it as a named function (`explainerSound: glassSound`), and the site's prompt then leaves the "`explainerSound(k)` is its sound design" clause out. The generator records this as `inlineExplainerSound`.
- 3 styles need no Google Fonts (cross-stitch-sampler, etch-a-sketch-toy, vector-arcade-1980).
- All other per-style data is the style card, the fonts line and the reference's demo topic.

## Layout

```
explainer/
├── .claude-plugin/plugin.json        # "skills": "./skills"
├── skills/explainer/
│   ├── SKILL.md                      # workflow, < 150 lines
│   ├── references/
│   │   ├── rules/{plain,voiceover}-{storyboard,direct}.txt   # the Atlas brief per option combination, with {{placeholders}}
│   │   └── catalog.md                # 86 rows by family: styleId · name · one-line look
│   ├── assets/
│   │   ├── lib/harness.js
│   │   ├── lib/sound.js
│   │   └── styles/<styleId>.js       # header comment (JSON) = style card + fonts + demo topic + inlineExplainerSound
│   └── scripts/
│       ├── prompt.py                 # renders a style's brief for the chosen options; --full = the original pasteable prompt
│       ├── inline_libs.py            # @lib markers → libraries copied in byte for byte, plus a player-interface lint
│       └── render.mjs                # puppeteer seek loop → ffmpeg; offline WAV; optional voiceover mix
├── tools/build_assets.py             # repo-only generator (not referenced by the skill)
├── README.md · CHANGELOG.md · LICENSE
```

## Decisions

1. **Store each shared part once, load one style at a time.** At runtime Claude reads SKILL.md, the rendered brief (~7 KB), the catalog (only when no style is named), one style file and the two libraries. That costs about the same as one pasted prompt today (~25k tokens), without the 86 duplicate copies.
2. **Keep style metadata in the style file's header.** One file per style keeps the card next to its code, and the generator writes `catalog.md` from those headers, so there's a single source of truth.
3. **Render the brief, don't paraphrase it** (changed during implementation; the first plan was a hand-written `build-rules.md`). `prompt.py` fills one of four captured templates with the style's fields and prints the brief Claude would have got from the site. The generator imports the same renderer and checks that `prompt.py --full` rebuilds every captured prompt byte for byte (86 defaults plus all 16 switch combinations captured for two styles). So the wording can't drift, and Claude doesn't have to choose between conditionals.
4. **The libraries are copied into the output unchanged.** Claude writes `<!-- @lib harness -->` / `<!-- @lib sound -->` markers and `inline_libs.py` copies the files in verbatim instead of Claude retyping them, which keeps the "include unchanged" rule exact. It also lints for `window.seek`, `window.DURATION`, `window.scoreSound`, `explainer()`, `SOUND.live` and `Math.random`.
5. **The storyboard is a hard stop.** When storyboard is on, the skill ends its turn after showing the storyboard and only builds once the user approves.
6. **The render script needs Node, puppeteer and ffmpeg.** `render.mjs` checks for each up front and prints install hints instead of failing halfway. Without a shell the skill skips rendering, as the original prompt does. Recent npm versions block puppeteer's post-install browser download, so it tries `PUPPETEER_EXECUTABLE_PATH`, then puppeteer's headless shell, then its bundled Chrome, then the installed Chrome. The picture sets the output length: a shorter voiceover is padded with silence, never used to cut the video.
7. **The generator is deterministic.** `build_assets.py` takes the directory of copied prompts (plus optional variant captures). It asserts the libraries are identical, that the build rules match the known variants after normalising, and that every style parses. It writes `assets/` and `catalog.md` and fails on anything unexpected.

## Open risks

- **Drift from the site:** Futurepedia may change prompts or add styles. Re-run the capture (Playwright: click each Copy prompt with the clipboard hooked) and `build_assets.py`; the generator's checks catch structural changes.
- **Size:** ~4.7 MB of assets in a plugin is large but well within limits, and only the chosen style's ~51 KB enters context.
