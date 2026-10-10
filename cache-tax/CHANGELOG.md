# Changelog

All notable changes to the Cache Tax plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.1] - 2026-10-10

### Added

- Vendored from [karanb192/cache-tax](https://github.com/karanb192/cache-tax) at commit `06cac47ec125a41a4aeeb78a6b006bec8cc6d6ed` (MIT, Karan Bansal) so updates are reviewed and pulled in deliberately rather than tracked from upstream.
- Security review before import: `hooks/register.ts` (520 lines) makes no network calls, spawns no processes, reads no files and uses only its own `$.store`; the single outbound request is a `$.model.fork` with a constant one-line prompt. `hooks/status-icons.ts` holds only generated SVG and PNG data. No install scripts, dependencies or lockfiles.

### Changed

- Asset paths in `README.md` and `tools/generate-status-icons.py` point at the vendored `assets/` folder. The upstream landing page, Pages workflow and explainer video are not vendored; the README links the video at the pinned upstream commit.

### Updating

Diff upstream against the pinned commit above, re-run the review on the diff, then bump this entry and the version in `plugin.json` and `marketplace.json`.
