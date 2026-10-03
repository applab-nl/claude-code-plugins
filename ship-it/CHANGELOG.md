# Changelog

All notable changes to the Ship It plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-10-03

### Changed

- **One run per PR.** `ship-it` waits for CI inside the run, with a background `gh pr checks --watch` and `Monitor` for review bots. It no longer re-invokes `/ship-it` through `ScheduleWakeup`, which re-read the whole session three or four times per PR and kept firing after the merge. `ScheduleWakeup` is now only a fallback.
- **Worktree cleanup that works from linked worktrees.** Paths are resolved up front and used with `git -C`. If `ExitWorktree` refuses, or the worktree wasn't created by the harness (phantom, `.worktrees/`, plain `git worktree add`), cleanup falls back to `phantom delete` or `git worktree remove`. The local branch is deleted with `-D` once GitHub reports `MERGED`, because `-d` fails after squash merges and cherry-picks. Main is fast-forwarded only when the primary checkout is on main and clean. Leftover merged branches and worktrees are reported, not deleted.
- `install-ship-it` carries the new invariants into generated skills. It also gates expensive project steps on changed paths, and ends user hand-offs (e.g. uploading a build) by opening the artifact instead of only reminding the user.

### Added

- A re-entry guard: a PR that is already merged leads straight to cleanup or a one-line exit. A closed PR stops the run.
- When an auto-mode permission check refuses the merge, `ship-it` asks once instead of retrying.
- The final report notes `no Linear ticket linked` when no sentinel exists.

### Fixed

- The fallback Linear tool name is now `mcp__claude_ai_Linear__save_issue`.

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
