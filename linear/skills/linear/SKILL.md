---
name: linear
description: Start work on a Linear ticket end-to-end — fetch the issue via the Linear MCP, classify it as a quick-fix vs spec-driven change, create an isolated git worktree named after Linear's canonical branchName, move the ticket to "In Progress", and chain into the right follow-up skill (OpenSpec if the project uses it, superpowers otherwise). Also defines the status-update protocol so the ticket advances to "In Review" when a PR opens and "Done" when it merges. Use whenever the user types `/linear <TICKET-ID>` (e.g. `/linear APP-123`), says "start work on <ticket>", "pick up linear ticket X", "let's tackle ENG-42", references a Linear issue ID and wants to begin, or is finishing work in a worktree that has a `.linear-ticket.json` sentinel and the ticket status needs to move forward.
---

# /linear — start (and shepherd) work on a Linear ticket

When the user invokes `/linear <TICKET-ID>` the argument arrives in `$ARGUMENTS`. The skill has two modes:

- **Start mode** — argument is a ticket ID (e.g. `APP-123`). Fetch, classify, worktree, status→In Progress, hand off.
- **Advance mode** — no argument, or the user is closing out work in a worktree that already has `.linear-ticket.json`. Move the ticket forward (In Review / Done) based on the current PR state.

Pick the mode from the argument and the presence of `.linear-ticket.json` in the current worktree.

## Why this exists

Starting from a Linear ticket has the same opening moves every time — read the issue, decide the workflow, set up isolation, mark it started. The closing moves are equally repetitive — In Review when the PR opens, Done when it merges. Centralising them here means: (a) the worktree branch name always matches what Linear shows so its native integrations light up, (b) tickets never sit stale because someone forgot to drag them, and (c) the model picks the right follow-up skill instead of defaulting to whatever it remembers.

---

## Start mode

### Step 1 — Parse the argument

`$ARGUMENTS` should match `^[A-Z][A-Z0-9]+-\d+$` (uppercase team prefix, dash, integer). Strip surrounding whitespace. If the argument doesn't match — empty, lowercase, a URL, a sentence — stop and ask via `AskUserQuestion` what ticket they meant. Don't guess from context.

### Step 2 — Load the Linear MCP tools (if needed)

The Linear MCP tools are typically deferred. Before calling them, load their schemas with `ToolSearch`. Prefer the plugin variant when both are available; fall back to the official one:

```
ToolSearch({ query: "select:mcp__plugin_linear_linear__get_issue,mcp__plugin_linear_linear__list_issue_statuses,mcp__plugin_linear_linear__save_issue,mcp__plugin_linear_linear__get_team", max_results: 4 })
```

If the plugin Linear MCP isn't installed, swap in `mcp__claude_ai_Linear_official__*` with the same suffixes. Throughout this skill, references to `get_issue` / `save_issue` / `list_issue_statuses` / `get_team` mean *whichever variant is available*.

### Step 3 — Fetch the ticket

Call `get_issue` with `{ issueId: "<TICKET-ID>" }`. Extract:

- `identifier` — e.g. `APP-123`
- `title`, `description`
- `branchName` — Linear's canonical branch name; use it verbatim for the worktree
- `team.id` (or `teamId`) — needed to look up workflow states
- `state` — `{ id, name, type }`; `type` is one of `triage` / `backlog` / `unstarted` / `started` / `completed` / `canceled`
- `labels` — list of `{ name }`
- `estimate`
- `priority`
- `children` (sub-issues), `parent` (if this is a sub-issue)
- `assignee`
- `url`

If the fetch fails (404, permission, transport error), surface the error verbatim and stop. Never fabricate a ticket summary.

### Step 4 — Sanity-check the ticket's current state

- If `state.type === 'completed'` or `'canceled'`: this ticket is closed. Ask the user via `AskUserQuestion` whether they want to reopen it or pick a different ticket. Don't silently restart closed work.
- If `state.type === 'started'` and there's an existing worktree matching `branchName`: switch into the existing worktree with `EnterWorktree({ path: <abs path> })` rather than creating a new one. Skip Step 7 status-update.
- If the assignee is someone other than the current user: note it in the summary ("Currently assigned to <name>"), but don't block. The user may be picking it up deliberately.
- If the ticket has `children` (it's a parent): ask which sub-issue to start on rather than treating the parent as the unit of work. Parents rarely make sense as a single branch.

### Step 5 — Classify quick-fix vs spec-driven

This is a judgment call, not a formula. Read the ticket and weigh these signals:

**Pulls toward quick-fix:**
- Labels include any of: `bug`, `fix`, `typo`, `chore`, `docs`, `hotfix`, `regression`, `cleanup`, `polish`, `copy`, `i18n`
- Low estimate (1–2 points, or XS/S) — or no estimate plus a short, concrete description
- Description reads "X is broken / wrong, should do Y" with a clear repro or before/after
- No sub-issues; narrow blast radius (one file, one component, one config key)

**Pulls toward spec-driven:**
- Labels include `feature`, `epic`, `proposal`, `rfc`, `design`, `architecture`, `migration`, `breaking`
- Higher estimate (≥ M / L / XL, or 5+ points)
- Description sketches a capability ("users should be able to…", "we need to support…") rather than naming a fix
- Has sub-issues, or is itself a sub-issue of a larger initiative
- Crosses multiple modules, touches public APIs, or introduces a new concept users will see

**When signals conflict** (e.g. `bug` label but L estimate, or a feature labelled `chore`) ask the user with `AskUserQuestion`. The cost of a wrong route is real: quick-fix skips spec scaffolding the user may want; spec-driven adds ceremony to a 20-minute change. Don't optimize for not asking.

State your call in one sentence before continuing so the user can override cheaply:

> Treating APP-123 as a quick-fix because the label is `bug` and the estimate is 1 point — say so if you want spec scaffolding instead.

### Step 6 — Create (or enter) the worktree

Use the native `EnterWorktree` tool. Pass `branchName` from Linear verbatim — it's already lowercase, hyphenated, prefixed by Linear with the assignee's username, and matches what Linear's "Copy branch name" button gives:

```
EnterWorktree({ branch: "<branchName>" })
```

If `branchName` is missing/empty, derive one as `<ticket-id-lowercase>-<title-slug>` (e.g. `app-123-fix-onboarding-redirect`). Keep it kebab-case, lowercase, no emoji.

If `EnterWorktree` reports the branch already exists in another worktree, switch into that one with the `path` parameter instead of creating a duplicate. Never run `git worktree add` directly — it bypasses the `WorktreeCreate` hook that sets up `.env.local` and `node_modules`.

### Step 7 — Resolve the team's workflow states

Linear teams customize state names ("Todo" / "In Progress" / "In Review" / "Done" / "Cancelled" — but also "Up Next", "Doing", "Shipping", etc.). Match by `type`, not by `name`:

```
list_issue_statuses({ teamId: "<team.id>" })
```

From the result, pick one state per slot:

- **inProgressId** — preferred order: a state of `type: 'started'` whose name matches `/in progress|doing|started|working/i`; else the first `type: 'started'` state by `position`.
- **inReviewId** — a `type: 'started'` state whose name matches `/review|qa|verify|pr/i`; if no such state exists, leave it `null` and reuse `inProgressId` for the In Review transition (some teams collapse the two).
- **doneId** — a `type: 'completed'` state whose name matches `/done|shipped|completed|merged/i`; else the first `type: 'completed'` state.
- **canceledId** — a `type: 'canceled'` state (informational; not used by this skill but cheap to capture).

If multiple states tie or the team's setup is unusual, ask the user via `AskUserQuestion` to confirm the mapping before moving the ticket. Wrong state IDs are easy to fix once but annoying every session after.

### Step 8 — Move ticket to "In Progress"

Call `save_issue` with `{ issueId: "<TICKET-ID>", stateId: "<inProgressId>" }`. If it's already in that state, skip silently.

Also assign yourself if unassigned (`assigneeId: <current user id from get_user me>`) — only when unassigned, never reassign someone else's ticket.

### Step 9 — Persist the lifecycle sentinel

Write `.linear-ticket.json` at the **worktree root** so later sessions (and the `/ship-it` skill) can advance the ticket without re-discovering the state mapping:

```json
{
  "identifier": "APP-123",
  "url": "https://linear.app/team/issue/APP-123/...",
  "title": "Fix onboarding redirect loop",
  "teamId": "<team uuid>",
  "states": {
    "inProgressId": "<uuid>",
    "inReviewId": "<uuid or null>",
    "doneId": "<uuid>",
    "canceledId": "<uuid>"
  },
  "branchName": "<branchName>",
  "workflow": "quick-fix" | "spec-driven",
  "openedAt": "<ISO timestamp>"
}
```

Add this file to the worktree's `.git/info/exclude` so it doesn't get committed — it's a per-worktree sentinel, not project state:

```bash
echo ".linear-ticket.json" >> .git/info/exclude
```

(If `.git` is a file pointing to the main repo, write to the worktree's actual gitdir — `git rev-parse --git-path info/exclude` resolves the right path.)

### Step 10 — Pick and invoke the follow-up skill

Detect the project's workflow ecosystem (run from inside the new worktree):

```bash
test -d openspec && echo openspec || echo none
```

Routing matrix:

| Project has `openspec/` | Classification | Chain into |
|---|---|---|
| Yes | spec-driven | `openspec-new-change` (with the ticket as the change brief) |
| Yes | quick-fix | Skip OpenSpec scaffolding; implement directly. Use `superpowers:systematic-debugging` if the ticket is a bug report, otherwise just start coding with TDD discipline. Reference the ticket ID in commits. |
| No | spec-driven | `superpowers:brainstorming` (then `superpowers:writing-plans` once intent is clear) |
| No | quick-fix | `superpowers:systematic-debugging` if it's a bug, else `superpowers:test-driven-development` |

When invoking the follow-up skill via the `Skill` tool, pass the Linear ticket as context: title, description, acceptance criteria, URL, and the classification. The downstream skill shouldn't have to re-read Linear.

### Step 11 — Print the summary and hand off

Before chaining into the follow-up skill, emit one short summary so the user sees what you decided:

```
APP-123 — Fix onboarding redirect loop
Workflow: quick-fix · superpowers:systematic-debugging (no openspec/ in this repo)
Worktree: .claude/worktrees/dviersel/app-123-fix-onboarding-redirect
Status: Todo → In Progress
Linear: https://linear.app/team/issue/APP-123/...
```

Then invoke the chosen follow-up skill in the same turn. Don't wait to be asked.

---

## Advance mode

Use this when the user is closing out work in a worktree that already has `.linear-ticket.json`, or invokes `/linear` with no argument from such a worktree. Don't trigger advance mode speculatively — only when the user signals they're moving the work forward (opening a PR, merging, closing out).

### Detecting the right transition

Read `.linear-ticket.json` from the worktree root. Then look at git/PR state:

- **No PR open yet, but about to push** → no transition; the ticket stays In Progress.
- **A PR exists for this branch and is open / draft → ready** → move to **In Review** (`stateId: inReviewId`, or `inProgressId` if `inReviewId` is null). Use `gh pr view --json state,isDraft,mergeable` to check.
- **PR is merged** → move to **Done** (`stateId: doneId`).
- **PR closed without merging / branch abandoned** → ask the user before setting state; usually `canceledId`, but they may want to reopen.

Make the transition with `save_issue({ issueId, stateId })`. Print a one-line confirmation:

```
APP-123: In Progress → In Review (PR #482 opened)
```

If the sentinel file is missing but the user clearly wants to advance a Linear ticket, fall back to re-running Steps 2–3 and 7 to rebuild the state map, then transition. Persisting the sentinel afterward is courteous to the next session.

### Coordination with `/ship-it`

The `ship-it` skill handles the commit / PR / merge / cleanup flow. When it runs in a worktree containing `.linear-ticket.json`, it should advance the Linear ticket at the corresponding moments. If you're authoring or invoking `/ship-it` here: after the PR is opened, do an Advance-mode In-Review transition; after merge, do an Advance-mode Done transition; then proceed to worktree cleanup.

---

## Edge cases

- **Linear MCP not configured**: stop and tell the user how to install it. Don't try to scrape Linear via web.
- **Multiple Linear MCP variants installed**: the plugin and the claude.ai official one expose identical surfaces. Pick one and use it for all calls in this run — don't mix.
- **Ticket is a sub-issue of an active spec change**: prefer to slot the work under that change rather than spawning a new one. In OpenSpec projects, use `openspec-continue-change` if the parent has an existing change directory.
- **User is on `main` already with no worktree**: still create one. The whole point is isolation, especially in repos like this one where `WorktreeCreate` hooks set up env files.
- **Branch already exists locally but not as a worktree**: `EnterWorktree({ branch })` will check it out into a new worktree linked to the existing branch — that's fine.

## Do NOT

- Don't `git worktree add` directly — always go through `EnterWorktree`.
- Don't reassign tickets away from someone else; only self-assign when the ticket is unassigned.
- Don't reopen closed (`completed` / `canceled`) tickets without confirming.
- Don't fabricate ticket content if the MCP fetch fails — surface the error and stop.
- Don't skip the classification step. One sentence of reasoning is the deliverable; the routing depends on it.
- Don't commit the `.linear-ticket.json` sentinel.
- Don't move the ticket past a state without a real signal (PR open → In Review, merged → Done). "I finished writing code" is not a signal to move to Done.
