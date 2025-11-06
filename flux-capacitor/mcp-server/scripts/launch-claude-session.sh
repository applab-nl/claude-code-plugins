#!/bin/bash
# launch-claude-session.sh - Atomic Claude Code session launcher
#
# This script performs ALL session setup in a single, atomic execution:
# - Creates git worktree
# - Creates tmux session
# - Launches Claude Code with @ file reference
# - Returns immediately (fire-and-forget)

set -euo pipefail  # Exit on any error

# Parse arguments
REPO_PATH=""
BRANCH=""
WORKTREE_NAME=""
PROMPT_FILE=""
SESSION_ID=""
BASE_BRANCH="main"

while [[ $# -gt 0 ]]; do
  case $1 in
    --repo-path)      REPO_PATH="$2"; shift 2 ;;
    --branch)         BRANCH="$2"; shift 2 ;;
    --worktree-name)  WORKTREE_NAME="$2"; shift 2 ;;
    --prompt-file)    PROMPT_FILE="$2"; shift 2 ;;
    --session-id)     SESSION_ID="$2"; shift 2 ;;
    --base-branch)    BASE_BRANCH="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# Validate required parameters
[[ -z "$REPO_PATH" ]] && { echo "ERROR: Missing --repo-path" >&2; exit 1; }
[[ -z "$BRANCH" ]] && { echo "ERROR: Missing --branch" >&2; exit 1; }
[[ -z "$WORKTREE_NAME" ]] && { echo "ERROR: Missing --worktree-name" >&2; exit 1; }
[[ -z "$PROMPT_FILE" ]] && { echo "ERROR: Missing --prompt-file" >&2; exit 1; }
[[ -z "$SESSION_ID" ]] && { echo "ERROR: Missing --session-id" >&2; exit 1; }
[[ ! -f "$PROMPT_FILE" ]] && { echo "ERROR: Prompt file not found: $PROMPT_FILE" >&2; exit 1; }

# Check if tmux is installed
if ! command -v tmux >/dev/null 2>&1; then
  echo "ERROR: tmux is not installed." >&2
  echo "Install tmux:" >&2
  echo "  macOS: tmux is built-in (or: brew install tmux)" >&2
  echo "  Ubuntu/Debian: sudo apt install tmux" >&2
  echo "  Fedora: sudo dnf install tmux" >&2
  exit 1
fi

# Calculate paths
WORKTREE_PATH="$(dirname "$REPO_PATH")/$WORKTREE_NAME"
TMUX_SESSION="flux-$SESSION_ID"
STATE_FILE="$WORKTREE_PATH/.claude/session-state.json"

# Step 1: Create worktree (if not exists)
if [[ ! -d "$WORKTREE_PATH" ]]; then
  cd "$REPO_PATH"

  # Create branch if doesn't exist
  if ! git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
    git branch "$BRANCH" "$BASE_BRANCH"
  fi

  # Create worktree
  git worktree add "$WORKTREE_PATH" "$BRANCH"
fi

# Step 2: Create tmux session with Claude Code
# Use -d to detach immediately (fire-and-forget)
# Use @ file reference for reliable prompt delivery
tmux new-session -d -s "$TMUX_SESSION" -c "$WORKTREE_PATH" \
  "claude \"Implement the plan in @$PROMPT_FILE\"; exec bash"

# Step 3: Save session state
mkdir -p "$(dirname "$STATE_FILE")"
cat > "$STATE_FILE" <<EOF
{
  "sessionId": "$SESSION_ID",
  "tmuxSession": "$TMUX_SESSION",
  "worktreePath": "$WORKTREE_PATH",
  "branch": "$BRANCH",
  "startedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "active"
}
EOF

# Step 4: Output session info (captured by MCP server)
echo "$TMUX_SESSION"

# Done! Session is running in background
exit 0
