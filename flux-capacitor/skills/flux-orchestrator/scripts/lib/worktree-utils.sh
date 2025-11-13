#!/usr/bin/env bash
# Git worktree management utilities

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Create a git worktree for a task
create_worktree() {
  local task_id="$1"
  local project_name="$2"

  if ! is_git_repo; then
    log_error "Not in a git repository"
    return 1
  fi

  local branch_name="feature/${task_id}"
  local worktree_name="${project_name}-${task_id}"
  local worktree_path="../${worktree_name}"

  # Get absolute path
  worktree_path=$(cd "$(dirname "$worktree_path")" && pwd)/$(basename "$worktree_path")

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

  # Create worktree
  if ! git worktree add "$worktree_path" "$branch_name" 2>/dev/null; then
    log_error "Failed to create worktree at: $worktree_path"
    return 1
  fi

  # Run initialization scripts if they exist
  local init_dir="$(get_git_root)/.worktree-init"
  if [ -d "$init_dir" ]; then
    log_info "Running worktree initialization scripts..."
    (
      cd "$worktree_path"
      for script in "$init_dir"/*; do
        if [ -x "$script" ]; then
          log_debug "Running: $(basename "$script")"
          "$script" || log_warn "Init script failed: $(basename "$script")"
        fi
      done
    )
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
  local project_name=$(get_project_name)
  git worktree list --porcelain | \
    grep -E "^worktree .+${project_name}-[a-zA-Z0-9]+" | \
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
  local project_name=$(get_project_name)
  local worktree_name="${project_name}-${task_id}"

  # Get absolute path
  local worktree_path="../${worktree_name}"
  if [ -d "$worktree_path" ]; then
    cd "$(dirname "$worktree_path")" && pwd
    echo "/$(basename "$worktree_path")"
  fi | tr -d '\n'
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
