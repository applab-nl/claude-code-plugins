---
name: work-audit-cleanup
description: Execute the cleanup a work audit recommended — push at-risk branches to a remote, delete branches verified as merged, remove finished worktrees, prune orphan directories, and close superseded pull requests. Use this only after an audit has established what is safe, when the user explicitly asks to carry it out: "do the cleanup", "delete the merged branches", "clean up the worktrees", "execute phase 4", "go ahead and tidy it up". This performs destructive git operations, so it always preserves before it deletes and confirms before each destructive group.
---

# Work Audit Cleanup

## Before anything

This skill deletes things. That is its whole purpose, and it is why it is separate from the audit —
the audit is read-only so it can be run freely, and this is opt-in so it cannot happen by accident.

**Require a current audit.** If one has not been run in this session, run the `work-audit` skill
first. Acting on a stale audit is how live work gets deleted: a branch that was merged last week may
have been reopened, and a worktree that was clean may now hold uncommitted changes.

Re-verify immediately before each destructive step rather than trusting the audit's table. The
verification is two cheap git commands; the mistake it prevents is unrecoverable.

## The ordering rule

**Preservation completes before deletion begins.** Not interleaved — completed. If pushing fails for
any branch, stop and report rather than proceeding to the deletion phases. The entire safety property
of this workflow is that everything exists in two places before anything exists in one.

## Phase 1 — Preserve

Push every branch holding commits that exist on no remote. Include branches you intend to delete
later; the point is to stop being the only copy, not to endorse the content.

```bash
git for-each-ref --format='%(refname:short)' refs/heads | while read -r b; do
  n=$(git log --oneline "$b" --not --remotes | wc -l | tr -d ' ')
  [ "$n" -gt 0 ] && echo "$b ($n commits on no remote)"
done
```

Push them. If the repo has push hooks that fail for unrelated reasons (a typecheck for a toolchain
that is not installed, say), `--no-verify` is legitimate here — you are archiving, not shipping — but
say that you used it and why.

Confirm each push succeeded before continuing. Also handle:

- **Uncommitted changes** in the trunk checkout or any worktree — show them and ask. Never commit on
  the user's behalf without being asked, and never discard.
- **Stashes** — list them with dates and contents. They are usually editor settings and generated
  files, but read before recommending anything.

## Phase 2 — Land what is finished

Merge or close only what the user has agreed to. For each: state what it is, why it is safe, then act.

- Merge PRs that are mergeable with green checks.
- Open PRs for complete, pushed branches that never got one.
- Close superseded PRs **with a comment saying what landed instead**. A closed PR with no explanation
  becomes someone's archaeology problem later.

## Phase 3 — Delete merged branches

Re-verify each branch at the moment of deletion:

```bash
git merge-base --is-ancestor "$b" origin/main && safe=1
[ "$(git cherry origin/main "$b" | grep -c '^+')" -eq 0 ] && safe=1
```

Delete with `-d` (which refuses unmerged branches) rather than `-D`. If `-d` refuses, that is the
safety net working — stop and re-examine rather than reaching for `-D`.

```bash
git branch -d "$b"                    # local
git push origin --delete "$b"         # remote, only when the user asked for remote cleanup
```

Batch these and report the count. Deleting forty merged branches is one action, not forty decisions —
but deleting one *unmerged* branch is always its own decision.

## Phase 4 — Worktrees and orphans

Use the project's worktree tool if it has one (`phantom delete <name> --force`, or similar) so its
own bookkeeping stays consistent. Otherwise:

```bash
git worktree remove <path>            # refuses if dirty — respect that
git worktree prune                    # clears registrations whose directories are gone
```

Before removing any worktree, check it is clean and its branch is pushed. For orphan directories,
confirm nothing is registered *beneath* them — a parent directory of nested worktrees looks like an
orphan and is not.

Migrate anything worth keeping out of a legacy worktree location before removing the directory.

## Phase 5 — Tracker updates

Only if the user asked. Apply the status changes the audit established, and comment the evidence on
each one:

> Closed by work audit: verified on `main` — `20260822100000_maintain_speaker_link_count.sql`
> implements the trigger, default and drift repair this ticket asks for.

A status change without evidence is worse than no change, because it destroys the record of why.

## What to refuse

- Deleting a branch with unique commits that exist on no remote, before it has been pushed.
- Force-pushing, or `git branch -D` on anything the audit did not classify as merged.
- Deleting a worktree with uncommitted changes.
- Rewriting trunk history.
- Acting on an audit from a previous session without re-running it.

If the user insists on one of these after you have explained the risk, that is their call — say so
plainly, do it, and make sure the preservation step ran first.

## Reporting

Close with what actually happened, not what was planned: branches deleted (count), worktrees removed,
PRs merged and closed, tickets updated, and anything skipped with the reason. If something failed
partway, say exactly where it stopped and what state things are in — a half-finished cleanup is the
one outcome that leaves the repository worse than before.
