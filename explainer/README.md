# Explainer

Animated explainers in **86 visual styles**: flat-vector science, watercolor wash, whiteboard, 1940s film noir, papercraft, Manim-style math, illuminated manuscript, 16-bit pixel art, halftone pop and more. Name a style (or describe the look you want), give a topic or script, approve a storyboard, and get one self-contained HTML file: a 1280x720 canvas animation with a player, synthesized sound effects and optional voiceover sync. It can then be rendered to MP4.

The styles, the drawing library and the sound kit come from Futurepedia's [AI Style Atlas](https://www.futurepedia.io/resources/ai-style-atlas/view), captured on 2026-11-20. Each style's "Copy prompt" is 67–124 KB, a third of it the same in every style. This plugin stores those shared parts once, loads only the chosen style, and adds style suggestions, a storyboard gate, library inlining and a render script.

## Installation

```bash
/plugin install explainer --marketplace applab-nl/claude-code-plugins
```

## Usage

Ask for it in plain words, or run `/explainer:explainer`:

```
Make an animated explainer about how vaccines train the immune system, watercolor style
Explain compound interest as a 20-second animation, something retro and computer-y
Animated explainer of how DNS works in Film Noir style, timed to this voiceover (voice.srt + voice.wav)
```

The skill:
1. **Picks the style**: by name, or by suggesting three from the catalog when you describe a look.
2. **Asks** for the content and the two options: *storyboard first* (default on) and *voiceover* (default off; give SRT or word timestamps, or an audio file to transcribe).
3. **Storyboards**: a grid of still frames in the real style with timings, on-screen text, transitions and sounds, then waits for your OK.
4. **Builds** `explainers/<topic>/explainer.html`: seekable, deterministic frames, sound in sync, voiceover-driven clock when voiceover is on.
5. **Renders** an MP4 on request.

## What's inside

| Path | What it is |
|---|---|
| `skills/explainer/SKILL.md` | The workflow |
| `skills/explainer/references/rules/*.txt` | The Atlas build brief for each storyboard/voiceover combination |
| `skills/explainer/references/catalog.md` | All 86 styles by family, with one-line looks |
| `skills/explainer/assets/styles/<styleId>.js` | Each style's reference animation, with its style card as a header comment |
| `skills/explainer/assets/lib/{harness,sound}.js` | The `H` drawing helpers and the `SOUND` Web Audio kit |
| `skills/explainer/scripts/prompt.py` | Prints a style's brief; `--full` gives the complete pasteable Atlas prompt |
| `skills/explainer/scripts/inline_libs.py` | Copies the libraries into an HTML file byte for byte and lints the player interface |
| `skills/explainer/scripts/render.mjs` | HTML → MP4 (frames via headless Chrome, effects via `SOUND.renderOffline`, optional voiceover mix) |
| `tools/build_assets.py` | Repo-only: regenerates the assets from copied prompts |

You can also use a style without the skill: `python3 skills/explainer/scripts/prompt.py flat-space --full | pbcopy` puts the original prompt on the clipboard for any Claude chat.

## Requirements

- Python 3 (stdlib only) for the helper scripts
- For MP4 renders: Node 18+, `ffmpeg` on PATH and `puppeteer` (`npm i -D puppeteer` in the working folder)
- Network access for Google Fonts when the animation loads

## Refreshing the styles

When the Atlas changes, capture every card's "Copy prompt" again (with the clipboard hooked in a scripted browser) into one `*.txt` per style. Capture the storyboard/voiceover switch combinations for at least two styles into a `variants.json`, then run:

```bash
python3 -I explainer/tools/build_assets.py <prompts-dir> --variants <variants.json>
```

It refuses to write anything if the shared libraries differ between prompts or a prompt's instructions don't come back exactly from the templates. After writing, it checks that `prompt.py --full` reproduces every input prompt byte for byte.

## Related

- [video-production](../video-production/README.md): launch videos and product walkthroughs with real UI, built with HyperFrames.

## License

MIT for the plugin's own code. The styles, `harness.js`, `sound.js` and the brief wording are Futurepedia's AI Style Atlas material, bundled for internal use.
