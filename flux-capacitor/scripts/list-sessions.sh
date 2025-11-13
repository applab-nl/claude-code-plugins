#!/usr/bin/env bash
# List all active flux-capacitor sessions
#
# Usage: list-sessions.sh
#
# Output: Formatted list of active sessions with details

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/tmux-utils.sh"
source "$SCRIPT_DIR/lib/worktree-utils.sh"

log_section "Active Flux Capacitor Sessions:"

# Get all flux sessions
sessions=$(list_flux_sessions)

if [ -z "$sessions" ]; then
  echo "No active flux-capacitor sessions found."
  echo ""
  echo "Start a new session: /run <task-description>"
  exit 0
fi

count=0

# Process each session
while IFS= read -r session_name; do
  count=$((count + 1))

  # Extract task ID from session name
  # Format: flux-<project>-<task-id>
  task_id=$(echo "$session_name" | sed "s/^${FLUX_PREFIX}-[^-]*-//")
  project_name=$(echo "$session_name" | sed "s/^${FLUX_PREFIX}-//" | sed "s/-${task_id}$//")

  worktree_path=$(get_worktree_path_from_task_id "$task_id")
  branch_name="feature/${task_id}"
  uptime=$(get_session_uptime "$session_name")

  echo ""
  echo "${count}. $session_name"
  echo "   Task ID: $task_id"

  if [ -n "$worktree_path" ] && [ -d "$worktree_path" ]; then
    echo "   Worktree: $worktree_path"
  else
    echo "   Worktree: [NOT FOUND]"
  fi

  echo "   Branch: $branch_name"
  echo "   Uptime: $uptime"

done <<< "$sessions"

echo ""
log_section "Total: $count active session(s)"

echo "Commands:"
echo "  Attach: tmux attach -t <session-name>"
echo "  Status: /flux-status <task-id>"
echo "  Cleanup: /cleanup <task-id>"
