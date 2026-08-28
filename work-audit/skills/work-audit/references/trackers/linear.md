# Linear

Detect Linear from: `mcp__*Linear*` tools being available, a `.linear-ticket.json` sentinel, or
branch names shaped `username/abc-123-slug`. Ticket ids look like `ABC-123`.

## Enumerate the board

Query by status *type* rather than name — teams rename statuses, and custom states like `READY` or
`Blocked` map onto the standard types. The types are `triage`, `backlog`, `unstarted`, `started`,
`completed`, `canceled`.

```
list_issue_statuses(team)      # do this first: learn the team's custom names and their types
list_issues(team, state, fields=["id","title","status","priority","gitBranchName","updatedAt"])
```

A full-board query easily exceeds the tool result limit. Two ways around it, both fine:

- Query per status and combine — usually only a few hundred open issues.
- If a large result is written to a file, delegate parsing to a subagent and ask for a compact table
  back rather than reading the file into your own context.

Request only the fields you need. `description` is what makes these payloads huge; omit it unless
you are verifying a specific ticket's scope.

## What to cross-reference

`gitBranchName` is the highest-value field — it maps tickets to branches directly, so a ticket whose
branch is fully merged while the ticket sits in Todo is an immediate finding.

```bash
git log origin/main --format='%s' -400 | grep -oE '[A-Z]{2,}-[0-9]+' | sort -u
```

Compare that set against tickets the board shows as open.

## Patterns worth checking

- **No tickets in "In Review"** while several branches are pushed with no PR. This means finished
  work is not being turned into pull requests — worth calling out as a process finding, not just a
  list of branches.
- **Parent/umbrella tickets** whose children are all Done. Linear does not close parents
  automatically.
- **`opsx:`-style tickets** that mirror a planning document rather than describing work. Their real
  status lives in the document, not the ticket.
- **Tickets untouched for a year but marked High/Urgent.** Priority set once and never revisited;
  either schedule or close.

## Updating

The audit itself is read-only. If the user asks you to apply the corrections afterwards:

```
save_issue(id, state)                     # move status
save_issue(id, title)                     # retitle when the diagnosis was wrong
save_comment(issueId, body)               # record the evidence for a status change
```

Leave a comment citing the file path or grep that justified the change. Whoever reopens the ticket
will want to know why it was closed, and "closed by an audit" is not an answer.
