# Changelog

All notable changes to 3d-explainer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-20

### Added
- `3d-explainer` skill: intake, rendered-stills storyboard with an approval gate, build, and MP4 render for short
  three.js explainers in a bundled look
- `add-style` skill and `import-style.mjs`: split a style prompt into `styles/<id>/`, diff its kits and its generic
  instructions against what is bundled
- 36 styles (card, reference source, source prompt each), listed in `references/styles.md`
- `index-styles.mjs`: rebuilds the style index the skill picks from, and the README table
- Two references fixed so they render deterministically on Apple GPUs (marked `// 3d-explainer fix:` and listed on
  their cards): Painted (texture lookup inside a non-uniform branch) and Neon Sign (per-brick canvas blur that reset
  the GPU process)
- `render.mjs` checks the GPU on a blank page and relaunches if WebGL comes up in software, and stops when a WebGL
  context is lost or a shader fails, instead of passing blank frames
- Shared libraries imported with their styles: TEXT3D (`text3d.js`, solid 3D letters, Soft Clay) and STROKEFONT
  (`strokefont.js`, drawn line lettering, Blueprint Build)
- Extra libraries per style: a card's `libs:` line makes `assemble.mjs` load them after the stage kit
- STAGE and SOUND kits bundled verbatim in `assets/lib`, spliced in by `assemble.mjs` so they are never retyped
- three.js 0.187.0 vendored into `assets/lib/three.js` by `tools/vendor-three.mjs` (three.core.js + three.module.js
  merged into one module) and spliced in by `assemble.mjs`: assembled HTML files are fully self-contained, with no
  CDN request and no import map
- Player and storyboard page templates (vendored three.js 0.187.0, theme tokens, phone layout)
- `lint-style.mjs` (banned non-deterministic calls, loaders, accumulating transforms) and a purity check in
  `render.mjs` that compares frames rendered in different orders
- `render.mjs`: headless Chrome with GPU via Playwright, PNG frames piped to ffmpeg, offline audio with two-pass
  loudnorm at -15 LUFS, stills and a contact sheet for an eyes-on check
