# Ship It

End-of-session shipping workflow. Takes an in-progress feature branch from "code is done" to "merged and cleaned up" without further prompting, pausing only for blockers that require human input.

## What it does

When you say "ship it", "/ship-it", "wrap up the session", "land this", etc., the skill:

1. **Commits** outstanding changes with an auto-generated Conventional Commits message
2. **Pushes** the branch to origin (setting upstream if needed)
3. **Opens a PR** with an auto-generated title and body
4. **Monitors** the PR via `ScheduleWakeup`-paced polling — CI checks, ultrareview/Claude review findings, mergeable status
5. **Triages blockers** — fixes failing CI and critical/high-severity review comments; surfaces ambiguous severity judgments to the user
6. **Merges** with `--merge` (regular merge commit) and `--delete-branch`
7. **Cleans up** — switches back to `main`, pulls, deletes the local branch, and calls `ExitWorktree`

## Linear integration

If a `.linear-ticket.json` sentinel is present at the worktree root (written by the [`linear`](../linear) plugin when work started), `ship-it` advances the linked Linear ticket at two moments:

- **PR opened** → ticket moves to **In Review**
- **PR merged** → ticket moves to **Done**

MCP failures during transitions surface the error but don't block the ship-it flow — the PR is already open/merged and Linear can be fixed manually.

## Requirements

- `gh` CLI installed and authenticated
- Git repository with a feature branch (the skill refuses to run on `main`/`master`)
- *Optional:* Linear MCP server for ticket transitions

## Installation

```bash
/plugin marketplace add applab-nl/claude-code-plugins
/plugin install ship-it@applab-plugins
```

## Design notes

- **Idempotent.** Re-invoking after a fix-and-push cycle simply resumes wherever the PR currently is.
- **Pacing is deliberate.** The skill uses `ScheduleWakeup` (300s default while CI runs, dropping to 60–120s as checks near completion) rather than tight-polling.
- **Conservative triage.** Only explicit critical/high markers trigger auto-fixes. Nitpicks and "consider X" feedback get reported but not actioned.
- **No force pushes, no `--amend`, no `--no-verify`.** Pre-commit hook failures get a fresh commit, not a bypass.

## License

MIT — see [LICENSE](./LICENSE).
