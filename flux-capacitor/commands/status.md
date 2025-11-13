---
name: flux-status
description: Get detailed status of a flux-capacitor session
---

Invoke the **flux-orchestrator** skill to get detailed status of a specific session.

## Task ID

The user wants status for: **{{arguments}}**

## Your Action

Invoke the flux-orchestrator skill with operation "STATUS":

```
/skill flux-orchestrator
```

Then provide the skill with:
- **Operation**: STATUS
- **Task ID**: {{arguments}}

The skill will:
1. Execute the status script with the task ID
2. Show detailed session information:
   - Session health (running/stopped)
   - Worktree status (uncommitted changes, commits ahead)
   - Recent activity (last 15 lines from tmux pane)
   - Next steps

Present the formatted status from the skill to the user.
