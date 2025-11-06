---
allowed-tools: Bash(git *), Bash(basename:*), Bash(dirname:*), Bash(pwd:*), Bash(find:*), Bash(test:*), Bash(echo:*)
description: Launch feature development in isolated worktree with flux-capacitor agent
---

## Context

- Current directory: !`pwd`
- Git repository root: !`git rev-parse --show-toplevel 2>/dev/null || echo ""`
- Current branch: !`git branch --show-current 2>/dev/null || echo ""`
- Arguments: `$ARGUMENTS`

## Your Task

**Launch feature development in isolated worktree with tmux session.** Execute commands with minimal shots.

### Step 1: Parse Arguments and Generate Branch Name

Parse `$ARGUMENTS` to detect pattern:

**Pattern 1: Issue Key** (e.g., `MEM-123`, `PROJ-456`)
- Regex: `^[A-Z]{2,10}-\d+`
- Branch: `feature/{key-lowercase}` (e.g., `feature/mem-123`)
- Mode: `issue-key`

**Pattern 2: Description** (anything else)
- Sanitize: lowercase, replace spaces/special chars with `-`, limit to 50 chars
- Branch: `feature/{sanitized-description}`
- Mode: `description`

**Pattern 3: Empty**
- Show usage and stop

### Step 2: Create Worktree and Launch Session (Single Command)

**CRITICAL: The tmux session MUST launch with working directory set to the worktree.**

Execute in a single bash command block:

```bash
# Verify we're in a git repository
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  echo "Error: Not in a git repository"
  echo "Please run this command from within a git repository"
  exit 1
fi

# Parse arguments and generate branch name
ARGS="$ARGUMENTS"
if [ -z "$ARGS" ]; then
  echo "Error: No arguments provided"
  echo ""
  echo "Usage: /run <ISSUE-KEY|description>"
  echo ""
  echo "Examples:"
  echo "  /run MEM-123"
  echo "  /run Add OAuth authentication with Google"
  exit 1
fi

MODE=""
BRANCH=""

# Detect issue key pattern
if echo "$ARGS" | grep -qiE '^[A-Z]{2,10}-[0-9]+'; then
  MODE="issue-key"
  ISSUE_KEY=$(echo "$ARGS" | grep -oiE '^[A-Z]{2,10}-[0-9]+')
  BRANCH="feature/$(echo "$ISSUE_KEY" | tr '[:upper:]' '[:lower:]')"
else
  MODE="description"
  SANITIZED=$(echo "$ARGS" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-//;s/-$//' | cut -c1-50)
  BRANCH="feature/$SANITIZED"
fi

# Find flux script - try multiple locations
FLUX=""

# Try CLAUDE_PLUGIN_ROOT if set
if [ -n "$CLAUDE_PLUGIN_ROOT" ] && [ -x "$CLAUDE_PLUGIN_ROOT/scripts/flux" ]; then
  FLUX="$CLAUDE_PLUGIN_ROOT/scripts/flux"
fi

# Try standard plugin location
if [ -z "$FLUX" ] && [ -x "$HOME/.claude/plugins/flux-capacitor/scripts/flux" ]; then
  FLUX="$HOME/.claude/plugins/flux-capacitor/scripts/flux"
fi

# Try local development location (common for marketplace development)
if [ -z "$FLUX" ] && [ -x "/Users/dylan/projects/claude-swarm/claude-code-plugins/flux-capacitor/scripts/flux" ]; then
  FLUX="/Users/dylan/projects/claude-swarm/claude-code-plugins/flux-capacitor/scripts/flux"
fi

# Search in ~/.claude as fallback
if [ -z "$FLUX" ]; then
  FLUX=$(find "$HOME/.claude" -type f -name flux -path '*/flux-capacitor/scripts/flux' 2>/dev/null | head -1)
fi

# Search home directory as last resort (limited depth for performance)
if [ -z "$FLUX" ]; then
  FLUX=$(find "$HOME/projects" -maxdepth 5 -type f -name flux -path '*/flux-capacitor/scripts/flux' 2>/dev/null | head -1)
fi

if [ -z "$FLUX" ] || [ ! -x "$FLUX" ]; then
  echo "Error: flux script not found"
  echo ""
  echo "Searched locations:"
  echo "  - \$CLAUDE_PLUGIN_ROOT/scripts/flux"
  echo "  - ~/.claude/plugins/flux-capacitor/scripts/flux"
  echo "  - ~/projects/*/flux-capacitor/scripts/flux"
  echo ""
  echo "Please ensure flux-capacitor plugin is installed correctly"
  exit 1
fi

echo "Using flux script: $FLUX"

# Create augmented prompt
PROMPT="You are in an isolated worktree for feature development.

**Input**: $ARGS
**Mode**: $MODE
**Branch**: $BRANCH

Invoke the flux-capacitor agent to handle:
- Issue tracker integration (if mode is 'issue-key')
- Comprehensive planning with ultrathink mode
- Subagent delegation strategy
- Implementation guidance

The flux-capacitor agent will guide you through the complete feature implementation."

# Launch worktree + tmux session + Claude (atomic operation)
echo "Launching feature development session..."
echo "  Mode: $MODE"
echo "  Branch: $BRANCH"
echo ""
"$FLUX" launch "$REPO_ROOT" "$BRANCH" "$PROMPT" "flux-capacitor"
```

### Step 3: Report Success

After flux script completes, report:
- Session ID (from flux output)
- Worktree path (from flux output)
- Branch name
- Commands to check status/attach

**Example Output:**
```
✓ Worktree created: /Users/alice/projects/my-app-feature-mem-123
✓ Branch: feature/mem-123
✓ Session launched: sess_my-app-feature-mem-123_1730890123_abc123

Claude Code is now running in the isolated worktree.
The flux-capacitor agent will handle planning and implementation.

Commands:
  flux attach sess_my-app-feature-mem-123_1730890123_abc123
  flux status sess_my-app-feature-mem-123_1730890123_abc123
```

## Critical Safety Requirements

1. **Working Directory Isolation**: The flux script's `-c "$worktree_path"` flag ensures tmux launches in the worktree
2. **Prompt File Location**: Created at `$worktree_path/.claude/prompt.md` (inside worktree)
3. **No Spillover**: Everything happens in the new worktree - zero risk of cross-contamination

## Error Handling

- **No arguments**: Show usage and stop
- **Not a git repo**: Error and stop
- **Flux script not found**: Error with installation instructions
- **Flux script fails**: Show error output from flux

## Usage Examples

```bash
# Issue key
/run MEM-123

# Description
/run Add OAuth authentication with Google
```
