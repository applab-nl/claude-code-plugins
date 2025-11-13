---
name: flux-list
description: List all active flux-capacitor sessions
---

Invoke the **flux-orchestrator** skill to list all active parallel development sessions.

## Your Action

Invoke the flux-orchestrator skill with operation "LIST":

```
/skill flux-orchestrator
```

Then provide the skill with:
- **Operation**: LIST

The skill will:
1. Execute the list script
2. Show all active flux-capacitor sessions with:
   - Session names
   - Task IDs
   - Worktree paths
   - Branch names
   - Uptime
3. Provide commands for attach/status/cleanup

Present the formatted list from the skill to the user.
