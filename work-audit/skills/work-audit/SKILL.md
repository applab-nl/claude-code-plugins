---
name: work-audit
description: Audit every piece of outstanding work in a repository — branches, worktrees, pull requests, issue-tracker tickets, stale planning artifacts and parallel agent sessions — verifying each claimed status against what is actually on the trunk, then produce a report and a phased close-down plan. Consult this skill whenever someone sounds disoriented about the state of their work or wants it consolidated, even when they do not ask for an "audit" by name: "I'm lost with everything that's outstanding", "what's still open", "what have we forgotten", "why do we have 40 branches", "which branches can I delete", "what's safe to delete", "is this ticket actually done", "did that ever ship", "clean up the repo", "can I lose anything", before a release or a team handover, when returning to a project after time away, or when the backlog feels larger than the work. Also consult it whenever a status is in doubt and the answer has to come from the code rather than from a ticket, a doc, or a memory. The skill is read-only and changes nothing; when it fires on inference rather than an explicit request it confirms with the user first, and offers a narrower one-question alternative, because a full sweep is minutes of work and should not be a surprise.
---

# Work Audit

## First: were you asked for this, or did you decide it yourself?

A full audit is a heavy operation. It sweeps every branch, worktree, pull request and ticket, reads
code on the trunk to verify each one, usually fans out subagents, and takes minutes rather than
seconds. That is a reasonable price when someone asked for it and a rude surprise when they did not.

**If the user invoked this directly, start work immediately.** A slash command, "run a work audit",
"audit the outstanding work", or anything else that names the operation *is* consent. Do not ask
again — being made to confirm something you just explicitly requested is its own small insult.

**If this skill fired on its own** — the user said something like "I'm lost with everything that's
outstanding" or "why do we have so many branches", and you inferred an audit would help — **stop and
ask before doing any of it.** Use `AskUserQuestion` if available, otherwise ask in plain text. The
confirmation is only useful if it carries the cost and the alternatives, so say:

- what it will do — a read-only sweep of branches, worktrees, PRs, tickets and planning artifacts,
  verifying each status against the trunk;
- roughly what it costs — several minutes, and subagents if they are available;
- that it changes nothing;
- and offer the cheap version, because it is very often what they actually wanted.

The narrow options are worth naming explicitly, since one of them usually answers the real question
in under a minute:

| Instead of the full audit | Answers |
|---|---|
| At-risk work only | "Could I lose anything?" — one script, seconds |
| Branch classification only | "What can I delete?" |
| One ticket or branch verified | "Is this actually done?" |

If they decline, do the narrow thing they asked for and drop the audit entirely. If they accept,
proceed through the order of work below without asking again.

## What this is for

Repositories accumulate a fog: branches nobody remembers, worktrees left behind, tickets whose
status stopped matching reality, planning documents describing work that shipped months ago. The
person asking for this audit usually feels buried. Almost always, they are less buried than they
think — the *record* is wrong, not the work.

So the deliverable is not a list of everything. It is a **trustworthy** picture: a small number of
things that genuinely need attention, separated from a large number of things that only look like
they do, with every claim checked against the code.

## The one discipline that matters

**Never report a status you have not verified against the trunk.**

Tickets, changelogs, handover docs, `NEXT_SESSION.md` files, your own memory of the project, and
even a previous run of this audit are all *claims*. They were true when written. Treat every one as
a hypothesis and go read the trunk.

This is the entire value of the audit. An inventory that restates the tracker is worthless — the
user can already see the tracker. What they cannot see is which parts of it are lying.

Two failure directions, both common, both worth hunting:

- **Claimed open, actually done.** Tickets whose code shipped under a different ticket, planning
  documents at 0% whose work was absorbed elsewhere, parent tickets whose children all closed.
  These inflate the backlog and cost nothing but a status change to remove.
- **Claimed done, actually missing.** A closed pull request whose fix never landed, a branch merged
  under a name nobody recognises, a "shipped" feature whose file is absent from the trunk. These are
  the dangerous ones: everybody believes they are finished.

When you verify, check for the **capability**, not the path. Code frequently lands under a different
filename than the branch that proposed it — a helper renamed, a class absorbed into a neighbour. A
missing file proves nothing on its own. Grep for the behaviour: the function name, the error string,
the config key, the migration's effect.

## Order of work

Follow this order. It is not arbitrary — it exists so that nothing can be deleted before it has been
preserved, and so the cheap reductions land before the expensive analysis.

1. **Inventory** — enumerate branches, worktrees, PRs, tickets, planning artifacts, sessions.
2. **Classify merge state** — for every branch, using two signals (below).
3. **Find loss risk** — work that exists in exactly one place.
4. **Verify statuses against the trunk** — the disagreements between record and code.
5. **Subtract dead work** — content targeting subsystems that no longer exist.
6. **Report** — findings first, inventory second, plan last.

Delegate the noisy sweeps to subagents when they are available. Branch forensics, tracker
enumeration and planning-artifact parsing are all high-volume and low-insight; you want their
conclusions, not their output, in your context. Run them in parallel in a single message.

## Classifying merge state: use two signals

A branch is "merged" in two different senses, and each test misses cases the other catches. Run
both, and say which one you used.

```bash
# Signal 1 — ancestry. Exact, but blind to squash and rebase merges.
git merge-base --is-ancestor "$branch" origin/main

# Signal 2 — patch equivalence. Catches content that landed under a different SHA.
git cherry origin/main "$branch" | grep -c '^+'   # 0 means nothing unique remains
```

Classify as:

- **FULLY-MERGED** — an ancestor of the trunk. Delete without reading.
- **CONTENT-MERGED** — not an ancestor, but zero unique patches. Squash- or rebase-merged. Delete
  without reading.
- **UNMERGED** — real unique commits. These are the only branches worth a human's attention.

Run the bundled script rather than rewriting this loop by hand — it already handles the third signal
below, which the two above miss. Its path is relative to **this skill's own directory**, so invoke it
with the directory you loaded this file from:

```bash
bash "$SKILL_DIR/scripts/branch_forensics.sh"                 # local branches
bash "$SKILL_DIR/scripts/branch_forensics.sh" --remote        # origin/* instead
bash "$SKILL_DIR/scripts/branch_forensics.sh" --risk-only     # just the loss risk
bash "$SKILL_DIR/scripts/worktree_health.sh" .worktrees .claude/worktrees
```

Both are read-only, take an optional trunk ref as their first argument, and print exact counts. If
you find yourself writing a `for b in $(git for-each-ref ...)` loop, stop and run the script instead.

**A third signal the scripts add, which you will otherwise miss.** A *multi-commit* squash merge
defeats `git cherry` entirely: the squashed commit's patch-id matches none of the originals, so a
branch that is fully absorbed still reports unique commits. The script therefore also checks whether
every path the branch touched is now identical between trunk and branch:

```bash
git diff --name-only -z "$trunk...$branch" | xargs -0 git diff --quiet "$trunk" "$branch" --
```

Exit 0 means the branch's content is present regardless of how it landed. Without this check, every
squash-merged branch in the repository is misreported as unmerged — which on a squash-merge project
is most of them.

**The trap that will catch you:** `git cherry` compares patch-ids, so content that was *re-authored*
rather than cherry-picked shows as unique even though the intent shipped. A branch that renamed a
config directory will look unmerged forever if the trunk made the same change by hand. Before
declaring a small branch unmerged, diff it against the trunk **two-dot** (`git diff main branch`),
not three-dot — three-dot diffs from the merge-base and will happily show you changes the trunk made
years ago as though the branch were responsible. If the two-dot diff shows the trunk already has the
outcome, the branch is superseded regardless of what `git cherry` says.

## Finding work that can actually be lost

This is the only section where the stakes are real. Everything else is tidying.

Work is at risk when it exists in exactly one place: committed locally, pushed to no remote, and not
present on the trunk.

```bash
git log --oneline "$branch" --not --remotes | wc -l    # commits on no remote
```

**Do not scan by worktree.** This is a mistake worth naming because it is so natural: you enumerate
worktrees, check each one's branch, and feel thorough. But a branch that is not currently checked
out anywhere will never appear, and stale branches are exactly the ones nobody has checked out.
Iterate over `git for-each-ref refs/heads`, then note which are in worktrees — not the reverse.

Also check, in the trunk checkout and each worktree: uncommitted changes (`git status --porcelain`)
and stashes (`git stash list`). Stashes are repository-wide, not per-worktree, so report them once —
and read what is in them, because they are usually editor settings and generated files rather than
work.

## Subtracting dead work

**A branch can be unmerged and still be worthless.** Before recommending anyone rescue a branch, ask
what it is patching. Repositories retire whole subsystems — a rewritten client, a dropped platform,
a replaced framework — and branches predating the removal carry files that no longer have anywhere
to land. Rebasing them applies changes to deleted paths.

Find the retirement events, then measure each branch against them:

```bash
# Directories deleted wholesale on the trunk
git log --oneline --diff-filter=D --name-only -- "$suspected_dir" | head

# What area does this branch's work actually touch?
git log --format='%H' origin/main.."$branch" \
  | while read -r sha; do git show --name-only --format='' "$sha"; done \
  | grep -v '^$' | sort -u | awk -F/ '{print $1}' | sort | uniq -c | sort -rn
```

Report the ratio, because it changes the recommendation completely: a branch that is 80% dead files
around a live 20% needs *surgery*, not a merge. Very often the dead and live halves fall on clean
commit boundaries, in which case the rescue is a cherry-pick of specific SHAs and the advice should
say exactly which ones. When they do not, `git checkout <branch> -- <paths>` takes the live files
alone.

Say plainly that the dead half is being **written off**, not lost — it stays in history like the
rest of the retired subsystem. People resist deleting things; the reassurance is what lets them.

## Verifying tracker statuses

Read `references/trackers/<tracker>.md` for the tool-specific queries. Detect which tracker is in
play from the available tools and from branch naming (`feat/ABC-123-...`, `username/abc-123-...`);
if there is no tracker, skip this section and audit branches and PRs only — the audit is still
useful.

The cross-reference that pays for itself: list the ticket identifiers referenced in trunk commit
messages, and compare against tickets the tracker still shows as open.

```bash
git log origin/main --format='%s' -400 | grep -oE '[A-Z]{2,}-[0-9]+' | sort -u
```

Then spot-check the disagreements in code. Prioritise:

- Open tickets whose identifier appears in a merged trunk commit.
- Parent or umbrella tickets whose children are all closed.
- Tickets that look like duplicates — but verify rather than assume. A very common shape is not two
  copies of one job but **a finished half and an unfinished half** (paging shipped, caching did
  not). Merging those loses the distinction; the right move is to close the delivered one and let
  the other carry the remaining scope and its priority.
- Tickets whose *diagnosis* is wrong even though the symptom is real. Check what the code actually
  does before accepting the title's explanation — the fix may be a different shape entirely, and
  saying so is worth more than confirming the ticket.

Closed-but-unmerged pull requests deserve a specific pass. A PR closed without merging is assumed by
everyone to be abandoned deliberately, so nobody re-reads it. Sometimes most of its content landed
by another route and one genuinely useful fix did not. Diff its branch against the trunk file by
file rather than trusting the closure.

## Planning artifacts

Many repositories keep planning documents with task checklists — OpenSpec changes, `specs/`, ADRs, a
`docs/plans/` directory. When a convention like this exists, it is often the single largest source
of the "everything is unfinished" feeling, because completed work is rarely archived.

If the repo has no such convention, skip this section entirely and say nothing about it.

See `references/planning-artifacts.md` for detection and parsing. The three findings that recur:

- **Complete but unarchived** — every box ticked, still sitting in the active directory. Usually the
  biggest single reduction available, and it is pure bookkeeping.
- **Effectively complete** — 90%+ ticked, with the remaining items being verification or archival
  steps, and the linked ticket already closed. Also bookkeeping.
- **Superseded stubs** — 0% ticked, which reads as untouched work, but the plan was absorbed into a
  later consolidated document and shipped under a different name. These are the most misleading
  items in the whole audit. A 0% document whose ticket is closed is a document to delete, not a
  backlog item to schedule.

Never infer "not started" from an unticked checklist alone. Confirm against the trunk.

## Parallel sessions

If the environment exposes other agent sessions or background jobs, list them — but keep it short.
What the user needs is which sessions are **blocked waiting on input**, which are still running, and
which correspond to work already merged. Do not transcribe session history.

## The report

Produce an HTML page and publish it as an artifact when that is available; otherwise write it to a
file and say where. `references/report-template.md` has the structure and the design approach.

The ordering principle: **findings before inventory, inventory before plan.** People open this page
worried. Answer the worry in the first screen — what is at risk, what is wrong — then let them
browse the full tables, then give them the sequence to act on.

Include, in this order:

1. **At-risk work** — the only section where something can be lost. Exact counts, per-branch verdicts.
2. **Status corrections** — where the record disagrees with the code, each with the file path or
   grep that proves it.
3. **Inventories** — sessions, PRs, branches, worktrees, tickets, planning artifacts.
4. **The plan** — phased, below.

Two habits that make the report trustworthy:

- **Cite the evidence.** "Absent from main — `git grep orAbortBatch origin/main` returns 0" is worth
  more than "not implemented". The user will act on this; let them audit your reasoning.
- **Give exact numbers, never estimates.** "51 branches, 39 deletable" is actionable. "Roughly 50,
  most are fine" is not, and it quietly signals you did not actually check.

When the report references ticket identifiers repeatedly, spell out the full title on first mention
and make later mentions hoverable rather than repeating the title inline — the tables stay readable
without losing meaning.

## The plan

Order the phases so that preservation precedes deletion, and cheap reductions precede expensive
analysis. This shape transfers well:

1. **Preserve** — push everything at risk to a remote. Cheap, reversible, ends the loss risk
   immediately. Do this even for branches you will recommend deleting; the point is to stop being
   the only copy.
2. **Land what is finished** — merge clean PRs, open PRs for complete branches that never got one,
   close superseded ones.
3. **Archive the bookkeeping** — completed planning artifacts, in bulk.
4. **Sweep** — delete verified-merged branches and finished worktrees, prune orphans.
5. **Re-triage** — collapse duplicates, close tickets the audit settled, fix docs that lie.
6. **Then build** — the real remaining queue, which is now small and ordered.

Give each phase a realistic time estimate and concrete commands. For anything destructive, show the
command but let the user run it, unless they have asked for the cleanup workflow — that is a
separate, explicitly opt-in skill (`work-audit-cleanup`).

## Staying honest

The audit's credibility rests on the boring parts. A few things to hold to:

- This is a **read-only** investigation. Do not create, delete, rebase or check out branches while
  auditing. `git fetch --prune` is fine.
- When two of your own findings conflict, say so and resolve it in code rather than picking one.
- If you cannot verify something — a production deployment, a dashboard setting, anything outside
  the repository — mark it unverified and say what would settle it. A confident wrong status is far
  more damaging here than an acknowledged gap, because the entire point of the document is that it
  can be trusted.
