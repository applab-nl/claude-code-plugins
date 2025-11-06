---
allowed-tools: Bash(git merge:*), Bash(git checkout:*), Bash(git switch:*), Bash(git status:*), Bash(git log:*), Bash(git branch:*), Bash(git rev-parse:*)
description: Merge a worktree's branch back to main or base branch
---

## Context

- Current directory: !`pwd`
- Current branch: !`git branch --show-current`
- Git status (check if clean): !`git status --porcelain`
- Default branches available: !`git branch --list main master`
- All branches: !`git branch -a --format='%(refname:short)'`

## Your task

Merge a feature branch from a worktree back to the main/base branch. **This is a two-step process for safety.**

**STEP 1 - Analysis and Confirmation (ALWAYS DO THIS FIRST):**

If no branch name provided, ask user: "Which branch should I merge?"

Then analyze and present:
1. **Safety check:** If `git status --porcelain` shows output, STOP and warn: "Working directory must be clean before merging"
2. **Target branch:** Detect main/master (prefer main if both exist)
3. **Source branch:** Verify it exists
4. **Commits to merge:** Show `git log {target}..{source} --oneline`
5. **Ask user:** "Ready to merge {source} into {target}? This will switch to {target} and merge. (yes/no)"

**STEP 2 - Execute Merge (ONLY AFTER USER CONFIRMS):**

1. Switch to target branch:
   ```bash
   git switch main
   ```

2. Perform merge:
   ```bash
   git merge {source-branch}
   ```

3. Handle result:
   - **Success:** Report merge commit, remind user about `/remove-worktree`
   - **Conflicts:** Show conflicted files, provide resolution instructions, DO NOT auto-resolve
   - **Error:** Report error clearly

**Critical Safety Rules:**
- NEVER merge if working directory is not clean
- NEVER auto-resolve conflicts
- ALWAYS ask for confirmation before executing merge
- STOP immediately if any safety check fails
