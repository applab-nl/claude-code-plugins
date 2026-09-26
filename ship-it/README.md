# Ship It

End-of-session shipping workflow. Takes an in-progress feature branch from "code is done" to "merged and cleaned up" without further prompting, pausing only for blockers that require human input.

## What it does

When you say "ship it", "/ship-it", "wrap up the session", "land this", etc., the skill:

1. **Syncs specs** when a spec-driven kit is present (OpenSpec, Superpowers, Spec Kit): brings specs and plans in line with what was built, ticks off finished tasks, and validates and archives completed OpenSpec changes so they ship in the same PR
2. **Commits** outstanding changes with an auto-generated Conventional Commits message
3. **Pushes** the branch to origin (setting upstream if needed)
4. **Opens a PR** with an auto-generated title and body
5. **Monitors** the PR via `ScheduleWakeup`-paced polling — CI checks, ultrareview/Claude review findings, mergeable status
6. **Triages blockers** — fixes failing CI and critical/high-severity review comments; surfaces ambiguous severity judgments to the user
7. **Merges** with `--merge` (regular merge commit) and `--delete-branch`
8. **Cleans up** — switches back to `main`, pulls, deletes the local branch, and calls `ExitWorktree`

## Project-specific ship-it (`/install-ship-it`)

The generic flow doesn't know about your mobile builds, device checks or database migrations. `/install-ship-it` generates a ship-it skill for the current repo:

1. **Analyzes** the project: stack and commands, CI, mobile targets, migrations, spec kits, deploy and release setup, ticketing
2. **Interviews** you about what the code can't tell (merge strategy, manual device verification, who applies migrations, …)
3. **Proposes steps** grouped by phase (pre-commit, PR, post-merge) for you to pick from
4. **Writes** a self-contained `.claude/skills/ship-it/SKILL.md`, committed or local-only, with a provenance header recording the template version

Run it again later to **review and upgrade** an existing project skill: it checks template changes since the recorded version and drift in the project (new migrations dir, removed commands, …), then applies only the suggestions you select, keeping your own edits. The generic `ship-it` defers to the project skill whenever one exists.

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
