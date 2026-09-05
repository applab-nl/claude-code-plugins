---
description: Sweep the backlog — close what already shipped, then refine the rest together
argument-hint: "[KEY-123 to refine one ticket]"
---

## Context

- Backlog config: !`cat .claude/backlog.json 2>/dev/null || echo "MISSING — run /tracker first"`
- Repo rules: !`ls CLAUDE.md AGENTS.md 2>/dev/null || echo "none at root"`
- Current branch: !`git branch --show-current`

## Task

Use the **`refine`** skill and follow it exactly.

Argument: `$ARGUMENTS`

- **empty** → Full sweep: build the scored queue from the backlog column, triage
  the whole open board (already shipped? already on the board twice?) into one
  approval batch, agree which tickets this session, dispatch parallel codebase
  recon for them, then walk them through the refinement interview.
- **a ticket key** → Skip the sweep; duplicate-check and recon that one ticket,
  then refine it interactively from the "refine now or later?" question.

Refinement moves a ticket **from the backlog column to the ready column, and
stops there**. The move from ready to the pickup column is the user's planning
step — never make it for them.

Remember the three rules that make this work: **CODE is mandatory** before
proposing any close (a spec is a design, not a shipment), **read the code before
you ask** (recon first, then questions), and **the user decides everything** —
this is an interview, not a batch job.
