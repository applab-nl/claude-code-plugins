#!/usr/bin/env bash
# worktree_health.sh — report the state of every registered worktree, plus orphan directories.
#
# Usage:  ./worktree_health.sh [worktree-parent-dir ...]
#
# Extra arguments are directories where worktrees are conventionally kept
# (e.g. .worktrees, .claude/worktrees). Any directory found there that is NOT a
# registered worktree is reported as an orphan — a leftover that `git worktree
# prune` plus a directory removal will clear.
#
# Read-only: runs nothing that mutates the repository.

set -uo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "error: not inside a git repository" >&2; exit 1; }

echo "Worktrees registered to $ROOT"
echo

# Stashes are repository-wide, not per-worktree — report once, not per row.
STASHES=$(git stash list 2>/dev/null | wc -l | tr -d ' ')

printf '%-56s %-34s %7s %9s %s\n' "PATH" "BRANCH" "DIRTY" "UNPUSHED" "STATE"

registered=""
while IFS= read -r line; do
  case "$line" in
    worktree\ *) wt_path="${line#worktree }" ;;
    branch\ *)   wt_branch="${line#branch }"; wt_branch="${wt_branch#refs/heads/}" ;;
    detached)    wt_branch="(detached)" ;;
    "")
      [ -z "${wt_path:-}" ] && continue
      registered="${registered}${wt_path}"$'\n'
      short="${wt_path#$ROOT/}"; [ "$short" = "$wt_path" ] && short="$wt_path"

      if [ ! -d "$wt_path" ]; then
        printf '%-56s %-34s %7s %9s %s\n' "$short" "${wt_branch:-?}" "-" "-" "MISSING-DIR (prunable)"
      else
        dirty=$(git -C "$wt_path" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
        unpushed=$(git -C "$wt_path" log --oneline HEAD --not --remotes 2>/dev/null | wc -l | tr -d ' ')
        state="clean"
        [ "$dirty" -gt 0 ] && state="DIRTY"
        [ "$unpushed" -gt 0 ] && state="${state}, ${unpushed} unpushed"
        printf '%-56s %-34s %7s %9s %s\n' "$short" "${wt_branch:-?}" "$dirty" "$unpushed" "$state"
      fi
      wt_path=""; wt_branch=""
      ;;
  esac
done < <(git worktree list --porcelain; echo)

echo
echo "Repository-wide stashes: $STASHES"
[ "$STASHES" -gt 0 ] && git stash list --format='  %gd  %ad  %s' --date=short 2>/dev/null
[ "$STASHES" -gt 0 ] && echo "  (read these before assuming they matter — usually editor settings or generated files)"

for parent in "$@"; do
  dir="$ROOT/$parent"
  [ -d "$dir" ] || continue
  echo
  echo "Orphan directories under $parent (present on disk, not registered worktrees):"
  found=0
  for d in "$dir"/*/; do
    [ -d "$d" ] || continue
    clean="${d%/}"
    # Registered itself? Not an orphan.
    printf '%s' "$registered" | grep -qxF "$clean" && continue
    # Contains a registered worktree beneath it (nested layouts like dylan/<ticket>)?
    # Then it is a parent directory, NOT an orphan — deleting it would destroy live work.
    if printf '%s' "$registered" | grep -qF "$clean/"; then
      nested=$(printf '%s' "$registered" | grep -cF "$clean/")
      echo "  ${clean#$ROOT/}/  — parent of $nested registered worktree(s), keep"
      found=2   # something was printed, but nothing is actually orphaned
      continue
    fi
    echo "  ${clean#$ROOT/}"
    found=1
  done
  [ "$found" -eq 0 ] && echo "  (none)"
  [ "$found" -eq 2 ] && echo "  (no true orphans)"
done

echo
echo "Note: a branch NOT checked out in any worktree will not appear above."
echo "Enumerate refs/heads to find at-risk work — see branch_forensics.sh."
