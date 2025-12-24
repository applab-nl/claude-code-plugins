# Changelog

All notable changes to the agents-md plugin will be documented in this file.

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
