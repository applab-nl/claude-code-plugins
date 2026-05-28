---
name: ship-it
description: End-of-session shipping workflow — commit, push, open a PR, monitor it (CI checks, ultrareview/Claude review findings, mergeable status), fix any critical/high-priority blockers that surface, then merge and clean up branches + worktree once everything is green. Also advances the Linear ticket through "In Review" (on PR open) and "Done" (on merge) when a `.linear-ticket.json` sentinel is present in the worktree. Use whenever the user says "ship it", "/ship-it", "wrap up the session", "close out", "let's land this", "we're done — push and PR", or otherwise signals they want to hand off the current branch's work and finish cleanly. Prefer this skill over ad-hoc git/gh commands when the user wants the full close-out flow, not just a single step.
---

# Ship It

End-of-session workflow that takes an in-progress feature branch from "code is done" to "merged and cleaned up" without further prompting, pausing only for blockers that require human input.

## What this skill does

Runs the user's standard session close-out:

1. **Commit** outstanding changes with an auto-generated conventional-commits message
2. **Push** the branch to origin (setting upstream if needed)
3. **Open a PR** with an auto-generated title and body
4. **Monitor** the PR: CI checks, ultrareview/Claude review findings, mergeable status
5. **Address** critical + high-priority issues that surface (failing CI, comments tagged critical/high)
6. **Merge** (regular merge), delete the branch locally + remotely, and exit the worktree

The user expects this to run mostly hands-off. Don't ask for confirmation on the standard happy path — only pause when something genuinely needs a human decision (merge conflict, ambiguous fix, severity judgment call you can't make confidently).

## When to trigger

Hard triggers — invoke without hesitation:
- `/ship-it` slash command
- "ship it", "ship this", "let's ship"
- "wrap up the session", "close out", "close this off"
- "we're done — push and PR", "land this", "send it"

Soft triggers — consider this skill when the user wants the *full* close-out, not just one step. If they say only "commit this" or "open a PR", use the narrower commit-commands skills instead and don't auto-escalate to the full ship-it flow.

## Preconditions check

Before doing anything destructive, verify:

- We're in a git repo (`git rev-parse --git-dir`)
- We're **not** on `main`/`master` (refuse and explain — the skill assumes a feature branch)
- `gh` CLI is installed and authenticated (`gh auth status`)

If any precondition fails, report the specific problem and stop. Don't try to "fix" them silently.

## Step 1 — Commit

Check `git status`. Behaviours:

- **Clean tree + branch already pushed + PR exists**: skip to Step 4 (monitor). The user is re-invoking after a fix-and-push cycle.
- **Clean tree + no PR yet**: skip to Step 3 (create PR).
- **Dirty tree**: stage and commit.

When committing:
- Use `git add` with specific paths from `git status --short` — **never** `git add -A` or `git add .` (avoids accidentally staging secrets/large files).
- Generate a Conventional Commits message: `emoji type(scope): subject` (the user's preferred style — see their global CLAUDE.md). Types/emojis: ✨feat, 🐛fix, ♻️refactor, ✅test, 📝docs, 🔧chore, ⚡perf, 👷ci.
- Include a body explaining the *why* and key changes. Pull from the conversation context — what was the user actually building?
- Pass the message via HEREDOC to preserve formatting.
- Let pre-commit hooks run. If they fail, fix the underlying issue and create a **new** commit (never `--amend`, never `--no-verify`).
- **Project-specific**: if this repo is the user's `cvmeister` project (or any repo where `.claude/logs/prompts.json` exists and is un-ignored), include that file in the commit per their CLAUDE.md requirement.

## Step 2 — Push

```
git push -u origin HEAD
```

The `-u` is a no-op if upstream already exists. If push is rejected (non-fast-forward), stop and surface the conflict to the user — don't force-push.

## Step 3 — Create PR

Skip if a PR for this branch already exists (`gh pr view` returns one).

Otherwise:

- Title: short (<70 chars), summarises the change. No trailing period.
- Body: auto-generate from the diff since `main` and the conversation context. Use the user's standard format:

```markdown
## Summary
- <1-3 bullets on what changed and why>

## Test plan
- [ ] <verification steps>
```

Run via `gh pr create --title "..." --body "$(cat <<'EOF' ... EOF)"` (HEREDOC, no escape sequences in the body).

Capture the PR URL and number from the output — you'll need both for monitoring.

After creating, mention to the user that they may want to run `/ultrareview` themselves if they want an AI review (this skill cannot launch it — it's user-triggered and billed).

Then advance the Linear ticket to **In Review** if a sentinel exists — see [Linear ticket transitions](#linear-ticket-transitions).

## Step 4 — Monitor

Watch three signals until the PR is mergeable and clean:

1. **CI checks** — `gh pr checks <number>` (or `gh pr view <number> --json statusCheckRollup`)
2. **Mergeable status** — `gh pr view <number> --json mergeable,mergeStateStatus`
3. **Review findings** — `gh pr view <number> --json comments,reviews` plus `gh api repos/{owner}/{repo}/pulls/{number}/comments` for inline review comments. Ultrareview / Claude review bots post their findings here.

### Pacing

Don't tight-poll. Use `ScheduleWakeup` to pace:

- **First wait**: 300s (5 min). CI rarely finishes in under a few minutes.
- **Subsequent waits while CI is still running**: 300s.
- **When CI is almost done** (most checks complete, 1-2 still running): drop to 60–120s.
- **When waiting on review only** (CI green, awaiting reviewer): 300s.

Pass the verbatim `/ship-it` prompt back via `ScheduleWakeup`'s `prompt` field so the skill resumes on wake. Use a specific `reason` like "waiting for CI on PR #123, 3/5 checks running" — that's what the user sees.

When you wake, re-check status before sleeping again. If everything is green, proceed to Step 5.

## Step 5 — Triage blockers

A blocker requires action when:

- **A CI check failed** — read the failure (`gh run view <run-id> --log-failed`), fix the underlying issue, then loop back to Step 1.
- **A comment or review is labeled critical or high** — look for explicit severity markers in comment bodies (e.g., `[critical]`, `**Severity: High**`, ultrareview-style headers). Fix and loop back to Step 1.
- **Merge conflict** (`mergeStateStatus: DIRTY`) — surface to the user; don't auto-resolve.

What is **not** a blocker for this skill (report but don't auto-fix):

- Comments without explicit critical/high severity tags
- Nitpicks, style suggestions, "consider doing X" feedback
- Passing CI checks that produced warnings

If you're unsure whether something counts as critical/high, ask the user via `AskUserQuestion` rather than guessing. Severity judgment is the one place this skill should pause.

When fixing a blocker, drop back to Step 1 with the new changes. The skill is naturally idempotent — re-running it just resumes wherever the PR currently is.

## Step 6 — Merge and clean up

Only proceed when:
- All CI checks pass
- `mergeable: MERGEABLE` and `mergeStateStatus: CLEAN`
- No outstanding critical/high blockers

Then:

```bash
gh pr merge <number> --merge --delete-branch
```

`--merge` = regular merge commit (the user's preferred strategy, not squash or rebase).
`--delete-branch` = removes the remote branch.

Immediately after merge succeeds, advance the Linear ticket to **Done** if a sentinel exists — see [Linear ticket transitions](#linear-ticket-transitions). Do this *before* the worktree cleanup below, because `.linear-ticket.json` lives inside the worktree and `ExitWorktree` may remove it.

After merge:

1. Switch back to `main` and pull: `git checkout main && git pull`
2. Delete the local branch: `git branch -d <branch-name>` (use `-d` not `-D` — if there are unmerged commits, something is wrong and we want to know)
3. If the current working directory is inside a git worktree (check `git rev-parse --git-common-dir` vs `--git-dir`), call **`ExitWorktree`** to let the harness clean up its tracking. Do **not** use `git worktree remove` directly — that bypasses the harness.

## Linear ticket transitions

If a `.linear-ticket.json` file exists at the worktree root, this skill advances the linked Linear ticket at two moments:

| Moment | Target state |
|---|---|
| Right after `gh pr create` succeeds (Step 3) | **In Review** (`inReviewId`, or `inProgressId` if the team has no review state) |
| Right after `gh pr merge` succeeds (Step 6, before worktree cleanup) | **Done** (`doneId`) |

The sentinel is written by the `/linear` skill when work starts; its shape is:

```json
{
  "identifier": "APP-123",
  "url": "...",
  "title": "...",
  "teamId": "...",
  "states": {
    "inProgressId": "...",
    "inReviewId": "..." | null,
    "doneId": "...",
    "canceledId": "..."
  },
  "branchName": "...",
  "workflow": "quick-fix" | "spec-driven",
  "openedAt": "..."
}
```

### Recipe

1. **Check for sentinel.** If `.linear-ticket.json` is missing, skip silently — this PR isn't Linear-linked. Don't try to discover a ticket from the branch name or commit message; the sentinel is the single source of truth.
2. **Read it.** Parse the JSON; pull out `identifier` and the relevant `stateId`.
3. **Load the Linear MCP tools** with `ToolSearch` if they aren't already in scope:
   ```
   ToolSearch({ query: "select:mcp__plugin_linear_linear__save_issue", max_results: 1 })
   ```
   Fall back to `mcp__claude_ai_Linear_official__save_issue` if the plugin variant isn't installed.
4. **Transition.** Call `save_issue({ issueId: identifier, stateId: <target> })`.
5. **Confirm in one line.** Print e.g. `APP-123: In Progress → In Review (PR #482 opened)` or `APP-123: In Review → Done (PR #482 merged)`. Don't narrate the MCP call; one line is enough.

### Failure handling

If the MCP call fails (auth, network, permission), surface the error but **don't block the ship-it flow** — the PR is already open / merged and Linear state can be fixed manually. Tell the user what happened and what the manual fix is (e.g. "drag APP-123 to Done in Linear"). Don't retry in a loop.

### Don'ts

- Don't read the sentinel and then commit it — it's gitignored via the worktree's `.git/info/exclude` by `/linear`. If you somehow find it staged, unstage it.
- Don't transition past Done. If the ticket is already `doneId`, skip silently.
- Don't move the ticket to `canceledId` from this skill — that's a deliberate user choice, not a side-effect of shipping.

## Final report

End with a `result:` line summarizing what shipped. Include the Linear transition if one happened, e.g.:

```
result: Merged PR #123 (feat(auth): add SSO support); APP-123 → Done; branch + worktree cleaned up
```

## Why this skill exists

The user closes off most coding sessions with exactly this dance. Spelling it out as a skill means:

- The model doesn't forget steps (especially the cleanup at the end)
- Pacing is consistent — no burning tokens tight-polling CI
- Triage rules are explicit, so the agent doesn't either bother the user with nitpicks or silently merge over real blockers

## Edge cases worth knowing

- **No commits yet on the branch** — if `git log main..HEAD` is empty, there's nothing to ship. Report and stop.
- **PR was already merged** (user re-ran the command after merging) — just do the cleanup (Step 6 from "After merge"). Don't try to re-create.
- **Multiple PRs open from this branch** — shouldn't happen normally; surface to user.
- **Required reviewers haven't approved** — `mergeStateStatus` will reflect this. Wait or, if the user has admin merge rights and explicitly OK'd it, surface that as a decision point.
- **Auto-merge enabled** — if the repo has auto-merge on, `gh pr merge --auto` might be a better fit. Detect via repo settings (`gh repo view --json autoMergeAllowed`) and adapt.
