#!/usr/bin/env bash
# Create isolated git worktree for a task
#
# Usage: create-worktree.sh <task-name> <project-name>
# Example: create-worktree.sh fix-oauth-bug-a1b2c3 myapp
#
# Output: Absolute path to created worktree

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/worktree-utils.sh"

# Validate arguments
if [ $# -lt 2 ]; then
  log_error "Usage: create-worktree.sh <task-name> <project-name>"
  exit 1
fi

task_name="$1"
project_name="$2"

# Validate inputs
if ! is_valid_task_id "$task_name"; then
  log_error "Invalid task name format: $task_name"
  exit 1
fi

if ! is_git_repo; then
  log_error "Not in a git repository"
  exit 1
fi

# Create worktree
log_info "Creating worktree for task: $task_name"

worktree_path=$(create_worktree "$task_name" "$project_name")

if [ -z "$worktree_path" ] || [ ! -d "$worktree_path" ]; then
  log_error "Failed to create worktree"
  exit 1
fi

log_info "Worktree created: $worktree_path"
log_info "Branch: feature/${task_name}"

# Output worktree path for caller
echo "$worktree_path"
