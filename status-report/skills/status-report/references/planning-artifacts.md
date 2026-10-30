# Planning artifacts

Many repositories keep planning documents with task checklists. When the convention exists and
completed items are not archived, this directory becomes the single largest contributor to the
feeling that nothing is finished — while being almost entirely bookkeeping.

If none of the detection patterns below match, skip this section of the audit and say nothing about
it. Inventing a "planning drift" section for a repo without the convention is noise.

## Detection

```bash
ls openspec/changes/ 2>/dev/null            # OpenSpec
ls specs/ .specify/ 2>/dev/null             # Spec-Kit and similar
ls docs/adr/ docs/decisions/ 2>/dev/null    # ADRs
ls docs/plans/ plans/ 2>/dev/null           # ad-hoc plan directories
```

If a CLI owns the convention, prefer it — it already knows the completion rules:

```bash
openspec list          # prints "n/m tasks" or "✓ Complete" per change
```

Otherwise parse checkboxes directly:

```bash
for d in <dir>/*/; do
  f="$d/tasks.md"; [ -f "$f" ] || continue
  total=$(grep -cE '^\s*[-*] \[.\]' "$f")
  done_=$(grep -cE '^\s*[-*] \[[xX]\]' "$f")
  last=$(git log -1 --format='%ad' --date=short -- "$d")
  printf '%s\t%s/%s\t%s\n' "$(basename "$d")" "$done_" "$total" "$last"
done
```

## The four buckets

**Complete but unarchived** — every box ticked, still in the active directory. Ready to archive with
no thought required. Usually the biggest single reduction in the whole audit.

**Effectively complete** — 90%+ ticked, where the stragglers are device verification, a release note,
or the archive step itself, and the linked ticket is already closed. Also bookkeeping: tick or mark
not-applicable, then archive.

**Genuinely in progress** — a real remainder. Report `done/total`, the last commit date, and the
linked ticket. Sort by staleness; a document last touched eight months ago at 60% is a decision to
make, not a task to resume.

**Superseded stubs** — 0% ticked, which reads as untouched work, but the plan was absorbed into a
later consolidated document and shipped under a different name.

## The 0% trap

This is the finding most likely to be got wrong, and it inverts the obvious reading.

A document at 0/18 tasks looks like the clearest possible "not started". But when several tickets all
wanted to change one surface, teams often write a *consolidating* plan and abandon the individual
ones without deleting them. The individual plans keep their zeros forever while their content ships.

Before reporting any 0% document as pending work, check:

```bash
grep -roh '[A-Z]\{2,\}-[0-9]\+' <dir>/<change>/ | sort -u   # tickets it references
```

Then check those tickets' status and whether the trunk has the behaviour. If the tickets are closed
and the code is present, the document is superseded — recommend deleting it, not scheduling it.

Observed: three documents at 0/18, 0/29 and 0/20 all described shipped features. Their work had been
folded into a fourth, consolidated document. Reported naively, they would have looked like 67 tasks
of pending work.

## Mapping documents to tickets

```bash
for d in <dir>/*/; do
  ids=$(grep -roh '[A-Z]\{2,\}-[0-9]\+' "$d" 2>/dev/null | sort -u | tr '\n' ' ')
  [ -n "$ids" ] && echo "$(basename "$d") -> $ids"
done
```

This mapping is what lets you say "this document is 22/24 but its ticket is Done, so the remainder is
bookkeeping" — the sentence that converts a scary directory listing into a five-minute chore.

## Archiving

Use the convention's own tooling where it exists (`/opsx:archive`, `/opsx:bulk-archive`, or the
project's documented step). Many projects also require a README or capability-index update as part of
archiving — check the repo's contributing guide before bulk-archiving, so the audit does not create a
second inconsistency while clearing the first.
