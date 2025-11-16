# Invoke Flux Skill

**CRITICAL: Validation Required Before Proceeding**

## Step 1: Validate Arguments

Check if the user provided a task description/prompt after the command.

If NO prompt provided:
```
❌ Error: Task description required

Usage: /invoke-flux-skill <task description>

Example:
  /invoke-flux-skill Add OAuth authentication with Google and GitHub
  /invoke-flux-skill Fix performance issue in dashboard data loading
  /invoke-flux-skill Implement user profile management with avatar upload
```

Stop here if no prompt provided.

## Step 2: Validate Tmux Session

Check if we're currently running in a tmux session:

```bash
if [ -z "$TMUX" ]; then
  echo "❌ Error: Not running in a tmux session"
  echo ""
  echo "The flux-skill requires tmux for proper isolation and management."
  echo ""
  echo "To start tmux:"
  echo "  tmux"
  echo ""
  echo "Or attach to existing session:"
  echo "  tmux attach"
  exit 1
fi
```

If not in tmux, display the error and stop.

## Step 3: Extract Task Description

The task description is everything after `/invoke-flux-skill`.

Store it in a variable for the skill invocation.

## Step 4: Invoke Flux Skill

Now that validation is complete, use the flux-skill to handle the task:

```
I'm invoking the flux-skill to handle your task: "<task description>"

The flux-skill will:
1. Create a comprehensive ultrathink plan
2. Delegate to specialist subagents as needed
3. Implement with comprehensive testing
4. Ensure code review and security review
5. Provide a detailed completion report

Starting now...
```

Then invoke: `/skill flux-skill`

After the skill is invoked, immediately provide the task to it:

```
Task: <task description>

Please begin by creating a comprehensive ultrathink plan for this task.
```

---

## Important Notes

- This command acts as a validated entry point to the flux-skill
- All validation happens in the command, not the skill
- The skill focuses purely on implementation orchestration
- Tmux is required for proper worktree and session management (handled externally)
