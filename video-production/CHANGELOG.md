# Changelog

All notable changes to video-production will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-11-22

### Added
- `video-styles` skill: the 86 2D and 37 3D styles of the former `explainer` and `3d-explainer` plugins as HyperFrames scene types. `build-scene.mjs` turns one style file into a scene with local fonts, its synthesized score as a WAV and declared on-screen texts; 2D and 3D scenes mix with UI scenes in one render and stay bit-identical across renders. 3D scenes use the GPU when HyperFrames' Chrome has one and fail loudly without it (`--prerender` fallback).
- Style gallery: two stills per style, filterable by medium and family, generated locally by `setup-styles.mjs` / `gallery.mjs`. A style catalog (`catalog.json` / `catalog.md`) written in our own words.
- `add-style` skill for 2D and 3D Atlas prompts.
- `video-storyboard` skill: key frames per beat on a contact sheet, approved before the build.
- Kokoro as the default, free, local voice engine (`tts_kokoro.py`, pinned and checksummed), ElevenLabs for unsupported languages, cloned and premium voices; `tts_check.py` transcribes every TTS line back and diffs it with the script.
- `readcheck.py`: fails text and captions held shorter than the reading rule.
- `video-brief`: a treatment step, a look field, a storyboard toggle and a voice engine field. `video-review`: a fresh-context reviewer.

### Changed
- BREAKING: replaces the `explainer` and `3d-explainer` plugins, which are removed from the marketplace. Their style material is no longer shipped; build it locally with `setup-styles.mjs --from-legacy` or `--from-prompts`.

## [1.0.0] - 2026-11-03

### Added
- Initial release as a Claude Code plugin, bundling ten skills for making videos in code:
  `video-brief`, `hyperframes-scene`, `motion-system`, `product-ui-recreation`, `walkthrough-video`,
  `ai-footage`, `voice-and-music`, `captions-on-the-beat`, `video-review` and `render-and-export`
- HyperFrames guardrails: pinned CLI version, telemetry/update/auto-install opt-outs, and commands that must never run
- `fal_run.py` spend-logged wrapper for paid fal calls, with an upload guard that only sends media files under the current directory
