---
name: run
description: Launch flux-capacitor session for parallel feature development
---

You are executing the **flux-capacitor /run** command to launch a new parallel development session.

## User Input

The user provided a task description: **{{arguments}}**

## Your Task

Orchestrate the flux-capacitor workflow to:
1. Generate a unique task ID
2. Create an isolated git worktree
3. Launch a tmux session/pane with Claude Code
4. Send the meta prompt to the new session
5. Report success and provide instructions to the user

## Workflow Steps

### Step 1: Parse and Validate

Extract the task description from the command arguments. The task description should be everything after `/run`.

Example inputs:
- `/run Add OAuth authentication with Google and GitHub`
- `/run Implement real-time notifications using Supabase`
- `/run Refactor authentication system for better security`

### Step 2: Generate Task ID

Create a unique task ID by combining:
- Task slug (from description)
- Unique identifier

Execute the following to generate:
```bash
${CLAUDE_PLUGIN_ROOT}/scripts/lib/common.sh
```

Use the `generate_task_id` and `slugify` functions to create:
- Slug from task description (e.g., "oauth-authentication")
- Unique ID (e.g., "a1b2c3")
- Combined task ID (e.g., "oauth-authentication-a1b2c3" or just "a1b2c3-oauth")

Keep it short and readable (max 50 chars).

### Step 3: Create Worktree

Execute the create-worktree script:
```bash
${CLAUDE_PLUGIN_ROOT}/scripts/create-worktree.sh <task-id> <project-name>
```

This will:
- Create branch: `feature/<task-id>`
- Create worktree: `../<project>-<task-id>`
- Run initialization scripts (if any)
- Return absolute path to worktree

Capture the output worktree path for next steps.

### Step 4: Launch Session

Execute the launch-session script:
```bash
${CLAUDE_PLUGIN_ROOT}/scripts/launch-session.sh <worktree-path> <task-id> <project-name>
```

This will:
- Detect if in tmux
- Create tmux pane (if in tmux) OR new session (if not)
- Launch Claude Code with `--dangerously-skip-permissions`
- Return either `PANE:<pane-id>` or `SESSION:<session-name>`

Parse the output to determine what was created.

### Step 5: Send Meta Prompt

Execute the send-prompt script:
```bash
${CLAUDE_PLUGIN_ROOT}/scripts/send-prompt.sh <target> <task-description> <worktree-path> <branch-name> <project-name>
```

Where:
- `target` is the pane ID or session name from step 4
- `task-description` is the original user input
- `worktree-path` is from step 3
- `branch-name` is `feature/<task-id>`
- `project-name` is current project name

This sends the meta prompt template to the new Claude session.

### Step 6: Report Success

Based on whether a pane or session was created, provide appropriate output:

**If PANE was created (user was in tmux):**
```
<¯ Flux Capacitor Session Created!

  Task ID: <task-id>
  Tmux Pane: <pane-id>
  Worktree: <worktree-path>
  Branch: feature/<task-id>

=Í Switch to pane:
   Ctrl+b, q ’ <pane-number>

The flux-capacitor agent is working on your task in parallel.

When complete: /cleanup <task-id>
```

**If SESSION was created (user not in tmux):**
```
<¯ Flux Capacitor Session Created!

  Task ID: <task-id>
  Session: <session-name>
  Worktree: <worktree-path>
  Branch: feature/<task-id>

=Í Attach to session:
   tmux attach -t <session-name>

   Or use shorthand:
   tmux a -t <session-name>

The flux-capacitor agent is working on your task in the background.

=¡ Tip: You can detach anytime with Ctrl+b, d
      The session will keep running.

When complete: /cleanup <task-id>
```

## Error Handling

If any step fails:
1. Log the error clearly
2. Provide diagnostic information
3. Clean up any partial state (worktree, session)
4. Suggest solutions

Common errors:
- **Not in git repo**: Tell user to navigate to a git repository
- **Worktree creation failed**: Check if branch already exists, disk space
- **Tmux not installed**: Inform user tmux is required, provide install instructions
- **Session already exists**: Provide session name and how to attach

## Script Locations

All scripts are located at: `${CLAUDE_PLUGIN_ROOT}/scripts/`

Where `CLAUDE_PLUGIN_ROOT` points to the flux-capacitor plugin directory.

## Example Execution

```bash
# User runs:
/run Add OAuth authentication with Google and GitHub

# You execute:
1. task_id="a1b2c3-oauth"
2. worktree_path=$(${CLAUDE_PLUGIN_ROOT}/scripts/create-worktree.sh a1b2c3-oauth myapp)
   # Returns: /Users/alice/projects/myapp-a1b2c3-oauth
3. target=$(${CLAUDE_PLUGIN_ROOT}/scripts/launch-session.sh "$worktree_path" a1b2c3-oauth myapp)
   # Returns: SESSION:flux-myapp-a1b2c3-oauth
4. ${CLAUDE_PLUGIN_ROOT}/scripts/send-prompt.sh flux-myapp-a1b2c3-oauth "Add OAuth..." "$worktree_path" feature/a1b2c3-oauth myapp
5. Report success with session info
```

## Important Notes

- **Be concise**: The user wants to get the session launched quickly
- **Provide clear instructions**: Make it easy to attach/switch to the session
- **Save the task ID**: User will need it for cleanup later
- **Confirm success**: Let user know the agent is working in parallel

Start the workflow now!
