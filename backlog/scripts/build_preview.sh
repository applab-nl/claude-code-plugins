#!/usr/bin/env bash
# Assemble a nightshift preview branch by merging per-ticket branches.
#
#   build_preview.sh --branches "iris-38-x,iris-41-y" [options]
#
#   --branches   comma-separated ticket branches to merge, in order (required)
#   --prefix     preview branch prefix            (default: nightshift)
#   --date       date segment of the branch name  (default: today, UTC)
#   --base       branch to build on top of        (default: origin's HEAD)
#   --push       push the preview branch to origin when done
#   --dry-run    report what would happen, change nothing
#
# Guarantees:
#   * never merges into the base branch - only into the fresh preview branch
#   * a conflicting branch is aborted cleanly and EXCLUDED; the run continues
#   * every ticket branch is left exactly as it was (they ship individually)
#   * prints a JSON summary on stdout as the last line
set -euo pipefail

PREFIX="nightshift"
DATE="$(date -u +%Y-%m-%d)"
BASE=""
BRANCHES=""
PUSH=0
DRY=0

die() { printf 'error: %s\n' "$1" >&2; exit 1; }
log() { printf '%s\n' "$1" >&2; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branches) BRANCHES="${2:-}"; shift 2 ;;
    --prefix)   PREFIX="${2:-}";   shift 2 ;;
    --date)     DATE="${2:-}";     shift 2 ;;
    --base)     BASE="${2:-}";     shift 2 ;;
    --push)     PUSH=1;            shift ;;
    --dry-run)  DRY=1;             shift ;;
    -h|--help)  sed -n '2,20p' "$0"; exit 0 ;;
    *) die "unknown argument: $1" ;;
  esac
done

[[ -n "$BRANCHES" ]] || die "--branches is required"
git rev-parse --git-dir >/dev/null 2>&1 || die "not inside a git repository"

# Refuse to run with uncommitted changes - a merge would swallow them.
[[ -z "$(git status --porcelain)" ]] || die "working tree is dirty; commit or stash first"

# Resolve the base branch from origin's HEAD unless told otherwise.
if [[ -z "$BASE" ]]; then
  BASE="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)"
  BASE="${BASE#origin/}"
  [[ -n "$BASE" ]] || BASE="$(git rev-parse --abbrev-ref HEAD)"
fi

PREVIEW="${PREFIX}/${DATE}"
[[ "$PREVIEW" != "$BASE" ]] || die "preview branch would equal the base branch ($BASE)"

log "base    : $BASE"
log "preview : $PREVIEW"

if git remote get-url origin >/dev/null 2>&1; then
  git fetch --quiet origin || log "warning: git fetch failed; using local refs"
else
  log "note    : no 'origin' remote; using local refs"
fi

MERGED=()
EXCLUDED_KEYS=()
EXCLUDED_REASONS=()

IFS=',' read -r -a WANTED <<< "$BRANCHES"

if [[ $DRY -eq 1 ]]; then
  log "[dry-run] would create $PREVIEW from $BASE and merge:"
  for b in "${WANTED[@]}"; do log "  - ${b// /}"; done
  exit 0
fi

# Start the preview from the freshest base we have.
START="$BASE"
git show-ref --verify --quiet "refs/remotes/origin/$BASE" && START="origin/$BASE"

git branch --force "$PREVIEW" "$START" >/dev/null
git checkout --quiet "$PREVIEW"

for raw in "${WANTED[@]}"; do
  branch="${raw// /}"
  [[ -n "$branch" ]] || continue

  ref="$branch"
  if ! git show-ref --verify --quiet "refs/heads/$branch"; then
    if git show-ref --verify --quiet "refs/remotes/origin/$branch"; then
      ref="origin/$branch"
    else
      log "SKIP    $branch (branch not found locally or on origin)"
      EXCLUDED_KEYS+=("$branch"); EXCLUDED_REASONS+=("branch not found")
      continue
    fi
  fi

  if git merge --no-ff --no-edit -m "🔀 merge($branch): into $PREVIEW" "$ref" >/dev/null 2>&1; then
    log "MERGED  $branch"
    MERGED+=("$branch")
  else
    conflicts="$(git diff --name-only --diff-filter=U | tr '\n' ' ' | sed 's/ $//')"
    git merge --abort || true
    log "EXCLUDE $branch (conflict: ${conflicts:-unknown})"
    EXCLUDED_KEYS+=("$branch")
    EXCLUDED_REASONS+=("merge conflict in ${conflicts:-unknown files}")
  fi
done

if [[ $PUSH -eq 1 ]]; then
  git push --set-upstream origin "$PREVIEW" >/dev/null 2>&1 \
    && log "pushed  $PREVIEW" \
    || log "warning: push failed for $PREVIEW"
fi

# JSON summary - last line of stdout, for the orchestrator to parse.
json_array() {
  local first=1 item
  printf '['
  for item in "$@"; do
    [[ $first -eq 1 ]] || printf ','
    printf '"%s"' "${item//\"/\\\"}"
    first=0
  done
  printf ']'
}

printf '{"previewBranch":"%s","baseBranch":"%s","merged":' "$PREVIEW" "$BASE"
json_array ${MERGED+"${MERGED[@]}"}
printf ',"excluded":['
for i in "${!EXCLUDED_KEYS[@]}"; do
  [[ $i -eq 0 ]] || printf ','
  printf '{"key":"%s","reason":"%s"}' "${EXCLUDED_KEYS[$i]}" "${EXCLUDED_REASONS[$i]}"
done
printf ']}\n'
