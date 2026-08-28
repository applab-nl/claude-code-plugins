# Work Audit

Find out what is *actually* outstanding in a repository — and how much of the backlog only looks
outstanding because the record stopped matching the code.

## The problem it solves

Repositories accumulate a fog: branches nobody remembers, worktrees left behind by agent sessions,
tickets whose status drifted, planning documents describing work that shipped months ago. The
feeling is "I am buried". The reality is usually that the *record* is wrong, not the work.

A run on a real project found 163 apparently-open planning documents, of which 50 were complete and
simply never archived; 51 branches, of which 39 were already merged; and 71 open tickets, of which
only 2 were genuinely in progress. It also found a closed pull request containing a production fix
that had never landed.

## What it does

**`/work-audit`** — a read-only investigation producing an HTML report and a phased plan:

| Section | What it answers |
|---|---|
| At risk | Which work exists in exactly one place and could be lost |
| Corrections | Where tickets, docs or PRs disagree with the trunk |
| Sessions | Which parallel agents are blocked, running, or already merged |
| Pull requests | Which are genuinely mergeable vs. stale or superseded |
| Branches | Merged, content-merged, or genuinely unmerged — with exact counts |
| Worktrees | Dirty, unpushed, orphaned |
| Tickets | Verified against code, with duplicates and mis-diagnoses flagged |
| Planning artifacts | Complete-but-unarchived, effectively done, superseded stubs |
| The plan | Phased, preservation before deletion |

**`/work-audit-cleanup`** — the opt-in destructive half. Pushes at-risk work to a remote *first*,
then deletes verified-merged branches, removes finished worktrees, prunes orphans and closes
superseded PRs. Separate by design: the audit is safe to run any time, the cleanup never happens by
accident.

## The core discipline

**Never report a status you have not verified against the trunk.**

Tickets, changelogs, handover docs and memory are claims, not facts. They were true when written. The
audit treats each as a hypothesis and goes to read the code — because an inventory that just restates
the tracker is worthless. What the user cannot see is which parts of the tracker are lying.

## Things it knows that are easy to get wrong

- **Two merge signals, not one.** Ancestry is blind to squash merges; patch-id false-positives on
  re-authored work. Each catches what the other misses.
- **Never scan by worktree.** A branch not checked out anywhere never appears — and those are exactly
  the forgotten ones.
- **Three-dot vs two-dot diffs.** `A...B` diffs from the merge-base and will show you the trunk's own
  changes as though the branch made them.
- **A missing file is not a missing feature.** Code lands under different filenames. Grep for the
  capability.
- **Closed PRs can hold unlanded fixes.** Closure reads as a decision, so nobody looks again.
- **Unmerged is not the same as worth keeping.** Branches predating a subsystem's removal patch paths
  that no longer exist — report the live/dead ratio and rescue surgically.
- **A planning document at 0% may be finished.** Consolidated plans absorb individual ones, which keep
  their zeros forever while their content ships.

## Trackers

Auto-detects and adapts: **Linear**, **GitHub Issues**, **Jira**, or none. With no tracker it audits
branches, worktrees and PRs, which is still useful. Tracker-specific queries live in
`skills/work-audit/references/trackers/`.

## Bundled scripts

Both are read-only and take an optional trunk ref:

```bash
skills/work-audit/scripts/branch_forensics.sh [trunk] [--remote] [--risk-only]
skills/work-audit/scripts/worktree_health.sh [worktree-parent-dir ...]
```

`branch_forensics.sh` prints the three merge buckets, the at-risk list, and how many branches are
deletable without review. `worktree_health.sh` reports dirty/unpushed state per worktree plus orphan
directories — and correctly distinguishes an orphan from a *parent* of nested worktrees.

## Requirements

- `git`
- *Optional:* `gh` CLI for pull requests
- *Optional:* a tracker MCP server (Linear, Jira) or `gh` for GitHub Issues
- *Optional:* subagents, which make the high-volume sweeps much faster

## Installation

```
/plugin marketplace add applab-nl/claude-code-plugins
/plugin install work-audit@applab-plugins
```

## Licence

MIT
