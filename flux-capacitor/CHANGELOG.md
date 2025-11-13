# Changelog

All notable changes to the Flux Capacitor plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-11-13

### 🚀 Major Redesign

Complete redesign of the Flux Capacitor plugin focused on simplicity, robustness, and true parallel development.

### Added

- **Simple Script-Based Architecture**: Pure shell scripts for all orchestration (no complex MCP server required initially)
- **Tmux-Native Operation**: Automatic detection of tmux environment with graceful handling
  - Creates panes when in tmux session (fast switching)
  - Creates new detached sessions when not in tmux (works standalone)
- **Four Core Commands**:
  - `/run <task-description>` - Launch new flux-capacitor session
  - `/cleanup <task-id>` - Safely merge and cleanup session
  - `/flux-list` - List all active sessions
  - `/flux-status <task-id>` - Get detailed session status
- **Safe Merge-Back Workflow**: Comprehensive cleanup with safety checks
  - Detects uncommitted changes (prompts to commit/discard/abort)
  - Handles merge conflicts gracefully
  - Preserves worktree on conflicts for manual resolution
  - Idempotent cleanup (can retry after fixes)
- **Quality Gates Built-In**: Every session enforces
  - Ultrathink comprehensive planning
  - Intelligent subagent delegation
  - Comprehensive test coverage
  - Code review before completion
  - Security review for all changes
- **Session Management Scripts**:
  - `create-worktree.sh` - Create isolated git worktrees
  - `launch-session.sh` - Launch Claude in tmux pane/session
  - `send-prompt.sh` - Send meta prompt to new session
  - `cleanup-session.sh` - Safe merge-back and cleanup
  - `list-sessions.sh` - List active sessions
  - `session-status.sh` - Get session status and recent activity
- **Utility Libraries**:
  - `common.sh` - Logging, ID generation, helpers
  - `tmux-utils.sh` - Tmux detection and management
  - `worktree-utils.sh` - Git worktree operations
- **Meta Prompt Template**: Comprehensive instructions for flux-capacitor agent including
  - Task context and requirements
  - Mandatory quality gates
  - Subagent delegation strategy
  - Success criteria
- **Comprehensive Documentation**:
  - Detailed README with examples
  - Usage workflows and best practices
  - Troubleshooting guide
  - Technical architecture details

### Changed

- **Simplified Purpose**: Focus on parallel development orchestration, removed issue tracker integration (can be added later)
- **Single Workflow Mode**: Simple task description input (removed multiple modes complexity)
- **Session Naming**: Format changed to `flux-<project>-<task-id>` for clarity
- **Agent Behavior**: Flux-capacitor agent now focused on orchestration and quality gates, not doing all the work itself

### Removed

- MCP server dependency (for initial release - can add back for advanced features)
- Issue tracker integration (Linear, GitHub Issues, Jira) - simplified to pure development workflow
- Multiple workflow modes - single simple interface
- Terminal window management - pure tmux-based approach

### Technical Details

- **Architecture**: Script-based orchestration with shell utilities
- **Dependencies**: tmux, git 2.30+, bash 4.0+
- **Session Isolation**: Git worktrees + tmux sessions
- **Safety**: All destructive operations require confirmation and preserve state on errors
- **Portability**: Pure bash scripts work across macOS and Linux

### Migration from 1.x

Version 2.0 is a complete redesign with breaking changes:

**What's Different:**
- No issue tracker integration (use plain task descriptions)
- Simplified command structure (`/run` instead of `/flux-capacitor`)
- Tmux-based session management (no MCP server initially)
- Focus on parallel development, not project management

**Migration Path:**
1. Install version 2.0 alongside 1.x
2. Use 2.0 for new tasks
3. Complete existing 1.x tasks before removal
4. Remove 1.x when all tasks migrated

## [1.2.1] - 2025-10-23 (Legacy)

### Added
- Bundled MCP server for worktree and session management
- Linear issue tracker integration
- Multiple workflow modes (issue key, description, plain text)
- Ultrathink planning mode
- Subagent delegation recommendations

### Features (Legacy Version)
- Issue tracker integration (Linear, with GitHub/Jira planned)
- Complex feature planning and breakdown
- Git worktree creation
- Terminal window session launching
- Issue status updates and comments

---

## Version Philosophy

### 2.x Series - Simplicity & Reliability
Focus on core parallel development workflow with pure shell scripts. Rock-solid foundation.

### Future (3.x?) - Enhanced Features
Potential additions (only after 2.x proven stable):
- Optional MCP server for advanced session management
- Optional issue tracker integration (Linear, GitHub, Jira)
- Progress monitoring and notifications
- Multi-repository support
- Team collaboration features

---

**[2.0.0]**: Complete redesign for simplicity and robustness
**[1.2.1]**: Legacy version with issue tracker integration (deprecated)
