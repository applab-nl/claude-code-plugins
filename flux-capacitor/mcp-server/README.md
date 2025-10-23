# Workspace Orchestrator MCP Server

A Model Context Protocol (MCP) server for managing git worktrees and orchestrating multiple Claude Code sessions in parallel. Part of the Flux Capacitor system for meta-orchestration of development workflows.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage with Claude Code](#usage-with-claude-code)
- [MCP Tools Reference](#mcp-tools-reference)
- [Workflow Examples](#workflow-examples)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

---

## Overview

The Workspace Orchestrator enables Claude Code to:
- Create and manage isolated git worktrees for parallel feature development
- Launch new Claude Code sessions in separate terminal windows
- Track session status and manage the lifecycle of multiple sessions
- Execute automated setup scripts when creating worktrees

This allows a single Claude Code session (the "orchestrator") to delegate work to multiple specialized sessions, each working in their own isolated worktree.

**Primary Use Case**: Powers the **flux-capacitor** plugin for automated feature development lifecycle orchestration. The flux-capacitor uses these tools to create isolated environments and launch dedicated sessions for each feature.

### Architecture

```
┌─────────────────────────────────────────┐
│   Master Claude Code Session            │
│   (Flux Capacitor Agent)                │
│   - Plans features                      │
│   - Decides delegation strategy         │
│   - Uses MCP tools below                │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│   Workspace Orchestrator MCP Server     │
│   - Creates git worktrees               │
│   - Launches terminal windows           │
│   - Tracks session state                │
└─────────────────┬───────────────────────┘
                  │
                  ↓
    ┌─────────────┴─────────────┐
    │                           │
    ↓                           ↓
┌──────────────┐        ┌──────────────┐
│ Worktree 1   │        │ Worktree 2   │
│ Session A    │        │ Session B    │
│ (Terminal 1) │        │ (Terminal 2) │
└──────────────┘        └──────────────┘
```

---

## Features

### Git Worktree Management
- Create worktrees as sibling directories to your repository
- Automatic branch creation if needed
- Execute initialization scripts on worktree creation (`.worktree-init/`)
- List all worktrees with associated session information
- Clean up worktrees and optionally delete branches

### Session Orchestration
- Launch Claude Code sessions in new terminal windows
- Support for Warp, iTerm2, Terminal.app, and custom terminals
- Track session status and process health
- Pass initial prompts and context files to sessions
- Specify which agent to use (e.g., `flutter-specialist`, `kotlin-backend-specialist`)

### State Persistence
- Persistent storage of worktree and session metadata
- Automatic state cleanup for old sessions
- Session-to-worktree associations

### Terminal Flexibility
- Auto-detect available terminals on macOS
- User-configurable terminal commands via templates
- Fallback chain for terminal selection

---

## Installation

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Git**: 2.30+ (for worktree support)
- **Claude Code**: Installed and configured
- **Terminal**: Warp, iTerm2, or Terminal.app (macOS)

### Install Dependencies

```bash
cd mcp-servers/flux-capacitor-mcp
npm install
```

### Build the Server

```bash
npm run build
```

This compiles TypeScript to `dist/` and makes the server executable.

### Verify Installation

```bash
node dist/index.js
```

You should see startup information. Press `Ctrl+C` to stop.

---

## Configuration

### Claude Code MCP Configuration

Add the server to your Claude Code MCP configuration file:

**Location**: `~/.claude/mcp_config.json` (or your configured MCP config path)

```json
{
  "mcpServers": {
    "flux-capacitor-mcp": {
      "command": "node",
      "args": [
        "/absolute/path/to/claude-code-config/mcp-servers/flux-capacitor-mcp/dist/index.js"
      ],
      "env": {
        "LOG_LEVEL": "info",
        "STATE_DIR": "~/.claude/flux-capacitor/state",
        "TERMINAL_APP": "auto-detect",
        "TERMINAL_DETECT_ORDER": "warp,iterm2,terminal"
      }
    }
  }
}
```

**Important**: Replace `/absolute/path/to/` with the actual absolute path to your installation.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging verbosity: `debug`, `info`, `warn`, `error` | `info` |
| `STATE_DIR` | Directory for state persistence | `~/.claude/flux-capacitor/state` |
| `TERMINAL_APP` | Terminal preference: `warp`, `iterm2`, `terminal`, `custom`, or `auto-detect` | `auto-detect` |
| `TERMINAL_DETECT_ORDER` | Priority order for auto-detection (comma-separated) | `warp,iterm2,terminal` |
| `TERMINAL_CUSTOM_COMMAND` | Custom terminal command template (see below) | - |

### Custom Terminal Commands

If you need to use a custom terminal or command, set `TERMINAL_APP=custom` and provide a template:

```json
{
  "env": {
    "TERMINAL_APP": "custom",
    "TERMINAL_CUSTOM_COMMAND": "kitty --directory={{cwd}} --title={{title}} sh -c '{{command}}'"
  }
}
```

**Template Variables:**
- `{{cwd}}` - Working directory path
- `{{title}}` - Window/tab title
- `{{command}}` - Command to execute
- `{{shell}}` - Shell to use (e.g., `/bin/zsh`)

---

## Usage with Claude Code

Once configured, the MCP tools are available in your Claude Code session. Claude will automatically discover and use these tools when appropriate.

### Recommended: Use with Flux Capacitor

The **flux-capacitor** plugin provides the best experience by orchestrating the complete feature development lifecycle:

```bash
/flux-capacitor MEM-123
```

The flux-capacitor will:
1. Fetch issue details from Linear/GitHub/Jira
2. Generate comprehensive implementation plan
3. Use `create_worktree` to create isolated environment
4. Use `launch_session` to start dedicated Claude Code session
5. Track progress and manage cleanup

See the [flux-capacitor documentation](../../../claude-code-plugins/flux-capacitor/README.md) for full details.

### Direct Usage Examples

You can also use these tools directly by asking Claude:

#### Create Worktree and Launch Session

> "Create a worktree for the new authentication feature and launch a session to implement it."

Claude will:
1. Use `create_worktree` to create a worktree on a new branch
2. Use `launch_session` to start a Claude Code session in that worktree
3. A new terminal window opens with Claude Code running in the worktree

#### Check Session Status

> "What sessions are currently running?"

Claude will use `list_worktrees` or `get_session_status` to show you active sessions.

#### Cleanup

> "I'm done with the auth-feature worktree. Clean it up."

Claude will use `cleanup_worktree` to remove the worktree and terminate the session.

---

## MCP Tools Reference

### 1. `create_worktree`

Create a new git worktree for isolated development.

**Parameters:**
```typescript
{
  repositoryPath: string;      // Absolute path to the git repository
  branchName: string;          // Branch name (created if doesn't exist)
  baseBranch?: string;         // Base branch (default: current branch)
  worktreeName?: string;       // Custom name (default: auto-generated)
}
```

**Returns:**
```typescript
{
  worktreePath: string;        // Absolute path to the new worktree
  branch: string;              // Branch name
  status: string;              // Creation status
  initScriptsRun: number;      // Number of init scripts executed
}
```

**Example:**
```json
{
  "repositoryPath": "/Users/alice/projects/my-app",
  "branchName": "feature/authentication",
  "baseBranch": "main"
}
```

**What it does:**
1. Validates the repository exists
2. Creates branch if it doesn't exist
3. Creates worktree as sibling directory (e.g., `my-app-feature-authentication`)
4. Executes any `.worktree-init/*.sh` scripts found
5. Saves worktree metadata to state

### 2. `list_worktrees`

List all git worktrees, optionally filtered by repository.

**Parameters:**
```typescript
{
  repositoryPath?: string;     // Filter by specific repository
  includeSessionInfo?: boolean; // Include associated session details
}
```

**Returns:**
```typescript
{
  worktrees: Array<{
    path: string;
    branch: string;
    commit: string;
    repository: string;
    locked: boolean;
    prunable: boolean;
    sessionId?: string;
    sessionStatus?: string;
    createdAt: string;
  }>
}
```

**Example:**
```json
{
  "repositoryPath": "/Users/alice/projects/my-app",
  "includeSessionInfo": true
}
```

### 3. `cleanup_worktree`

Remove a worktree and optionally its associated branch.

**Parameters:**
```typescript
{
  worktreePath: string;        // Absolute path to worktree
  deleteBranch?: boolean;      // Also delete the branch (default: false)
  force?: boolean;             // Force removal even if dirty (default: false)
}
```

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  branchDeleted?: boolean;
  sessionsTerminated?: number;
}
```

**Example:**
```json
{
  "worktreePath": "/Users/alice/projects/my-app-feature-auth",
  "deleteBranch": true,
  "force": false
}
```

**What it does:**
1. Terminates any active sessions in the worktree (SIGTERM, then SIGKILL)
2. Removes the worktree using `git worktree remove`
3. Optionally deletes the branch
4. Cleans up state storage

### 4. `launch_session`

Launch a new Claude Code session in a worktree.

**Parameters:**
```typescript
{
  worktreePath: string;        // Absolute path to worktree
  prompt: string;              // Initial prompt/instructions for Claude
  contextFiles?: string[];     // Files to include in context
  agentName?: string;          // Specific agent to use
}
```

**Returns:**
```typescript
{
  sessionId: string;           // Unique session identifier
  status: string;              // Session status
  terminalPid: number;         // Terminal process ID
  terminalApp: string;         // Terminal application used
  worktreePath: string;
}
```

**Example:**
```json
{
  "worktreePath": "/Users/alice/projects/my-app-feature-auth",
  "prompt": "Implement OAuth2 authentication flow using Supabase. Follow the security best practices in docs/SECURITY.md.",
  "contextFiles": [
    "src/lib/auth.ts",
    "docs/SECURITY.md"
  ],
  "agentName": "supabase-integration-expert"
}
```

**What it does:**
1. Validates worktree exists
2. Creates a prompt file in `.claude/` directory (to avoid command line length limits)
3. Opens a new terminal window
4. Launches Claude Code with the prompt and context files
5. Tracks the session in state storage

### 5. `get_session_status`

Check the status of a Claude Code session.

**Parameters:**
```typescript
{
  sessionId: string;           // Session ID from launch_session
}
```

**Returns:**
```typescript
{
  sessionId: string;
  status: string;              // active, completed, failed, terminated, unknown
  worktreePath: string;
  startedAt: string;
  completedAt?: string;
  terminalPid: number;
  terminalAlive: boolean;      // Is the terminal process still running?
  lastActivity?: string;
  terminalApp: string;
}
```

**Example:**
```json
{
  "sessionId": "sess_my-app-feature-auth_1729012345_abc123"
}
```

### 6. `create_terminal`

Low-level tool for creating terminal windows. Primarily used internally by `launch_session`.

**Parameters:**
```typescript
{
  shell?: string;              // Shell to use
  cwd?: string;                // Working directory
  title?: string;              // Window/tab title
  command?: string;            // Initial command to execute
}
```

**Returns:**
```typescript
{
  pid: number;                 // Terminal process ID
  app: string;                 // Terminal application used
  success: boolean;
}
```

---

## Workflow Examples

### Example 1: Parallel Feature Development

**Scenario**: Working on two features simultaneously - authentication and payment processing.

```
1. User (in main Claude Code session):
   "I need to work on authentication and payment features in parallel."

2. Claude creates worktrees:
   - Uses create_worktree for feature/authentication
   - Uses create_worktree for feature/payment

3. Claude launches sessions:
   - Uses launch_session with supabase-integration-expert for auth
   - Uses launch_session with kotlin-backend-specialist for payment

4. Two new terminal windows open, each with Claude Code running

5. User switches between terminals to monitor/guide each session

6. When done, user tells Claude:
   "Both features are complete. Clean up the worktrees."

7. Claude uses cleanup_worktree for both, keeping branches for PR review
```

### Example 2: Hotfix While Working on Feature

**Scenario**: You're working on a feature when a production bug is discovered.

```
1. User (in feature branch):
   "There's a production bug in the payment flow. I need to fix it while
    keeping my current work intact."

2. Claude:
   - Uses create_worktree with baseBranch: "main" for hotfix/payment-bug
   - Uses launch_session with clear prompt about the bug

3. New terminal opens with Claude Code in the hotfix worktree

4. User fixes bug in that terminal, tests, commits

5. User returns to original terminal to continue feature work

6. When hotfix is deployed:
   "Clean up the hotfix worktree but keep the branch."

7. Claude uses cleanup_worktree with deleteBranch: false
```

### Example 3: Team Collaboration Setup

**Scenario**: Setting up multiple worktrees for team members to review.

```
1. Team lead:
   "Set up review worktrees for Alice, Bob, and Carol to review PR branches."

2. Claude creates three worktrees:
   - Uses create_worktree for review/alice-pr-123
   - Uses create_worktree for review/bob-pr-124
   - Uses create_worktree for review/carol-pr-125

3. Worktrees are created but sessions are NOT launched (team will use their own editors)

4. Team members can cd into their assigned worktrees

5. When reviews are complete:
   "All reviews are done. Clean up all review worktrees."

6. Claude uses list_worktrees to find them, then cleanup_worktree for each
```

---

## Worktree Initialization Scripts

The server supports automatic execution of setup scripts when creating worktrees.

### How It Works

1. Create a `.worktree-init/` directory in your repository
2. Add shell scripts (`.sh` files) that will run on worktree creation
3. Scripts execute in alphabetical order
4. Scripts receive the source repository path as the first argument

### Example: Node.js Project

**`.worktree-init/01-install-deps.sh`**
```bash
#!/bin/bash
# Smart dependency installation
SOURCE_REPO="$1"
WORKTREE_DIR="$(pwd)"

echo "Setting up dependencies for worktree..."

# Symlink node_modules if available in source (fast)
if [ -d "$SOURCE_REPO/node_modules" ]; then
  echo "Symlinking node_modules from source..."
  ln -sf "$SOURCE_REPO/node_modules" "$WORKTREE_DIR/node_modules"
else
  echo "Installing dependencies..."
  npm install
fi
```

**`.worktree-init/02-setup-env.sh`**
```bash
#!/bin/bash
# Environment setup
SOURCE_REPO="$1"

# Copy environment files
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

if [ -f "$SOURCE_REPO/.env.local" ]; then
  cp "$SOURCE_REPO/.env.local" .env.local
fi
```

**`.worktree-init/03-build.sh`**
```bash
#!/bin/bash
# Build the project
echo "Running build..."
npm run build
```

### Best Practices

1. **Use numbered prefixes** - Ensures predictable execution order
2. **Make scripts executable** - The server does this automatically, but you can: `chmod +x .worktree-init/*.sh`
3. **Handle failures gracefully** - Scripts continue executing even if one fails
4. **Use the source repo argument** - Passed as `$1` to each script
5. **Test scripts** - Run them manually to verify they work: `.worktree-init/01-install-deps.sh /path/to/repo`
6. **Keep them fast** - Consider symlinking instead of copying large directories
7. **Log progress** - Use `echo` to show what's happening

---

## Troubleshooting

### Server Won't Start

**Symptom**: MCP server fails to start or Claude Code can't connect.

**Solutions**:
1. Check the path in `mcp_config.json` is absolute and correct
2. Verify Node.js version: `node --version` (needs v18+)
3. Rebuild the server: `npm run build`
4. Check Claude Code logs for error messages
5. Test server manually: `node dist/index.js`

### Terminal Windows Don't Open

**Symptom**: `launch_session` succeeds but no terminal appears.

**Solutions**:
1. Check `TERMINAL_APP` setting matches your terminal
2. Verify terminal is installed and in PATH
3. Try manual creation: Use `create_terminal` tool directly
4. Check logs with `LOG_LEVEL=debug`
5. For Warp: Ensure `warp-cli` is available: `which warp-cli`

### Worktree Creation Fails

**Symptom**: `create_worktree` returns an error.

**Solutions**:
1. Verify git version: `git --version` (needs 2.30+)
2. Check repository path is absolute and exists
3. Ensure branch name is valid (no spaces, special chars)
4. Check parent directory permissions
5. Verify repository is not bare: `git rev-parse --is-bare-repository`

### State Persistence Issues

**Symptom**: Sessions or worktrees aren't remembered between restarts.

**Solutions**:
1. Check `STATE_DIR` exists and is writable
2. Default location: `~/.claude/flux-capacitor/state`
3. Create directory manually: `mkdir -p ~/.claude/flux-capacitor/state`
4. Check disk space: `df -h`

### Init Scripts Not Running

**Symptom**: `.worktree-init/` scripts don't execute.

**Solutions**:
1. Verify scripts have `.sh` extension
2. Check scripts are in correct location: `<repo>/.worktree-init/`
3. Make scripts executable: `chmod +x .worktree-init/*.sh`
4. Test scripts manually: `.worktree-init/01-script.sh /path/to/source`
5. Check logs with `LOG_LEVEL=debug` for script output

### Session Shows as Active But Terminal Closed

**Symptom**: `get_session_status` shows `active` but terminal is closed.

**Solutions**:
1. This is normal - sessions are marked active until explicitly terminated
2. Use `cleanup_worktree` to properly terminate sessions
3. Session status updates on next status check (checks if PID is alive)
4. Clean up old sessions: Check architecture doc for cleanup utility

### Performance Issues

**Symptom**: Slow worktree creation or session launch.

**Solutions**:
1. Use `.worktree-init/` scripts to symlink instead of copy large directories
2. Check disk speed - worktrees on slow drives will be slower
3. Reduce context files passed to `launch_session`
4. Consider SSD for state directory
5. Profile with `time` command to identify bottlenecks

---

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Watch mode for development
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

### Project Structure

```
flux-capacitor-mcp/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── services/        # Core business logic
│   │   ├── state.service.ts       # State persistence
│   │   ├── git.service.ts         # Git worktree operations
│   │   ├── terminal.service.ts    # Terminal management
│   │   └── session.service.ts     # Session lifecycle
│   ├── tools/           # MCP tool implementations
│   ├── utils/           # Validators, logger, helpers
│   ├── server.ts        # MCP server setup
│   └── index.ts         # Entry point
├── tests/
│   ├── helpers/         # Test utilities
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Building

```bash
# Development build with watch
npm run dev

# Production build
npm run build

# Clean build artifacts
npm run clean
```

### Debugging

Set `LOG_LEVEL=debug` in your MCP configuration:

```json
{
  "env": {
    "LOG_LEVEL": "debug"
  }
}
```

Logs will show:
- All tool calls with parameters
- Git command execution
- Terminal creation details
- State persistence operations
- Error stack traces

### Contributing

1. Write tests for new features
2. Follow existing code style
3. Update this README for user-facing changes
4. Add TSDoc comments for public APIs
5. Run linter: `npm run lint`

---

## FAQ

### Q: Can I use this with remote repositories?

**A**: Yes, but the repository must be cloned locally. The MCP server operates on local git repositories.

### Q: What happens if Claude Code crashes in a worktree session?

**A**: The session will remain marked as "active" until you check its status (which detects the dead process) or clean up the worktree. The worktree itself remains intact with any uncommitted changes.

### Q: Can multiple sessions work in the same worktree?

**A**: Not recommended. Each worktree should have one associated session. If you need multiple sessions, create multiple worktrees.

### Q: How do I integrate this with my CI/CD pipeline?

**A**: This tool is designed for local development workflows. For CI/CD, use standard git branching and your normal CI tools. However, you could use `create_worktree` in CI to create isolated test environments.

### Q: Does this work on Linux or Windows?

**A**: Currently macOS only due to terminal application support (Warp, iTerm2, Terminal.app). Linux/Windows support could be added by implementing terminal creation for those platforms.

### Q: Can I customize the terminal command for my workflow?

**A**: Yes! Use `TERMINAL_APP=custom` and `TERMINAL_CUSTOM_COMMAND` with template variables. See [Custom Terminal Commands](#custom-terminal-commands).

### Q: How much disk space do worktrees use?

**A**: Worktrees share the `.git` directory with the source repository, so they only store working tree files. This is much more efficient than full clones. Use `.worktree-init/` scripts to symlink large directories like `node_modules`.

### Q: Can I use this without Claude Code?

**A**: Yes! All MCP tools can be called by any MCP client, not just Claude Code. You could integrate with other LLM tools that support MCP.

### Q: What's the relationship to git-worktree?

**A**: This is a wrapper around git's native `git worktree` command. It adds state management, session orchestration, and automation. You can still use `git worktree` commands directly alongside this tool.

---

## Resources

- **Flux Capacitor Plugin**: `../../../claude-code-plugins/flux-capacitor/README.md`
- **MCP Documentation**: https://modelcontextprotocol.io
- **Git Worktree Docs**: https://git-scm.com/docs/git-worktree
- **Claude Code**: https://claude.com/claude-code
- **Claude Code Plugin Reference**: https://docs.claude.com/en/docs/claude-code/plugins-reference

---

## License

MIT

---

## Support

For issues, questions, or contributions:
1. Check this README and troubleshooting section
2. Review the architecture document
3. Check Claude Code documentation
4. Open an issue with detailed logs (use `LOG_LEVEL=debug`)
