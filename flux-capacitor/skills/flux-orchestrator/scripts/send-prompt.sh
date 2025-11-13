#!/usr/bin/env bash
# Send meta prompt to Claude session in tmux
#
# Usage: send-prompt.sh <target> <task-description> <worktree-path> <branch-name> <project-name>
# Example: send-prompt.sh 0.2 "Add OAuth authentication" /path/to/worktree feature/oauth-a1b2c3 myapp
#
# Target can be: pane ID (e.g., 0.2) or session name (e.g., flux-myapp-oauth-a1b2c3)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/tmux-utils.sh"

# Validate arguments
if [ $# -lt 5 ]; then
  log_error "Usage: send-prompt.sh <target> <task-description> <worktree-path> <branch-name> <project-name>"
  exit 1
fi

target="$1"
task_description="$2"
worktree_path="$3"
branch_name="$4"
project_name="$5"

# Load meta prompt template
template_path="$SCRIPT_DIR/../templates/meta-prompt.md"

if [ ! -f "$template_path" ]; then
  log_error "Meta prompt template not found: $template_path"
  exit 1
fi

log_debug "Loading meta prompt template from: $template_path"

# Read template and substitute variables
meta_prompt=$(cat "$template_path" | \
  sed "s|{TASK_DESCRIPTION}|$task_description|g" | \
  sed "s|{WORKTREE_PATH}|$worktree_path|g" | \
  sed "s|{BRANCH_NAME}|$branch_name|g" | \
  sed "s|{PROJECT_NAME}|$project_name|g")

# Wait for Claude to be ready (look for prompt)
log_info "Waiting for Claude Code to be ready..."
sleep 3

# Send the meta prompt
log_debug "Sending meta prompt to target: $target"

# Escape the prompt for tmux
# We'll send it line by line to avoid issues with special characters
while IFS= read -r line; do
  # Skip empty lines and send non-empty lines
  if [ -n "$line" ]; then
    tmux send-keys -t "$target" -l "$line"
    tmux send-keys -t "$target" C-m
  fi
done <<< "$meta_prompt"

log_info "Meta prompt sent successfully"
