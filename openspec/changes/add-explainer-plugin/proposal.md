# Change: Add the `explainer` plugin (86-style animated explainers)

> **Superseded** by `merge-styles-into-video-production`: the plugin was folded into `video-production` 2.0.0 and its Atlas material is no longer committed.

## Why

Futurepedia's AI Style Atlas offers 86 visual styles for animated explainers. Each one comes as a "Copy prompt" that is pasted into a new Claude chat. A copied prompt is 67–124 KB, and about a third of it is the same in every style: the build rules, a drawing helper library and a sound kit. Using a style today means finding it on the site, copying it, pasting it and filling in a placeholder.

A skill can hold one copy of the shared parts, load only the chosen style, and add the things a pasted prompt can't do: suggest a style from a description, ask the right questions, stop at the storyboard for approval, and render the MP4 with a bundled script.

## What Changes

- **New plugin `explainer`** (category: media) with one skill, `explainer`:
  - Picks a style by name, or suggests three from a catalog when the user describes a look or mood.
  - Collects the content (topic or script) and the options the site's dialog offers: **storyboard first** (on by default) and **voiceover** (off by default; on asks for SRT or word-level timing, or transcribes an attached audio file).
  - Builds one self-contained HTML canvas animation (1280x720) following the Atlas brief for that style and those options (rendered word for word by `scripts/prompt.py`), with the chosen style's reference source as its style guide. `scripts/inline_libs.py` copies the shared libraries in unchanged.
  - Optionally renders an MP4 with `scripts/render.mjs` (headless Chrome → ffmpeg, plus an offline WAV of the effects, and a sidechain mix when there's a voiceover).
- **Bundled assets** (the repo is private, so redistribution is fine): `lib/harness.js`, `lib/sound.js` (stored once) and 86 `styles/<styleId>.js` reference sources (~4.6 MB).
- **A generator script that stays in the repo** (`explainer/tools/build_assets.py`, not loaded at runtime). It turns copied prompts into the plugin's assets and fails if the shared parts stop matching, so a refresh from the site can't quietly drift.
- **Marketplace:** a `marketplace.json` entry (1.15.0 → 1.16.0), the plugin added under **Media** in the repo's CLAUDE.md, a README section, and the plugin's own README, CHANGELOG and LICENSE.

## Impact

- Affected specs: `explainer` (new capability)
- Affected code: new `explainer/` directory, `.claude-plugin/marketplace.json`, `CLAUDE.md`, `README.md`
- No changes to other plugins. `video-production` (HyperFrames/GSAP) stays separate; the two READMEs point at each other.
