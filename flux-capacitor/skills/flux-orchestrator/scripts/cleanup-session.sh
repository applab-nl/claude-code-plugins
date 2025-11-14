#!/usr/bin/env bash
# Safely merge worktree changes back to source tree and cleanup
#
# Usage: cleanup-session.sh <task-name>
# Example: cleanup-session.sh fix-oauth-bug-a1b2c3
#
# This script:
# 1. Checks for uncommitted changes in worktree
# 2. Merges feature branch to current branch
# 3. Removes worktree
# 4. Deletes feature branch
# 5. Kills tmux session

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/tmux-utils.sh"
source "$SCRIPT_DIR/lib/worktree-utils.sh"

# Validate arguments
if [ $# -lt 1 ]; then
  log_error "Usage: cleanup-session.sh <task-name>"
  exit 1
fi

task_name="$1"
project_name=$(get_project_name)
session_name="${FLUX_PREFIX}-${project_name}-${task_name}"
worktree_path=$(get_worktree_path_from_task_id "$task_name")
branch_name="feature/${task_name}"

log_section "🔍 Cleanup: $task_name"

# Step 1: Verify worktree exists
if [ -z "$worktree_path" ] || [ ! -d "$worktree_path" ]; then
  log_error "Worktree not found for task: $task_name"
  log_error "Expected path: ../${project_name}-${task_name}"
  exit 1
fi

log_info "Worktree found: $worktree_path"

# Step 2: Check for uncommitted changes in worktree
if worktree_has_uncommitted_changes "$worktree_path"; then
  log_warn "WARNING: Uncommitted changes detected in worktree!"
  echo ""
  (cd "$worktree_path" && git status --short)
  echo ""
  echo "Options:"
  echo "  1) Commit changes now"
  echo "  2) Discard changes (DANGEROUS)"
  echo "  3) Abort cleanup"
  read -p "Choice [1/2/3]: " choice

  case $choice in
    1)
      log_info "Committing changes..."
      worktree_commit_all "$worktree_path" "WIP: Auto-commit before cleanup"
      ;;
    2)
      log_warn "Discarding uncommitted changes..."
      (cd "$worktree_path" && git reset --hard HEAD)
      ;;
    3)
      log_info "Cleanup aborted."
      exit 0
      ;;
    *)
      log_error "Invalid choice. Aborting."
      exit 1
      ;;
  esac
else
  log_info "No uncommitted changes"
fi

# Step 3: Get current branch
current_branch=$(git branch --show-current)
log_info "Current branch: $current_branch"

# Step 4: Merge the feature branch
log_info "Merging $branch_name into $current_branch..."

if git merge "$branch_name" --no-edit; then
  log_info "Merge successful!"
else
  log_error "Merge conflicts detected!"
  echo ""
  echo "Please resolve conflicts manually, then run:"
  echo "  git merge --continue"
  echo "  /cleanup $task_name  # Run cleanup again"
  echo ""
  log_warn "Cleanup aborted. Worktree preserved for conflict resolution."
  exit 1
fi

# Step 5: Remove worktree
log_info "Removing worktree: $worktree_path"
remove_worktree "$worktree_path"

# Step 6: Delete feature branch
log_info "Deleting branch: $branch_name"
git branch -D "$branch_name" 2>/dev/null || log_warn "Branch already deleted"

# Step 7: Kill tmux session (if exists)
if session_exists "$session_name"; then
  log_info "Killing tmux session: $session_name"
  kill_tmux_session "$session_name"
else
  log_debug "Tmux session not found (may have been closed manually)"
fi

log_section "✅ Cleanup complete!"

echo "Summary:"
echo "  • Changes merged to: $current_branch"
echo "  • Worktree removed: $worktree_path"
echo "  • Branch deleted: $branch_name"
echo "  • Session terminated: $session_name"
