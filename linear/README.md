# Linear

Start (and shepherd) work on a Linear ticket end-to-end. The `linear` skill wraps the opening *and* closing moves of ticket-driven development into a single workflow so the model picks the right path every time.

## What it does

When you invoke `/linear <TICKET-ID>` (or say "start work on APP-123", "let's tackle ENG-42", etc.) the skill:

1. **Fetches** the issue via the Linear MCP (`get_issue`)
2. **Classifies** it as a *quick-fix* or *spec-driven* change based on labels, estimate, and description
3. **Creates an isolated git worktree** named after Linear's canonical `branchName` (so Linear's native git integrations light up)
4. **Moves the ticket to "In Progress"** — looking up the team's actual workflow state IDs rather than hard-coding names
5. **Writes a `.linear-ticket.json` sentinel** at the worktree root so later sessions (and `/ship-it`) can advance the ticket without re-discovering state
6. **Chains into the right follow-up skill** — OpenSpec if the project uses it, superpowers (`brainstorming`, `writing-plans`, `systematic-debugging`, or `test-driven-development`) otherwise

When invoked from inside a worktree that already has `.linear-ticket.json`, the skill enters *advance mode* and moves the ticket forward (In Review when a PR opens, Done on merge) based on the current PR state.

## Requirements

- A Linear MCP server: either the AppLab `linear` plugin or the official `claude.ai/Linear` connector. The skill prefers the plugin variant and falls back to the official one.
- A git repository with worktree support — the skill uses the native `EnterWorktree` tool, never `git worktree add` directly.

## Installation

```bash
/plugin marketplace add applab-nl/claude-code-plugins
/plugin install linear@applab-plugins
```

## Pairing with `/ship-it`

This skill is designed to bookend with the [`ship-it`](../ship-it) plugin. `/linear` writes the sentinel at the start of work; `/ship-it` reads it at the end and transitions the ticket to In Review and then Done as the PR moves through its lifecycle.

## License

MIT — see [LICENSE](./LICENSE).
