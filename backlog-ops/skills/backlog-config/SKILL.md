---
name: backlog-config
description: Use when a backlog operation needs to know which ticketing system this repo uses and no `.claude/backlog.json` exists yet, or the existing one is stale, incomplete or fails validation — a provider call returns "unknown team/project", the project key looks wrong, the column names don't match the board. Also use when the user says "set up the backlog integration", "point this at Jira", "we moved to GitHub Issues", "reconfigure the board", "which board are we on?", or before the first unattended run in a repo.
---

# backlog-config — detect the ticketing provider once, persist it forever

Every other skill in this plugin (`backlog-refine`, `nightshift`) needs the same
five facts: which provider, which project, which columns mean what, what this
repo's conventions are, and which tools to call. Re-deriving those every session
is slow, and **an unattended run cannot derive them at all** — nightshift starts
at 03:00 with nobody to ask.

So: **detect once, confirm with the user, write `.claude/backlog.json`, and read
it from then on.**

## The contract

Everything in this plugin reads `.claude/backlog.json` at the repo root. It is
committed to the repo — it describes the project, not the person.

```json
{
  "version": 1,
  "provider": "linear",
  "projectKey": "IRIS",
  "scope": {
    "teamId": "6caf4d03-f867-406b-8c14-a2197f8a8823",
    "projectId": null,
    "boardId": null
  },
  "tools": {
    "prefix": "mcp__claude_ai_Linear__",
    "kind": "mcp"
  },
  "columns": {
    "backlog":    ["Backlog"],
    "todo":       ["Todo"],
    "inProgress": ["In Progress"],
    "inReview":   ["In Review"],
    "done":       ["Done"],
    "dropped":    ["Canceled", "Duplicate"]
  },
  "conventions": {
    "planningSystem": "superpowers",
    "specsDir": "docs/superpowers/specs",
    "plansDir": "docs/superpowers/plans",
    "changelogFile": "src/lib/changelog/entries.ts",
    "sourceDirs": ["src"],
    "testCommand": "bun run test",
    "typecheckCommand": "bunx tsc --noEmit",
    "buildCommand": null
  },
  "nightshift": {
    "maxTickets": 5,
    "previewBranchPrefix": "nightshift",
    "branchPrefix": "",
    "draftPrs": true,
    "requireReadyTickets": true
  }
}
```

**Every field is required except `scope.*` sub-keys, `conventions.buildCommand`
and `conventions.changelogFile`, which may be `null`.** A `null` you chose is
fine; a missing key means the config was hand-edited badly — re-run detection.

## Step 1 — Is there already a config?

Read `.claude/backlog.json`. If it parses and validates (all required keys, a
known `provider`, a non-empty `projectKey`), **use it and stop**. Say one line:

```
Backlog: linear · IRIS · todo column "Todo" (.claude/backlog.json)
```

Do not re-interview a user who already configured this repo.

## Step 2 — Detect the provider

Probe in this order and collect *every* hit — do not stop at the first:

| Provider | How to detect |
|---|---|
| `linear` | A Linear MCP is available: `mcp__*Linear*__list_issues`. Check `ToolSearch({query: "+linear list issues", max_results: 5})` |
| `jira` | An Atlassian/Jira MCP is available: `mcp__*__jira_search`, `mcp__*__jira_get_project_issues` |
| `github` | `gh auth status` succeeds AND `gh issue list --limit 1` works in this repo |

Also grep the repo for corroborating evidence — it makes the confirmation
question concrete instead of speculative:

- Branch names and merge commits: `git log --oneline -50` for `ABC-123` style keys
- `.github/ISSUE_TEMPLATE/`, a `JIRA_PROJECT` in CI config, a Linear link in the README

If **zero** providers are detectable, stop. Tell the user exactly what you
probed and what to install (the Linear MCP, the Atlassian MCP, or `gh auth
login`). Never invent a provider, and never fall back to "I'll just use TODO
comments in the code".

If **more than one** is detectable, that is normal (many repos have `gh` plus a
tracker). Ask — don't rank them yourself.

## Step 3 — Interview, with the detection as the default

One `AskUserQuestion` call, batched. Lead every question with what you detected
so the user is confirming, not composing:

1. **Provider** — options are the detected ones, in detection order.
2. **Project key / scope** — for Linear the team key + id (`list_teams`); for
   Jira the project key (`jira_get_agile_boards` / project list); for GitHub the
   `owner/repo`. Offer what you found; let them correct it.
3. **Column mapping** — fetch the real workflow states (`list_issue_statuses`,
   Jira board columns, or GitHub labels/Projects columns) and propose the
   mapping. Boards rarely use the canonical names: "Ready" is often `todo`,
   "QA" is often `inReview`.
4. **Conventions** — propose from what's actually in the repo: a `docs/specs/`
   or `openspec/` directory, the test script in `package.json`, a changelog
   file. Only offer paths that exist.

`nightshift.*` defaults (5 tickets, draft PRs on, ready-tickets-only) are sane —
apply them silently and mention them in the summary rather than spending a
question on them.

### The one thing you must not guess: the todo column

`nightshift` implements everything in `columns.todo` while the user sleeps. If
that maps to the wrong column, it implements the wrong work — or the entire
backlog. **Always confirm the todo column explicitly**, even when detection
looks unambiguous, and show the ticket count it currently resolves to:

> Todo column → **"Todo"** (7 tickets). Nightshift will implement from here.

A user who sees "7 tickets" catches a mis-mapping that a user who sees "Todo"
does not.

## Step 4 — Write it

Write `.claude/backlog.json`, create `.claude/` if needed. Then **read it back
and validate it** — a config that doesn't round-trip is worse than none, because
the next skill will trust it.

Tell the user it is committed to the repo and safe to share: it contains ids and
column names, never tokens. If they need a token, it belongs in the MCP server's
own config or the environment, never here.

## Provider verb mapping

The other skills speak in **verbs**, not tool names. Translate here, once:

| Verb | Linear MCP | Jira MCP | GitHub (`gh`) |
|---|---|---|---|
| `list_issues` | `list_issues({team, limit})` | `jira_search({jql})` | `gh issue list --json ...` |
| `get_issue` | `get_issue({issueId})` | `jira_get_issue({issue_key})` | `gh issue view <n> --json ...` |
| `update_issue` | `save_issue({id, ...})` | `jira_update_issue({...})` | `gh issue edit <n> ...` |
| `move_issue` | `save_issue({id, state})` | `jira_move_issue` / transition | `gh issue edit --add-label` or Projects |
| `comment` | `save_comment({issueId, body})` | `jira_add_comment` | `gh issue comment <n>` |
| `link_relation` | `save_issue({id, blockedBy})` | `jira_create_issue_link` | body text + `gh issue edit` |

Load the tools you need in **one** `ToolSearch` call using `config.tools.prefix`,
not five. If a verb has no equivalent for the configured provider (GitHub has no
native estimate field, for example), say so once and degrade gracefully — write
it into the issue body instead of failing the run.

## Red flags

- About to ask the user questions when `.claude/backlog.json` already validates → **read it instead**
- About to write a config with a guessed `projectKey` → confirm it, always
- About to map the todo column without showing its ticket count → the user can't catch your mistake
- About to put an API token in this file → it goes in the MCP/env config
- About to proceed with no detectable provider → stop and say what to install
