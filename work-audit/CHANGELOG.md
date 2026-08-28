# Changelog

All notable changes to the Work Audit plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-28

### Added

- Initial release, generalised from a real audit of a multi-worktree Kotlin/Supabase monorepo.
- `work-audit` skill — read-only audit of branches, worktrees, pull requests, tracker tickets,
  planning artifacts and parallel agent sessions, verifying each claimed status against the trunk.
- `work-audit-cleanup` skill — opt-in destructive cleanup that completes preservation before
  beginning deletion, re-verifies merge state at the moment of deletion, and uses `git branch -d`
  rather than `-D`.
- `/work-audit` and `/work-audit-cleanup` commands, with `allowed-tools` scoped so the audit command
  is read-only at the harness level.
- `scripts/branch_forensics.sh` — classifies every branch as fully-merged, content-merged or
  unmerged using three signals, and lists commits that exist on no remote. Ancestry misses squash
  and rebase merges; patch-id catches a rebase but not a *multi-commit squash*, whose single commit
  matches none of the originals; a touched-path content comparison catches that. Found by the eval
  fixtures, which planted a squash-merged branch that the first two signals both misreported.
- `scripts/worktree_health.sh` — per-worktree dirty/unpushed state, repository-wide stashes, and
  orphan directory detection that distinguishes a true orphan from a parent of nested worktrees.
- `references/git-forensics.md` — the commands, plus seven traps that have each produced a wrong
  conclusion in a real audit (patch-id false positives, three-dot diffs, worktree-based scanning,
  missing-file-vs-missing-feature, closed PRs, regressive stale branches, retired subsystems).
- `references/planning-artifacts.md` — detection and parsing for OpenSpec, Spec-Kit, ADRs and ad-hoc
  plan directories, including the 0%-but-actually-shipped trap.
- `references/trackers/{linear,github-issues,jira}.md` — tracker-specific enumeration and the
  cross-reference patterns worth checking.
- `references/report-template.md` — report structure, evidence-citing style, and the hover-title
  pattern for repeated ticket references.
