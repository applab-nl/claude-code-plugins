---
allowed-tools: Bash(git worktree:*), Bash(git branch:*), Bash(git status:*), Bash(pwd:*)
description: Remove a git worktree and optionally delete its branch
---

## Context

- Current directory: !`pwd`
- Existing worktrees: !`git worktree list`
- All branches: !`git branch -a`

## Your task

Remove a git worktree and optionally delete its associated branch.

**Safety checks:**
1. Verify the worktree exists
2. Verify we're NOT currently in the worktree being removed
3. Check for uncommitted changes in the worktree

**Steps:**
1. Ask the user:
   - Worktree path or branch name to remove
   - Whether to also delete the branch (yes/no)
   - Whether to force removal if there are uncommitted changes (--force)

2. Check worktree status:
   ```bash
   git worktree list
   ```

3. Remove the worktree:
   ```bash
   # Without force
   git worktree remove /path/to/worktree

   # With force (if user confirmed)
   git worktree remove --force /path/to/worktree
   ```

4. Optionally delete the branch (if user requested):
   ```bash
   # Delete merged branch
   git branch -d branch-name

   # Force delete (if not merged and user confirmed)
   git branch -D branch-name
   ```

5. Confirm removal:
   - Show remaining worktrees
   - Confirm branch deletion if performed
   - Remind user that the worktree directory itself may still exist

**Important:**
- NEVER remove worktree without user confirmation
- Warn if worktree has uncommitted changes
- Explain implications of branch deletion
- Do NOT delete main/master branches
- Prevent removal if currently in the worktree directory

**Example workflow:**
```bash
# List worktrees
git worktree list

# Remove worktree (keeps branch)
git worktree remove /Users/alice/projects/my-app-feature-oauth

# Remove worktree and delete branch
git worktree remove /Users/alice/projects/my-app-feature-oauth
git branch -d feature/oauth-implementation
```

Be clear about what will be deleted and what will be preserved.
