---
allowed-tools: Bash(git log:*), Bash(git branch:*), Bash(git for-each-ref:*), Bash(git rev-list:*), Bash(git merge-base:*), Bash(git cherry:*), Bash(git show:*), Bash(git diff:*), Bash(git status:*), Bash(git stash list:*), Bash(git ls-tree:*), Bash(git grep:*), Bash(git worktree list:*), Bash(git rev-parse:*), Bash(git fetch:*), Bash(gh pr list:*), Bash(gh pr view:*), Bash(gh issue list:*), Bash(openspec list:*)
description: Audit all outstanding work — branches, worktrees, PRs, tickets, planning artifacts — verified against the trunk, with a report and close-down plan
argument-hint: [trunk-ref]
---

Run a full work audit of this repository using the `work-audit` skill.

Trunk reference: ${ARGUMENTS:-auto-detect (origin/main, then origin/master)}

**This is an explicit invocation — begin immediately.** The skill asks for confirmation when it fires
on inference rather than a direct request; that gate does not apply here, and asking the user to
confirm what they just typed would be an irritation, not a courtesy.

This is a **read-only** investigation. Do not create, delete, rebase or check out branches. Follow
the skill's order of work:

1. Inventory branches, worktrees, PRs, tracker tickets, planning artifacts and parallel sessions.
2. Classify every branch with both merge signals (ancestry and patch-id).
3. Identify work that exists in exactly one place — the only true loss risk.
4. Verify claimed statuses against the trunk by reading the code, not the record.
5. Subtract work targeting retired subsystems.
6. Produce the report and the phased plan.

Delegate the high-volume sweeps to parallel subagents where available, and keep only their
conclusions. Give exact numbers, cite the evidence for every status claim, and mark anything you
could not verify as unverified rather than guessing.
