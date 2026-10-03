# Changelog

All notable changes to the agents-md plugin will be documented in this file.

## [1.1.0] - 2026-10-03

### Added

- `project-brief` skill: writes or refreshes `docs/PROJECT_OVERVIEW.md`, an LLM-oriented project overview for orienting other agents. It uses a fixed frontmatter schema and fixed sections, and takes the repository URL from `origin`. It fact-checks and migrates existing drafts, and commits only that file to the default branch. When the checkout is busy, it commits from a throwaway worktree. It handles repos without a remote.

## [1.0.0] - 2024-12-24

### Added

- Initial release of agents-md plugin
- `/convert` command - Convert CLAUDE.md to multi-platform instruction files
- `/sync` command - Regenerate platform files from AGENTS.md
- `instruction-analyzer` agent for content classification
- `ai-instructions` skill with platform format knowledge
- Support for:
  - AGENTS.md (universal standard)
  - CLAUDE.md (Claude Code)
  - .github/copilot-instructions.md (GitHub Copilot)
  - GEMINI.md (Gemini CLI)
- Keyword-based classification for Claude-specific vs generic content
- Reference documentation for all platform formats
- Example files for each platform
