# Changelog

All notable changes to the Backlog plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-08-28

### Added

#### Refined tickets are promoted to the ready column

`refine` interviewed a ticket to completion, wrote the description, set the
estimate and the labels — and then left it exactly where it found it. Since
`nightshift` builds its queue from one column and never looks anywhere else, a
fully-specced ticket sitting in Backlog was invisible to the overnight run until
somebody dragged it across by hand. The skill warned about the *symptom* ("what
leaves nightshift idle") while the plumbing produced it for perfectly refined
tickets.

Step 3.6 now moves the ticket as part of the same approval as the description,
gated on the Step 3.4 checklist:

- **All six boxes ticked** → `move_issue` to the ready column. That checklist is
  already nightshift's admission gate, so passing it is precisely what "ready"
  means.
- **Any box open** → status untouched, with one line naming the box
  (`left in Backlog — no acceptance criteria yet`). Promoting a half-refined
  ticket is how nightshift ends up implementing a guess.
- Tickets already in the column, and tickets with an open `blockedBy` relation,
  are left alone — ready means *implementable now*.

The target is a new **optional `columns.ready`** in `.claude/backlog.json`,
falling back to `columns.todo` when it is `null`. Most boards have no separate
Ready column and need no config change; boards that do (Backlog / Ready / Todo
as three distinct columns) can now say so. `tracker` asks about it during the
column-mapping interview, and its "the one thing you must not guess" section is
now about the ready column, since both other skills pivot on it. `nightshift`
reads its queue from the same `columns.ready ?? columns.todo` resolution, so the
new key can never become a column that only gets written to.

### Changed

#### `refine` Phase 4 — spec artifacts land via their own branch, without a PR

The landing rule was "open a single docs-only PR, then merge it", which put a
review round-trip in front of documents the user had just approved line by line
in the interview. It also said nothing about *when* to branch, so a sweep that
started on `main` had the planning kit write spec files straight into the trunk
working tree at Step 3.5 — before Phase 4 was ever read.

Both halves are now explicit:

- **Branch before the first file is written.** Step 3.5 checks the current
  branch before invoking the planning kit, and Phase 4 creates one branch
  (`refinement-YYYY-MM-DD`, or a worktree on it) for the whole sweep. Nothing a
  sweep produces is committed directly to `main`.
- **No pull request.** The branch is merged into `main` locally and pushed —
  docs-only changes need no changelog entry, no test run and no review. The
  documented fallback for a protected `main` is the docs-only PR; working around
  the protection is not an option. A sweep that touched source still hands off
  to `ship-it` for the full gates.

Two red flags and a `Do NOT` entry were added to keep both halves enforceable,
and the quick-reference table now reads "Specs committed on their own branch,
merged to `main` — no PR".

## [1.1.0] - 2026-08-24

### Changed

#### Planning kit is now an adapter, not a hardcoded list

`conventions.planningSystem` was an enum of three (`superpowers`, `openspec`,
`none`), so any other spec-driven kit — Spec Kit, Kiro, BMAD, or a homegrown
flow — had no branch and silently degraded to writing designs inline. It is
replaced by a top-level `planning` block that records **how the kit is started**
rather than naming a kit the skills have to recognise:

```json
"planning": {
  "kind": "spec-kit",
  "invoke": { "type": "command", "steps": ["/specify", "/plan"] },
  "specsDir": "specs",
  "plansDir": "specs",
  "naming": "specs/<NNN>-<slug>/",
  "notes": "Creates a numbered directory per feature."
}
```

`invoke.type` covers the only three entry-point shapes that exist — `skill`
(invoke via the Skill tool), `command` (run slash commands), `docs` (read the
kit's own agent instructions and follow them) — plus `none`. `refine` Step 3.5
now dispatches on that instead of on a kit name, and verifies the files the kit
claims to have written actually exist before writing a `**Spec:**` trailer.

`tracker` fingerprints the common kits (superpowers, OpenSpec, Spec Kit, Kiro,
BMAD) as a shortcut, but treats every fingerprint as a hypothesis to confirm,
and **asks the user how their kit starts when it doesn't recognise one** —
making unknown and homegrown kits a supported path rather than a gap. Defaulting
to `none` because a kit wasn't recognised is now an explicit red flag.

`planning.notes` carries kit-specific quirks (numbered feature folders, a
required branch name, a `tasks.md` to generate separately) and is passed
verbatim to the kit at handoff and to nightshift's implementer, so kit knowledge
lives in config rather than in the skills.

**Config migration:** `conventions.planningSystem` / `conventions.specsDir` /
`conventions.plansDir` move to `planning.kind` / `planning.specsDir` /
`planning.plansDir`, and `planning.invoke` is new. `tracker` re-runs detection
on any config missing required keys, so an older config self-heals on next use.

## [1.0.0] - 2026-08-24

### Added

#### Initial release — provider-agnostic backlog grooming and unattended overnight implementation

**`tracker` skill** — detect-then-persist provider configuration.
Probes for a Linear MCP, an Atlassian/Jira MCP, or GitHub Issues via `gh`,
corroborates with issue keys found in git history, confirms provider, project
key, scope and column mapping with the user, detects the repo's planning system,
specs/plans directories, changelog file and test commands, then writes and
validates a committed `.claude/backlog.json`. Includes the provider verb mapping
(`list_issues`, `get_issue`, `update_issue`, `move_issue`, `comment`,
`link_relation`) that the other skills are written against, so no skill contains
a tracker-specific tool name.

**`refine` skill** — the collaborative grooming session, in four phases:
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

**`testplan` skill** — the manifest schema and the rules for writing
click-through steps a stranger could follow.

**`implementer` agent** — the per-ticket worker.

**Commands** — `/tracker`, `/refine`, `/nightshift`.

**Scripts**

- `build_preview.sh` — builds `nightshift/<date>` from the default branch and
  merges each ticket branch in turn, aborting and excluding any that conflicts,
  leaving every ticket branch untouched, and emitting a JSON summary.
- `render_testplan.py` — renders the manifest into a single self-contained
  `testplan.html` with per-ticket steps, acceptance-criteria evidence, excluded
  branches, and progress checkboxes persisted in local storage. Python stdlib
  only, no install step.

[1.0.0]: https://github.com/applab-nl/claude-code-plugins/tree/main/backlog
