# Changelog

All notable changes to the Ship It plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-28

### Added

- Initial release of the `ship-it` skill, packaged as a plugin.
- End-to-end close-out flow: commit → push → PR → monitor → triage → merge → cleanup.
- Conventional Commits message generation with project-aware behaviour (auto-includes `.claude/logs/prompts.json` when relevant).
- `ScheduleWakeup`-paced PR monitoring (300s default, dropping to 60–120s as CI nears completion) to avoid token-burn from tight polling.
- Blocker triage that auto-fixes failing CI and critical/high review comments, while leaving nitpicks and unclear severity for the user.
- Linear ticket transitions when a `.linear-ticket.json` sentinel is present — In Review on PR open, Done on merge.
- Worktree-aware cleanup via the native `ExitWorktree` tool.
