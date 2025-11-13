---
name: run
description: Launch flux-capacitor session for parallel feature development
---

Invoke the **flux-orchestrator** skill to launch a new parallel development session.

## Task Description

The user wants to work on: **{{arguments}}**

## Your Action

Invoke the flux-orchestrator skill with operation "RUN":

```
/skill flux-orchestrator
```

Then provide the skill with:
- **Operation**: RUN
- **Task Description**: {{arguments}}

The skill will:
1. Generate a unique task ID
2. Create an isolated git worktree
3. Launch a tmux pane/session with Claude Code
4. Send the meta prompt with quality gates
5. Report success and provide instructions

That's it! The skill handles all the orchestration.
