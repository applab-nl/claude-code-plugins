---
name: nightshift
description: Use when the user wants unattended overnight implementation of a whole column of ready tickets — "/nightshift", "run the nightshift", "work through the todo column tonight", "have it built by morning", "implement everything that's ready while I sleep", "give me something to test in the morning". Also use the morning after, when they ask "what happened last night?", "show me the test plan", or want a tested nightshift PR marked ready for review and shipped.
---

# nightshift — a column of tickets in, a testable preview branch out

You start it before you go to bed. It reads the ready column, implements as many
tickets as it can, keeps **one branch per ticket** so each can ship
independently, merges them into **one preview branch** so everything can be
tested together, and writes an **HTML test plan** describing exactly what to
click. In the morning the user tests the preview, then marks the good PRs ready.

```
ready column ─┬─ ticket A ─→ branch A ─→ draft PR A ─┐
              ├─ ticket B ─→ branch B ─→ draft PR B ─┼─→ preview branch ─→ testplan.html
              └─ ticket C ─→ branch C ─→ draft PR C ─┘
```

## Modes

| Invocation | Mode |
|---|---|
| `/nightshift` (no args) | **Run** — the overnight loop below |
| `/nightshift finalize <KEY-123>` | **Finalize** — that ticket tested OK: draft PR → ready for review, hand to `ship-it` |
| `/nightshift report` | **Report** — re-print last night's summary and test plan path |

---

## Phase 0 — Preflight. Fail fast, fail loud, fail *now*.

Nobody is watching. A run that starts broken burns the whole night and produces
a preview branch the user can't trust. Check all of these **before touching a
single ticket**, and abort the entire run on the first failure with a one-screen
explanation:

- [ ] `.claude/backlog.json` exists and validates → else run `tracker` (needs the user; **cannot** be done unattended, so stop and say so)
- [ ] Working tree is clean and on the default branch, synced with `origin`
- [ ] `gh auth status` succeeds and the repo has a remote
- [ ] `conventions.testCommand` runs green **on the current default branch** — a red baseline means you cannot tell your breakage from pre-existing breakage
- [ ] The ready column (`columns.ready ?? columns.todo`) resolves to ≥1 ticket

Print the preflight result as a checklist. This is the last thing a human may
ever read before morning; make it complete.

**Do not "work around" a failed preflight.** A dirty tree does not become clean
by stashing someone else's work; a red test suite does not become green by
skipping tests. Abort and explain.

---

## Phase 1 — Build the night's queue

`list_issues` scoped to **the ready column** — `columns.ready` when the config
sets it, `columns.todo` when it is `null`. That is the column `refine` promotes
into, which is what makes the two skills one loop. Then apply the **readiness
gate** — this is what separates nightshift from a machine that generates noise.

### The readiness gate

A ticket is admitted only if it answers all six (the same checklist
`refine` Step 3.4 refines toward):

- [ ] What the user sees, and where
- [ ] The trigger, and the unhappy path
- [ ] Which modules/tables it touches
- [ ] What is explicitly out of scope
- [ ] How to verify it works
- [ ] What flag/config it ships behind, if the repo works that way

In practice: a **Summary**, a **Scope**, and **Acceptance criteria** in the
description. A title-only ticket, or one whose acceptance criteria are "it
works", is **skipped** — listed in the morning report under "not ready, needs
refinement", never guessed at.

**Skipping a thin ticket is a success, not a failure.** Implementing a guess
overnight produces a plausible feature for the wrong problem, and the user
discovers it after testing it. The morning report's "not ready" list is the
input to the next `refine` session.

Order by the same blended score as `refine` (priority + recency), take
the top `nightshift.maxTickets` (default 5), and drop any ticket that is
`blockedBy` another open ticket — including one earlier in tonight's own queue.
Sequential dependencies do not parallelize; leave the blocked one for tomorrow.

Print the admitted queue and the skipped list **before** starting work.

---

## Phase 2 — Implement, one isolated agent per ticket, in parallel

Dispatch one subagent per admitted ticket, **all in a single message** so they
run concurrently, each with `isolation: "worktree"` so they cannot collide on
the filesystem or on git's index.

```
Agent({
  subagent_type: "backlog:implementer",   // fall back to "general-purpose"
  isolation: "worktree",
  name: "ns-IRIS-38",
  description: "Implement IRIS-38",
  prompt: <the dispatch brief below>
})
```

The dispatch brief must contain, in full — the agent cannot ask you anything:

1. **Ticket identifier, title, and the complete description** (summary, scope,
   acceptance criteria, out-of-scope). Paste it; don't summarize it.
2. **The branch name to use** — from the provider's canonical branch name if it
   has one, else `<branchPrefix><key>-<slug>`. This is the contract that lets
   Phase 3 find the work.
3. **The repo's commands**: `testCommand`, `typecheckCommand`, `buildCommand`.
4. **The instruction to follow the `nightshift-implement` skill**, which owns
   the TDD loop, the commit convention, the push and the draft PR.
5. **The spec/plan paths** from the ticket's `**Spec:**` trailer, if present,
   plus `planning.notes` verbatim if the config sets it — that is where the
   repo's planning kit records quirks the implementer needs (a `tasks.md` to
   work through, a required branch name, a numbered feature folder).
6. **The stop conditions** (below).

### Stop conditions — how far "as far as it can go" goes

An agent stops and reports rather than pushing on when:

- The acceptance criteria are met and the test suite is green → **complete**
- It has made real progress but can't finish (missing credential, needs a
  product decision, an API it can't reach) → **partial**: commit what works,
  push the branch, report the blocker
- It would have to change a shared foundation another ticket in tonight's queue
  also touches → **stop**: report the collision, don't guess at merge order
- It cannot get the tests green after a genuine attempt → **blocked**: commit
  the work as WIP, push, report exactly which test fails and why

**Every outcome ends with a pushed branch.** Partial and blocked work is not
thrown away — it is the morning's most useful signal, and a branch nobody can
see is indistinguishable from work nobody did. The one thing an agent may never
do is report success it did not verify.

Each agent returns a structured result: `{ key, branch, outcome, summary,
filesChanged, testStatus, prUrl, blocker, testPlanNotes }`. Collect them all.

---

## Phase 3 — Assemble the preview branch

The point of the preview branch is that the user tests **everything at once**,
in one running app, instead of checking out five branches one at a time.

Run the bundled script from the repo root:

```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/build_preview.sh" \
  --prefix nightshift \
  --branches "IRIS-38-fast-dismiss,IRIS-41-digest-hour,IRIS-44-topic-merge"
```

It creates `nightshift/YYYY-MM-DD` from the default branch and merges each ticket
branch in, one at a time, in the order given. On a conflict it **aborts that one
merge, leaves the branch out, and continues** — then reports which were
excluded. A conflicting ticket still has its own branch and its own PR; it is
simply not in tonight's combined preview.

Never resolve a merge conflict unattended. A conflict means two tickets disagree
about the same code, and picking a side at 04:00 without the user is how you
ship a subtly broken preview that passes tests.

After assembly, run `testCommand` **once on the preview branch**. Integration
failures that no single branch had are the highest-value thing nightshift can
find — record them prominently in the test plan; do not attempt a fix that
rewrites a ticket branch you already pushed.

---

## Phase 4 — Write the HTML test plan

Follow the `testplan` skill. It produces
`nightshift/<date>/testplan.html` on the preview branch: one section per ticket,
with the acceptance criteria turned into concrete click-through steps, the
branch and PR links, and the blocked/partial items called out at the top.

The test plan is the deliverable the user actually opens. Everything else is
plumbing.

---

## Phase 5 — Push, draft PRs, and the morning report

- Push the preview branch. **One draft PR per ticket** (already opened by each
  implementer), never one giant PR — the user asked to keep the ability to ship
  changes individually, and a combined PR destroys it.
- The preview branch gets **no PR**. It is a disposable integration artifact;
  opening a PR for it invites someone to merge the whole night in one click.
- Leave the tickets in the ready column. **Nightshift does not move tickets** —
  work that hasn't been tested isn't in review. Post one comment per ticket
  linking its branch and draft PR.

Then write the morning report as the final message: what shipped to a branch,
what's partial, what's blocked and why, what was skipped as not-ready, the
preview branch name, and the test plan path. Lead with anything the user must
decide.

```
Nightshift 2026-08-25 · 5 admitted · 3 complete · 1 partial · 1 blocked

preview   nightshift/2026-08-25  (3 of 5 merged clean)
testplan  nightshift/2026-08-25/testplan.html

✅ IRIS-38 Fast-dismiss        draft #418 · 12 tests
✅ IRIS-41 Digest hour         draft #419 · 4 tests
✅ IRIS-44 Topic merge         draft #420 · 7 tests
🟡 IRIS-46 Routines UI         draft #421 · partial — needs a product call on recurrence UI
🔴 IRIS-49 MCP retry           draft #422 · blocked — integration test needs a live MCP server
⏭  IRIS-52 Trello connector    not ready — title only, no acceptance criteria

excluded from preview: none
```

---

## Finalize mode — the morning after

`/nightshift finalize IRIS-38`, once the user has tested it on the preview:

1. Confirm the ticket's tests still pass on **its own branch** (the preview
   proved the combination; the PR ships the branch).
2. `gh pr ready <n>` — draft becomes ready for review.
3. Move the ticket to `columns.inReview` and comment that it was built by
   nightshift and tested on `<preview branch>`.
4. Hand to `ship-it` for CI monitoring and merge, if it's installed.

Finalize **one ticket at a time**, only on the user's say-so. "The preview
looked fine" is not approval to finalize all five — ask which ones.

---

## Quick reference

| Phase | Output | Runs where |
|---|---|---|
| 0 Preflight | Checklist, or a clean abort | main |
| 1 Queue | Admitted + skipped lists | main |
| 2 Implement | One pushed branch + draft PR per ticket | **parallel agents, worktree-isolated** |
| 3 Preview | `nightshift/<date>` branch | script |
| 4 Test plan | `testplan.html` on the preview | `testplan` |
| 5 Report | Morning summary | main |

## Red flags — stop

- About to implement a ticket with no acceptance criteria → skip it, report it
- About to resolve a merge conflict unattended → exclude the branch instead
- About to squash the night into one PR → individual PRs are the whole point
- About to merge anything into the default branch → nightshift never merges
- About to move tickets to done/in-review before a human tested them → don't
- About to discard a failed agent's work → push it as WIP; blocked ≠ worthless
- About to report a ticket complete on an agent's word alone → check `testStatus`
- About to start with a red baseline test suite → abort in preflight

## Do NOT

- Don't run without a validated `.claude/backlog.json`.
- Don't touch `main`/`master`, force-push, or rewrite a pushed branch.
- Don't open non-draft PRs (unless `nightshift.draftPrs` is false).
- Don't delete a ticket branch, ever — the preview is disposable, the branches are not.
- Don't let an agent write to the tracker beyond one status comment.
- Don't exceed `nightshift.maxTickets` because the queue "looks easy".
- Don't fabricate test results, PR numbers, or a summary of work you didn't verify.
