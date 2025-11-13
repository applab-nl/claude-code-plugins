---
name: flux-status
description: Get detailed status of a flux-capacitor session
---

You are executing the **flux-capacitor /flux-status** command to show detailed information about a specific parallel development session.

## User Input

The user provided a task ID: **{{arguments}}**

## Your Task

Display comprehensive status information for the specified flux-capacitor session, including:
- Session health (running/stopped)
- Worktree status (exists, uncommitted changes, commits ahead)
- Recent activity from the tmux pane
- Next steps and commands

## Workflow

### Step 1: Validate Task ID

Ensure a task ID was provided. If not:
```
❌ Task ID required

Usage: /flux-status <task-id>

Find task IDs: /flux-list
```

### Step 2: Execute Status Script

Run the session-status script:
```bash
${CLAUDE_PLUGIN_ROOT}/scripts/session-status.sh <task-id>
```

This will:
- Check if tmux session exists and is running
- Verify worktree exists
- Get git status (uncommitted changes, commits ahead, last commit)
- Capture recent output from the tmux pane
- Format into detailed status report

### Step 3: Present Results

The script outputs a formatted status report. Present it clearly:

**Example output (running session):**
```
📊 Session Status: oauth-a1b2c3

Session: flux-myapp-oauth-a1b2c3
  Status: ✓ Running
  Uptime: 2h 34m

Worktree: /Users/alice/projects/myapp-oauth-a1b2c3
  Path exists: ✓ Yes
  Branch: feature/oauth-a1b2c3
  Status: 3 files changed
  Commits ahead: 12
  Last commit: 8 minutes ago - Add OAuth callback handler tests

💡 Recent activity (last 15 lines):
  ✓ Created test file: src/auth/oauth.test.ts
  ✓ All tests passing (24 passed, 0 failed)
  ✓ Running code review...
  /agent code-reviewer
  [code-reviewer] Analyzing changes...
  [code-reviewer] ✓ Code quality: PASSED
  [code-reviewer] ✓ Security check: PASSED
  [code-reviewer] No issues found
  ✓ OAuth implementation complete

Commands:
  Attach: tmux attach -t flux-myapp-oauth-a1b2c3
  Cleanup: /cleanup oauth-a1b2c3
```

**Example output (session stopped):**
```
📊 Session Status: oauth-a1b2c3

Session: flux-myapp-oauth-a1b2c3
  Status: ✗ Not running

Worktree: /Users/alice/projects/myapp-oauth-a1b2c3
  Path exists: ✓ Yes
  Branch: feature/oauth-a1b2c3
  Status: 0 files changed
  Commits ahead: 15
  Last commit: 1 hour ago - Complete OAuth implementation with tests

Commands:
  Navigate to worktree: cd /Users/alice/projects/myapp-oauth-a1b2c3
  Cleanup: /cleanup oauth-a1b2c3
```

**Example output (task not found):**
```
❌ Task not found: invalid-task-id

No flux-capacitor session with this task ID.

List active sessions: /flux-list
```

### Step 4: Provide Context

Help users interpret the status:

**Session status:**
- **Running**: Session is active, agent is working
- **Not running**: Session was stopped or crashed

**Worktree status:**
- **Files changed**: Uncommitted modifications exist
- **Commits ahead**: Number of commits not yet merged
- **Last commit**: Most recent commit message and time

**Recent activity:**
- Last 15 lines of output from the session
- Shows what the agent is currently doing
- Helpful for monitoring progress without attaching

## Interpreting Status

Help users understand what they're seeing:

**"Status: ✓ Running, 3 files changed, 12 commits ahead"**
→ Session is actively working. Has 12 commits and 3 uncommitted changes.

**"Status: ✗ Not running, 0 files changed, 15 commits ahead"**
→ Session completed. Work is committed. Ready to cleanup and merge.

**Recent activity shows "✓ Complete"**
→ Task is done. Consider running `/cleanup <task-id>`

**Recent activity shows errors**
→ Session might need attention. Attach to investigate.

## Common User Questions

**Q: Session shows "Not running" but I didn't stop it**
A: Session may have completed, crashed, or been killed. Check the recent activity for clues.

**Q: How do I see more than 15 lines of activity?**
A: Attach to the session: `tmux attach -t <session-name>`

**Q: Status says "0 files changed" but "12 commits ahead"**
A: Perfect! All work is committed. Safe to cleanup and merge.

**Q: Many files changed but low commits ahead**
A: Agent might be working. Check recent activity. Attach if concerned.

## Script Location

The status script is at: `${CLAUDE_PLUGIN_ROOT}/scripts/session-status.sh`

## Example Execution

```bash
# User runs:
/flux-status oauth-a1b2c3

# You execute:
${CLAUDE_PLUGIN_ROOT}/scripts/session-status.sh oauth-a1b2c3

# Present the formatted output to the user
```

## Important Notes

- **Non-invasive**: Only reads status, doesn't modify anything
- **Real-time**: Shows current state of the session
- **Progress monitoring**: Check on long-running tasks
- **Completion detection**: See when a task is done
- **Debug helper**: Recent activity helps diagnose issues

Execute the status command now!
