# Changelog

All notable changes to the Flux Capacitor plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
