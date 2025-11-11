---
allowed-tools: Bash(git merge:*), Bash(git checkout:*), Bash(git switch:*), Bash(git status:*), Bash(git log:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(git push:*), Bash(git worktree:*)
description: Merge worktree, push changes, cleanup worktree and branch in one operation
---

## Context

- Current directory: !`pwd`
- Current branch: !`git branch --show-current`
- Git status (check if clean): !`git status --porcelain`
- Default branches available: !`git branch --list main master`
- Existing worktrees: !`git worktree list --porcelain`
- All branches: !`git branch -a --format='%(refname:short)'`

## Your task

Complete workflow to merge a worktree's branch, push changes, and clean up the worktree and branch. **This is a comprehensive operation with safety checks.**

**STEP 1 - Analysis and Confirmation (ALWAYS DO THIS FIRST):**

If no branch name provided, ask user: "Which worktree branch should I merge and clean up?"

Then analyze and present a comprehensive plan:

1. **Safety checks:**
   - If `git status --porcelain` shows output, STOP and warn: "Working directory must be clean"
   - If source branch is main/master, STOP and warn: "Cannot merge and cleanup main/master branch"
   - Verify source branch exists

2. **Target branch detection:**
   - Detect main/master (prefer main if both exist)

3. **Merge preview:**
   - Show commits to merge: `git log {target}..{source} --oneline --decorate`
   - Check for merge conflicts (if possible): `git merge-tree $(git merge-base {target} {source}) {target} {source}`

4. **Worktree identification:**
   - Parse `git worktree list --porcelain` to find worktree for the source branch
   - Check worktree status (locked/unlocked)

5. **Remote tracking:**
   - Check if target branch tracks remote: `git rev-parse --abbrev-ref {target}@{upstream}`

6. **Present comprehensive plan:**
   ```
   Plan Summary:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Source branch: {source-branch}
   Target branch: {target-branch}
   Worktree path: {worktree-path}
   Commits to merge: {count} commits

   Operations to perform:
   1. Switch to {target-branch}
   2. Merge {source-branch} into {target-branch}
   3. Push {target-branch} to origin
   4. Remove worktree at {worktree-path}
   5. Delete {source-branch}

   ⚠️  This is a destructive operation that cannot be easily undone.
   ```

7. **Ask user:** "Proceed with merge, push, and cleanup? (yes/no)"

**STEP 2 - Execute Full Workflow (ONLY AFTER USER CONFIRMS):**

Execute all operations sequentially, stopping immediately if any step fails:

1. **Switch to target branch:**
   ```bash
   git switch {target-branch}
   ```
   - Verify success before continuing

2. **Merge source branch:**
   ```bash
   git merge {source-branch}
   ```
   - **If conflicts:** STOP, report conflicted files, provide resolution instructions
   - **If success:** Continue to next step

3. **Push to origin:**
   ```bash
   git push origin {target-branch}
   ```
   - If not tracking remote, use: `git push -u origin {target-branch}`
   - **If push fails:** STOP and report error (might need to pull first)

4. **Remove worktree:**
   ```bash
   git worktree remove {worktree-path}
   ```
   - If worktree has uncommitted changes, use: `git worktree remove --force {worktree-path}`
   - **If removal fails:** STOP and report error

5. **Delete source branch:**
   ```bash
   git branch -d {source-branch}
   ```
   - **If branch not fully merged:** Report warning but confirm it was just merged
   - **If delete fails:** Report error but note that merge/push were successful

6. **Final report:**
   ```
   ✅ Merge, Push, and Cleanup Complete
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✓ Merged {source-branch} into {target-branch}
   ✓ Pushed {target-branch} to origin
   ✓ Removed worktree at {worktree-path}
   ✓ Deleted branch {source-branch}

   Current branch: {target-branch}
   Remaining worktrees: {count}
   ```

**Error Handling:**

If ANY step fails:
1. Report which step failed and why
2. Describe current state clearly
3. Provide manual recovery instructions
4. DO NOT continue to subsequent steps

**Critical Safety Rules:**
- NEVER proceed if working directory is not clean
- NEVER merge/cleanup main/master branches
- NEVER auto-resolve merge conflicts
- ALWAYS ask for confirmation before executing
- STOP immediately if any step fails
- Report clear status after each operation
- Provide recovery instructions if operations fail mid-process

**Common Failure Scenarios:**

1. **Merge conflicts:**
   - Stop at merge step
   - List conflicted files
   - Instruct user to resolve conflicts manually
   - Do NOT attempt cleanup operations

2. **Push fails (e.g., remote has changes):**
   - Stop at push step
   - Merge is complete locally but not pushed
   - Instruct user to pull and retry
   - Do NOT cleanup worktree/branch yet

3. **Worktree locked or in use:**
   - Stop at worktree removal
   - Merge and push are complete
   - Instruct user to close processes using worktree
   - Branch deletion can be done separately

4. **Branch delete fails:**
   - All other operations succeeded
   - Branch might have unpushed commits elsewhere
   - Provide manual deletion command: `git branch -D {branch}`
