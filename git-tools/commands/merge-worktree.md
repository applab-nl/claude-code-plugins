---
allowed-tools: Bash(git merge:*), Bash(git checkout:*), Bash(git status:*), Bash(git log:*), Bash(git branch:*), Bash(pwd:*)
description: Merge a worktree's branch back to main or base branch
---

## Context

- Current directory: !`pwd`
- Current branch: !`git branch --show-current`
- Git status: !`git status --porcelain`
- Recent commits on current branch: !`git log --oneline -5`

## Your task

Merge a feature branch from a worktree back to the main/base branch.

**Safety checks:**
1. Verify current working directory is clean (no uncommitted changes)
2. Verify we're on the target branch (main/master) or switch to it
3. Verify source branch exists and has commits to merge

**Steps:**
1. Ask the user:
   - Branch name to merge (e.g., `feature/oauth-implementation`)
   - Target branch (defaults to `main`)
   - Merge strategy: `--ff-only`, `--no-ff`, or default

2. Switch to target branch if needed:
   ```bash
   git checkout main
   ```

3. Perform the merge:
   ```bash
   git merge feature/oauth-implementation
   ```

4. Handle conflicts:
   - If conflicts occur, inform user and show conflicted files
   - Provide clear instructions for resolution
   - Do NOT auto-resolve conflicts

5. Confirm successful merge:
   - Show merge commit details
   - Show updated branch status

**Important:**
- NEVER force merge or skip conflict resolution
- Always verify clean working directory before merging
- Provide clear error messages if preconditions aren't met

After successful merge, remind user they can remove the worktree with `/git-tools:remove-worktree`.
