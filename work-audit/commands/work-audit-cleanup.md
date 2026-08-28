---
allowed-tools: Bash(git push:*), Bash(git branch:*), Bash(git worktree:*), Bash(git log:*), Bash(git merge-base:*), Bash(git cherry:*), Bash(git status:*), Bash(git stash list:*), Bash(git for-each-ref:*), Bash(git rev-parse:*), Bash(gh pr merge:*), Bash(gh pr close:*), Bash(gh pr create:*), Bash(gh pr list:*), Bash(gh pr view:*), Bash(phantom delete:*)
description: Execute the cleanup a work audit recommended — preserve at-risk work first, then delete merged branches, remove finished worktrees and close superseded PRs
argument-hint: [phase]
---

Execute the work-audit cleanup using the `work-audit-cleanup` skill.

Scope: ${ARGUMENTS:-all phases, confirming before each destructive group}

This is an explicit invocation, so do not ask whether to begin. Do still confirm before each
destructive group — that gate is about protecting data, not about consent to run.

This performs **destructive** git operations. Before starting:

- Require a current audit from this session. If there isn't one, run `/work-audit` first — acting on
  a stale audit is how live work gets deleted.
- Complete the preservation phase before beginning any deletion. If a push fails, stop and report.
- Re-verify each branch's merge state at the moment of deletion rather than trusting the audit table.
- Use `git branch -d`, never `-D`. A refusal is the safety net working.

Report what actually happened, including anything skipped and why.
