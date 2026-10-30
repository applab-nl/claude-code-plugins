# Roadmap Status

A live pane beside the chat that shows which phase or slice of a plan you are in and how far along it is. It reads OpenSpec changes, Superpowers plans and any markdown roadmap built from headings and checkboxes, and redraws as boxes get ticked.

```
Add billing
openspec/changes/add-billing/tasks.md
████████████░░░░░░░░░░░░ 50%
Phase 2 of 4 · 6/12 tasks

✓ 1. Data model                 4/4
▶ 2. API
  ██████░░░░░░░░░░ 2/5
  □ 2.3 Validate input
  □ 2.4 Webhooks
  □ 2.5 Write tests
○ 3. UI                         0/2
○ 4. Rollout                    0/1
```

## Installation

```
/plugin marketplace add applab-nl/claude-code-plugins
/plugin install roadmap-status-mod@applab-plugins
```

## Usage

The pane opens by itself when a plan is found and the terminal is wide enough (144 columns); otherwise run `/roadmap-status`.

| Command | Effect |
| --- | --- |
| `/roadmap-status` | Open the pane |
| `/roadmap-status <path>` | Pin a markdown file, or an OpenSpec change folder, for this project |
| `/roadmap-status auto` | Unpin, and forget the plan the agent last touched |

## How it reads a plan

- **Phases.** Every heading with checkboxes under it is a phase: OpenSpec's `## 1. Setup` with `- [ ] 1.1 ...`, or Superpowers' `### Task 3: ...` with `- [ ] **Step 1: ...**`. The current phase is the first one with open boxes. Checkboxes inside code blocks are ignored.
- **Nested phases.** A heading starting with Phase, Stage, Milestone, Part, Wave, Sprint or Epic groups the task headings below it, until the next heading of its level or higher. The pane folds finished and upcoming phases to one line each and opens the one in progress with its tasks:

  ```
  Phase 4 of 5 · Task 16 of 18 · 53/65 steps

  ✓ Phase 3: Canvas                          3/3
  ▾ Phase 4: Editing and relations           3/4
    ✓ Task 14: Lane headers                  3/3
    ▶ Task 15: Board settings
    ...
  ○ Phase 5: Check-in and polish             0/3
  ```
- **Slices.** In a section whose list items link to other plan files (a `.md` file, or an OpenSpec change folder meaning its `tasks.md`), each item is a slice. Its progress comes from the linked file, and the pane shows that file's current phase too. When the linked file is gone, for example an archived change, the item's own checkbox counts.

```markdown
# Roadmap
- [x] [Foundations](openspec/changes/archive/foundations/tasks.md)
- [ ] [Billing](openspec/changes/add-billing/)
- [ ] Polish
```

- **Roadmap tables.** In `ROADMAP.md` or `PLAN.md`, each table row is a slice, named from its first two cells (`| 7 | Breadth |` under a `Slice` column reads "Slice 7: Breadth"). A row is done when a cell says `(done)`, `done`, ✓ or ✅.
- **The agent's task list.** Plans often never get their boxes ticked; the agent tracks progress in its own task list (TodoWrite or the Task tools). Each task is matched to a phase by number ("Task 8", "Re-review Task 8 fix") or by the words it shares with the phase title. A phase whose matched tasks are all completed counts as done, remembered per plan across sessions, and the phase with a task in progress is the current one.
- **Off-road.** The agent's open tasks that match no phase of the plan show in an Off-road section above it, with their own bar, so a detour is visible without losing the plan.

## Which plan it follows

The first roadmap found (`ROADMAP.md`, `PLAN.md`, `docs/ROADMAP.md`, `openspec/ROADMAP.md`, else the newest `*roadmap*.md` in `docs/superpowers/plans/` or `docs/plans/`) is shown as a two-line header: slices done and the current slice. Below it, the plan, chosen in this order:

1. The pinned plan.
2. The plan an agent of this session last read or edited: a file under `docs/superpowers/plans/` or `docs/plans/`, or an OpenSpec change, also in a sibling git worktree (shown as `my-app-wt-feature/docs/...`, marked "in use").
3. The plan file the roadmap's current slice links to.
4. The most recently edited plan with open tasks in `openspec/changes/*/tasks.md` (not the archive), `docs/superpowers/plans/*.md` or `docs/plans/*.md`.
5. The roadmap itself.

It refreshes after every tool call and every 4 seconds, so edits made outside Claude show up too.

## Development

```
claude plugin validate roadmap-status-mod
claude plugin test roadmap-status-mod
claude --plugin-dir ./roadmap-status-mod
```

## License

MIT
