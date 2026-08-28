#!/usr/bin/env bash
# branch_forensics.sh — classify every branch by how merged it really is.
#
# Two signals, because each misses what the other catches:
#   ancestry      (git merge-base --is-ancestor) is exact but blind to squash/rebase merges
#   patch-id      (git cherry) catches re-landed content but false-positives on re-authored work
#
# Usage:
#   ./branch_forensics.sh [trunk-ref] [--remote] [--risk-only]
#
#   trunk-ref     defaults to origin/main, falling back to origin/master, then main/master
#   --remote      classify origin/* branches instead of local ones
#   --risk-only   print only branches holding commits that exist on no remote
#
# Read-only: runs nothing that mutates the repository.

set -uo pipefail

TRUNK=""
MODE="local"
RISK_ONLY=0

for arg in "$@"; do
  case "$arg" in
    --remote)    MODE="remote" ;;
    --risk-only) RISK_ONLY=1 ;;
    --help|-h)   sed -n '2,18p' "$0"; exit 0 ;;
    *)           TRUNK="$arg" ;;
  esac
done

if [ -z "$TRUNK" ]; then
  for candidate in origin/main origin/master main master; do
    if git rev-parse --verify --quiet "$candidate" >/dev/null 2>&1; then
      TRUNK="$candidate"; break
    fi
  done
fi

if [ -z "$TRUNK" ]; then
  echo "error: could not determine a trunk ref; pass one explicitly" >&2
  exit 1
fi

git rev-parse --verify --quiet "$TRUNK" >/dev/null 2>&1 || {
  echo "error: trunk ref '$TRUNK' does not resolve" >&2; exit 1; }

if [ "$MODE" = "remote" ]; then
  REFS=$(git for-each-ref --format='%(refname:short)' refs/remotes/origin \
         | grep -v '/HEAD$' | grep -vFx "$TRUNK")
else
  REFS=$(git for-each-ref --format='%(refname:short)' refs/heads)
fi

# Map each checked-out branch to its worktree path.
WT_MAP=$(git worktree list --porcelain 2>/dev/null \
  | awk '/^worktree /{p=$2} /^branch /{sub("refs/heads/","",$2); print $2"\t"p}')

ancestor=0; content=0; unmerged=0; total=0
anc_list=""; con_list=""; unm_list=""; risk_list=""

for b in $REFS; do
  total=$((total + 1))

  unique=$(git cherry "$TRUNK" "$b" 2>/dev/null | grep -c '^+')
  behind_ahead=$(git rev-list --left-right --count "$TRUNK...$b" 2>/dev/null || echo "0	0")
  behind=$(printf '%s' "$behind_ahead" | cut -f1)
  ahead=$(printf '%s' "$behind_ahead" | cut -f2)
  last=$(git log -1 --format='%ad' --date=short "$b" 2>/dev/null)
  norem=$(git log --oneline "$b" --not --remotes 2>/dev/null | wc -l | tr -d ' ')
  wt=$(printf '%s' "$WT_MAP" | awk -F'\t' -v n="$b" '$1==n{print $2}')

  row=$(printf '  %-58s ahead:%-5s behind:%-5s %s%s' \
        "$b" "$ahead" "$behind" "$last" "${wt:+  [worktree]}")

  # Signal 3 — absorption. A MULTI-COMMIT squash merge defeats signal 2, because the
  # squashed commit's patch-id matches none of the originals. But if every path the
  # branch touched is now identical between trunk and branch, its content is present
  # regardless of how it got there.
  absorbed=0
  touched=$(git diff --name-only "$TRUNK...$b" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$touched" -gt 0 ]; then
    if git diff --name-only -z "$TRUNK...$b" 2>/dev/null \
       | xargs -0 git diff --quiet "$TRUNK" "$b" -- 2>/dev/null; then
      absorbed=1
    fi
  fi

  if git merge-base --is-ancestor "$b" "$TRUNK" 2>/dev/null; then
    ancestor=$((ancestor + 1)); anc_list="${anc_list}${row}"$'\n'
  elif [ "$unique" -eq 0 ] || [ "$absorbed" -eq 1 ]; then
    tag=""; [ "$unique" -gt 0 ] && tag="  (squash-absorbed)"
    content=$((content + 1)); con_list="${con_list}${row}${tag}"$'\n'
  else
    unmerged=$((unmerged + 1))
    unm_list="${unm_list}${row}  unique:${unique}"$'\n'
  fi

  # At risk: commits that exist on no remote at all.
  if [ "$norem" -gt 0 ] && [ "$unique" -gt 0 ]; then
    risk_list="${risk_list}$(printf '  %-58s %s commit(s) on NO REMOTE   last:%s' "$b" "$norem" "$last")"$'\n'
  fi
done

if [ "$RISK_ONLY" -eq 1 ]; then
  echo "AT RISK — commits on no remote and not on $TRUNK"
  [ -n "$risk_list" ] && printf '%s' "$risk_list" || echo "  (none)"
  exit 0
fi

echo "Trunk: $TRUNK   |   scope: $MODE   |   branches: $total"
echo
echo "FULLY-MERGED (ancestor of trunk) — delete without reading: $ancestor"
[ -n "$anc_list" ] && printf '%s' "$anc_list"
echo
echo "CONTENT-MERGED (0 unique patches; squash/rebase) — delete without reading: $content"
[ -n "$con_list" ] && printf '%s' "$con_list"
echo
echo "UNMERGED (real unique commits) — the only ones worth reading: $unmerged"
[ -n "$unm_list" ] && printf '%s' "$unm_list"
echo
echo "AT RISK — commits on no remote:"
[ -n "$risk_list" ] && printf '%s' "$risk_list" || echo "  (none)"
echo
echo "Deletable without review: $((ancestor + content)) of $total"
echo
echo "Note: CONTENT-MERGED uses patch-ids. Work that was re-authored rather than"
echo "cherry-picked will land in UNMERGED even though the trunk already has the"
echo "outcome. Before trusting an UNMERGED verdict on a small branch, check:"
echo "    git diff $TRUNK <branch>        # two-dot, NOT three-dot"
