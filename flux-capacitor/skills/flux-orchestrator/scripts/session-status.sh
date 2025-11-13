#!/usr/bin/env bash
# Get detailed status of a flux-capacitor session
#
# Usage: session-status.sh <task-id>
# Example: session-status.sh oauth-a1b2c3

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/tmux-utils.sh"
source "$SCRIPT_DIR/lib/worktree-utils.sh"

# Validate arguments
if [ $# -lt 1 ]; then
  log_error "Usage: session-status.sh <task-id>"
  exit 1
fi

task_id="$1"
project_name=$(get_project_name)
session_name="${FLUX_PREFIX}-${project_name}-${task_id}"
worktree_path=$(get_worktree_path_from_task_id "$task_id")
branch_name="feature/${task_id}"

log_section "📊 Session Status: $task_id"

# Check session exists
echo "Session: $session_name"
if session_exists "$session_name"; then
  uptime=$(get_session_uptime "$session_name")
  echo "  Status: ✓ Running"
  echo "  Uptime: $uptime"
else
  echo "  Status: ✗ Not running"
fi

echo ""

# Check worktree exists
echo "Worktree: $worktree_path"
if [ -n "$worktree_path" ] && [ -d "$worktree_path" ]; then
  echo "  Path exists: ✓ Yes"

  # Get worktree status
  echo ""
  worktree_status "$worktree_path" | sed 's/^/  /'
else
  echo "  Path exists: ✗ No"
fi

echo ""

# Show recent activity from tmux pane/session
if session_exists "$session_name"; then
  echo "💡 Recent activity (last 15 lines):"
  echo ""
  capture_pane_output "$session_name" 15 | sed 's/^/  /'
  echo ""
fi

log_section "Commands:"
echo "  Attach: tmux attach -t $session_name"
echo "  Cleanup: /cleanup $task_id"
