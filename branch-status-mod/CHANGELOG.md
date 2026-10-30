# Changelog

All notable changes to branch-status-mod will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-29

### Added
- Branches pane (`/branches`): every local branch beside main with an ahead bar, `+ahead −behind`, worktree folder and PR badge
- Merged detection by the PR's merged state (squash merges included) or by having nothing ahead of main; merged branches stay dimmed with a "delete?" hint
- Remote-only rows for open PRs whose branch is not checked out locally
- Options: show pull requests (default on) and the PR refresh interval (default 5 minutes)
- git re-read every 15 seconds and after git/gh commands; `git fetch origin` every 5 minutes
