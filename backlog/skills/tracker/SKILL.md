---
name: tracker
description: Use when a backlog operation needs to know which ticketing system this repo uses and no `.claude/backlog.json` exists yet, or the existing one is stale, incomplete or fails validation — a provider call returns "unknown team/project", the project key looks wrong, the column names don't match the board. Also use when the user says "set up the backlog integration", "point this at Jira", "we moved to GitHub Issues", "reconfigure the board", "which board are we on?", or before the first unattended run in a repo. Also use when the repo's spec-driven planning kit changes or isn't recognised — "we use Spec Kit now", "point refine at our spec workflow", or a handoff that produced no spec files.
---

# tracker — detect the ticketing provider once, persist it forever

Every other skill in this plugin (`refine`, `nightshift`) needs the same
facts: which provider, which project, which columns mean what, how this repo
turns a ticket into a design, what its conventions are, and which tools to call. Re-deriving those every session
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
    "ready":      ["READY"],
    "todo":       ["Todo"],
    "inProgress": ["In Progress"],
    "inReview":   ["In Review"],
    "done":       ["Done"],
    "dropped":    ["Canceled", "Duplicate"]
  },
  "planning": {
    "kind": "superpowers",
    "invoke": {
      "type": "skill",
      "steps": ["superpowers:brainstorming", "superpowers:writing-plans"]
    },
    "specsDir": "docs/superpowers/specs",
    "plansDir": "docs/superpowers/plans",
    "naming": "<YYYY-MM-DD>-<slug>-design.md",
    "notes": null
  },
  "conventions": {
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

**Every field is required except `scope.*` sub-keys, `columns.ready`,
`planning.naming`, `planning.notes`, `conventions.buildCommand` and
`conventions.changelogFile`, which may be `null`.** A `null` you chose is fine; a missing key means the config
was hand-edited badly — re-run detection.

`planning` describes **how this repo turns a refined ticket into a design**. It
is deliberately an adapter, not an enum: `kind` is a free-text label, and
`invoke` says how to *start* the kit rather than naming a kit the skill has to
know about. See "Step 4 — the planning kit" below.

## Step 1 — Is there already a config?

Read `.claude/backlog.json`. If it parses and validates (all required keys, a
known `provider`, a non-empty `projectKey`), **use it and stop**. Say one line:

```
Backlog: linear · IRIS · ready "READY" → pickup "Todo" (.claude/backlog.json)
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
   mapping. Boards rarely use the canonical names: "QA" is often `inReview`.
   Ask specifically whether the board has a **distinct "Ready" column** sitting
   between backlog and todo, and describe what each answer buys — see "the two
   columns you must not guess" below. Set `columns.ready` only when Ready and
   Todo are genuinely two different columns on this board; leave it `null`
   otherwise.
4. **Conventions** — propose from what's actually in the repo: the test and
   typecheck scripts in `package.json` (or the equivalent), a changelog file,
   the source directories. Only offer paths that exist.
5. **Planning kit** — see Step 4; ask it in this same batched call when the
   fingerprint was unambiguous, and as its own follow-up when it wasn't.

`nightshift.*` defaults (5 tickets, draft PRs on, ready-tickets-only) are sane —
apply them silently and mention them in the summary rather than spending a
question on them.

### The two columns you must not guess

Two roles come out of `columns`, and every other skill pivots on them:

| Role | Resolves to | Who writes it |
|---|---|---|
| **ready column** | `columns.ready ?? columns.todo` | `refine`, when a ticket passes its readiness checklist |
| **pickup column** | `columns.todo`, always | the **user**, by hand — `nightshift` implements what sits here |

Map either one wrong and the damage is real: nightshift builds the wrong work,
or `refine` promotes tickets into a column nobody watches.

**The choice this config makes is whether the user gets a manual planning gate.**
Say it out loud while asking, because it is not obvious from the column names:

- **Distinct Ready column** (`columns.ready` set) → `refine` promotes into Ready
  and stops. Nothing gets built until the user drags it to Todo themselves.
  Refined ≠ scheduled.
- **No Ready column** (`columns.ready` null) → both roles are Todo. A ticket
  `refine` promotes is admitted to the next nightshift automatically. Simpler,
  faster, no gate.

**Always confirm both explicitly**, even when detection looks unambiguous, and
show the ticket count each currently resolves to:

> Ready column → **"READY"** (4 tickets). `refine` promotes here and stops.
> Pickup column → **"Todo"** (7 tickets). You move tickets here when you want
> them built; `nightshift` implements from here.

A user who sees "7 tickets" catches a mis-mapping that a user who sees "Todo"
does not.

When `columns.ready` is `null`, say that consequence in the same breath —
"`refine` promotes straight into Todo, so a refined ticket is queued for the
next nightshift" — rather than reporting one column twice.

## Step 4 — The planning kit

When `refine` decides a ticket is too big to implement from a description alone,
it hands off to whatever spec-driven kit this repo uses. Kits differ in how they
are *started* — a skill, a slash command, or a document that tells the agent
what to do — so the config records that, rather than a name this skill would
have to recognise.

### `invoke.type` — three ways to start a kit, plus "no kit"

| `type` | Means | `steps` holds | Example |
|---|---|---|---|
| `skill` | Invoke skills in order via the `Skill` tool | skill names | `["superpowers:brainstorming", "superpowers:writing-plans"]` |
| `command` | Run slash commands in order | command strings | `["/specify", "/plan"]` |
| `docs` | Read the kit's own agent instructions and follow them | file paths | `["openspec/AGENTS.md"]` |
| `none` | No kit — the refined description *is* the deliverable | `[]` | `[]` |

Anything a kit can be started with fits one of the first three. If you find
yourself wanting a fourth, you are describing a workflow, not an entry point —
put it in `notes`, which is passed to the handoff verbatim.

### Fingerprints — a shortcut, not a whitelist

Probe for these, in this order. **Treat every row as a hypothesis to confirm
with the user, not a fact** — kits change layouts, and a repo may use one in a
non-standard way:

| Likely kit | Fingerprint to look for | Proposed `invoke` |
|---|---|---|
| superpowers | the superpowers plugin is installed; `docs/*/specs/` + `docs/*/plans/` | `skill` → `superpowers:brainstorming`, `superpowers:writing-plans` |
| openspec | an `openspec/` directory containing `AGENTS.md` | `docs` → `openspec/AGENTS.md` |
| spec-kit | a `.specify/` directory, or `specs/<NNN>-<slug>/spec.md` | `command` → `/specify`, `/plan` |
| kiro | `.kiro/specs/<feature>/` with `requirements.md` / `design.md` / `tasks.md` | `docs` → the kit's steering files |
| bmad | a `.bmad-core/` directory or BMAD agent definitions | `docs` → its agent instructions |
| *(none found)* | no planning artifacts anywhere | ask — see below |

Corroborate a fingerprint before proposing it: open the directory and confirm it
holds what you expect. A `specs/` folder containing three stale markdown files
is not a kit.

### When you don't recognise it, ask — that is the mechanism, not the fallback

Most repos will not match a fingerprint, and a wrong guess here is expensive:
`refine` would either invoke a kit that doesn't exist or silently drop to
writing designs inline, and the user would only notice when a spec never
appeared. So when detection is ambiguous or empty, ask directly:

> **How does this repo turn a ticket into a design/spec before implementation?**
> · Runs a skill — which one(s)?
> · Runs a slash command — which one(s)?
> · Follow a document in the repo — which path?
> · Nothing formal — a refined ticket description is enough

Then confirm the artifact paths (`specsDir`, `plansDir`) by asking where the kit
*writes*, and check the directory exists. Record any quirk — numbered feature
folders, a required branch name, a `tasks.md` that must be generated separately —
in `notes`. That text is handed to the kit verbatim at handoff time, so it is
where kit-specific knowledge lives instead of in this skill.

`specsDir` and `plansDir` may be the same directory; several kits keep
`spec.md` and `plan.md` side by side in one per-feature folder.

## Step 5 — Write it

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
- About to map the ready or pickup column without showing its ticket count → the user can't catch your mistake
- About to set `columns.ready` without saying it creates a manual planning gate → that consequence *is* the question
- About to put an API token in this file → it goes in the MCP/env config
- About to proceed with no detectable provider → stop and say what to install
- About to set `planning.kind` from a directory name without opening it → confirm the fingerprint
- About to default `planning` to `none` because you didn't recognise the kit → **ask the user instead**; silently dropping to inline designs is the failure this adapter exists to prevent
- About to invent a `steps` entry (a skill or command you haven't seen exist) → ask for the real one
