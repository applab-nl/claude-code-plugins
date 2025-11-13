#!/usr/bin/env bash
# Common utilities and shared variables for flux-capacitor scripts

set -euo pipefail

# Constants
FLUX_PREFIX="flux"
LOG_LEVEL="${FLUX_LOG_LEVEL:-info}"  # debug, info, warn, error

# Logging functions
log_info() {
  echo "✓ $*"
}

log_warn() {
  echo "⚠️  $*"
}

log_error() {
  echo "❌ $*" >&2
}

log_debug() {
  if [ "$LOG_LEVEL" = "debug" ]; then
    echo "🔍 $*"
  fi
}

log_section() {
  echo ""
  echo "$*"
  echo ""
}

# Generate short unique task ID (timestamp + random)
generate_task_id() {
  local timestamp_part=$(date +%s | tail -c 7)
  local random_part=$(openssl rand -hex 3)
  echo "${timestamp_part}${random_part}"
}

# Convert task description to URL-safe slug
slugify() {
  local text="$1"
  echo "$text" | \
    tr '[:upper:]' '[:lower:]' | \
    tr -cs '[:alnum:]' '-' | \
    sed 's/^-//' | \
    sed 's/-$//' | \
    cut -c1-40
}

# Get current project name from directory
get_project_name() {
  basename "$PWD"
}

# Get git root directory
get_git_root() {
  git rev-parse --show-toplevel 2>/dev/null
}

# Check if we're in a git repository
is_git_repo() {
  git rev-parse --git-dir >/dev/null 2>&1
}

# Validate task ID format
is_valid_task_id() {
  local task_id="$1"
  [[ "$task_id" =~ ^[a-zA-Z0-9_-]+$ ]]
}

# Export functions for use in other scripts
export -f log_info log_warn log_error log_debug log_section
export -f generate_task_id slugify get_project_name get_git_root is_git_repo is_valid_task_id
export FLUX_PREFIX LOG_LEVEL
