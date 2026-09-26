---
name: install-ship-it
description: Generate (or upgrade) a project-specific `ship-it` skill for the current repository. Analyzes the project (stack, CI, build/test commands, mobile targets, database migrations, spec kits, deploy targets, ticketing), interviews the user for what the code can't tell, proposes a menu of close-out steps to pick from, and writes a self-contained `.claude/skills/ship-it/SKILL.md` based on the generic ship-it workflow. When a project ship-it skill already exists, reviews it against the current template and the project's current state and suggests upgrades. Use when the user says "install ship-it", "/install-ship-it", "set up ship-it for this project", "customize ship-it", "upgrade/review our ship-it skill", or wants the close-out flow to cover project specifics like mobile builds, device verification or database changes.
---

# Install Ship It

Turns the generic `ship-it` workflow into a skill tailored to one repository, so shipping covers what this project actually needs: a mobile build, a pass on a real device, a migration check, a preview deploy smoke test, a release tag.

The output is a **self-contained** skill at `.claude/skills/ship-it/SKILL.md`. It inlines the generic steps plus the project steps, so it works even without the plugin installed. It records which template version it came from so a later run can offer upgrades.

## The template

The generic workflow is the sibling skill at `../ship-it/SKILL.md`, relative to this skill's base directory. Read it in full before generating anything. It is the baseline every generated skill starts from. The template version is the `version` in `../../.claude-plugin/plugin.json`.

Carry these invariants from the template into every generated skill. Leave them out only if the user explicitly asks you to:

- stage specific paths, never `git add -A` / `git add .`
- no force push, no `--amend`, no `--no-verify`
- `ScheduleWakeup`-paced monitoring, no tight polling
- conservative blocker triage (explicit critical/high only; ask when unsure)
- refuse to run on the default branch; `ExitWorktree` for worktree cleanup
- a closing `result:` line

## Mode

Check for an existing project skill at `.claude/skills/ship-it/SKILL.md` (also check `.claude/commands/ship-it.md`, an older form):

- **Missing** → [Install](#install) mode.
- **Present** → [Upgrade](#upgrade) mode. Don't overwrite it without going through the review.

## Install

### 1. Analyze the project

Delegate the survey to an `Explore` agent (thoroughness "medium") so the file dumps stay out of the main context. Ask it to report **facts with file paths**, not guesses, for each of:

| Area | What to look for |
|---|---|
| Conventions | `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`: commit style, merge policy, release rules, anything already describing "how we ship" |
| Stack & commands | package manager + scripts (`package.json`, `bun.lock`, `pubspec.yaml`, `build.gradle.kts`, `Makefile`, `justfile`, `pyproject.toml`); the exact lint / typecheck / test / build commands |
| CI | `.github/workflows/*`, other CI configs: which checks run on PRs, and which only after merge (deploys, releases) |
| Pre-commit | husky, lefthook, `pre-commit`, lint-staged |
| Mobile | `ios/`, `android/`, Flutter, Expo/EAS (`app.json`, `eas.json`), fastlane, version/build-number files |
| Database | `prisma/`, `supabase/migrations/`, Flyway/Liquibase, Drizzle, raw SQL migration dirs; seed scripts; generated types |
| Spec kits | OpenSpec (`openspec/`), Superpowers (`docs/superpowers/`), Spec Kit (`.specify/`) |
| Deploy | Vercel, Netlify, Fly, Docker, k8s manifests, preview-deploy setup, post-merge deploy workflows |
| Release | `CHANGELOG.md`, versioned manifests, release-please/changesets/semantic-release, tags |
| Tickets | `.linear-ticket.json` usage, `.claude/backlog.json`, issue references in commit history |
| Repo shape | monorepo/workspaces, default branch name |

In parallel, gather the repo's GitHub settings yourself:

```bash
gh repo view --json defaultBranchRef,mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed,autoMergeAllowed,deleteBranchOnMerge
```

Summarize the findings for the user in a short table before the interview. That lets them correct anything the analysis got wrong.

### 2. Interview

Use `AskUserQuestion` to get what the repository can't tell you. Ask only questions whose answers change the generated skill. Base them on the findings, pre-fill the likely answer as the recommended option, and skip anything already answered by the conventions files. Keep interviewing until nothing is ambiguous. Typical topics, used only where relevant:

- **Merge strategy**: merge / squash / rebase, and auto-merge if the repo allows it.
- **Local gate**: which checks must pass locally before pushing, given what CI already covers (don't duplicate a slow CI suite locally without reason).
- **Mobile**: which platforms to build before shipping; whether a pass on a simulator or a physical device is required, and whether it's automated or a manual checkpoint where the skill pauses and asks.
- **Database**: whether migrations must be generated and committed with schema changes, a drift check, who applies migrations to shared/prod environments and when (before merge, after merge, never by the agent). Never let the generated skill apply migrations to production unless the user explicitly asks for that.
- **Deploy**: whether to smoke-test the preview deploy before merge; whether to watch the production deploy (and error tracking) after merge.
- **Release**: version bump / changelog / tag, and on which changes.
- **Blockers**: anything project-specific that must block a merge (e.g. a required reviewer, a failing e2e suite that is flaky and should only warn).
- **Location**: install as **committed** (`.claude/skills/ship-it/`, shared with the team; recommended) or **local-only** (same path, excluded via `.git/info/exclude`).

### 3. Propose steps and let the user pick

Build a menu from the [step catalog](#step-catalog), keeping only steps that apply to what the analysis and interview found. Present it with `AskUserQuestion` using `multiSelect: true`, one question per phase (pre-commit, PR, post-merge). Each option names the concrete command it would run, e.g. "Local gate — `bun run lint && bun run typecheck && bun test`". Mark recommended steps with "(Recommended)". A question holds at most 4 options, so split a phase into two questions if needed. Offer nothing that doesn't apply.

The template's core (commit → push → PR → monitor → triage → merge → cleanup) is not optional and is not on the menu.

### 4. Generate

Write `.claude/skills/ship-it/SKILL.md`:

- **Frontmatter**: `name: ship-it` and a description that names the project and its specifics (e.g. "…builds the iOS and Android apps and pauses for device verification before merging"), plus the template's trigger phrases.
- **Provenance block** right after the frontmatter, for Upgrade mode to parse:
  ```markdown
  <!--
  generated-by: install-ship-it
  generated-from: ship-it@<template version>
  generated-on: <YYYY-MM-DD>
  steps: [spec-sync, local-gate, mobile-build, device-verification, ...]
  -->
  ```
- **Body**: the template's structure, with selected steps inserted where they belong and numbered in order. Use the **exact commands** found in the repo (verified, not invented). Drop template sections that don't apply (e.g. Linear transitions when the project doesn't use Linear). Replace the template's merge strategy and default-branch name with the project's.
- Keep it as lean as the template. Project steps state *what to run, what counts as pass/fail, and when to pause*. Don't pad them with generic advice.

Then:

1. Show the user a short outline of the generated steps, not the whole file.
2. For **local-only**, append `.claude/skills/ship-it/` to `.git/info/exclude`.
3. For **committed**, leave the file uncommitted and tell the user. It ships with their next `/ship-it`.
4. Mention that the plugin's generic `ship-it:ship-it` stays available. The generic skill defers to a project skill when one exists.

## Upgrade

1. **Read the existing skill** and its provenance block. If there's no block, it was hand-written. Treat it as the user's own work and review it the same way.
2. **Diff against the template**: read the current template and `../../CHANGELOG.md`. List what changed since `generated-from` that the project skill lacks (new steps, fixed rules, changed invariants).
3. **Re-analyze the project** (same survey as Install step 1) and look for drift:
   - commands in the skill that no longer exist
   - new areas the skill doesn't cover (a migrations dir appeared, a mobile target was added, CI gained a deploy job)
   - steps for things the project dropped
4. **Review the skill itself** for weaknesses: missing invariants, vague pass/fail criteria, steps in the wrong order (e.g. device verification after merge), unsafe actions (applying prod migrations, force pushes).
5. **Present suggestions** with `AskUserQuestion` (`multiSelect: true`), each one a concrete change and why it's needed. Group them by source: template upgrade / project drift / review finding. If there are no suggestions, say it's current and stop.
6. **Apply only what was selected**, editing in place. Preserve the user's hand edits everywhere else: this is a merge, not a regeneration. Update the provenance block (`generated-from`, `generated-on`, `steps`).
7. If the user wants to add steps that aren't a fix, run Install step 3 for just those.

## Step catalog

Starting points, not scripts. Adapt each to the project's actual commands and answers.

**Pre-commit**
- `spec-sync`: the template's Step 0 (OpenSpec / Superpowers / Spec Kit).
- `local-gate`: run lint / typecheck / tests / build; stop on failure and fix before committing.
- `migration-check`: schema changed ⇒ a migration exists and is committed; run the drift check (e.g. `prisma migrate diff`, `supabase db diff`); regenerate DB types if the project commits them. Run migrations only from the worktree where the work started.
- `mobile-build`: build each selected platform (e.g. `flutter build ios --no-codesign`, `flutter build apk`, `eas build --local`); bump build numbers if the project requires it.
- `device-verification`: run on a simulator/emulator/device. When it's manual, pause with `AskUserQuestion` for a pass/fail confirmation, with a short checklist of what to verify, derived from the change.
- `version-changelog`: bump versions in every manifest that must stay in sync and add a CHANGELOG entry.
- `docs-sync`: update README / CLAUDE.md / API docs affected by the change.

**PR**
- `preview-smoke`: wait for the preview deploy, then smoke-test the changed flows (browser automation or `curl` against health endpoints).
- `ticket-transitions`: Linear sentinel transitions from the template, or the tracker in `.claude/backlog.json`.
- `required-review`: wait for or request specific reviewers when the repo requires it.

**Post-merge**
- `deploy-watch`: follow the production deploy to completion and check error tracking (e.g. Sentry) for new issues.
- `migration-apply`: only if the user explicitly wants the agent to apply migrations after merge; name the target environment and get confirmation every time.
- `release-tag`: tag and publish a release when the change warrants it.
- `store-submission`: hand off to the mobile release pipeline (fastlane / EAS submit), usually as a reminder rather than an automatic action.
- `dependency-refresh`: check for outdated dependencies after merge to main, if that's the team's policy.

## Don'ts

- Don't invent commands. If the analysis couldn't find one, ask.
- Don't put steps in the generated skill that the user didn't select.
- Don't commit the generated skill yourself. Committing belongs to shipping.
- Don't modify the plugin's generic `ship-it` skill from here.
