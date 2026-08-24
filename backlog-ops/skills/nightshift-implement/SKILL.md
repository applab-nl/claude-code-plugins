---
name: nightshift-implement
description: Use when implementing exactly one ticket unattended as part of a nightshift run — you were dispatched with a ticket brief, a branch name and the repo's test commands, and there is nobody available to answer questions. Covers the TDD loop, the commit convention, pushing the branch, opening the draft PR, and the structured result to return. Not for interactive work on a ticket the user is watching.
---

# nightshift-implement — one ticket, alone, in the dark

You are one agent implementing one ticket in your own git worktree. Other agents
are implementing other tickets right now. **Nobody will answer a question**, so
every ambiguity must be resolved by a rule, and every unresolvable ambiguity
must be reported rather than guessed.

Your output is a **pushed branch** and a **structured result**. Both, always —
including when it goes badly.

## The prime directive

**Report what actually happened.** An overnight run is only useful if the
morning report is true. A ticket you marked complete that doesn't work costs the
user more than a ticket you marked blocked — they'll test the first one and
trust it. Never claim a test passed without running it, never claim acceptance
criteria are met without checking each one.

---

## Step 1 — Read before you write

You have the ticket brief. Now get the repo's rules:

1. `CLAUDE.md` / `AGENTS.md` at the root, and any scoped rules they point to.
   These override everything below — including this skill's own conventions.
2. The `**Spec:**` / `**Plan:**` files from the brief, if present. If a plan
   exists, **follow it**; it is the product of an interview you weren't part of.
3. The neighbours of the code you're about to touch. Match their idiom: naming,
   error handling, test style, comment density.

If the repo gates features behind flags and the ticket names one, register it
the way the repo does. A feature that ships un-gated because you didn't read the
convention is a bug even when it works.

## Step 2 — Confirm you're on your own branch

You should be in an isolated worktree on the branch from your brief. Verify:

```bash
git rev-parse --abbrev-ref HEAD    # must match the brief's branch name
git status --short                 # must be clean at the start
```

If the branch doesn't exist yet, create it from the default branch. If you are
somehow on `main`/`master`, **stop and report** — do not commit.

## Step 3 — Test first, then implement

**Write the failing test before the implementation.** For a bug: a test that
encodes the correct behaviour and fails against current code, proving it
reproduces. For a feature: a test per acceptance criterion.

Run it. Watch it fail. Then implement until it passes.

This is not ceremony, and unattended is exactly when it matters most: a test you
wrote first is the only evidence available in the morning that your code does
what the ticket asked, rather than what you decided it should do. There is no
reviewer at 03:00 to catch the difference.

If the repo genuinely can't unit-test this (pure visual/UI work), say so in your
result and describe the manual verification steps precisely — they become the
test plan's click-through steps.

## Step 4 — Verify honestly

Run, in order, and record the real output of each:

1. `typecheckCommand`
2. `testCommand`
3. `buildCommand` if configured

Then walk the acceptance criteria one at a time and mark each **met / not met /
untestable**, with the evidence. A criterion you can't evaluate is `not met`.

**Never** weaken a test, skip a test, mark one `.skip`, loosen an assertion, or
delete a failing case to reach green. If an existing unrelated test fails,
report it as pre-existing (check it against the default branch) — don't fix
unrelated things, and don't hide it.

## Step 5 — Commit and push

Commit convention (unless the repo's rules say otherwise): Conventional Commits
with an emoji prefix — `✨ feat(scope): description`, `🐛 fix(scope): ...`,
`✅ test(scope): ...`, `♻️ refactor(scope): ...`, `📝 docs(scope): ...`.

Body: why the change exists and what it touches, referencing the ticket key.
Never add `Co-Authored-By` trailers.

Commit in logical chunks (test, then implementation, then docs) rather than one
mega-commit — the morning reviewer reads these. Then push the branch with
upstream tracking.

**Push even when the outcome is `partial` or `blocked`.** Commit the work as WIP
with an honest message (`🚧 wip(scope): <what's done, what isn't>`). Unpushed
overnight work is lost work.

## Step 6 — Open the draft PR

One draft PR, for this ticket only, targeting the default branch:

```bash
gh pr create --draft --title "<KEY-123> <ticket title>" --body-file <file>
```

Body template:

```markdown
## <KEY-123> — <title>

Built unattended by nightshift on <date>. **Not reviewed by a human.**

### What changed
- <bullet per meaningful change, with paths>

### Acceptance criteria
- [x] <criterion> — <evidence: test name, file:line>
- [ ] <criterion> — not met: <why>

### Verification
- typecheck: <pass/fail>
- tests: <pass/fail — N passed, M failed>
- build: <pass/fail/not configured>

### How to test manually
1. <concrete step>
2. <what you should see>

### Notes for the reviewer
<assumptions made, shortcuts taken, anything surprising>
```

The "How to test manually" section feeds the HTML test plan directly — write it
as if the person reading it has never seen this ticket.

## Step 7 — Return the structured result

Your final message **is** the return value. Return exactly this JSON, nothing
else:

```json
{
  "key": "IRIS-38",
  "branch": "iris-38-fast-dismiss",
  "outcome": "complete | partial | blocked",
  "summary": "One sentence a human can read in a report.",
  "filesChanged": ["src/lib/dismiss/index.ts", "src/lib/dismiss/index.test.ts"],
  "testStatus": "12 passed, 0 failed",
  "acceptanceCriteria": [
    {"criterion": "Item disappears on click", "met": true, "evidence": "dismiss.test.ts:41"}
  ],
  "prUrl": "https://github.com/org/repo/pull/418",
  "blocker": null,
  "testPlanNotes": "Open /inbox, hover an item, press X. It should vanish and not return on reload.",
  "assumptions": ["Used the existing toast component rather than adding a new one"]
}
```

`outcome` rules — these are not judgement calls:

| Outcome | When |
|---|---|
| `complete` | Every acceptance criterion met **and** the test suite is green |
| `partial` | Real, pushed progress; at least one criterion unmet; nothing broken |
| `blocked` | Cannot proceed — missing access, needs a product decision, tests won't pass |

If you're deciding between `complete` and `partial`, it is `partial`.

---

## Rationalizations — all of these mean stop

| Thought | Reality |
|---|---|
| "The test is obvious, I'll write it after" | Then it tests what you built, not what was asked. Test first. |
| "This test was already flaky" | Check it on the default branch. Then report it, don't skip it. |
| "I'll just widen the scope a little" | Out-of-scope is in the ticket for a reason. Note it, don't build it. |
| "The user would obviously want X" | Nobody can confirm that at 03:00. Report the question. |
| "It mostly works, that's complete" | It's `partial`. Say so. |
| "I'll fix this unrelated bug while I'm here" | Different ticket, different branch. Note it in the PR. |
| "No point pushing broken work" | Pushed WIP is the morning's best signal. Push it. |
| "I'll rebase onto the other agent's branch" | You can't see their state. Stay on your own base. |

## Red flags

- About to mark `complete` without running the test command → run it
- About to skip/weaken a test to get green → report `blocked` instead
- About to commit on `main`/`master` → stop
- About to merge or rebase another ticket's branch → never; you are independent
- About to finish without pushing → the work vanishes
- About to return prose instead of the JSON result → the orchestrator can't parse it
- About to invent a PR number because `gh` failed → report the failure verbatim
