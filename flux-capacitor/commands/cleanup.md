---
name: cleanup
description: Safely merge worktree changes and cleanup flux-capacitor session
---

Invoke the **flux-orchestrator** skill to safely merge and cleanup a completed session.

## Task ID

The user wants to cleanup: **{{arguments}}**

## Your Action

Invoke the flux-orchestrator skill with operation "CLEANUP":

```
/skill flux-orchestrator
```

Then provide the skill with:
- **Operation**: CLEANUP
- **Task ID**: {{arguments}}

The skill will:
1. Execute the cleanup script with the task ID
2. Handle user prompts for uncommitted changes
3. Merge the feature branch (with conflict handling)
4. Remove the worktree and branch
5. Kill the tmux session
6. Report results

The skill's script is interactive and will prompt the user if needed. Present all output and guidance from the skill to the user.
