---
description: Detect this repo's ticketing system and write .claude/backlog.json
---

## Context

- Existing config: !`cat .claude/backlog.json 2>/dev/null || echo "none — first run"`
- GitHub CLI: !`gh auth status 2>&1 | head -3`
- Repo: !`git remote get-url origin 2>/dev/null || echo "no origin"`
- Issue-key evidence in history: !`git log --oneline -30 | grep -oE '[A-Z][A-Z0-9]+-[0-9]+' | sort -u | head -5`

## Task

Use the **`tracker`** skill and follow it exactly.

Detect which trackers are reachable (Linear MCP, Jira/Atlassian MCP, GitHub
Issues via `gh`), confirm the provider, project key, scope and column mapping
with the user, detect this repo's conventions (planning system, specs/plans
directories, changelog file, test and typecheck commands), then write and
validate `.claude/backlog.json`.

Confirm **both post-refinement columns** explicitly, with the ticket count each
resolves to: the **ready column** (`columns.ready`, falling back to
`columns.todo`) that `refine` promotes into, and the **pickup column**
(`columns.todo`) that `nightshift` implements from unattended. Setting
`columns.ready` is what gives the user a manual planning gate between the two —
say so while asking, because a mis-mapping here is the most expensive mistake
available in this skill.
