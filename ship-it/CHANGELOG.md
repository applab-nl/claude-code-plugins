# Changelog

All notable changes to the Ship It plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-09-26

### Added

- `install-ship-it` skill: analyzes the repository, interviews the user, lets them pick project-specific close-out steps (local gate, migration check, mobile build, device verification, preview smoke test, deploy watch, release tag, …) and generates a self-contained `.claude/skills/ship-it/SKILL.md`, either committed or local-only. When a project skill already exists, it reviews it against the current template and the project's current state and offers upgrades, keeping the user's own edits.

### Changed

- The generic `ship-it` defers to a project-specific `.claude/skills/ship-it/SKILL.md` when one exists, and points to `/install-ship-it` when the project has specifics it doesn't cover.

## [1.1.0] - 2026-09-26

### Added

- Step 0, "Sync specs": when a spec-driven kit is detected (OpenSpec, Superpowers, Spec Kit), the branch's specs and plans are brought up to date with the implementation, their task checklists are synchronized, and completed OpenSpec changes are validated and archived before committing, so the specs ship in the same PR as the code.

## [1.0.0] - 2026-05-28

### Added

- Initial release of the `ship-it` skill, packaged as a plugin.
- End-to-end close-out flow: commit → push → PR → monitor → triage → merge → cleanup.
- Conventional Commits message generation with project-aware behaviour (auto-includes `.claude/logs/prompts.json` when relevant).
- `ScheduleWakeup`-paced PR monitoring (300s default, dropping to 60–120s as CI nears completion) to avoid token-burn from tight polling.
- Blocker triage that auto-fixes failing CI and critical/high review comments, while leaving nitpicks and unclear severity for the user.
- Linear ticket transitions when a `.linear-ticket.json` sentinel is present — In Review on PR open, Done on merge.
- Worktree-aware cleanup via the native `ExitWorktree` tool.
