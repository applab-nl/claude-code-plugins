# agents-md

Convert your existing `CLAUDE.md` into a multi-platform AI instruction structure following the [AGENTS.md standard](https://agents.md).

## The Problem

Different AI coding assistants use different instruction file formats:
- **Claude Code**: `CLAUDE.md`
- **GitHub Copilot**: `.github/copilot-instructions.md`
- **Gemini CLI**: `GEMINI.md`
- **OpenCode**: `AGENTS.md`

Maintaining separate files with overlapping content is tedious and error-prone.

## The Solution

This plugin converts your `CLAUDE.md` into a hierarchical structure where:

1. **`AGENTS.md`** - Universal instructions (the source of truth)
2. **`CLAUDE.md`** - Claude Code-specific additions only
3. **`.github/copilot-instructions.md`** - GitHub Copilot version
4. **`GEMINI.md`** - Gemini CLI version

**AGENTS.md is always leading** - all platform-specific files include its content inline plus their unique additions.

## Installation

```bash
/plugin install agents-md
```

## Usage

### Convert existing CLAUDE.md

```bash
/agents-md:convert
```

This will:
1. Analyze your existing `CLAUDE.md`
2. Classify content as generic vs Claude-specific (using keyword detection)
3. Create `AGENTS.md` with generic instructions
4. Update `CLAUDE.md` to contain only Claude-specific additions
5. Generate `.github/copilot-instructions.md` and `GEMINI.md`

### Sync changes

After editing `AGENTS.md`, regenerate all platform files:

```bash
/agents-md:sync
```

## File Structure After Conversion

```
your-project/
├── AGENTS.md                          # Universal (leading)
├── CLAUDE.md                          # Claude-specific only
├── GEMINI.md                          # Gemini CLI
└── .github/
    └── copilot-instructions.md        # GitHub Copilot
```

## Classification Logic

Content is classified as **Claude-specific** if it contains:
- References to "Claude Code", "Claude", or Anthropic
- MCP (Model Context Protocol) configuration
- Claude Code tools: `Task`, `TodoWrite`, `Edit`, `Write`, etc.
- Hooks: `PreToolUse`, `PostToolUse`, `Stop`, etc.
- Plugin references
- Claude-specific formatting instructions

Everything else is considered **generic** and goes to `AGENTS.md`.

## Configuration

Create `.claude/agents-md.local.md` to customize:

```yaml
---
platforms:
  - agents-md     # Always generated
  - claude        # Claude Code
  - copilot       # GitHub Copilot
  - gemini        # Gemini CLI
additional_claude_keywords:
  - "custom-keyword"
  - "my-specific-tool"
---
```

## Platform Support

| Platform | File | Status |
|----------|------|--------|
| [AGENTS.md](https://agents.md) | `AGENTS.md` | Supported |
| Claude Code | `CLAUDE.md` | Supported |
| GitHub Copilot | `.github/copilot-instructions.md` | Supported |
| Gemini CLI | `GEMINI.md` | Supported |
| OpenCode | Uses `AGENTS.md` | Automatic |

## License

MIT
