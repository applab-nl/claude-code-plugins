# Changelog

All notable changes to video-production will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-03

### Added
- Initial release as a Claude Code plugin, bundling ten skills for making videos in code:
  `video-brief`, `hyperframes-scene`, `motion-system`, `product-ui-recreation`, `walkthrough-video`,
  `ai-footage`, `voice-and-music`, `captions-on-the-beat`, `video-review` and `render-and-export`
- HyperFrames guardrails: pinned CLI version, telemetry/update/auto-install opt-outs, and commands that must never run
- `fal_run.py` spend-logged wrapper for paid fal calls, with an upload guard that only sends media files under the current directory
