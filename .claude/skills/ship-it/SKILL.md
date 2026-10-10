---
name: ship-it
description: Close-out workflow for AppLab's claude-code-plugins marketplace — validates the marketplace and plugin manifests, keeps plugin.json, the marketplace entry, the top-level marketplace version and CHANGELOG.md in sync, syncs the root README, audits new or vendored third-party plugins, then commits, pushes, opens a PR, watches it and merges with a merge commit. Use whenever the user says "ship it", "/ship-it", "wrap up the session", "close out", "let's land this", "we're done — push and PR", or otherwise wants this branch's work handed off and cleaned up.
---

<!--
generated-by: install-ship-it
generated-from: ship-it@1.3.0
generated-on: 2026-10-10
steps: [manifest-validation, version-changelog, readme-sync, plugin-audit]
-->

# Ship It — claude-code-plugins

Takes a branch of this marketplace monorepo from "changes are done" to "merged and cleaned up". Run hands-off on the happy path; pause only for blockers that need a human decision.

There is no CI, no git hooks and no test suite in this repo, so Steps 1–4 below are the only safety net before a PR. Don't skip them.

## Invariants

- Stage specific paths from `git status --short`, never `git add -A` / `git add .`.
- No force push, no `--amend`, no `--no-verify`. A failing hook means a fix and a **new** commit.
- Refuse to run on `main`. Say so and stop.
- Wait inside one run (background `gh pr checks --watch`, `Monitor` for review comments); `ScheduleWakeup` only as a fallback. Never re-invoke `/ship-it`, no tight polling.
- Triage conservatively: only explicit critical/high findings block. Ask when unsure.
- Never push or merge to a repo other than `applab-nl/claude-code-plugins` without asking.

## Preconditions and re-entry guard

1. `git rev-parse --git-dir`, `git branch --show-current` (must not be `main`), `gh auth status`.
2. `gh pr view --json number,state,mergedAt,url` on every invocation, including a woken one:
   - `MERGED` → go straight to [Cleanup](#step-8--merge-and-clean-up), skipping the merge. If cleanup is also done, print `result: PR #N was already merged; nothing left to do` and stop.
   - `CLOSED` → report and stop.
   - `OPEN` → continue at the step matching the current state.
3. No commits ahead of `main` (`git log main..HEAD` empty) and a clean tree → nothing to ship; report and stop.

## Step 1 — Classify the change

Run `git diff main...HEAD --name-only` plus `git status --short`. Note which plugin directories changed (the top-level directory of each path) and which of them are new (no `.claude-plugin/plugin.json` on `main`). Steps 2–5 use this list. A change that only touches `CLAUDE.md`, root `README.md` or `openspec/` skips Steps 2–5 and says so in one line.

## Step 2 — Manifest validation

**Runs when** the diff matches `*/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, or adds/removes a plugin directory.

Run from the repo root and require exit 0:

```bash
python3 -I - <<'PY'
import json,os,sys
m=json.load(open('.claude-plugin/marketplace.json')); bad=[]
names=[p['name'] for p in m['plugins']]
if len(names)!=len(set(names)): bad.append('duplicate plugin names')
for p in m['plugins']:
    src=p['source']; pj=os.path.join(src,'.claude-plugin','plugin.json')
    if not os.path.isfile(pj): bad.append(f"{p['name']}: missing {pj}"); continue
    j=json.load(open(pj))
    if j.get('name')!=p['name']: bad.append(f"{p['name']}: plugin.json name is {j.get('name')}")
    if j.get('version')!=p.get('version'): bad.append(f"{p['name']}: plugin.json {j.get('version')} != marketplace {p.get('version')}")
    for f in ('README.md','CHANGELOG.md'):
        if not os.path.isfile(os.path.join(src,f)): bad.append(f"{p['name']}: no {f}")
for d in os.listdir('.'):
    if os.path.isfile(os.path.join(d,'.claude-plugin','plugin.json')) and d not in names: bad.append(f"{d}: not listed in marketplace.json")
print('\n'.join(bad) or 'manifests ok'); sys.exit(1 if bad else 0)
PY
```

Any output other than `manifests ok` is a failure: fix the manifest and re-run before continuing.

## Step 3 — Version and changelog

**Runs when** the diff touches files inside a plugin directory.

For each changed plugin, in the **same commit**:

1. Bump `version` (semver: fix = patch, new capability = minor, breaking = major) in both `<plugin>/.claude-plugin/plugin.json` and the plugin's entry in `.claude-plugin/marketplace.json`.
2. Add a dated entry to `<plugin>/CHANGELOG.md` (Keep a Changelog format).
3. Bump the **top-level** `version` in `.claude-plugin/marketplace.json` once for the whole branch: patch for fixes, minor for a new plugin or skill. This is the repo's practice in git history, although `CLAUDE.md` doesn't state it.

A plugin already bumped on this branch (compare against `git show main:<path>`) is not bumped again. A brand-new plugin keeps the version it was introduced with.

## Step 4 — Root README sync

**Runs when** a plugin was added, removed or had its version, category or purpose changed.

Check the root `README.md`: a new plugin needs a section under the right `### …` heading of "Available Plugins" (version, category, doc link, key features) and a line in "Plugin Categories". Update the `**Version**` line of any bumped plugin. Don't rewrite the stale parts of the README (marketplace version footer, plugin count in `CLAUDE.md`) as a side effect; mention them in the PR body instead.

## Step 5 — Audit new or third-party plugins

**Runs when** a plugin directory is new on this branch, or the diff touches a plugin whose `CHANGELOG.md` or `plugin.json` says it was vendored or adapted from another repository.

Run the `repo-audit` skill against that plugin directory and, for vendored code, against the upstream commit it names. Show the rating. `HIGH` or `CRITICAL`, or any prompt-injection finding, **blocks shipping**; stop and report. `MEDIUM` goes in the PR body for the reviewer. Vendored code must also keep its upstream `LICENSE`, and the changelog must name the source repository and commit SHA.

## Step 6 — Commit and push

- Group changes logically: one commit per plugin, plus one for the marketplace manifest and README if they stand apart. Don't mix unrelated plugins.
- Message: `emoji type(scope): subject` (✨feat, 🐛fix, ♻️refactor, ✅test, 📝docs, 🔧chore, ⚡perf, 👷ci), with a body explaining why. Scope is the plugin name, or `marketplace`. Pass via HEREDOC. Append any attribution lines the session requires.
- `git push -u origin HEAD`. A rejected push (non-fast-forward) stops the run; don't force.

## Step 7 — Open the PR and monitor

Skip creation if `gh pr view` already returns a PR. Title under 70 characters, no trailing period. Body:

```markdown
## Summary
- <what changed and why>

## Test plan
- [ ] manifest validation passes (Step 2 output)
- [ ] <plugin-specific checks; for vendored plugins the audit rating and source SHA>
```

Then wait inside this run:

1. CI: this repo has none. `gh pr checks` reporting "no checks" is normal, so don't wait on it.
2. Review comments: if a Claude or review bot comment is expected, use `Monitor` with an until-loop over `gh pr view <n> --json reviews,comments` every 60s, 20-minute ceiling. On timeout merge if nothing blocking was posted, and say so.
3. Triage: blockers are an explicit critical/high label, or `mergeStateStatus: DIRTY` (surface; never auto-resolve). Nitpicks and "consider…" comments are reported, not fixed.

Mention that `/code-review ultra` is available to the user if they want a cloud review; the agent can't launch it.

## Step 8 — Merge and clean up

Proceed only when mergeable and clean, with no critical/high blockers:

```bash
gh pr merge <number> --merge --delete-branch
```

The repo has `deleteBranchOnMerge` off, so `--delete-branch` is needed. If a permission check refuses the merge, ask once; don't rephrase to get past it.

Then clean up, trusting GitHub's `MERGED` state rather than local ancestry:

```bash
WT=$(git rev-parse --show-toplevel)
ROOT=$(git worktree list --porcelain | head -1 | sed 's/^worktree //')
BRANCH=$(git branch --show-current)
```

- **Linked worktree** (`$WT` ≠ `$ROOT`): `git -C "$WT" status --porcelain` must be empty; `ExitWorktree` with `remove` if this session entered it, else `phantom delete <name>` or `git -C "$ROOT" worktree remove "$WT"` (never `--force`); then `git -C "$ROOT" branch -D "$BRANCH"` and `git -C "$ROOT" fetch origin --prune`; fast-forward main only if the primary checkout is on a clean main.
- **Primary checkout**: `git switch main`, `git pull --ff-only`, `git branch -D "$BRANCH"`.
- List other local branches whose PRs are merged and report them in one line; don't delete them unasked.

## Step 9 — Local refresh

**Runs when** the merged change touched a plugin the user has installed. Tell the user to refresh the marketplace (`/plugin marketplace update applab-plugins`) so the new version is picked up. Don't run it for them.

## Final report

End with a `result:` line:

```
result: Merged PR #15 (feat(cache-tax): vendor cache-tax 2.2.1); marketplace 1.9.0; audit CLEAN; branch cleaned up
```
