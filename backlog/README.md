# Backlog

**Groom your backlog with you. Implement it without you.**

Two halves of the same problem. `refine` sits down with you and turns a
messy backlog into tickets that are actually implementable. `nightshift` takes
the ones you then plan in, builds them while you sleep, and leaves a testable
preview branch, one draft PR per ticket, and an HTML test plan on your desk in
the morning.

Works with **Linear, Jira or GitHub Issues** — the tracker is detected once and
recorded in a committed `.claude/backlog.json`.

---

## Install

```
/plugin marketplace add applab-nl/claude-code-plugins
/plugin install backlog@applab-plugins
```

Then, once per repository:

```
/tracker
```

This detects your tracker, confirms the project key and column mapping with you,
picks up the repo's test/typecheck commands and planning conventions, and writes
`.claude/backlog.json`. Commit it — it describes the project, not you.

---

## `/refine` — the grooming session

```
/refine            # full sweep
/refine IRIS-38    # just this ticket
```

It moves tickets along exactly one edge of the board:

```
Backlog ──/refine──▶ READY ──you, by hand──▶ Todo ──▶ In Progress
unrefined            refined,               planned
                     not planned
```

Five phases:

1. **Queue** — the backlog column, scored by `priority + recency` so urgent work
   floats up without burying fresh thinking. Tickets past the backlog have
   already cleared refinement and are never re-interviewed.
2. **Triage** — two checks, one approval batch. Parallel subagents sweep the
   codebase for evidence that a ticket already shipped (`CODE`, `LOG`, `PR`,
   `SPEC`) — **shipped code is mandatory evidence**, a matching spec filename is
   explicitly *not* enough, because planning directories are full of designs that
   were never built. In the same pass, every backlog ticket is matched against
   the rest of the board, so the copy of a ticket that is already in progress,
   done or cancelled gets reconciled instead of refined.
3. **Prepare** — you pick which tickets this session, then one read-only `Explore`
   agent per ticket returns a recon brief: the files a change would touch, the
   pattern this repo already uses, the closest prior art, and whether part of it
   is built already.
4. **Refine** — one ticket at a time, always starting with *"refine this now, or
   later?"*. Title-only tickets get an open "explain this to me" question before
   anything structured, and every option after that names a real file from the
   recon. The interview continues until six questions are answerable — what the
   user sees, the unhappy path, which paths it touches, what's out of scope, how
   to verify it, what it ships behind. Answer all six and the ticket is
   **promoted to the ready column**; leave one open and it stays in the backlog,
   with a line saying which.
5. **Land** — any specs written during the sweep are committed on their own
   branch, never straight to `main`, then merged into `main` directly — docs-only
   work needs no PR — and every `**Spec:**` path written into a ticket is
   verified to exist.

**Refinement stops at ready.** Moving a ticket from ready to the pickup column is
your planning decision — that hand-move is what keeps an overnight run from
building every idea on the board.

The fan-out is the performance story: 30+ tickets × 4 signals, plus a codebase
recon per ticket, is hundreds of greps whose raw output you never need. Subagents
return verdicts and briefs, not transcripts, so the context stays free for the
part that matters — the conversation.

---

## `/nightshift` — the overnight run

```
/nightshift                     # run it
/nightshift finalize IRIS-38    # this one tested clean → PR ready for review
/nightshift report              # what happened last night?
```

```
pickup column ─┬─ ticket A ─→ branch A ─→ draft PR A ─┐
               ├─ ticket B ─→ branch B ─→ draft PR B ─┼─→ preview branch ─→ testplan.html
               └─ ticket C ─→ branch C ─→ draft PR C ─┘
```

**Preflight is strict, because nobody is watching.** Config valid, tree clean,
`gh` authenticated, and the test suite green on the default branch — a red
baseline means it couldn't tell its own breakage from yours, so it aborts
instead of guessing.

**It reads the pickup column, not the ready column** (`columns.todo`) — what you
planned, not everything `/refine` marked ready. On a board with no separate Ready
column the two are the same column and the gate simply isn't there.

**Only ready tickets are admitted.** A ticket without acceptance criteria is
skipped and reported, never guessed at. Skipping is a feature: implementing a
guess overnight produces a plausible feature for the wrong problem, and you find
out only after testing it.

**One agent per ticket, each in its own git worktree**, running in parallel.
Every one writes the failing test first, verifies against each acceptance
criterion, and ends with a pushed branch — including when it ends up `partial`
or `blocked`. Honest WIP is the morning's most useful signal.

**Individual branches are preserved.** Each ticket gets its own draft PR so you
can ship, delay or reject them independently. The preview branch is a disposable
integration artifact that merges them all for testing — it gets no PR of its
own, so nobody can merge the whole night in one click. A branch that conflicts is
excluded from the preview and reported; conflicts are never resolved unattended.

**The test plan is the deliverable.** `nightshift/<date>/testplan.html` is a
single self-contained file — no build, no network — with per-ticket click-through
steps, acceptance criteria and their evidence, blocked items called out at the
top, and checkboxes that persist as you work through them.

In the morning you test the preview, then finalize what passed, one ticket at a
time. Nightshift never merges anything, never moves a ticket to done, and never
touches your default branch.

---

## What's in the box

| Component | Type | Purpose |
|---|---|---|
| `tracker` | skill | Detect the tracker once, persist `.claude/backlog.json` |
| `refine` | skill | The grooming session (queue → cleanup → refine → land) |
| `nightshift` | skill | The overnight orchestrator |
| `nightshift-implement` | skill | How a single ticket gets built unattended |
| `testplan` | skill | Manifest schema + HTML rendering |
| `implementer` | agent | The per-ticket worker, one per worktree |
| `/tracker`, `/refine`, `/nightshift` | commands | Entry points |
| `build_preview.sh` | script | Merge ticket branches into the preview, excluding conflicts |
| `render_testplan.py` | script | Manifest → self-contained `testplan.html` (stdlib only) |

## Configuration

`.claude/backlog.json`, written by `/tracker`:

```json
{
  "version": 1,
  "provider": "linear",
  "projectKey": "IRIS",
  "scope": { "teamId": "...", "projectId": null, "boardId": null },
  "tools": { "prefix": "mcp__claude_ai_Linear__", "kind": "mcp" },
  "columns": {
    "backlog": ["Backlog"], "ready": ["READY"], "todo": ["Todo"],
    "inProgress": ["In Progress"], "inReview": ["In Review"],
    "done": ["Done"], "dropped": ["Canceled"]
  },
  "planning": {
    "kind": "superpowers",
    "invoke": {
      "type": "skill",
      "steps": ["superpowers:brainstorming", "superpowers:writing-plans"]
    },
    "specsDir": "docs/superpowers/specs",
    "plansDir": "docs/superpowers/plans",
    "naming": "<YYYY-MM-DD>-<slug>-design.md",
    "notes": null
  },
  "conventions": {
    "changelogFile": "src/lib/changelog/entries.ts",
    "sourceDirs": ["src"],
    "testCommand": "bun run test",
    "typecheckCommand": "bunx tsc --noEmit",
    "buildCommand": null
  },
  "nightshift": {
    "maxTickets": 5, "previewBranchPrefix": "nightshift",
    "branchPrefix": "", "draftPrs": true, "requireReadyTickets": true
  }
}
```

No tokens ever go in this file — those belong to your MCP server config or the
environment.

### Works with any spec-driven kit

When `/refine` decides a ticket is too big to implement from a description
alone, it hands off to whatever planning kit your repo uses. It doesn't need to
know the kit — `planning.invoke` says how to *start* it, and there are only
three ways to start one (plus `none`):

| `invoke.type` | `steps` holds | Example |
|---|---|---|
| `skill` | skill names, run in order | `["superpowers:brainstorming", "superpowers:writing-plans"]` |
| `command` | slash commands, run in order | `["/specify", "/plan"]` |
| `docs` | paths to the kit's own agent instructions | `["openspec/AGENTS.md"]` |
| `none` | — | a refined ticket description is the deliverable |

`/tracker` fingerprints the common kits (superpowers, OpenSpec, Spec Kit, Kiro,
BMAD) and proposes a config, but a fingerprint is only ever a hypothesis to
confirm. **When it doesn't recognise your kit, it asks you how the kit starts
and records the answer** — so an unknown or homegrown kit is a supported path,
not a gap. Kit-specific quirks (numbered feature folders, a required branch
name, a `tasks.md` that must be generated separately) go in `planning.notes`,
which is passed to the kit verbatim at handoff and to nightshift's implementer.

## Requirements

- One of: a Linear MCP server, an Atlassian/Jira MCP server, or `gh` authenticated
- `gh` CLI for PR creation (nightshift)
- `git` ≥ 2.20 and `python3` (stdlib only — no packages to install)
- A repo with a working test command, for nightshift's preflight

## Pairs well with

- **`ship-it`** — nightshift's finalize mode hands off to it for CI monitoring and merge
- **`linear`** — for starting work on one refined ticket interactively
- **`git-tools`** — worktree management

## License

MIT
