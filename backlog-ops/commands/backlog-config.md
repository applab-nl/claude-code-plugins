---
description: Detect this repo's ticketing system and write .claude/backlog.json
---

## Context

- Existing config: !`cat .claude/backlog.json 2>/dev/null || echo "none — first run"`
- GitHub CLI: !`gh auth status 2>&1 | head -3`
- Repo: !`git remote get-url origin 2>/dev/null || echo "no origin"`
- Issue-key evidence in history: !`git log --oneline -30 | grep -oE '[A-Z][A-Z0-9]+-[0-9]+' | sort -u | head -5`

## Task

Use the **`backlog-config`** skill and follow it exactly.

Detect which trackers are reachable (Linear MCP, Jira/Atlassian MCP, GitHub
Issues via `gh`), confirm the provider, project key, scope and column mapping
with the user, detect this repo's conventions (planning system, specs/plans
directories, changelog file, test and typecheck commands), then write and
validate `.claude/backlog.json`.

Confirm the **todo column** explicitly and show how many tickets it currently
resolves to — `nightshift` implements from that column unattended, so a
mis-mapping there is the most expensive mistake available here.
