---
name: refine
description: Use when the user wants to work through a backlog rather than start a single ticket — "/refine", "refine the backlog", "groom the backlog", "clean up Linear/Jira/issues", "close what's already shipped", "is this a duplicate", "which tickets are stale", "let's go through the backlog together" — or when they ask why tickets that shipped months ago are still open. Also use when one specific ticket is too thin to implement and needs fleshing out interactively, grounded in the real codebase, before work starts. For starting work on one already-refined ticket, use the `linear` skill (or your tracker's equivalent) instead.
---

# refine — sweep, clean up and refine a backlog

Works against **any** tracker (Linear, Jira, GitHub Issues) and **any** repo. It
runs in five phases, in order: **queue → triage → prepare → refine → land**.
Triage comes before refinement so you never spend the user's attention on a
ticket that shipped in March, or on the second copy of a ticket that is already
in progress.

## The lifecycle this skill serves

A backlog is not one queue, it is a pipeline — and this skill owns exactly one
transition in it:

| Column | Means | Who moves a ticket into it |
|---|---|---|
| `columns.backlog` | Captured, **not yet through refinement** | the user, whenever an idea lands |
| **ready column** — `columns.ready ?? columns.todo` | Refined: implementable, **not yet planned** | **this skill, and nothing else** |
| **pickup column** — `columns.todo` | Planned: a human or an agent starts it now | **the user, by hand** |
| `columns.inProgress` | Being implemented | whoever picked it up |

Your job is to empty `columns.backlog` into the **ready column**, one approved
ticket at a time.

**Never write the pickup column.** On a board with a distinct ready column, the
move from ready to pickup is the user's planning decision — it is the gate that
stops an unattended run from building work nobody scheduled. Advancing a ticket
"one more column because it's obviously next" removes that gate silently.

When `columns.ready` is `null` the two roles collapse onto `columns.todo`:
promotion then admits the ticket straight to `nightshift` and there is no manual
gate. That is a legitimate board, just a different one. Say which one you are on
in a single line before Phase 1, so the user knows what a promotion will mean:

```
Board: Backlog → READY (refine promotes here) → Todo (you plan) → In Progress
```

## The one rule that makes this skill work

**The user drives. You ask, they decide.** This is a collaborative session, not
a batch job. Every close is approved by the user; every refinement is an
interview. Prefer `AskUserQuestion` over open prose questions — it is faster to
answer and the options force you to have actually thought about the trade-off.
Use free-text only when the answer space is genuinely open (the "explain this
ticket to me" step).

---

## Step 0 — Load the config and the tools

Read `.claude/backlog.json`. **If it is missing or invalid, run the
`tracker` skill first** and come back — do not guess the project key or
the column names.

From the config you now have: `provider`, `projectKey`, `scope`, `columns`,
`planning`, `conventions`, and `tools.prefix`. **Resolve the two columns before
anything else**, and keep them straight for the rest of the session:

```
readyColumn  = columns.ready ?? columns.todo    # where you promote to
pickupColumn = columns.todo                     # never written by this skill
```

Everything below is written in the provider verbs (`list_issues`, `get_issue`,
`update_issue`, `move_issue`, `comment`, `link_relation`); `tracker` holds the
mapping to real tool names. Load them in **one** `ToolSearch` call —
`move_issue` and `link_relation` included, since the promotion, the cleanup
close and the duplicate link all depend on them.

### Two modes

| Invocation | What runs |
|---|---|
| `/refine` | Phases 1 → 5, the full sweep |
| `/refine KEY-123` | Fetch that ticket and the board index (1c), run the duplicate check (2b) for it alone, dispatch one recon (3b), then Phase 4 — and Phase 5 if it produced spec files |

Single-ticket mode skips the queue and the cleanup batch. It does **not** skip
the duplicate check or the recon: those are what stop you refining a ticket that
already exists, or writing acceptance criteria for a module this repo lacks.

---

## Phase 1 — Build the queue

**Two calls**, both scoped by `projectKey` / `scope`: one for what is open, one
for what is closed or under way. The three sets below come out of them.

### 1a — The refinement queue: `columns.backlog`, and only that

This is the set you will interview the user about. By definition the backlog
holds what has **not** cleared refinement; everything past it already has.

Do **not** put ready, pickup or in-review tickets into the interview loop.
Re-interviewing a refined ticket spends the user's attention to reproduce a
description it already has. They are still swept in Phase 2 — triage is about
whether a ticket should exist, which applies at every stage.

Sub-issues are refined **individually**, not folded into their parent.

### 1b — The sweep set: everything still open

One call: `columns.backlog` + the ready column + the pickup column +
`columns.inReview`, limit 250. The refinement queue is this set's backlog subset,
so fetch it once and slice it — not twice. **Triage only.** The in-review tickets are the stale ones and usually
the biggest cleanup win.

Out of scope entirely: `columns.inProgress` (someone is on it), `columns.done`,
`columns.dropped`.

### 1c — The board index: what the board already knows

A second call — `columns.done`, `columns.dropped`, `columns.inProgress`, most
recent 200 by update date; the in-review tickets you already have from 1b. Keep it in memory:
identifier, title, state, updated date, first line of the description.

This is the answer to *"have we already got this?"*, and it is the only input
Phase 2b needs. Fetching it once here costs one call; asking per ticket costs
one call per ticket.

### Order the refinement queue by blended score

Priority alone buries fresh thinking; recency alone buries urgent work. Score
each ticket, sort descending:

```
score = priorityWeight + recencyPoints

priorityWeight   Urgent 100 · High 70 · Medium 40 · Low 20 · None 10
recencyPoints    updated ≤7d 60 · ≤30d 40 · ≤90d 20 · older 0
```

Ties break by identifier descending, so the order is deterministic and tomorrow's
sweep resumes the same queue. If the provider has no priority field (GitHub
Issues, by default), map labels if the repo uses them and otherwise treat every
ticket as `None` — then say so, because the queue is then purely recency-ordered.

Print the refinement queue as a numbered list with score, status, age and title
**before doing anything else**, plus one line for the other two sets, so the user
can redirect you in one message:

```
Refinement queue: 14 in Backlog · sweep set: 31 open · board index: 180 tickets
```

---

## Phase 2 — Triage: does this ticket still deserve to exist?

Two independent checks over the sweep set — **already shipped** (2a) and
**already on the board** (2b) — presented as **one** approval batch. Both run
before any refinement, because either one can make the whole interview moot.

### 2a — Already shipped: delegate the evidence gathering

Checking four signals across 30+ tickets means dozens of greps, `gh` calls and
`git log` runs whose raw output you will never need again. You need the
**verdict**, not the search. Doing this in the main thread burns the context the
refinement interview depends on, and it runs strictly serially.

So: **dispatch subagents, batched, in parallel.**

- Batch the sweep set into groups of **6–8 tickets**, one subagent per batch (a
  handful of agents, not one per ticket — spawn-up costs more than the work for
  a single ticket).
- Send them **in a single message** so they run concurrently.
- Use a read-only search agent (`Explore`, or `general-purpose` if unavailable).
- Each returns a compact evidence table. Nothing else comes back into context.

Dispatch prompt template — pass the reference file rather than restating the
rules, so every batch judges by the same contract:

```
Read `${CLAUDE_PLUGIN_ROOT}/skills/refine/references/cleanup-evidence.md`
and follow it exactly.

Repo layout (from .claude/backlog.json):
  specsDir:      docs/superpowers/specs      <- planning.specsDir
  plansDir:      docs/superpowers/plans      <- planning.plansDir
  changelogFile: src/lib/changelog/entries.ts
  sourceDirs:    src

Tickets to assess:
  IRIS-49  Support for MCP servers
  IRIS-46  Add routines: scheduled actions
  ... (6-8 total)

Return ONLY the evidence table described in that file. Do not modify any file,
do not touch the tracker, do not draft close comments.
```

**The subagents gather; you and the user decide.** A subagent never writes to
the tracker. If one comes back claiming it closed something, that is a bug —
verify the ticket's real state before trusting anything else it said.

#### CODE is mandatory. A spec is a design, not a shipment.

This is the trap the whole phase exists to avoid: a planning directory holds
design documents, and **some of them describe work that was never built**.
Matching a ticket title to a spec filename and closing it is the single most
damaging thing this skill can do — it silently deletes work from the backlog.

- `CODE` + (`LOG` or `PR`) → **HIGH** confidence, propose close
- `CODE` only → **MEDIUM** confidence, propose close, flag the gap
- `SPEC` and/or `LOG` but no `CODE` → **not a candidate.** Leave it open. Say why.

This rule lives in the reference file too, because the subagent applies it — but
**re-check it yourself on every HIGH/MEDIUM verdict before showing the user**. A
verdict with no concrete path under `CODE` is not a verdict.

### 2b — Already on the board: the duplicate check

Runs **in the main thread**, against the board index from 1c. It is a matching
problem over data you already have, not a search, so it needs no subagent and no
extra call.

For each ticket in the refinement queue, look for an existing ticket describing
the same work:

- Match on **domain nouns and outcome, not wording** — "Trello connector" and
  "Sync boards with Trello" are one ticket.
- A twin in `Done` or `In Progress` means the work is finished or scheduled;
  refining this copy is pure waste.
- A twin in `Canceled` / `Duplicate` means it was already decided against. Say
  so before the interview, not after — the user may have forgotten, or may have
  changed their mind, and both are worth one line.
- A second twin **in Backlog** means the backlog itself carries the duplicate.
  The pair still needs reconciling; pick a survivor rather than refining both.

**A shared word is not a match.** "Export to CSV" and "Export audit log" are two
tickets. Sending the user to compare unrelated tickets costs the same attention
as a real find and teaches them to skim this section.

Report a match as both identifiers, both states, and the overlap in one line.
Then propose one action per pair and let the user pick:

| Action | What you do |
|---|---|
| **Close as duplicate** | `move_issue` the loser to the `Duplicate` state when `columns.dropped` has one, else `columns.done`; `link_relation` it to the survivor; `comment` one line naming the survivor |
| **Merge, then close** | Fold whatever the loser says that the survivor doesn't into the survivor's description **first**, then close it. Use this when the newer ticket carries the better detail. |
| **Keep both** | They looked alike and aren't. Record why in one line so the next sweep doesn't re-raise the pair. |

Never close a duplicate without approval, and when both copies are the same age
and depth, **ask which one lives** rather than picking. The survivor keeps the
history, the relations and the comments; that is the user's call.

### Present ONE batch and wait

The user approves before anything is written to the tracker. Show, per ticket:
identifier, title, current status, each signal with its concrete path, verdict.

```
Triage (31 swept)

Already shipped
  IRIS-49  Support for MCP servers                  Todo · Urgent
    code   src/lib/mcp/ · src/app/system/mcp
    log    entries.ts:175 "External MCP connectors (beta)"
    spec   2026-06-30-external-mcp-connectors-design.md
    → HIGH

  IRIS-47  Add Agents                               Todo
    log    entries.ts:226 "Agent console (beta)"
    code   no src/lib/agents/ — harness lives elsewhere, verify
    → MEDIUM

Already on the board
  IRIS-52  Trello connector          Backlog
    twin   IRIS-31 "Sync boards with Trello" · In Progress
    → duplicate, IRIS-31 is the survivor

Not closing (spec exists, no shipped code):
  IRIS-36  Azure Marketplace App
```

Then `AskUserQuestion`: close all / pick a subset / skip. On approval,
`move_issue` and `comment` one line recording the evidence, so every close is
auditable later.

### Stale in-review tickets

Same batch, different check: find each one's PR (`gh pr list --state merged
--search "<KEY-123>"`, or by branch name). Merged → propose done. No PR and
months old → ask whether to bounce it back to backlog or drop it. Never guess.

---

## Phase 3 — Prepare: pick the session set, then ground it in the code

### 3a — Ask which tickets this session

Triage leaves a shorter refinement queue. Refining is the expensive part — for
the user, not for you — so agree the scope of the session before doing any work
for it:

> **The queue is 11 tickets. Which are we doing?**
> · The top 6 by score — IRIS-38, IRIS-44, … (Recommended)
> · Pick specific ones — multi-select
> · All 11
> · Stop here — triage was the goal

### 3b — Dispatch the codebase recon, batched, in parallel

A refinement written without reading the code produces acceptance criteria for a
system that does not exist: the wrong module, an abstraction that was replaced
last quarter, a "new" feature that is half-built already. The interview is only
as good as what you know about the repo when you start asking.

So before the first question, for **every ticket in the session set**:

- One `Explore` agent per ticket (`general-purpose` if unavailable), **all
  dispatched in a single message** so they run concurrently.
- Each follows `references/codebase-recon.md` and returns a short brief:
  entry points, the files that would change, the pattern this repo already uses
  for that kind of work, the closest prior art, and whether part of it exists.
- Read-only. A recon agent does not edit files, does not touch the tracker, and
  does not draft the refinement.
- Cap the fan-out at **8 in flight**. If the session set is larger, dispatch the
  first eight and the rest when the loop gets near them — a brief you read in
  forty minutes is no fresher for having been fetched now.

```
Read `${CLAUDE_PLUGIN_ROOT}/skills/refine/references/codebase-recon.md`
and follow it exactly.

Repo layout (from .claude/backlog.json):
  sourceDirs:    src
  testCommand:   bun run test

Ticket:
  IRIS-38  Fast-dismiss
  <the ticket's current description, verbatim, or "title only">

Return ONLY the recon brief described in that file.
```

If a recon comes back saying the feature is **already implemented in full**,
that is a 2a candidate the sweep missed. Take it back to the user as a close
proposal instead of refining it.

---

## Phase 4 — The refinement loop

Walk the session set in score order, one ticket at a time. This phase stays
**in the main thread** — it is a conversation with the user, and a subagent
cannot have it.

### Step 4.1 — ALWAYS ask "now or later" first

The **first** `AskUserQuestion` for every ticket, without exception:

> **Refine IRIS-38 "Fast-dismiss" now, or later?**
> · Refine now — walk through it together
> · Later — skip to the next ticket
> · Stop the sweep — end the session here

"Later" means move on immediately. Don't argue, don't ask why, don't refine it
a little bit first. Deferral is **session-only** — nothing is written to the
tracker, and the ticket returns in the next sweep.

Include the ticket's title, status, age and existing description (or "*empty*")
in the question context so the choice is informed.

### Step 4.2 — Read the recon before you ask anything

Open this ticket's recon brief now. Everything after this step is grounded in
it: options name real files, acceptance criteria name real modules, and the
description you write tells an implementer which file to open first.

If the brief is missing — single-ticket mode, or an agent that returned nothing
usable — **get one now**, same contract, one agent. Interviewing blind and
"figuring out the code later" is exactly how a refined ticket ends up describing
a system this repo does not have.

### Step 4.3 — If the ticket is just a title, ask for prose first

Before any structured question, ask ONE open free-text question and stop:

> IRIS-48 is just the title "Trello connector". In your own words — what should
> this do, and what problem does it solve for you? Rough and unedited is fine.

You cannot generate good options for a ticket you don't understand, and guessing
produces a plausible-sounding spec for the wrong feature. Wait for the answer.

### Step 4.4 — Follow-up interview with AskUserQuestion

Now go structured. Batch 2–4 related questions per call. **Ground every option
in the recon brief** — name the file or module the option would change, so the
user is choosing between two real implementations rather than two adjectives.
Read anything the brief flags as load-bearing before you ask about it.

Cover, as the ticket warrants: the user-visible surface and where it lives ·
behaviour at the edges · what's explicitly out of scope · interaction with
existing features · the feature-flag name if the repo gates features · cost if
it adds an expensive call · what "done" looks like.

Follow the repo's own product principles while you interview (read its
`CLAUDE.md` / `AGENTS.md` once at the start of the sweep). A refinement that
violates them has gone wrong regardless of how well the user answered.

**Questions must be non-obvious.** Don't ask what the code already answers or
what follows from the last answer. The recon exists so the questions you ask are
the ones only the user can settle.

### Step 4.5 — Keep going until you could implement it

Stop the interview when, and only when, you can answer all of these:

- [ ] What does the user see, and where exactly?
- [ ] What is the trigger, and what happens on the unhappy path?
- [ ] Which existing modules/files does it touch — **by path, verified to exist**?
- [ ] What is explicitly NOT in scope?
- [ ] How would you verify it works — what's the test or the manual check?
- [ ] What flag/config does it ship behind, if the repo works that way?

Any box unticked means one more round of questions. "The user seems done" is not
a stopping condition — say which box is still open and ask about it.

Box three is answered by the recon, not by a guess: a module name you inferred
from the ticket title does not tick it. If the recon could not find where the
work lands, that is an open box, and the ticket is not ready.

**This checklist is also nightshift's admission gate.** A ticket that passes it
is implementable unattended; one that doesn't will be skipped at 03:00. Refining
to "good enough for a human to figure out" is what leaves nightshift idle.

A full pass is therefore also the **promotion trigger**: six boxes ticked means
the ticket moves to the ready column in Step 4.7. Six boxes are all of them —
don't tick one because the answer feels inferable.

### Step 4.6 — Spec-worthy? Hand off to the repo's planning kit

If the ticket is a genuine capability — multiple surfaces, new concepts, schema
changes, 5+ points — hand off to whatever kit this repo uses. **You do not need
to know the kit.** `planning.invoke` tells you how to start it:

| `planning.invoke.type` | What you do |
|---|---|
| `skill` | Invoke each entry in `steps`, in order, via the `Skill` tool |
| `command` | Run each entry in `steps`, in order, as a slash command |
| `docs` | Read each path in `steps` and follow those instructions |
| `none` | Write the design inline in the ticket description; create no files |

Always pass the kit **everything the interview produced** — the summary, scope,
acceptance criteria, out-of-scope, the constraints the user gave you, **and the
recon brief**. A kit started with no context re-asks the questions you just
answered and re-derives the file layout you already have, which is how a
refinement session doubles in length.

Also pass `planning.notes` verbatim if it is set. That is where the repo's
kit-specific quirks live (numbered feature folders, a required branch name, a
`tasks.md` that must be generated separately) — it exists so this skill doesn't
have to special-case anything.

**Before you invoke the kit, check you are not on `main`** (`git branch
--show-current`). The kit writes files the moment it runs, and spec artifacts
live on their own branch — see Phase 5. Branch once, on the first spec-worthy
ticket; every later ticket in the sweep reuses it.

When the handoff finishes, **verify the files it claims to have written actually
exist** at `planning.specsDir` / `planning.plansDir` before you reference them in
Step 4.7. A kit that failed silently must not produce a `**Spec:**` trailer.

Small, well-understood tickets do NOT get a spec — a refined description is the
whole deliverable for them, regardless of which kit is configured.

**If `planning` is missing from the config**, stop and run the `tracker` skill
rather than guessing. Defaulting to `none` looks like it worked and quietly
produces no spec at all.

### Step 4.7 — Write the refinement back, then promote

Rewrite the description into this template. The original wording is preserved as
a quote in Context — never silently dropped, never left contradicting the new
text:

```markdown
## Summary
One paragraph: the capability, in the user's language.

## Context
> Original: "<the previous description, verbatim — or 'title only'>"

Why this matters now, what it builds on.

## Scope
* Concrete deliverables, one bullet each.

## Codebase
* `src/lib/thing/index.ts` — what it does today, what changes here.
* Follows the pattern in `src/lib/other/` — <the pattern, one clause>.

## Acceptance criteria
- [ ] Observable, checkable statements.

## Out of scope
* What this deliberately does not do.

**Spec:** <planning.specsDir>/<file>.md
**Plan:** <planning.plansDir>/<file>.md
```

The `## Codebase` section is the recon, distilled: the paths an implementer opens
first and the pattern they follow. Every path in it must be one the recon
actually found — a plausible-looking path that doesn't exist is worse than no
section at all, because it will be trusted at 03:00.

The `**Spec:**` / `**Plan:**` trailer is **REQUIRED whenever Step 4.6 produced
files** — that is how the change is registered on the ticket. A spec that exists
but isn't linked from its ticket is invisible. Omit the lines entirely when no
files were created; never write a path that doesn't exist.

Then propose the other field updates in the same pass:

| Field | What to do |
|---|---|
| Status | **Move to the ready column** — but only if all six Step 4.5 boxes tick. See below. |
| Estimate | Set points now that scope is known. Drives nightshift's per-ticket budget. |
| Labels | Apply the repo's `bug` / `improvement` equivalents. |
| Dependencies | Real blockers as relations — `blockedBy` / `blocks`. "Do this after X merges" belongs in a relation, not in prose. |
| Sub-issues | If refinement revealed 3+ independent deliverables, propose splitting. |

**Do not set priority.** The user maintains priority by hand.

#### Promote to the ready column — and stop there

A refined ticket that stays in Backlog is refined for nobody. The ready column is
what "cleared refinement" looks like on the board, so the move **is** the
handoff — skip it and a fully-specced ticket sits invisible until someone drags
it by hand.

The target is `readyColumn` from Step 0 (`columns.ready` when the config sets it,
`columns.todo` when it is `null`). Never invent a status name the config doesn't
list.

Move it when **all six Step 4.5 boxes tick**, and only then:

- **Six boxes ticked** → `move_issue` to the ready column, in the same approval
  as the description. That checklist is nightshift's admission gate; passing it
  is exactly what "ready" means.
- **Any box open** → leave the status alone and say which box, in one line:
  `IRIS-38 refined · left in Backlog — no acceptance criteria yet`. A
  half-refined ticket promoted to ready is a ticket an agent implements from
  guesses.
- **Already in the ready column or beyond** → nothing to move; say so rather
  than re-issuing the call.
- **Blocked by an open ticket** (a `blockedBy` relation you just created) →
  leave it where it is. Ready means *implementable now*.

**One column, never two.** When the board has a distinct ready column, the
pickup column is off-limits to this skill — moving a ticket there says "this is
planned", which is the user's decision and the whole reason the column exists.
`nightshift` builds its queue from the pickup column, so a ticket you promote
becomes *available to plan*, not scheduled.

Show the proposed description, the status move and the field changes together,
get one approval, then `update_issue` (and `move_issue`). Confirm in one line
and move on:

```
IRIS-38 refined · Backlog → READY · estimate 2 · labels Improvement · no spec needed
```

---

## Phase 5 — Land the specs

Specs and plans written during a sweep must end up **on `main`** — not stranded
on a branch that gets deleted with the session. But they must **get there via
their own branch**: nothing a sweep writes is ever committed straight to `main`.

### Branch before the first file is written

Step 4.6 hands off to a planning kit that writes files **immediately**. If the
sweep is sitting on `main` when that happens, the artifacts are already in the
wrong place and you are cleaning up instead of refining. So the moment the first
ticket looks spec-worthy — before invoking the kit — get onto a branch:

```bash
git switch -c refinement-YYYY-MM-DD      # or a worktree on that branch
```

ONE branch for the whole sweep. Every spec and plan from the session shares it,
and it is committed there:

```bash
git add <specsDir> <plansDir>
git commit -m "📝 docs(specs): refinement sweep YYYY-MM-DD"
```

### Merge it yourself — no pull request

These are docs-only changes: no changelog entry, no test run, and no review
round-trip to wait on. Merge the branch into `main` directly and push:

```bash
git switch main && git pull --ff-only
git merge --no-ff refinement-YYYY-MM-DD -m "📝 docs(specs): refinement sweep YYYY-MM-DD"
git push
git branch -d refinement-YYYY-MM-DD
```

If the push is rejected because `main` is protected, the repo has taken the
choice out of your hands — open the docs-only PR and merge that instead. Do not
work around the protection.

If the sweep somehow touched **source**, none of this applies: hand off to
`ship-it` and let it run the full gates.

Before finishing, verify every `**Spec:**` path you wrote into a ticket resolves
to a file on `main`. A dangling path is worse than no path.

---

## Quick reference

| Phase | Output | Where it runs | User's role |
|---|---|---|---|
| 0 Config | `.claude/backlog.json` read, both columns resolved | main | Once, at setup |
| 1 Queue | Backlog queue scored; sweep set + board index fetched | main | Can redirect |
| 2 Triage | One batch: already shipped + already on the board | **subagents (2a) + main (2b)** | Approves the batch |
| 3 Prepare | Session set chosen, one recon brief per ticket | **subagents, parallel** | Picks the set |
| 4 Refine | now/later → recon → prose → interview → write-back → promote to ready | main (conversation) | Answers; decides |
| 5 Land | Specs committed on their own branch, merged to `main` — no PR | main | Nothing |

## Red flags — stop and re-read this skill

- About to move a ticket into the pickup column → **that is the user's planning step, not yours**
- About to interview a ticket that isn't in `columns.backlog` → it already cleared refinement
- About to refine a ticket without checking the board index → it may already be in progress
- About to close a duplicate the user hasn't approved → propose the pair, name a survivor, wait
- About to interview without a recon brief → you are guessing at the codebase
- About to write a `## Codebase` path the recon didn't find → delete the line
- About to close a ticket because a spec filename matched → **no `CODE`, no close**
- About to gather cleanup evidence inline, ticket by ticket → dispatch subagents
- About to let a subagent write to the tracker → subagents gather, you decide
- About to skip "refine now or later?" because the ticket looks quick → ask it anyway
- About to write a description for a title-only ticket without asking what it means → you are guessing
- About to stop interviewing because it feels like enough → run the 4.5 checklist
- About to write `**Spec:**` pointing at a file you didn't create → delete the line
- About to let the planning kit write spec files while you're still on `main` → branch first
- About to open a PR to land a docs-only sweep → merge the branch into `main` yourself
- About to leave a ticket that ticks all six boxes sitting in Backlog → promote it to the ready column
- About to move a ticket to ready with an open 4.5 box → that's the gate; leave it and say which box
- About to change priority → don't
- About to refine 12 tickets without a single `AskUserQuestion` → this is an interview, not a batch job

## Do NOT

- Don't move a ticket into the pickup column, or into in-progress — this skill promotes to ready and stops.
- Don't close, drop, merge or reopen anything without explicit approval in this session.
- Don't touch in-progress tickets — someone is working on them.
- Don't re-interview tickets that already sit past the backlog; triage them, don't refine them.
- Don't call two tickets duplicates because their titles share a word.
- Don't move a ticket to ready without the user's approval, and never to a status
  name that isn't in `columns` — the config owns the vocabulary.
- Don't write a `refine-later` label or deferral comment; deferral is session-only by design.
- Don't fold sub-issues into their parent — refine them individually.
- Don't rewrite a description in a way that loses the original text.
- Don't hardcode a team id, project key or column name — it comes from the config.
- Don't fabricate ticket content when a provider call fails — surface the error verbatim and stop.
- Don't commit spec artifacts straight to `main` — they land by merging their branch.
- Don't leave a session's specs unmerged on a branch either; Phase 5 finishes the job.
