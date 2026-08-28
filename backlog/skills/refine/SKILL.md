---
name: refine
description: Use when the user wants to work through a backlog rather than start a single ticket — "/refine", "refine the backlog", "groom the backlog", "clean up Linear/Jira/issues", "close what's already shipped", "which tickets are stale", "let's go through the backlog together" — or when they ask why tickets that shipped months ago are still open. Also use when one specific ticket is too thin to implement and needs fleshing out interactively before work starts. For starting work on one already-refined ticket, use the `linear` skill (or your tracker's equivalent) instead.
---

# refine — sweep, clean up and refine a backlog

Works against **any** tracker (Linear, Jira, GitHub Issues) and **any** repo. It
runs in four phases, in order: **queue → cleanup → refine → land**. Cleanup
comes before refinement so you never spend the user's attention refining a
ticket that shipped in March.

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
`planning`, `conventions`, and `tools.prefix`. Everything below is written in the provider
verbs (`list_issues`, `get_issue`, `update_issue`, `comment`); `tracker`
holds the mapping to real tool names. Load them in **one** `ToolSearch` call.

---

## Phase 1 — Build the queue

Fetch the sweep set in one call, scoped by `projectKey` / `scope`, limit 250.

**In scope:** anything in `columns.backlog` or `columns.todo`, plus tickets
sitting in `columns.inReview` (these are the stale ones — the biggest cleanup
win). Sub-issues are refined **individually**, not folded into their parent.

**Out of scope:** `columns.inProgress` (someone is on it), `columns.done`,
`columns.dropped`.

### Order the queue by blended score

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

Print the queue as a numbered list with score, status, age and title **before
doing anything else**, so the user can redirect you to a different starting
point in one message.

---

## Phase 2 — Cleanup pass (close what already shipped)

Fast-moving repos leave tickets behind. Sweep the whole queue for
already-implemented work **first**, in one batch, before any refinement.

### Delegate the evidence gathering — do not do it inline

Checking four signals across 30+ tickets means dozens of greps, `gh` calls and
`git log` runs whose raw output you will never need again. You need the
**verdict**, not the search. Doing this in the main thread burns the context the
refinement interview depends on, and it runs strictly serially.

So: **dispatch subagents, batched, in parallel.**

- Batch the queue into groups of **6–8 tickets**, one subagent per batch (a
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

### CODE is mandatory. A spec is a design, not a shipment.

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

### Present ONE batch and wait

The user approves before anything is written to the tracker. Show, per ticket:
identifier, title, current status, each signal with its concrete path, verdict.

```
Close candidates (3 of 31 swept)

IRIS-49  Support for MCP servers                    Todo · Urgent
  code   src/lib/mcp/ · src/app/system/mcp
  log    entries.ts:175 "External MCP connectors (beta)"
  spec   2026-06-30-external-mcp-connectors-design.md
  → HIGH

IRIS-47  Add Agents                                 Todo
  log    entries.ts:226 "Agent console (beta)"
  code   no src/lib/agents/ — harness lives elsewhere, verify
  → MEDIUM

Not closing (spec exists, no shipped code):
  IRIS-36  Azure Marketplace App
```

Then `AskUserQuestion`: close all / pick a subset / skip. On approval,
`move_issue` to `columns.done` and `comment` one line recording the evidence, so
the close is auditable later.

### Stale in-review tickets

Same batch, different check: find each one's PR (`gh pr list --state merged
--search "<KEY-123>"`, or by branch name). Merged → propose done. No PR and
months old → ask whether to bounce it back to backlog or drop it. Never guess.

---

## Phase 3 — Refinement loop

Walk the remaining queue in score order, one ticket at a time. This phase stays
**in the main thread** — it is a conversation with the user, and a subagent
cannot have it.

### Step 3.1 — ALWAYS ask "now or later" first

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

### Step 3.2 — If the ticket is just a title, ask for prose first

Before any structured question, ask ONE open free-text question and stop:

> IRIS-48 is just the title "Trello connector". In your own words — what should
> this do, and what problem does it solve for you? Rough and unedited is fine.

You cannot generate good options for a ticket you don't understand, and guessing
produces a plausible-sounding spec for the wrong feature. Wait for the answer.

### Step 3.3 — Follow-up interview with AskUserQuestion

Now go structured. Batch 2–4 related questions per call. Ground every option in
the actual codebase — read the relevant files first so the options are real
choices, not generic ones.

Cover, as the ticket warrants: the user-visible surface and where it lives ·
behaviour at the edges · what's explicitly out of scope · interaction with
existing features · the feature-flag name if the repo gates features · cost if
it adds an expensive call · what "done" looks like.

Follow the repo's own product principles while you interview (read its
`CLAUDE.md` / `AGENTS.md` once at the start of the sweep). A refinement that
violates them has gone wrong regardless of how well the user answered.

**Questions must be non-obvious.** Don't ask what the code already answers or
what follows from the last answer. Read first, then ask what you genuinely
can't determine.

### Step 3.4 — Keep going until you could implement it

Stop the interview when, and only when, you can answer all of these:

- [ ] What does the user see, and where exactly?
- [ ] What is the trigger, and what happens on the unhappy path?
- [ ] Which existing modules/tables does it touch?
- [ ] What is explicitly NOT in scope?
- [ ] How would you verify it works — what's the test or the manual check?
- [ ] What flag/config does it ship behind, if the repo works that way?

Any box unticked means one more round of questions. "The user seems done" is not
a stopping condition — say which box is still open and ask about it.

**This checklist is also nightshift's admission gate.** A ticket that passes it
is implementable unattended; one that doesn't will be skipped at 03:00. Refining
to "good enough for a human to figure out" is what leaves nightshift idle.

### Step 3.5 — Spec-worthy? Hand off to the repo's planning kit

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
acceptance criteria, out-of-scope, and the constraints the user gave you. A kit
started with no context re-asks the questions you just answered, which is how a
refinement session doubles in length.

Also pass `planning.notes` verbatim if it is set. That is where the repo's
kit-specific quirks live (numbered feature folders, a required branch name, a
`tasks.md` that must be generated separately) — it exists so this skill doesn't
have to special-case anything.

**Before you invoke the kit, check you are not on `main`** (`git branch
--show-current`). The kit writes files the moment it runs, and spec artifacts
live on their own branch — see Phase 4. Branch once, on the first spec-worthy
ticket; every later ticket in the sweep reuses it.

When the handoff finishes, **verify the files it claims to have written actually
exist** at `planning.specsDir` / `planning.plansDir` before you reference them in
Step 3.6. A kit that failed silently must not produce a `**Spec:**` trailer.

Small, well-understood tickets do NOT get a spec — a refined description is the
whole deliverable for them, regardless of which kit is configured.

**If `planning` is missing from the config**, stop and run the `tracker` skill
rather than guessing. Defaulting to `none` looks like it worked and quietly
produces no spec at all.

### Step 3.6 — Write the refinement back

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

## Acceptance criteria
- [ ] Observable, checkable statements.

## Out of scope
* What this deliberately does not do.

**Spec:** <planning.specsDir>/<file>.md
**Plan:** <planning.plansDir>/<file>.md
```

The `**Spec:**` / `**Plan:**` trailer is **REQUIRED whenever Step 3.5 produced
files** — that is how the change is registered on the ticket. A spec that exists
but isn't linked from its ticket is invisible. Omit the lines entirely when no
files were created; never write a path that doesn't exist.

Then propose the other field updates in the same pass:

| Field | What to do |
|---|---|
| Estimate | Set points now that scope is known. Drives nightshift's per-ticket budget. |
| Labels | Apply the repo's `bug` / `improvement` equivalents. |
| Dependencies | Real blockers as relations — `blockedBy` / `blocks`. "Do this after X merges" belongs in a relation, not in prose. |
| Sub-issues | If refinement revealed 3+ independent deliverables, propose splitting. |

**Do not set priority.** The user maintains priority by hand.

Show the proposed description and field changes, get approval, then
`update_issue`. Confirm in one line and move on:

```
IRIS-38 refined · estimate 2 · labels Improvement · no spec needed
```

---

## Phase 4 — Land the specs

Specs and plans written during a sweep must end up **on `main`** — not stranded
on a branch that gets deleted with the session. But they must **get there via
their own branch**: nothing a sweep writes is ever committed straight to `main`.

### Branch before the first file is written

Step 3.5 hands off to a planning kit that writes files **immediately**. If the
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
| 0 Config | `.claude/backlog.json` read | main | Once, at setup |
| 1 Queue | Scored, ordered list printed | main | Can redirect |
| 2 Cleanup | One evidence table of close candidates | **subagents, parallel** | Approves the batch |
| 3 Refine | now/later → prose → interview → write-back | main (conversation) | Answers; decides |
| 4 Land | Specs committed on their own branch, merged to `main` — no PR | main | Nothing |

## Red flags — stop and re-read this skill

- About to close a ticket because a spec filename matched → **no `CODE`, no close**
- About to gather cleanup evidence inline, ticket by ticket → dispatch subagents
- About to let a subagent write to the tracker → subagents gather, you decide
- About to skip "refine now or later?" because the ticket looks quick → ask it anyway
- About to write a description for a title-only ticket without asking what it means → you are guessing
- About to stop interviewing because it feels like enough → run the 3.4 checklist
- About to write `**Spec:**` pointing at a file you didn't create → delete the line
- About to let the planning kit write spec files while you're still on `main` → branch first
- About to open a PR to land a docs-only sweep → merge the branch into `main` yourself
- About to change priority → don't
- About to refine 12 tickets without a single `AskUserQuestion` → this is an interview, not a batch job

## Do NOT

- Don't close, drop or reopen anything without explicit approval in this session.
- Don't touch in-progress tickets — someone is working on them.
- Don't write a `refine-later` label or deferral comment; deferral is session-only by design.
- Don't fold sub-issues into their parent — refine them individually.
- Don't rewrite a description in a way that loses the original text.
- Don't hardcode a team id, project key or column name — it comes from the config.
- Don't fabricate ticket content when a provider call fails — surface the error verbatim and stop.
- Don't commit spec artifacts straight to `main` — they land by merging their branch.
- Don't leave a session's specs unmerged on a branch either; Phase 4 finishes the job.
