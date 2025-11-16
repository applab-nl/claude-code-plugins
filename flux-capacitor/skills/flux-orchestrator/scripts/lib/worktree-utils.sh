#!/usr/bin/env bash
# Git worktree management utilities

set -euo pipefail

# Source common utilities if not already loaded
if ! declare -f log_info > /dev/null; then
  _WORKTREE_UTILS_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  source "$_WORKTREE_UTILS_SCRIPT_DIR/common.sh"
fi

# Create a git worktree for a task
create_worktree() {
  local task_id="$1"
  local project_name="$2"

  if ! is_git_repo; then
    log_error "Not in a git repository"
    return 1
  fi

  local branch_name="feature/${task_id}"
  local git_root="$(get_git_root)"
  local worktrees_dir="${git_root}/.worktrees"
  local worktree_path="${worktrees_dir}/${task_id}"

  # Create .worktrees directory if it doesn't exist
  if [ ! -d "$worktrees_dir" ]; then
    mkdir -p "$worktrees_dir" || {
      log_error "Failed to create .worktrees directory"
      return 1
    }
  fi

  log_debug "Creating branch: $branch_name"

  # Create branch from current HEAD (or use existing)
  if git show-ref --verify --quiet "refs/heads/$branch_name"; then
    log_warn "Branch $branch_name already exists, using existing branch"
  else
    git branch "$branch_name" 2>/dev/null || {
      log_error "Failed to create branch: $branch_name"
      return 1
    }
  fi

  log_debug "Creating worktree: $worktree_path"

  # Create worktree (redirect output to stderr to keep stdout clean)
  if ! git worktree add "$worktree_path" "$branch_name" >&2 2>&1; then
    log_error "Failed to create worktree at: $worktree_path"
    return 1
  fi

  # Run initialization scripts if they exist
  local init_dir="$git_root/.worktree-init"
  if [ -d "$init_dir" ]; then
    log_info "Running worktree initialization scripts..." >&2
    (
      cd "$worktree_path"
      for script in "$init_dir"/*; do
        if [ -x "$script" ]; then
          log_debug "Running: $(basename "$script")" >&2
          "$script" "$git_root" >&2 || log_warn "Init script failed: $(basename "$script")" >&2
        fi
      done
    ) || true  # Don't fail if init scripts have issues
  fi

  echo "$worktree_path"
}

# Remove a git worktree
remove_worktree() {
  local worktree_path="$1"

  if [ ! -d "$worktree_path" ]; then
    log_warn "Worktree does not exist: $worktree_path"
    return 0
  fi

  log_debug "Removing worktree: $worktree_path"
  git worktree remove "$worktree_path" --force
}

# List all flux-capacitor worktrees
list_flux_worktrees() {
  local git_root="$(get_git_root)"
  local worktrees_dir="${git_root}/.worktrees"

  if [ ! -d "$worktrees_dir" ]; then
    return 0
  fi

  git worktree list --porcelain | \
    grep -E "^worktree ${worktrees_dir}/" | \
    sed 's/^worktree //' || true
}

# Check if worktree has uncommitted changes
worktree_has_uncommitted_changes() {
  local worktree_path="$1"

  if [ ! -d "$worktree_path" ]; then
    return 1
  fi

  (cd "$worktree_path" && ! git diff-index --quiet HEAD --)
}

# Commit all changes in worktree
worktree_commit_all() {
  local worktree_path="$1"
  local message="$2"

  if [ ! -d "$worktree_path" ]; then
    log_error "Worktree does not exist: $worktree_path"
    return 1
  fi

  (
    cd "$worktree_path"
    git add -A
    git commit -m "$message"
  )
}

# Get worktree status summary
worktree_status() {
  local worktree_path="$1"

  if [ ! -d "$worktree_path" ]; then
    echo "ERROR: Worktree not found"
    return 1
  fi

  (
    cd "$worktree_path"
    echo "Branch: $(git branch --show-current)"
    echo "Status: $(git status --short | wc -l | tr -d ' ') files changed"
    echo "Commits ahead: $(git rev-list --count @{u}.. 2>/dev/null || echo "0")"
    echo "Last commit: $(git log -1 --format='%ar - %s' 2>/dev/null || echo "No commits")"
  )
}

# Get branch name from task ID
get_branch_from_task_id() {
  local task_id="$1"
  echo "feature/${task_id}"
}

# Get worktree path from task ID
get_worktree_path_from_task_id() {
  local task_id="$1"
  local git_root="$(get_git_root)"
  local worktree_path="${git_root}/.worktrees/${task_id}"

  if [ -d "$worktree_path" ]; then
    echo "$worktree_path"
  fi
}

# Check if worktree exists for task ID
worktree_exists_for_task() {
  local task_id="$1"
  local worktree_path=$(get_worktree_path_from_task_id "$task_id")
  [ -n "$worktree_path" ] && [ -d "$worktree_path" ]
}

# Export functions
export -f create_worktree remove_worktree list_flux_worktrees
export -f worktree_has_uncommitted_changes worktree_commit_all worktree_status
export -f get_branch_from_task_id get_worktree_path_from_task_id worktree_exists_for_task
