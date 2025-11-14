#!/usr/bin/env bash
# Tmux detection and management utilities

set -euo pipefail

# Source common utilities if not already loaded
if ! declare -f log_info > /dev/null; then
  _TMUX_UTILS_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  source "$_TMUX_UTILS_SCRIPT_DIR/common.sh"
fi

# Check if currently running inside tmux
is_in_tmux() {
  [ -n "${TMUX:-}" ]
}

# Get current tmux session name
get_current_session() {
  if is_in_tmux; then
    tmux display-message -p '#S'
  else
    echo ""
  fi
}

# Get current tmux pane ID
get_current_pane() {
  if is_in_tmux; then
    tmux display-message -p '#{pane_id}'
  else
    echo ""
  fi
}

# Create a new tmux pane in current session (horizontal split)
create_tmux_pane() {
  local worktree_path="$1"

  if ! is_in_tmux; then
    log_error "Cannot create pane: not in tmux session"
    return 1
  fi

  log_debug "Creating new tmux pane in current session"
  tmux split-window -h -c "$worktree_path"

  # Get the pane ID of the newly created pane
  tmux display-message -p '#{pane_id}'
}

# Create a new detached tmux session
create_tmux_session() {
  local session_name="$1"
  local worktree_path="$2"

  if session_exists "$session_name"; then
    log_error "Session already exists: $session_name"
    return 1
  fi

  log_debug "Creating new tmux session: $session_name"
  tmux new-session -d -s "$session_name" -c "$worktree_path"

  echo "$session_name"
}

# Check if a tmux session exists
session_exists() {
  local session_name="$1"
  tmux has-session -t "$session_name" 2>/dev/null
}

# Kill a tmux session
kill_tmux_session() {
  local session_name="$1"

  if session_exists "$session_name"; then
    log_debug "Killing tmux session: $session_name"
    tmux kill-session -t "$session_name"
    return 0
  else
    log_debug "Session does not exist: $session_name"
    return 1
  fi
}

# Send keystrokes to a tmux target (pane or session)
send_keys_to_target() {
  local target="$1"
  local keys="$2"

  log_debug "Sending keys to: $target"
  tmux send-keys -t "$target" "$keys" C-m
}

# Wait for tmux target to be ready
wait_for_target() {
  local target="$1"
  local max_wait="${2:-5}"
  local count=0

  while [ $count -lt "$max_wait" ]; do
    if tmux list-panes -t "$target" >/dev/null 2>&1 || \
       tmux list-sessions -F "#{session_name}" | grep -q "^${target}$"; then
      return 0
    fi
    sleep 0.5
    count=$((count + 1))
  done

  log_error "Timeout waiting for target: $target"
  return 1
}

# List all flux-capacitor tmux sessions
list_flux_sessions() {
  tmux list-sessions -F "#{session_name}" 2>/dev/null | \
    grep "^${FLUX_PREFIX}-" || true
}

# Get session uptime in human-readable format
get_session_uptime() {
  local session_name="$1"

  if ! session_exists "$session_name"; then
    echo "N/A"
    return 1
  fi

  local created=$(tmux display-message -t "$session_name" -p '#{session_created}')
  local now=$(date +%s)
  local uptime=$((now - created))

  local hours=$((uptime / 3600))
  local minutes=$(((uptime % 3600) / 60))

  if [ $hours -gt 0 ]; then
    echo "${hours}h ${minutes}m"
  else
    echo "${minutes}m"
  fi
}

# Capture recent output from a tmux pane/session
capture_pane_output() {
  local target="$1"
  local lines="${2:-20}"

  tmux capture-pane -t "$target" -p -S -"$lines" 2>/dev/null || echo "No output available"
}

# Export functions
export -f is_in_tmux get_current_session get_current_pane
export -f create_tmux_pane create_tmux_session
export -f session_exists kill_tmux_session
export -f send_keys_to_target wait_for_target
export -f list_flux_sessions get_session_uptime capture_pane_output
