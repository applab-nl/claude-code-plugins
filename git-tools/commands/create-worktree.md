---
allowed-tools: Bash(git worktree:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(basename:*), Bash(dirname:*)
description: Create a new git worktree for isolated feature development
argument-hint: [branch-name]
---

## Context

- Current directory: !`pwd`
- Repository root: !`git rev-parse --show-toplevel`
- Current branch: !`git branch --show-current`
- Existing worktrees: !`git worktree list`
- Repository name: !`basename $(git rev-parse --show-toplevel)`

## Your task

Create a new git worktree for isolated feature development.

**If no branch name provided:** Ask user for branch name only, then proceed.

**Steps:**
1. Generate worktree path:
   - Get repo root parent directory: `dirname $(git rev-parse --show-toplevel)`
   - Get repo name: `basename $(git rev-parse --show-toplevel)`
   - Sanitize branch name (replace `/` with `-`)
   - Path: `{parent-dir}/{repo-name}-{sanitized-branch}`

2. Create the worktree:
   ```bash
   # If branch doesn't exist, it will be created from current branch
   git worktree add /path/to/worktree branch-name
   ```

3. Report success with:
   - Worktree path
   - Branch name
   - Navigation command

**Important:**
- Use current branch as base (automatic with git worktree add)
- Create worktree in sibling directory to main repo
- Keep output concise - just report path and branch
