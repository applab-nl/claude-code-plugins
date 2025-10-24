# Changelog

All notable changes to the Flux Capacitor plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
