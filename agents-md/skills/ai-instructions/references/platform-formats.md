# Platform Format Reference

Comprehensive documentation for each AI coding assistant instruction file format.

## AGENTS.md Specification

### Official Standard

AGENTS.md is the emerging standard for AI coding agent instructions, backed by the Linux Foundation's Agentic AI Foundation (AAIF).

**Key contributors**: OpenAI, Anthropic, Google, Amazon, Microsoft, Cloudflare, Bloomberg

**Adoption**: 20,000+ GitHub repositories

### File Location

Primary location:
```
project-root/
└── AGENTS.md
```

Per-directory instructions (override parent):
```
project-root/
├── AGENTS.md           # Root instructions
├── packages/
│   ├── api/
│   │   └── AGENTS.md   # API-specific instructions
│   └── frontend/
│       └── AGENTS.md   # Frontend-specific instructions
```

**Resolution**: Agents read the nearest AGENTS.md in the directory tree. Closer files take precedence.

### Recommended Structure

```markdown
# AGENTS.md

Brief project description.

## Project Overview

- Technology stack
- Architecture summary
- Key directories

## Setup

Installation and environment setup commands.

## Development

### Coding Standards

- Style guidelines
- Naming conventions
- File organization

### Patterns

Common patterns used in this project.

## Testing

```bash
# Run tests
npm test
```

## Building

```bash
# Build project
npm run build
```

## Deployment

Deployment procedures and requirements.

## Security

Security considerations and guidelines.

## Git Workflow

Commit message format, branching strategy.
```

### Best Practices

1. **Be specific**: Include actual commands, not generic descriptions
2. **Keep updated**: Treat as living documentation
3. **Per-directory specifics**: Use nested AGENTS.md for subprojects
4. **No secrets**: Never include API keys, passwords, or credentials

---

## CLAUDE.md Format

### File Locations

**Project-specific**:
```
project-root/
└── CLAUDE.md
```

**User global** (applies to all projects):
```
~/.claude/CLAUDE.md
```

### Claude-Specific Capabilities

Claude Code has unique capabilities that other assistants don't support:

**Tool System**:
- `Task` - Launch subagents for complex tasks
- `TodoWrite` - Track progress with todos
- `Edit` / `Write` - File operations
- `Bash` - Shell command execution
- `Grep` / `Glob` - Code search
- `Read` - File reading
- `WebFetch` / `WebSearch` - Web access
- `LSP` - Language server protocol
- `AskUserQuestion` - Interactive queries

**Subagent System**:
- `subagent_type` parameter for specialized agents
- Parallel task execution
- Background processing

**Hook System**:
- `PreToolUse` - Before tool execution
- `PostToolUse` - After tool execution
- `Stop` - Session completion
- `SubagentStop` - Subagent completion
- `SessionStart` / `SessionEnd` - Session lifecycle
- `UserPromptSubmit` - User input processing
- `PreCompact` - Before context compaction

**MCP Integration**:
- Model Context Protocol servers
- External tool integration
- Custom server configuration

### Structure with AGENTS.md

When AGENTS.md exists, CLAUDE.md should contain ONLY Claude-specific additions:

```markdown
# CLAUDE.md

> See AGENTS.md for universal project guidelines.

## Claude Code Specific

### MCP Configuration

This project uses the following MCP servers:
- `database` - PostgreSQL access
- `api` - External API integration

### Subagent Delegation

When implementing features:
- Use `flutter-specialist` for mobile code
- Use `test-engineer` for comprehensive testing

### Tool Preferences

- Prefer `Edit` over `Write` for existing files
- Use `TodoWrite` to track multi-step tasks
- Run `npm test` after code changes

### Hooks

Pre-commit hooks validate code style.
```

---

## GitHub Copilot Format

### File Locations

**Repository-wide**:
```
.github/
└── copilot-instructions.md
```

**Path-specific** (with YAML frontmatter):
```
.github/
└── instructions/
    ├── react-components.instructions.md
    ├── api-routes.instructions.md
    └── tests.instructions.md
```

### Repository-Wide Format

```markdown
# Copilot Instructions

Project-specific guidelines for GitHub Copilot.

## Project Overview

[Include AGENTS.md content here]

## Copilot-Specific Guidelines

### Code Generation Preferences

- Prefer functional components over class components
- Use TypeScript strict mode
- Include JSDoc comments for public APIs

### File Patterns

When generating code for this project, follow these patterns...
```

### Path-Specific Format

Use YAML frontmatter with `applyTo` glob pattern:

```markdown
---
applyTo: "src/components/**/*.tsx"
---

# React Component Guidelines

- Use functional components with hooks
- Props interface should be named `{ComponentName}Props`
- Export components as named exports
- Include displayName for debugging
```

```markdown
---
applyTo: "src/api/**/*.ts"
---

# API Route Guidelines

- Use Zod for input validation
- Return consistent error formats
- Include rate limiting headers
```

### Multiple Patterns

```markdown
---
applyTo: "**/*.test.ts,**/*.spec.ts"
---

# Test File Guidelines

- Use describe/it pattern
- Mock external dependencies
- Test edge cases
```

---

## GEMINI.md Format

### File Locations

**Context file** (Gemini CLI):
```
project-root/
└── GEMINI.md
```

**Style guide** (Code review):
```
.gemini/
└── styleguide.md
```

### GEMINI.md Structure

```markdown
# GEMINI.md

Context for Gemini CLI agent mode.

## Project Overview

[Include AGENTS.md content here]

## Gemini-Specific

### Agent Mode Preferences

- Use agentic chat for complex tasks
- Prefer incremental changes
- Validate changes before applying
```

### styleguide.md Structure

For GitHub code review integration:

```markdown
# Code Review Style Guide

## General Principles

- Focus on correctness and security
- Suggest performance improvements
- Flag potential bugs

## Language-Specific

### TypeScript

- Require explicit return types
- No `any` types
- Prefer `const` over `let`

### Python

- Follow PEP 8
- Use type hints
- Docstrings for public functions
```

---

## OpenCode Format

OpenCode uses AGENTS.md natively - no separate file needed.

### Configuration

OpenCode can be configured to read additional instruction files via `opencode.json`:

```json
{
  "instructions": [
    "AGENTS.md",
    "docs/coding-standards.md"
  ]
}
```

### Custom Commands

OpenCode supports custom commands in `.opencode/commands/`:

```
.opencode/
└── commands/
    └── review.md
```

---

## Cross-Platform Compatibility

### Content That Works Everywhere

- Project setup instructions
- Coding standards
- Testing commands
- Git workflow
- Architecture docs
- Security guidelines

### Content That's Platform-Specific

| Content Type | Claude | Copilot | Gemini | OpenCode |
|--------------|--------|---------|--------|----------|
| MCP servers | Yes | No | No | No |
| Hooks | Yes | No | No | No |
| Subagents | Yes | No | No | Partial |
| Path rules | No | Yes | No | No |
| Code review | Partial | Partial | Yes | No |
| Tool preferences | Yes | No | Partial | Partial |
