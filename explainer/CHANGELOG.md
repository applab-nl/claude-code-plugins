# Changelog

All notable changes to explainer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-20

### Added
- `explainer` skill: style selection (by name, or three suggestions from a description), content and option intake, storyboard approval gate, build, optional MP4 render
- 86 reference styles from the AI Style Atlas (captured 2026-11-20), the shared `H` helper library and `SOUND` kit, and a generated style catalog
- `scripts/prompt.py`: prints a style's build brief word for word as the Atlas gives it, for every storyboard/voiceover combination (`--full` gives the complete pasteable prompt)
- `scripts/inline_libs.py`: copies the libraries into the output byte for byte and lints the player interface
- `scripts/render.mjs`: headless Chrome frame capture → H.264, offline effects WAV, optional voiceover loudness/sidechain mix
- `tools/build_assets.py` (repo only): regenerates the assets from copied prompts and checks that every prompt round-trips exactly
