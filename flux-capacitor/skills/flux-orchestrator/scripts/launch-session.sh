#!/usr/bin/env bash
# Launch Claude Code session in tmux (pane or new session)
#
# Usage: launch-session.sh <worktree-path> <task-id> <project-name>
# Example: launch-session.sh /path/to/worktree oauth-a1b2c3 myapp
#
# Output: PANE:<pane-id> or SESSION:<session-name>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/tmux-utils.sh"

# Validate arguments
if [ $# -lt 3 ]; then
  log_error "Usage: launch-session.sh <worktree-path> <task-id> <project-name>"
  exit 1
fi

worktree_path="$1"
task_id="$2"
project_name="$3"

# Validate worktree exists
if [ ! -d "$worktree_path" ]; then
  log_error "Worktree does not exist: $worktree_path"
  exit 1
fi

session_name="${FLUX_PREFIX}-${project_name}-${task_id}"

if is_in_tmux; then
  # Already in tmux: create new pane
  log_info "Creating new pane in current tmux session..."

  pane_id=$(create_tmux_pane "$worktree_path")

  if [ -z "$pane_id" ]; then
    log_error "Failed to create tmux pane"
    exit 1
  fi

  log_info "Pane created: $pane_id"

  # Wait for pane to be ready
  wait_for_target "$pane_id" || {
    log_error "Pane not ready"
    exit 1
  }

  # Launch Claude in the new pane
  log_debug "Launching Claude Code in pane: $pane_id"
  send_keys_to_target "$pane_id" "claude --dangerously-skip-permissions"

  # Output pane ID
  echo "PANE:$pane_id"

else
  # Not in tmux: create new detached session
  log_info "Creating new tmux session: $session_name"

  if session_exists "$session_name"; then
    log_error "Session already exists: $session_name"
    log_error "Attach with: tmux attach -t $session_name"
    exit 1
  fi

  create_tmux_session "$session_name" "$worktree_path" >/dev/null

  log_info "Session created: $session_name"

  # Wait for session to be ready
  wait_for_target "$session_name" || {
    log_error "Session not ready"
    exit 1
  }

  # Launch Claude in the new session
  log_debug "Launching Claude Code in session: $session_name"
  send_keys_to_target "$session_name" "claude --dangerously-skip-permissions"

  # Output session name
  echo "SESSION:$session_name"
fi
