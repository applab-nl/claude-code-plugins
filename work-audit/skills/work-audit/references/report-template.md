# The report

Read this when you are ready to write up findings. The audit's value is destroyed by a report that
reads like a database dump, so the shape matters nearly as much as the research.

## Format

Produce an HTML page. Publish it as an artifact if the environment supports it; otherwise write it
to a file and tell the user the path.

If an `artifact-design` skill is available, load it before writing — this is a dashboard, not prose,
so information design leads: summary before detail, state encoded in form as well as number, and
anything that needs attention readable at a glance.

## Structure

Findings first, inventory second, plan last. People open this page worried; answer the worry on the
first screen.

```
Masthead        one line on what was audited and against which trunk commit
Metric strip    6-8 numbers, the alarming ones first
01  At risk     work that exists in exactly one place
02  Corrections where the record disagrees with the code
03  Sessions    parallel agents/jobs, if the environment has them
04  Pull requests
05  Branches
06  Worktrees
07  Tickets
08  Planning artifacts   (omit entirely if the repo has no such convention)
09  The plan    phased, preservation before deletion
```

Drop any section the repository has nothing for. An empty section implies you looked and found
nothing, which is a different and weaker claim than not having the concept at all.

## Writing the findings

Each finding needs three things: **what is true**, **how you know**, and **what to do**. The middle
one is what makes the document trustworthy — the user is going to delete branches based on this.

> **A closed PR dropped a live fix.** PR #85 was closed unmerged. Most of its content landed by other
> routes — the R8 keep-rules are in `proguard-rules.pro`. But its retry-abort is not on main:
> `git grep orAbortBatch origin/main` returns 0 matches, and `RemoteExceptionClassifier.kt` does not
> exist. Cherry-pick `11f10d0d` onto a fresh branch.

Not:

> **Sentry PR needs review.** Some fixes may not have landed. Worth checking.

## Numbers

Exact, always. "51 branches, 39 deletable without review" is actionable and shows the work was done.
"Roughly 50, most are probably fine" is not, and quietly admits you did not check.

Reconcile your own totals in the document — if 12 branches are unmerged, account for all 12. An
unexplained remainder is where the thing everyone forgot is hiding.

## Ticket references

When identifiers repeat across tables, spell the full title on first mention and make later mentions
hoverable. This keeps tables scannable without losing meaning:

```html
<abbr class="tk" title="ABC-123 — Full ticket title here">ABC-123</abbr>
```

Simplest robust approach: write the identifier as the element's text so it survives without
JavaScript, hold titles in one object, and attach them on load.

```html
<script>
const TICKETS = { "ABC-123": "Full ticket title here" };
document.querySelectorAll("[data-tk]").forEach(el => {
  const id = el.dataset.tk, t = TICKETS[id];
  if (t) el.title = `${id} — ${t}`;
});
</script>
```

Before publishing, check that every referenced id has a title and every title is referenced — an
orphan in either direction means a table cell is wrong.

## State colours

Semantic, and separate from the page's accent:

| State | Meaning |
|---|---|
| shipped / merged | verified present on the trunk |
| active | in flight, someone is on it |
| blocked | conflicting, failing, or at risk of loss |
| stale | superseded or abandoned |
| planned | specced but unstarted |

Encode state in form as well as colour — a chip, a left edge stripe — so a row's urgency survives
greyscale and colour-blindness.

## The plan section

Phases, each with a realistic time estimate and real commands. Preservation before deletion, cheap
before expensive:

1. **Preserve** — push at-risk work to a remote. Do this even for branches you will recommend
   deleting.
2. **Land what is finished** — merge clean PRs, open PRs for complete branches, close superseded ones.
3. **Archive bookkeeping** — completed planning artifacts, in bulk.
4. **Sweep** — delete verified-merged branches and worktrees, prune orphans.
5. **Re-triage** — collapse duplicates, close what the audit settled, fix docs that lie.
6. **Build** — the real remaining queue, ordered.

Show destructive commands but let the user run them, unless they have explicitly asked for the
cleanup workflow.

## Footer

State what the report was verified against and how, so a reader six weeks from now knows how much to
trust it:

> Audited 2026-08-28 against `origin/main` c980eab4. Merge claims checked with
> `git merge-base --is-ancestor` and `git cherry`; "already done" claims checked by reading the file
> on main.
