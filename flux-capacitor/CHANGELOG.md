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
- GitHub Issues integration
- Jira integration
- Git worktree creation automation
- Dedicated session launch for isolated feature development
- Enhanced state management across feature lifecycle
- Merge/rebase workflow automation
- Branch cleanup utilities
