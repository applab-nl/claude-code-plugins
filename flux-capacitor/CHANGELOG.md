# Changelog

All notable changes to the Flux Capacitor plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-06

### BREAKING CHANGES - Architecture Redesign

Complete separation of infrastructure from planning concerns.

**New Flow:**
```
User → /run command → creates worktree → launches tmux → flux-capacitor agent
        (infrastructure)   (<3 seconds)    (in worktree)   (planning only)
```

### Changed

- **BREAKING**: `/run` command now handles infrastructure directly
  - Parses arguments immediately (issue key or description)
  - Generates branch name deterministically
  - Creates worktree and launches tmux session atomically
  - Passes augmented prompt to new Claude instance
  - Single-shot execution with minimal LLM involvement

- **BREAKING**: flux-capacitor agent simplified to focus purely on planning
  - Removed all infrastructure code (300+ lines)
  - Assumes already running in isolated worktree
  - Focuses on issue tracking and planning only
  - No longer handles worktree creation or tmux management

### Benefits

- **10x faster workflow**: <3s to get into worktree (vs 30s+ before)
- **Cleaner separation**: Command handles infra, agent handles planning
- **More reliable**: Fewer failure points, atomic operations
- **Better UX**: Immediate feedback, faster iterations
- **Critical safety**: Tmux `-c "$worktree_path"` ensures complete isolation

### What Agent Does Now

- ✓ Issue tracker integration (Linear/GitHub/Jira)
- ✓ Ultrathink planning mode with comprehensive breakdowns
- ✓ Subagent delegation strategy
- ✓ Implementation guidance throughout feature lifecycle

### What Agent Does NOT Do

- ✗ Worktree creation (handled by `/run` command)
- ✗ Tmux session management (handled by flux script)
- ✗ Infrastructure concerns (all pre-handled)

### Migration Guide

**For Users:**
1. No changes needed - just use `/run MEM-123` or `/run Add OAuth`
2. Command handles all infrastructure automatically
3. Agent focuses on planning and guidance
4. Workflow is now 10x faster

**For Developers:**
- `/run` command uses `! ` syntax for immediate context gathering
- Command calls flux script directly for atomic operations
- Agent receives pre-parsed input mode and context
- Agent prompt includes mode, input, branch, worktree path

### Technical Details

- **Worktree isolation**: Tmux launches with `-c "$worktree_path"` flag
- **Prompt delivery**: Created at `$worktree_path/.claude/prompt.md`
- **Zero spillover**: Everything executes in the new worktree
- **Atomic operations**: Single flux script call creates worktree + launches session
- **Branch naming**: `feature/{issue-key}` or `feature/{sanitized-description}`

## [1.4.0] - 2025-01-06

### Changed
- **BREAKING**: Completely removed MCP server architecture
- **BREAKING**: Replaced MCP tools with standalone `flux` CLI script
- Agent now uses direct bash script execution instead of MCP tool calls
- Session management via `${CLAUDE_PLUGIN_ROOT}/scripts/flux` commands

### Added
- Standalone `flux` CLI script with comprehensive commands
  - `flux launch <repo> <branch> <prompt> [agent]` - Atomic worktree + session creation
  - `flux list` - List all active sessions
  - `flux status <session-id>` - Check session status with output capture
  - `flux attach <session-id>` - Attach to running tmux session
  - `flux cleanup <session-id>` - Clean up worktree and session
- Session state management via JSON file (~/.flux-capacitor/sessions.json)
- Native tmux integration (no external dependencies)
- Performance improvement: < 3 seconds for full launch vs 30+ seconds with MCP

### Removed
- **BREAKING**: Entire MCP server (mcp-server/ directory)
- `.mcp.json` configuration file
- Node.js dependency for session management
- TypeScript build step for session orchestration

### Migration Guide

**For Users:**
1. Ensure `tmux` is installed (built-in on macOS, `apt install tmux` on Linux)
2. Update to flux-capacitor v1.4.0: `/plugin update flux-capacitor`
3. No MCP server configuration needed - flux CLI works immediately
4. Old sessions (if any) can be cleaned: `${CLAUDE_PLUGIN_ROOT}/scripts/flux list`

**For Developers:**
- Use `${CLAUDE_PLUGIN_ROOT}/scripts/flux` for all session operations
- No MCP tool calls - direct bash execution only
- Session state at ~/.flux-capacitor/sessions.json
- Scripts use jq for JSON manipulation

## [2.0.0] - 2025-01-02

### Breaking Changes
- **MIGRATION TO TMUX**: Complete architectural change from terminal-based to tmux-based session management
  - Sessions now tracked via tmux pane IDs (e.g., `remote-cli-session:0.2`) instead of terminal PIDs
  - Requires `tmux-cli` to be installed: `uv tool install claude-code-tools`
  - No longer supports terminal app selection (Warp, iTerm2, Terminal.app)
  - Existing sessions from v1.x will be marked as terminated (tmux-cli cannot manage legacy terminal sessions)

### Added
- **Tmux-Based Session Management**: Faster and more robust session orchestration
  - 4-6x faster session creation (~500ms vs ~2-3s for terminal windows)
  - Sessions run in tmux panes instead of separate terminal windows
  - Can capture output from active sessions in real-time
  - Can wait for sessions to become idle before sending commands
  - Can attach to sessions for live monitoring: `tmux-cli attach`
- **Enhanced Session Status**: `get_session_status` now captures recent output (last 50 lines)
- **New tmux.service.ts**: Comprehensive wrapper around tmux-cli commands
  - `launch()` - Create new pane
  - `send()` - Send input to pane
  - `capture()` - Get output from pane
  - `waitIdle()` - Wait for pane to become idle
  - `kill()` - Terminate pane
  - `paneExists()` - Check if pane is alive

### Changed
- `launch_session` tool now uses tmux panes instead of spawning terminal windows
- `get_session_status` tool now includes recent output from sessions
- `cleanup_worktree` tool now kills tmux panes instead of terminal processes
- Session type now uses `tmuxPaneId: string` instead of `terminalPid: number`
- MCP server version updated to 2.0.0
- Plugin version updated to 2.0.0
- Session launch workflow:
  1. Launch zsh in tmux pane
  2. Change directory to worktree
  3. Start Claude Code
  4. Wait for prompt
  5. Send implementation plan

### Removed
- Terminal app configuration (Warp, iTerm2, Terminal.app support)
- `terminalApp` parameter from `launch_session` tool
- `create_terminal` tool (no longer needed with tmux)
- `TERMINAL_APP` environment variable

### Deprecated
- `terminal.service.ts` (kept for reference as `.old.ts`)
- PID validation functions (no longer needed with tmux pane IDs)

### Technical Details
- Session state storage now uses tmux pane IDs for tracking
- Prompt files still used to avoid shell escaping issues
- All terminal-specific code removed from codebase
- Comprehensive end-to-end test suite created (`test-workflow.sh`)
- Full migration documentation in `MIGRATION_SUMMARY.md`

### Migration Guide
For users upgrading from v1.x to v2.0:
1. Install tmux-cli: `uv tool install claude-code-tools`
2. Update plugin: `/plugin update flux-capacitor@applab-plugins`
3. Existing v1.x sessions cannot be managed by v2.0 (different tracking mechanism)
4. New sessions will automatically use tmux panes
5. Enjoy 4-6x faster session creation!

## [1.2.3] - 2025-10-24

### Fixed
- **CRITICAL: Shell Script Escaping**: Fixed shell syntax errors when launching sessions with complex prompts
  - Prompts containing unbalanced quotes, apostrophes, or special characters no longer break launch scripts
  - Changed from inline bash here-documents to piping prompt files directly via stdin
  - Eliminates nested shell escaping issues that caused "unexpected EOF" and syntax errors
  - Affects all terminal backends: Warp, iTerm2, and Terminal.app
  - Launch scripts now use `cat "prompt-file" | claude` instead of embedding prompt content
  - Prevents shell metacharacter interpretation in user-provided prompts

### Technical Details
- Modified `session.service.ts` to pass prompt file path as object instead of string command
- Updated `terminal.service.ts` to handle `{ type: 'prompt-file', promptFile: string }` command format
- All terminal implementations (Warp, iTerm2, Terminal.app) now support prompt-file mode
- Type definitions updated to support both string and prompt-file command formats

## [1.2.2] - 2025-10-24

### Fixed
- **CRITICAL: Process Termination Safety**: Fixed catastrophic bug in cleanup_worktree that could kill system-wide processes
  - Added comprehensive PID validation before ALL signal operations
  - Invalid PIDs (0, -1, negative values) now rejected to prevent system-wide process termination
  - PID validation in `isValidPid()` checks for: number type, not NaN, integer, finite, and > 0
  - Protected `terminateProcess()`, `isProcessAlive()`, and session termination methods
  - Added safety checks in cleanup loop to detect and handle corrupted session state
  - Invalid PIDs in stored sessions now marked as 'failed' instead of attempting termination
  - Prevents Unix signal broadcast behaviors:
    - `pid=0`: Would signal all processes in current process group
    - `pid=-1`: Would signal all processes user owns
    - `pid<-1`: Would signal specific process group
  - Added detailed error logging for invalid PID detection

### Security
- Prevents potential catastrophic failures where cleanup_worktree could inadvertently kill Claude Code itself and all related processes
- Validates PIDs at multiple layers: storage, retrieval, and before ANY process.kill() operation
- Protects against corrupted state files containing invalid PIDs

## [1.2.1] - 2025-10-23

### Fixed
- **MCP Server Bundling**: Properly bundle all dependencies using tsup for zero-configuration installation
  - MCP server now uses CommonJS format for better Node.js compatibility
  - All dependencies bundled into single ~920KB file (previously missing from distribution)
  - Eliminates "Cannot find package '@modelcontextprotocol/sdk'" error
  - No `npm install` required in plugin directory
  - Cross-platform compatibility ensured

### Changed
- Build system migrated from TypeScript compiler to tsup bundler
- Output format changed from ESM to CJS for improved compatibility with dynamic requires
- MCP server executable now `dist/index.cjs` (previously `dist/index.js`)

## [1.2.0] - 2025-10-23

### Added
- **Bundled MCP Server**: flux-capacitor-mcp is now included with the plugin and starts automatically
  - Zero-configuration workspace orchestration
  - No separate installation or setup required
  - Automatic git worktree creation
  - Dedicated Claude Code session launching
  - Enabled immediately upon plugin installation

### Changed
- Renamed command from `flux-capacitor` to `run` for brevity and improved UX
  - Command invocation: `/run` or `/flux-capacitor:run` (instead of `/flux-capacitor:flux-capacitor`)
  - Follows common CLI conventions (npm run, cargo run, docker run)
  - Maintains semantic clarity while reducing typing overhead
- Updated all documentation and examples to reflect bundled MCP server
- Simplified requirements: only Node.js 18+ needed (MCP server auto-starts)
- Removed manual MCP server installation instructions (no longer needed)

## [1.1.0] - 2025-10-23

### Added
- Workspace orchestration via flux-capacitor-mcp MCP server
  - Git worktree creation for isolated development environments
  - Dedicated Claude Code session launching in new terminal windows
  - Parallel feature development support
  - Automatic initialization script execution
  - Session lifecycle management (create, check status, cleanup)

### Changed
- Enhanced workflow with automated worktree and session management
- Improved user experience with parallel development capabilities

## [1.0.0] - 2025-10-14

### Added
- Initial release of Flux Capacitor plugin
- Multi-mode workflow support (Issue Key, Description with Tracker, Plain Description)
- Linear integration for issue tracking
  - Fetch issue details by key
  - Search for similar issues
  - Create new issues
  - Update issue status and assignment
  - Add comments with implementation plans
- Ultrathink planning mode for comprehensive feature planning
- Subagent delegation strategy recommendations
- Implementation plan generation with:
  - Technical approach
  - Detailed step-by-step breakdown
  - Success criteria
  - Testing plan
  - Effort estimation
- Slash command `/flux-capacitor` for easy invocation
- Comprehensive documentation and examples
- MIT License

### Features
- Automatic MCP server detection for issue trackers
- Fuzzy matching for similar issues (70%+ confidence)
- User approval workflow before plan execution
- Clear next steps and guidance after plan approval
- Support for issue key patterns (e.g., MEM-123, PROJ-456)
- Context-aware feature description parsing

## [Unreleased]

### Planned
- GitHub Issues integration (coming Q1 2026)
- Jira integration (coming Q1 2026)
- Enhanced merge/rebase workflow automation
- Multi-repository support
- Analytics and metrics dashboard

## [1.1.0] - 2025-10-17

### Added
- **Workspace Orchestrator Integration**: Full integration with flux-capacitor-mcp MCP server
  - Automated git worktree creation for isolated feature development
  - Dedicated Claude Code session launching in new terminal windows
  - Session lifecycle management and status tracking
  - Worktree cleanup and branch management automation
- **Parallel Development Support**: Work on multiple features simultaneously in isolated worktrees
- **Graceful Fallback**: Automatic detection of flux-capacitor-mcp availability with manual instructions fallback
- **Enhanced User Feedback**: Clear progress indicators for worktree creation and session launching
- **Session Status Commands**: Check status of running feature development sessions
- **Complete Lifecycle Orchestration**: From issue fetch → plan → worktree → session → cleanup

### Changed
- Execution flow now includes worktree creation and session launching when flux-capacitor-mcp is available
- Example workflows updated to demonstrate full automated workflow
- Documentation expanded with flux-capacitor-mcp setup instructions
- Agent responsibilities updated to include worktree and session management

### Improved
- User experience with automated environment setup
- Development workflow isolation and parallel feature development
- Documentation with comprehensive examples and troubleshooting
