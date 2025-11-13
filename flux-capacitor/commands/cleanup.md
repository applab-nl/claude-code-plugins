---
name: cleanup
description: Safely merge worktree changes and cleanup flux-capacitor session
---

You are executing the **flux-capacitor /cleanup** command to safely merge a completed task and clean up the isolated environment.

## User Input

The user provided a task ID: **{{arguments}}**

## Your Task

Execute the cleanup workflow to:
1. Verify the worktree exists
2. Check for uncommitted changes
3. Merge changes back to the source tree
4. Remove the worktree
5. Delete the feature branch
6. Kill the tmux session
7. Report results to the user

## Critical Requirements

**SAFETY FIRST:**
- ✅ NEVER lose uncommitted work
- ✅ ALWAYS merge before cleanup
- ✅ Handle merge conflicts gracefully
- ✅ Preserve state on failures
- ✅ Allow retry after fixes

## Workflow

### Step 1: Validate Task ID

Ensure the task ID provided is valid and a corresponding worktree exists.

### Step 2: Execute Cleanup Script

Run the cleanup script:
```bash
${CLAUDE_PLUGIN_ROOT}/scripts/cleanup-session.sh <task-id>
```

The script will:
1. Find the worktree by task ID
2. Check for uncommitted changes
3. If uncommitted changes exist:
   - Prompt user to: commit, discard, or abort
   - Wait for user choice
   - Act accordingly
4. Merge feature branch to current branch
5. If merge conflicts:
   - Show conflict message
   - Preserve worktree for resolution
   - Exit with instructions
6. If merge successful:
   - Remove worktree
   - Delete feature branch
   - Kill tmux session
7. Show success summary

### Step 3: Handle Script Output

The script provides interactive prompts and detailed output. Your job is to:
- Present the information clearly to the user
- If conflicts occur, explain how to resolve them
- If successful, confirm what was cleaned up
- Provide next steps if applicable

## User Interaction

### If Uncommitted Changes Detected

The script will prompt:
```
⚠️  WARNING: Uncommitted changes detected in worktree!

 M src/auth/oauth.ts
 M src/components/OAuthButton.tsx
?? src/auth/oauth.test.ts

Options:
  1) Commit changes now
  2) Discard changes (DANGEROUS)
  3) Abort cleanup
Choice [1/2/3]:
```

Pass this through to the user and wait for their choice.

### If Merge Conflicts Occur

The script will output:
```
❌ Merge conflicts detected!

CONFLICT (content): Merge conflict in src/auth/index.ts

Please resolve conflicts manually, then run:
  git merge --continue
  /cleanup <task-id>  # Run cleanup again
```

Present this to the user with additional context:
- Explain that conflicts are normal when main branch changed during development
- Guide them to resolve conflicts
- Remind them they can re-run `/cleanup <task-id>` after resolution
- The worktree is preserved for conflict resolution

### If Cleanup Succeeds

The script outputs a success summary. Present it clearly:
```
✅ Cleanup complete!

Summary:
  • Changes merged to: main
  • Worktree removed: ../myapp-oauth-a1b2c3
  • Branch deleted: feature/oauth-a1b2c3
  • Session terminated: flux-myapp-oauth-a1b2c3

Your changes are now in the main branch.
```

Optionally suggest next steps:
- Review the merged changes: `git log`
- Run tests to verify: `npm test` or similar
- Create PR if working with remotes: `gh pr create`

## Error Handling

Common errors:

**Task ID not found:**
```
❌ Worktree not found for task ID: <task-id>

No active flux-capacitor session with this task ID.

List active sessions: /flux-list
```

**Not in git repo:**
```
❌ Not in a git repository

Navigate to your project directory first.
```

**Script execution failed:**
```
❌ Cleanup failed: <error-message>

Please check the error above and try again.
If the issue persists, you may need to manually:
  1. Navigate to worktree: cd ../<project>-<task-id>
  2. Commit changes: git add -A && git commit
  3. Return to main: cd <original-path>
  4. Merge: git merge feature/<task-id>
  5. Remove worktree: git worktree remove ../<project>-<task-id>
  6. Kill session: tmux kill-session -t flux-<project>-<task-id>
```

## Script Location

The cleanup script is at: `${CLAUDE_PLUGIN_ROOT}/scripts/cleanup-session.sh`

## Example Execution

```bash
# User runs:
/cleanup oauth-a1b2c3

# You execute:
${CLAUDE_PLUGIN_ROOT}/scripts/cleanup-session.sh oauth-a1b2c3

# Script output (success case):
🔍 Cleanup: oauth-a1b2c3

✓ Worktree found: /Users/alice/projects/myapp-oauth-a1b2c3
✓ No uncommitted changes
✓ Current branch: main
✓ Merging feature/oauth-a1b2c3 into main...
✓ Merge successful!
✓ Removing worktree: /Users/alice/projects/myapp-oauth-a1b2c3
✓ Deleting branch: feature/oauth-a1b2c3
✓ Killing tmux session: flux-myapp-oauth-a1b2c3

✅ Cleanup complete!

Summary:
  • Changes merged to: main
  • Worktree removed: /Users/alice/projects/myapp-oauth-a1b2c3
  • Branch deleted: feature/oauth-a1b2c3
  • Session terminated: flux-myapp-oauth-a1b2c3
```

## Important Notes

- **This is a destructive operation**: Worktree and branch are deleted (after merge)
- **Always merge first**: Changes are preserved in the main branch
- **Interactive prompts**: User may need to respond during cleanup
- **Idempotent**: Can safely re-run after fixing conflicts
- **Safe defaults**: Aborts on errors rather than losing work

Execute the cleanup workflow now!
