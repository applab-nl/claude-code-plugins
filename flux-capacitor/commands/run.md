---
name: run
description: Launch flux-capacitor session for parallel feature development
---

# ⚠️ DELEGATION TASK - DO NOT IMPLEMENT DIRECTLY

The user wants to **delegate** this task to a separate isolated Claude session:

> **Task**: {{arguments}}

## YOUR ONLY JOB RIGHT NOW

1. **Invoke the `flux-orchestrator` skill** using the Skill tool
2. **Execute ONLY the "Operation: RUN" section** of that skill
3. **Do NOT implement the task yourself**

## Action Required - Execute Immediately

**Step 1**: Use the Skill tool with parameter `skill = "flux-orchestrator"`

**Step 2**: When the skill prompt appears, look for the **"Operation: RUN"** section and follow ONLY those instructions.

**Step 3**: The RUN operation will:
- Generate a task ID
- Create an isolated git worktree
- Launch a NEW Claude session in tmux
- Send this task to that NEW session

You are **delegating**, not implementing. The new session does the actual work.
