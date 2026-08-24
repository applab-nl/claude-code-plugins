# Changelog

All notable changes to the Backlog Ops plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-24

### Added

#### Initial release — provider-agnostic backlog grooming and unattended overnight implementation

**`backlog-config` skill** — detect-then-persist provider configuration.
Probes for a Linear MCP, an Atlassian/Jira MCP, or GitHub Issues via `gh`,
corroborates with issue keys found in git history, confirms provider, project
key, scope and column mapping with the user, detects the repo's planning system,
specs/plans directories, changelog file and test commands, then writes and
validates a committed `.claude/backlog.json`. Includes the provider verb mapping
(`list_issues`, `get_issue`, `update_issue`, `move_issue`, `comment`,
`link_relation`) that the other skills are written against, so no skill contains
a tracker-specific tool name.

**`backlog-refine` skill** — the collaborative grooming session, in four phases:
queue (blended priority + recency score), cleanup (close what already shipped),
refine (guided interview), land (specs to `main` in one docs-only PR).

- Cleanup evidence gathering runs as **parallel subagents**, batched 6–8 tickets
  each, returning verdicts rather than search transcripts — the context stays
  free for the refinement conversation, and the sweep runs concurrently instead
  of ticket-by-ticket.
- The evidence contract lives in `references/cleanup-evidence.md`, passed to
  every subagent so all batches judge by the same rule.
- **`CODE` is mandatory before proposing a close.** A matching spec filename is
  explicitly insufficient — planning directories accumulate designs that were
  never built, and closing on a filename match silently deletes real work.
- Refinement always opens with "refine now, or later?"; title-only tickets get an
  open-ended "explain this to me" question before anything structured; the
  interview continues until a six-point implementability checklist is answerable.

**`nightshift` skill** — the unattended overnight orchestrator.

- Strict preflight (valid config, clean tree, authenticated `gh`, green baseline
  test suite) that aborts loudly rather than burning the night.
- A readiness gate that admits only tickets with acceptance criteria and skips
  the rest into the morning report, instead of guessing at thin tickets.
- One worktree-isolated implementation agent per ticket, dispatched in parallel.
- Per-ticket branches and draft PRs are preserved so changes ship individually;
  the preview branch merges them for testing and deliberately gets no PR.
- Merge conflicts exclude a branch from the preview and are reported — never
  resolved unattended.
- Finalize mode marks one tested ticket's draft PR ready for review and hands
  off to `ship-it`.

**`nightshift-implement` skill** — how a single ticket is built alone: read the
repo's rules first, failing test before implementation, honest per-criterion
verification, Conventional Commits, always end with a pushed branch (including
`partial` and `blocked` outcomes), one draft PR, and a structured JSON result.
Includes a rationalization table for the pressures specific to unattended work.

**`nightshift-testplan` skill** — the manifest schema and the rules for writing
click-through steps a stranger could follow.

**`nightshift-implementer` agent** — the per-ticket worker.

**Commands** — `/backlog-config`, `/backlog-refine`, `/nightshift`.

**Scripts**

- `build_preview.sh` — builds `nightshift/<date>` from the default branch and
  merges each ticket branch in turn, aborting and excluding any that conflicts,
  leaving every ticket branch untouched, and emitting a JSON summary.
- `render_testplan.py` — renders the manifest into a single self-contained
  `testplan.html` with per-ticket steps, acceptance-criteria evidence, excluded
  branches, and progress checkboxes persisted in local storage. Python stdlib
  only, no install step.

[1.0.0]: https://github.com/applab-nl/claude-code-plugins/tree/main/backlog-ops
