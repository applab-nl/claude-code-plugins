# Git forensics — commands and the traps that void them

Read this when classifying branches, hunting at-risk work, or deciding whether a branch is worth
rescuing. Every trap below has produced a wrong conclusion in a real audit.

## Contents

- [The three merge signals](#the-three-merge-signals)
- [Trap: patch-id false positives](#trap-patch-id-false-positives)
- [Trap: three-dot diffs](#trap-three-dot-diffs)
- [Trap: scanning by worktree](#trap-scanning-by-worktree)
- [Trap: a missing file is not a missing feature](#trap-a-missing-file-is-not-a-missing-feature)
- [Trap: closed pull requests](#trap-closed-pull-requests)
- [Trap: stale branches that would regress the trunk](#trap-stale-branches-that-would-regress-the-trunk)
- [Dead work: content targeting retired subsystems](#dead-work-content-targeting-retired-subsystems)
- [Useful one-liners](#useful-one-liners)

## The three merge signals

```bash
git merge-base --is-ancestor "$branch" "$trunk"   # exit 0 = fully merged
git cherry "$trunk" "$branch" | grep -c '^+'      # 0 = no unique patches remain
```

Ancestry is exact but blind to squash and rebase merges. Patch-id catches a *rebase*, where patches
survive one-to-one — but not a **multi-commit squash**, whose single commit has a patch-id matching
none of the originals. For that you need a third signal: are the paths the branch touched now
identical on both sides?

```bash
git diff --name-only -z "$trunk...$branch" | xargs -0 git diff --quiet "$trunk" "$branch" --
```

Exit 0 means the content is present however it landed. On a squash-merge project this is the signal
that does most of the work — without it nearly every merged branch reads as unmerged.
`scripts/branch_forensics.sh` runs all three and prints the buckets.

## Trap: patch-id false positives

`git cherry` compares patch-ids. Content that was **re-authored** on the trunk — the same change made
by hand, differently worded — has a different patch-id, so the branch shows unique commits forever.

Observed: a branch moved a worktree directory and rewrote three docs. The trunk later made the same
move independently, with better wording. `git cherry` reported 2 unique commits; the branch was
entirely superseded.

Confirm with a **two-dot** diff before calling a small branch unmerged:

```bash
git diff "$trunk" "$branch" -- <the files it touches>
```

If the trunk already has the outcome, the branch is superseded no matter what patch-ids say.

## Trap: three-dot diffs

`git diff A...B` diffs from the **merge-base**, not from A. On a branch that is 800 commits behind,
this shows everything the trunk did since the fork as though the branch were responsible — often
tens of thousands of lines, including deletions the branch never made.

- `git diff A...B` — "what did this branch add since it forked". Right for reviewing a PR.
- `git diff A B` — "how do these two trees differ right now". Right for asking whether the trunk
  already has something.

Using the wrong one is the single easiest way to produce a confidently wrong audit.

## Trap: scanning by worktree

Enumerating worktrees and checking each one's branch feels thorough and silently misses every branch
that is not checked out — which is precisely the population that holds forgotten work.

Always iterate refs, then annotate with worktree info:

```bash
git for-each-ref --format='%(refname:short)' refs/heads
```

## Trap: a missing file is not a missing feature

Work frequently lands under a different filename than the branch that proposed it: a helper renamed,
a class folded into a neighbour, a script replaced by a build step. `git cat-file -e trunk:path`
returning non-zero proves the *path* is absent, nothing more.

Search for the capability instead — a distinctive function name, error string, config key, table
name, or the migration's observable effect:

```bash
git grep -n 'distinctiveSymbol' "$trunk" -- <dir>
git ls-tree -r "$trunk" --name-only | grep -i 'concept'
```

Observed: a branch's `SentrySecretRedactor.kt` was absent from the trunk, which looked like an
unlanded fix. The trunk had `SentryScrubbing.kt` doing the same job. The genuinely missing part of
that branch was something else entirely.

## Trap: closed pull requests

A PR closed without merging reads as "deliberately abandoned", so nobody opens it again. Sometimes
most of its content landed by another route and one useful fix did not.

For each closed-unmerged PR whose branch still exists, diff the branch's files against the trunk
individually rather than trusting the closure:

```bash
gh pr list --state closed --limit 50 \
  --json number,title,headRefName,mergedAt \
  --jq '.[] | select(.mergedAt == null) | "\(.number)\t\(.headRefName)\t\(.title)"'

git diff --stat "$trunk" "origin/$branch" -- <each file>
```

## Trap: stale branches that would regress the trunk

A branch hundreds of commits behind may carry tests or code written against an **older** API. Merging
it replaces newer trunk content with older content while looking like a fix.

Before recommending a merge on any long-stale branch, diff the specific files and check which side is
newer. If the branch's version references symbols the trunk has since renamed or removed, it is
superseded — close it rather than merging.

## Dead work: content targeting retired subsystems

Projects retire whole trees: a rewritten client, a dropped platform, a replaced framework. Branches
predating the removal patch paths that no longer exist.

Find the retirement commits:

```bash
git log --oneline --diff-filter=D --name-only -- "$dir" | head
git ls-tree -r "$trunk" --name-only | grep -c "^$dir/"    # 0 = gone from the trunk
```

Measure each unmerged branch against them:

```bash
git log --format='%H' "$trunk".."$branch" \
  | while read -r sha; do git show --name-only --format='' "$sha"; done \
  | grep -v '^$' | sort -u | awk -F/ '{print $1}' | sort | uniq -c | sort -rn
```

Report the live/dead ratio, and check whether the split falls on commit boundaries — it often does,
which makes the rescue a precise cherry-pick:

```bash
# per-commit area breakdown
git log --format='%H|%h %s' "$trunk".."$branch" | while IFS='|' read -r sha desc; do
  areas=$(git show --name-only --format='' "$sha" | grep -v '^$' \
          | awk -F/ '{print $1}' | sort | uniq -c | sort -rn | awk '{printf "%s(%s) ",$2,$1}')
  printf '  %s\n      -> %s\n' "$desc" "$areas"
done
```

Then either cherry-pick the live commits, or take the live paths alone:

```bash
git checkout -b rescue "$trunk"
git cherry-pick <live-sha> <live-sha>
# or
git checkout "$branch" -- path/to/live/subtree
```

Frame the discarded half as **written off, not lost** — it remains in history exactly like the rest
of the retired subsystem. That framing is usually what lets people actually let go of it.

## Useful one-liners

```bash
# Commits that exist on no remote at all — the true loss risk
git log --oneline "$branch" --not --remotes | wc -l

# Ticket ids referenced in trunk history (cross-reference against "open" tickets)
git log "$trunk" --format='%s' -400 | grep -oE '[A-Z]{2,}-[0-9]+' | sort -u

# Remote branches carrying unmerged commits, newest first
for b in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin | grep -v HEAD); do
  ahead=$(git rev-list --count "$trunk..$b")
  [ "$ahead" -gt 0 ] && echo "$(git log -1 --format=%ad --date=short "$b") $b +$ahead"
done | sort -r

# Is this worktree's branch checked out anywhere? (parent dirs are not orphans)
git worktree list --porcelain | awk '/^worktree /{print $2}'
```
