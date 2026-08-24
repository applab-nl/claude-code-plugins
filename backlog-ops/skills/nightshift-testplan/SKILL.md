---
name: nightshift-testplan
description: Use when turning a completed nightshift run into the HTML test plan the user opens in the morning — building the manifest from the implementation agents' structured results and rendering `testplan.html` onto the preview branch. Also use when the user asks to regenerate, fix or re-render a test plan for a night that already ran.
---

# nightshift-testplan — the artifact the user actually opens

Everything else nightshift produces is plumbing. This is the page someone reads
with coffee, deciding what to trust. Two jobs: **build the manifest**, then
**render it**.

## Step 1 — Build the manifest

Write `nightshift/<date>/manifest.json` from the implementation agents' returned
JSON plus the preview script's summary. Schema:

```json
{
  "date": "2026-08-25",
  "repo": "applab-nl/iris",
  "previewBranch": "nightshift/2026-08-25",
  "baseBranch": "main",
  "setupCommand": "bun install && bun run dev",
  "preview": {
    "testStatus": "148 passed, 0 failed",
    "excluded": [{ "key": "iris-46-routines", "reason": "merge conflict in src/lib/routines/index.ts" }]
  },
  "tickets": [
    {
      "key": "IRIS-38",
      "title": "Fast-dismiss",
      "outcome": "complete",
      "summary": "Hovering an inbox item shows an X that dismisses it permanently.",
      "branch": "iris-38-fast-dismiss",
      "prUrl": "https://github.com/applab-nl/iris/pull/418",
      "testStatus": "12 passed, 0 failed",
      "acceptanceCriteria": [
        { "criterion": "Item disappears on click", "met": true, "evidence": "dismiss.test.ts:41" },
        { "criterion": "Stays dismissed after reload", "met": false, "evidence": "not implemented" }
      ],
      "steps": [
        "Open /inbox and hover the first item.",
        "Click the X on the right of the row.",
        "The row should vanish immediately, with an undo toast.",
        "Reload the page — the item should still be gone."
      ],
      "blocker": null,
      "assumptions": ["Reused the existing toast component instead of adding one"]
    }
  ]
}
```

`outcome` is one of `complete` · `partial` · `blocked` · `skipped`. Include
**skipped** tickets too (the not-ready ones) — the user needs to see what
nightshift declined and why, or they'll assume it was forgotten.

`setupCommand` is how this repo starts: read it from the repo's README or
`package.json` scripts. Guessing it wrong is the fastest way to make a test plan
useless.

## Step 2 — Write steps a stranger could follow

The `steps` array is the heart of the page. Derive it from each agent's
`testPlanNotes` and the acceptance criteria, then rewrite it properly:

| Bad step | Good step |
|---|---|
| "Test the dismiss feature" | "Open /inbox and hover the first item." |
| "Verify it works" | "The row should vanish immediately, with an undo toast." |
| "Check persistence" | "Reload the page — the item should still be gone." |

Rules:

- **One action or one observation per step**, never both bundled vaguely.
- **Say what should happen**, not just what to do. A step with no expected
  outcome can't fail, which means it can't pass either.
- **Start from a known state** — the first step names the page or command.
- For a `partial` ticket, only write steps for what *was* built, and let the
  unmet acceptance criteria carry the rest. Steps for missing functionality read
  as bugs.
- For a `blocked` ticket, steps may be empty; the blocker text is the content.

## Step 3 — Render

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/render_testplan.py" \
  --manifest nightshift/2026-08-25/manifest.json \
  --out      nightshift/2026-08-25/testplan.html
```

The output is a single self-contained HTML file — no network, no build step,
no dependencies. It opens from disk. Steps have checkboxes that persist in the
browser's local storage, so the user can stop halfway and come back.

Commit both the manifest and the HTML **to the preview branch** (not to the
individual ticket branches — the plan describes the combination, and it would
otherwise show up in every PR diff).

## Step 4 — Sanity-check before you call it done

- [ ] Every admitted ticket appears, including partial, blocked and skipped ones
- [ ] Excluded-from-preview branches are listed with their conflict reason
- [ ] Every `complete` ticket has at least one step with an expected outcome
- [ ] The checkout snippet names the real preview branch
- [ ] `setupCommand` is the repo's actual start command
- [ ] The file opens in a browser and is not blank

A test plan that lists four tickets when five were built is worse than no test
plan: the user tests four things and merges five.

## Red flags

- About to write "verify it works" as a step → say what the user should see
- About to omit the blocked tickets to keep the page tidy → they're the point
- About to hand-write HTML instead of running the renderer → use the script
- About to commit the plan to a ticket branch → it belongs on the preview branch
- About to claim a criterion is met because the agent said so → use its evidence field
