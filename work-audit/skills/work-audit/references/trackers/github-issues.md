# GitHub Issues

Detect from a GitHub remote plus the `gh` CLI. Issues are referenced as `#123`, and closing keywords
in commits or PR bodies (`Fixes #123`) create the link.

## Enumerate

```bash
gh issue list --state open --limit 200 \
  --json number,title,labels,milestone,assignees,updatedAt,state \
  --jq '.[] | "\(.number)\t\(.title)\t\(.labels | map(.name) | join(","))"'

gh pr list --state open --limit 100 \
  --json number,title,headRefName,isDraft,mergeable,mergeStateStatus,statusCheckRollup,changedFiles
```

`mergeable` and `mergeStateStatus` together are what separate "ready to merge right now" from "needs
a rebase" — the most actionable split in the PR list.

## The closed-unmerged pass

```bash
gh pr list --state closed --limit 100 \
  --json number,title,headRefName,mergedAt \
  --jq '.[] | select(.mergedAt == null) | "#\(.number)\t\(.headRefName)\t\(.title)"'
```

For each, if the branch still exists, diff it against the trunk file by file. A closed PR is the
easiest place for a real fix to be lost, because closure reads as a decision.

## Cross-reference

```bash
# issue numbers referenced in trunk history
git log origin/main --format='%s%n%b' -400 | grep -oE '#[0-9]+' | sort -u

# issues closed by a merged PR are already handled by GitHub; the interesting set is
# issues still open whose number appears in a merged commit
gh issue list --state open --json number --jq '.[].number'
```

## Patterns worth checking

- **Dependency-bot PRs stacked up.** Several weekly maintenance PRs, all but the newest conflicting.
  Merge the newest, close the rest as superseded — do not try to rebase each one.
- **Draft PRs whose content already landed.** Check whether the file the draft adds already exists on
  the trunk under any name.
- **Issues with no activity since a milestone closed.** Either the milestone moved on without them or
  they were quietly done.

## Updating

```bash
gh issue close 123 --comment "Verified on main: <evidence>"
gh issue edit 123 --title "..." --add-label "..."
gh pr close 81 --comment "Superseded — <what landed instead>"
```

Always include the evidence in the comment. An audit that closes issues without saying why creates
its own archaeology problem a year later.
