# Jira

Detect from an `atlassian`/`jira` MCP server, a `.jira` config, or branch names carrying `ABC-123`
keys. Jira keys look identical to Linear's, so confirm which tracker is actually in play before
assuming.

## Enumerate

Prefer JQL over per-issue fetches, and restrict fields — Jira issue payloads are large.

```
project = ABC AND statusCategory != Done ORDER BY updated DESC
project = ABC AND statusCategory = Done AND updated >= -90d
```

Fields worth requesting: `key`, `summary`, `status`, `priority`, `assignee`, `updated`,
`resolutiondate`, `parent`, `issuelinks`. Skip `description` and `comment` unless verifying one
ticket's scope.

Jira's `statusCategory` (`To Do` / `In Progress` / `Done`) is the stable grouping; workflow status
names are per-project and often heavily customised, so classify on the category and show the name.

## Cross-reference

```bash
git log origin/main --format='%s%n%b' -400 | grep -oE '[A-Z]{2,}-[0-9]+' | sort -u
```

Jira's own "development" panel links commits and branches when the integration is installed, but it
misses work pushed before the integration or merged under a squashed message. The git-side grep is
the more reliable signal for an audit.

## Patterns worth checking

- **Epics whose children are all Done** but which remain open — the Jira equivalent of an orphaned
  umbrella ticket.
- **Sub-tasks closed while the parent stayed open**, or the reverse.
- **`Blocked` status with no active blocker.** Check whether the linked blocker resolved; blocked
  tickets are rarely revisited on their own.
- **Duplicate-linked issues** where the "duplicate" actually covers different scope. Verify in code
  before honouring the link — the same finished-half/unfinished-half shape appears here too.

## Updating

Transition ids vary per workflow, so read the available transitions for an issue before moving it
rather than hardcoding a name. Add a comment carrying the evidence for any status change.
