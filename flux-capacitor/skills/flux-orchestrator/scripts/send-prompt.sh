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

target_param="$1"
task_description="$2"
worktree_path="$3"
branch_name="$4"
project_name="$5"

# Parse target parameter (could be "SESSION:name" or "PANE:id" or just "name")
if [[ "$target_param" == SESSION:* ]]; then
  target="${target_param#SESSION:}"
elif [[ "$target_param" == PANE:* ]]; then
  target="${target_param#PANE:}"
else
  target="$target_param"
fi

# Load meta prompt template
template_path="$(cd "$SCRIPT_DIR/.." && pwd)/templates/meta-prompt.md"

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

# Send the prompt using literal mode to avoid interpretation issues
# Write to a temporary file first to avoid command-line escaping issues
tmp_file=$(mktemp)
trap "rm -f '$tmp_file'" EXIT

echo "$meta_prompt" > "$tmp_file"

# Send the prompt line by line
while IFS= read -r line || [ -n "$line" ]; do
  # Send line literally (disable key name lookup)
  # Use -- to prevent lines starting with - from being interpreted as flags
  tmux send-keys -t "$target" -l -- "$line"
  tmux send-keys -t "$target" C-m
done < "$tmp_file"

# Send final Enter to submit the prompt
tmux send-keys -t "$target" Enter

log_info "Meta prompt sent successfully"
