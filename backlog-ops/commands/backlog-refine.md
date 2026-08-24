---
description: Sweep the backlog — close what already shipped, then refine the rest together
argument-hint: "[KEY-123 to refine one ticket]"
---

## Context

- Backlog config: !`cat .claude/backlog.json 2>/dev/null || echo "MISSING — run /backlog-config first"`
- Repo rules: !`ls CLAUDE.md AGENTS.md 2>/dev/null || echo "none at root"`
- Current branch: !`git branch --show-current`

## Task

Use the **`backlog-refine`** skill and follow it exactly.

Argument: `$ARGUMENTS`

- **empty** → Full sweep: build the scored queue, dispatch parallel subagents to
  gather cleanup evidence, present one batch of close candidates for approval,
  then walk the remaining tickets through the refinement interview.
- **a ticket key** → Skip the sweep; refine that one ticket interactively,
  starting from the "refine now or later?" question.

Remember the two rules that make this work: **CODE is mandatory** before
proposing any close (a spec is a design, not a shipment), and **the user decides
everything** — this is an interview, not a batch job.
