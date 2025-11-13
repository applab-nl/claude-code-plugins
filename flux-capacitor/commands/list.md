---
name: flux-list
description: List all active flux-capacitor sessions
---

You are executing the **flux-capacitor /flux-list** command to show all active parallel development sessions.

## Your Task

Display a formatted list of all active flux-capacitor sessions with their details.

## Workflow

### Step 1: Execute List Script

Run the list-sessions script:
```bash
${CLAUDE_PLUGIN_ROOT}/scripts/list-sessions.sh
```

This will:
- Find all tmux sessions matching `flux-*` pattern
- Extract task IDs and project names
- Check worktree paths and status
- Get session uptime
- Format into a readable list

### Step 2: Present Results

The script outputs a formatted list. Present it clearly to the user:

**Example output (with sessions):**
```
Active Flux Capacitor Sessions:

1. flux-myapp-oauth-a1b2c3
   Task ID: oauth-a1b2c3
   Worktree: /Users/alice/projects/myapp-oauth-a1b2c3
   Branch: feature/oauth-a1b2c3
   Uptime: 2h 34m

2. flux-myapp-notifications-def456
   Task ID: notifications-def456
   Worktree: /Users/alice/projects/myapp-notifications-def456
   Branch: feature/notifications-def456
   Uptime: 45m

Total: 2 active session(s)

Commands:
  Attach: tmux attach -t <session-name>
  Status: /flux-status <task-id>
  Cleanup: /cleanup <task-id>
```

**Example output (no sessions):**
```
No active flux-capacitor sessions found.

Start a new session: /run <task-description>
```

### Step 3: Provide Context

After showing the list, optionally provide helpful context:

**If sessions exist:**
- Remind user how to attach to a session
- Suggest using `/flux-status` for detailed info
- Mention `/cleanup` when tasks are complete
- Note that sessions run in the background

**If no sessions:**
- Explain how to start a new session
- Provide an example: `/run Add user authentication`
- Mention that flux enables parallel development

## What the Output Means

Help users understand the information:

**Session name:** `flux-<project>-<task-id>`
- Unique identifier for the tmux session
- Used for attaching: `tmux attach -t <name>`

**Task ID:**
- Short identifier for this specific task
- Used for status checks and cleanup
- Example: `oauth-a1b2c3`

**Worktree:**
- Isolated git working directory
- Separate from main project
- Can develop multiple features in parallel

**Branch:**
- Git branch for this task
- Will be merged back when cleaned up
- Format: `feature/<task-id>`

**Uptime:**
- How long the session has been running
- Helps track which sessions might be stale

## Common User Questions

**Q: How do I see what's happening in a session?**
A: `tmux attach -t <session-name>` or `/flux-status <task-id>`

**Q: Can I have multiple sessions for the same project?**
A: Yes! That's the purpose - parallel development

**Q: How do I clean up old sessions?**
A: `/cleanup <task-id>` when the task is complete

**Q: What if a session shows but worktree is [NOT FOUND]?**
A: This means the worktree was deleted manually. Kill the session with:
   `tmux kill-session -t <session-name>`

## Script Location

The list script is at: `${CLAUDE_PLUGIN_ROOT}/scripts/list-sessions.sh`

## Example Execution

```bash
# User runs:
/flux-list

# You execute:
${CLAUDE_PLUGIN_ROOT}/scripts/list-sessions.sh

# Present the formatted output to the user
```

## Important Notes

- **Quick overview**: Shows all parallel work at a glance
- **Session discovery**: Find sessions you might have forgotten
- **Status check**: See uptime to identify stale sessions
- **No modification**: This command only reads, never changes state

Execute the list command now!
