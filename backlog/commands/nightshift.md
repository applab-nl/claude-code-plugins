---
description: Run the overnight backlog implementation loop, or finalize a tested ticket
argument-hint: "[finalize <KEY-123> | report]"
---

## Context

- Backlog config: !`cat .claude/backlog.json 2>/dev/null || echo "MISSING — run /tracker first"`
- Current branch: !`git branch --show-current`
- Working tree: !`git status --porcelain | head -20`
- Recent nightshift branches: !`git branch -a --list '*nightshift/*' | head -10`

## Task

Use the **`nightshift`** skill and follow it exactly.

Argument: `$ARGUMENTS`

- **empty** → Run mode. Preflight, build the night's queue from the todo column,
  dispatch one worktree-isolated implementation agent per admitted ticket in a
  single message, assemble the preview branch, render the HTML test plan, push
  draft PRs, and finish with the morning report.
- **`finalize <KEY-123>`** → Finalize mode. That ticket tested clean on the
  preview: mark its draft PR ready for review, move the ticket to in-review, and
  hand off to `ship-it` if available. One ticket at a time.
- **`report`** → Re-print the last run's summary and the path to its test plan.

Hard boundaries, regardless of mode: never merge into the default branch, never
force-push, never delete a ticket branch, and never mark a ticket done that a
human hasn't tested.
