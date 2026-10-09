# Changelog

All notable changes to diagram-images will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-10-09

### Security
- Stale-image cleanup no longer trusts the committed `.diagram-images.json` manifest: it only deletes plain file names of the form `<doc>-*.<format>` inside the output directory, so a crafted manifest cannot delete files elsewhere

## [1.0.0] - 2026-10-09

### Added
- Initial release as a Claude Code plugin
- Renders ```mermaid blocks in markdown to SVG or PNG from one shared hand-drawn theme
- Drift linter: inline styling, config overrides, unknown/missing classes, wrong shape for a class, multiple subjects
- Shape vocabulary of ten node classes defined in the theme
- Optional `%% id: name` comment to give a diagram a stable image file name
- Stale images from earlier renders are removed, tracked in `images/.<doc>.diagram-images.json`

### Notes
- Renders with a pinned `mermaid` in a headless system Chrome/Chromium/Edge: no puppeteer, mermaid-cli or Docker
- Labels are plain SVG text (no `foreignObject`), so SVGs open in PowerPoint, Keynote and Slides
