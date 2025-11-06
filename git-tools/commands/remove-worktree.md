---
allowed-tools: Bash(git worktree:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(git merge-base:*), Bash(git log:*)
description: Remove a git worktree and optionally delete its branch
---

## Context

- Current directory: !`pwd`
- Current worktree: !`git rev-parse --show-toplevel`
- Existing worktrees: !`git worktree list --porcelain`
- All branches: !`git branch --format='%(refname:short)'`
- Default branch: !`git branch --list main master`

## Your task

Remove a git worktree and optionally delete its associated branch. **This is a two-step process for safety.**

**STEP 1 - Analysis and Confirmation (ALWAYS DO THIS FIRST):**

If no worktree path/branch provided, ask user: "Which worktree should I remove? (provide path or branch name)"

Then analyze and present:

1. **Find worktree:** Parse `git worktree list --porcelain` to find the matching worktree
2. **Current location check:** If worktree path matches current directory, STOP and warn: "Cannot remove current worktree. Navigate elsewhere first."
3. **Protected branch check:** If branch is main/master, STOP and warn: "Cannot remove main/master branch worktree"
4. **Uncommitted changes:** Check if worktree has uncommitted changes (look for "locked" in porcelain output)
5. **Branch merge status:** Check if branch is merged: `git merge-base --is-ancestor {branch} main`
6. **Present summary:**
   ```
   Worktree: {path}
   Branch: {branch}
   Status: {clean/uncommitted changes}
   Merged to main: {yes/no}

   Actions:
   - Remove worktree: yes
   - Delete branch: {auto-yes if merged, ask if not merged}
   - Force: {needed if uncommitted changes}
   ```

7. **Ask user:** "Proceed with removal? (yes/no)"

**STEP 2 - Execute Removal (ONLY AFTER USER CONFIRMS):**

1. Remove worktree:
   ```bash
   git worktree remove {path}           # if clean
   git worktree remove --force {path}   # if uncommitted changes
   ```

2. Delete branch (if confirmed):
   ```bash
   git branch -d {branch}    # if merged
   git branch -D {branch}    # if not merged and user confirmed
   ```

3. Report success:
   - Confirm worktree removed
   - Confirm branch deleted (if applicable)
   - Show remaining worktrees

**Critical Safety Rules:**
- NEVER remove main/master worktrees
- NEVER remove current worktree
- ALWAYS warn about uncommitted changes
- ALWAYS ask for confirmation before executing
- Auto-delete branch only if fully merged
- STOP immediately if any safety check fails
