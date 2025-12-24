---
name: AI Instructions
description: This skill should be used when the user asks to "convert CLAUDE.md", "create AGENTS.md", "sync instruction files", "generate copilot instructions", "create GEMINI.md", "split instructions into platforms", or needs guidance on AI coding assistant instruction file formats (AGENTS.md, CLAUDE.md, copilot-instructions.md, GEMINI.md).
version: 1.0.0
---

# AI Instructions File Formats

Guidance for working with AI coding assistant instruction files across multiple platforms.

## Overview

The AGENTS.md standard provides a universal format for AI coding assistant instructions. Platform-specific files (CLAUDE.md, copilot-instructions.md, GEMINI.md) extend the universal base with platform-specific additions.

**Hierarchy principle**: AGENTS.md is always the leading source of truth. Platform-specific files include its content inline plus their unique additions.

## Platform File Formats

### AGENTS.md (Universal Standard)

**Location**: Repository root (can also have per-directory files)
**Format**: Markdown with natural language instructions
**Specification**: https://agents.md
**Supported by**: OpenCode (native), and as base for all other platforms

Structure:
```markdown
# AGENTS.md

Project overview and setup instructions.

## Development Guidelines

Coding standards, patterns, and conventions.

## Testing

Test commands and requirements.

## Deployment

Deployment procedures.
```

### CLAUDE.md (Claude Code)

**Location**: Repository root or `~/.claude/CLAUDE.md` for global
**Format**: Markdown
**Contains**: Claude Code-specific instructions only (when AGENTS.md exists)

Claude-specific content indicators:
- References to "Claude Code", "Claude", or "Anthropic"
- MCP (Model Context Protocol) configuration
- Claude Code tools: `Task`, `TodoWrite`, `Edit`, `Write`, `Bash`, `Grep`, `Glob`, `Read`
- Hook events: `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`, `SessionStart`
- Plugin references and slash commands
- Subagent delegation patterns

### .github/copilot-instructions.md (GitHub Copilot)

**Location**: `.github/copilot-instructions.md`
**Format**: Markdown
**Additional files**: `.github/instructions/*.instructions.md` for path-specific rules

Path-specific instruction format:
```markdown
---
applyTo: "**/*.tsx"
---

React component guidelines for TSX files.
```

### GEMINI.md (Gemini CLI)

**Location**: Repository root
**Format**: Markdown
**Additional**: `.gemini/styleguide.md` for code review customization

## Classification Keywords

### Claude-Specific Keywords

Content containing these should remain in CLAUDE.md:

**Tool references**:
- `Task tool`, `TodoWrite`, `Edit tool`, `Write tool`
- `Bash tool`, `Grep`, `Glob`, `Read tool`
- `WebFetch`, `WebSearch`, `LSP`
- `AskUserQuestion`, `EnterPlanMode`

**System references**:
- `Claude Code`, `Anthropic`
- `MCP`, `Model Context Protocol`
- `mcpServers`, `.mcp.json`
- `subagent`, `subagent_type`

**Hook references**:
- `PreToolUse`, `PostToolUse`
- `Stop`, `SubagentStop`
- `SessionStart`, `SessionEnd`
- `UserPromptSubmit`, `PreCompact`
- `hooks.json`

**Plugin references**:
- `/plugin`, `slash command`
- `plugin.json`, `.claude-plugin`
- `CLAUDE_PLUGIN_ROOT`

**Claude-specific formatting**:
- `<system-reminder>`, `<example>`
- `ultrathink`, `extended thinking`

### Generic Keywords (Go to AGENTS.md)

Content without Claude-specific keywords is generic:
- Project setup and installation
- Coding standards and conventions
- Testing commands and requirements
- Git workflow and commit guidelines
- Architecture and design patterns
- API documentation
- Deployment procedures
- Security guidelines

## Conversion Process

### Step 1: Analyze Source File

Read the existing CLAUDE.md and identify sections by scanning for Claude-specific keywords.

### Step 2: Classify Content

For each major section (identified by ## headings):
1. Scan for Claude-specific keywords
2. If found: Mark section as Claude-specific
3. If not found: Mark section as generic

### Step 3: Generate Output Files

**AGENTS.md**: Include all generic sections
**CLAUDE.md**: Include only Claude-specific sections, with header referencing AGENTS.md
**copilot-instructions.md**: AGENTS.md content + Copilot-specific header
**GEMINI.md**: AGENTS.md content + Gemini-specific header

### Step 4: Add Platform Headers

Each platform file should include a header explaining its relationship to AGENTS.md:

```markdown
# CLAUDE.md

> This file contains Claude Code-specific instructions. See AGENTS.md for universal project guidelines that apply to all AI assistants.

[Claude-specific content here]
```

## Sync Process

When AGENTS.md is updated:

1. Read current AGENTS.md content
2. Read platform-specific sections from each platform file
3. Regenerate each platform file:
   - AGENTS.md content (inline)
   - Platform-specific header
   - Platform-specific sections

## Additional Resources

### Reference Files

For detailed platform specifications:
- **`references/platform-formats.md`** - Complete format details for each platform
- **`references/keyword-lists.md`** - Full keyword classification lists

### Example Files

Working examples in `examples/`:
- **`example-agents.md`** - Sample AGENTS.md structure
- **`example-claude.md`** - Sample Claude-specific CLAUDE.md
- **`example-copilot.md`** - Sample copilot-instructions.md
