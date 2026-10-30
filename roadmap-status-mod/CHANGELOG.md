# Changelog

All notable changes to roadmap-status-mod will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-10-29

### Added
- Follows the plan any agent of the session reads or edits, including one in a sibling git worktree (shown as `worktree/docs/...`, marked "in use")
- Progress from the agent's task list (TodoWrite or the Task tools): a phase whose matched tasks are all completed counts as done, remembered per plan, and the phase in progress becomes the current one. Tasks match phases by number ("Task 8", "Re-review Task 8 fix") or by shared words
- Off-road section: the agent's open tasks that match no phase of the plan, with their own bar
- Roadmap tables: each row is a slice, done when a cell says `(done)`, `done`, ✓ or ✅
- The roadmap is shown as a two-line header above the plan in progress. A `*roadmap*.md` beside the plans (`docs/superpowers/plans/2026-10-29-stage-1-roadmap.md`) counts as the roadmap too, the newest one winning, and is never picked as the plan itself
- Phase headings (`## Phase 2: Server`, also Stage, Milestone, Part, Wave, Sprint, Epic) group the task headings under them: the pane folds finished and upcoming phases to one line each, opens the one in progress with its tasks, and reads "Phase 2 of 4 · Task 7 of 18". A phase ends at the next heading of its level or higher
- An agent task naming a phase ("Phase 4 review") counts as on the plan, not off-road; "Phase 4" no longer matches "Task 4"

### Changed
- `/roadmap-status auto` also forgets the plan the agent last touched
- A refresh asked for during another one runs again afterwards instead of being skipped
- The progress line counts in the plan's own words: "Task 16 of 18 · 53/65 steps" for a Superpowers plan, "Phase 2 of 4 · 6/12 tasks" otherwise

## [1.0.0] - 2026-10-29

### Added
- Plan pane showing overall progress, every phase with its count, and the current phase's bar and open tasks
- Phases from headings with checkboxes (OpenSpec `tasks.md`, Superpowers plans, any markdown)
- Roadmap slices: list items linking to other plan files or OpenSpec change folders take their progress from the linked file
- Auto-follows the most recently edited plan with open work; `/roadmap-status <path>` pins one per project, `/roadmap-status auto` unpins
- Refreshes after every tool call and every 4 seconds
