#!/usr/bin/env bash
# Launch Claude Code session in tmux (pane or new session)
#
# Usage: launch-session.sh <worktree-path> <task-name> <project-name>
# Example: launch-session.sh /path/to/worktree fix-oauth-bug-a1b2c3 myapp
#
# Output: PANE:<pane-id> or SESSION:<session-name>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/tmux-utils.sh"

# Validate arguments
if [ $# -lt 3 ]; then
  log_error "Usage: launch-session.sh <worktree-path> <task-name> <project-name>"
  exit 1
fi

worktree_path="$1"
task_name="$2"
project_name="$3"

# Validate worktree exists
if [ ! -d "$worktree_path" ]; then
  log_error "Worktree does not exist: $worktree_path"
  exit 1
fi

session_name="${FLUX_PREFIX}-${project_name}-${task_name}"

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

  # Wait for shell to initialize and dotenv prompt to appear
  sleep 1.5

  # Answer dotenv prompt with 'a' (always)
  tmux send-keys -t "$pane_id" "a"
  sleep 0.3

  # Now launch Claude
  send_keys_to_target "$pane_id" "claude --dangerously-skip-permissions"

  # Layer 5: Health check - verify Claude started
  log_debug "Verifying Claude Code started successfully..."
  sleep 2
  pane_output=$(capture_pane_output "$pane_id" 10)

  if echo "$pane_output" | grep -q "Claude Code"; then
    log_info "✓ Claude Code started successfully"
  else
    log_warn "Could not verify Claude Code startup. Check pane manually."
    log_debug "Recent output: $pane_output"
  fi

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

  # Wait for shell to initialize and dotenv prompt to appear
  sleep 1.5

  # Answer dotenv prompt with 'a' (always)
  tmux send-keys -t "$session_name" "a"
  sleep 0.3

  # Now launch Claude
  send_keys_to_target "$session_name" "claude --dangerously-skip-permissions"

  # Layer 5: Health check - verify Claude started
  log_debug "Verifying Claude Code started successfully..."
  sleep 2
  session_output=$(capture_pane_output "$session_name" 10)

  if echo "$session_output" | grep -q "Claude Code"; then
    log_info "✓ Claude Code started successfully"
  else
    log_warn "Could not verify Claude Code startup. Check session manually."
    log_debug "Recent output: $session_output"
  fi

  # Output session name
  echo "SESSION:$session_name"
fi
