---
allowed-tools: Bash(git worktree:*), Bash(git branch:*), Bash(git status:*), Bash(pwd:*)
description: Create a new git worktree for isolated feature development
---

## Context

- Current directory: !`pwd`
- Current branch: !`git branch --show-current`
- Existing worktrees: !`git worktree list`

## Your task

Create a new git worktree for isolated feature development.

**Steps:**
1. Ask the user for:
   - Branch name (e.g., `feature/new-feature`)
   - Optional: Base branch (defaults to current branch)
   - Optional: Custom worktree directory name (defaults to repo-name-branch-name)

2. Create the worktree:
   - If branch doesn't exist, create it from the base branch
   - Create worktree in a sibling directory to the current repository
   - Use naming convention: `{repo-name}-{branch-name-sanitized}`

3. Confirm creation and provide:
   - Worktree path
   - Branch name
   - Command to navigate: `cd {worktree-path}`

**Example:**
```bash
# For branch feature/oauth-implementation
# Current repo: /Users/alice/projects/my-app
# Creates worktree: /Users/alice/projects/my-app-feature-oauth-implementation
git worktree add /Users/alice/projects/my-app-feature-oauth-implementation feature/oauth-implementation
```

Be clear, concise, and confirm successful creation.
