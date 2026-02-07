<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is **AppLab's Claude Code Plugins Marketplace** — a curated collection of production-ready plugins that extend Claude Code's capabilities. Each plugin provides specialized functionality through agents, slash commands, hooks, skills, and/or MCP servers.

### Core Architecture

Monorepo where each plugin is a self-contained directory:

```
claude-code-plugins/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace manifest (all 9 plugins)
├── {plugin-name}/
│   ├── .claude-plugin/
│   │   └── plugin.json          # Individual plugin manifest
│   ├── agents/                  # Subagent definitions (.md files)
│   ├── commands/                # Slash commands (.md files)
│   ├── skills/                  # Skill definitions (optional)
│   ├── hooks/                   # Hook scripts (optional, Python/uv)
│   ├── .mcp.json               # MCP server config (optional)
│   ├── README.md
│   ├── CHANGELOG.md
│   └── LICENSE
```

### Available Plugins

**Productivity:**
1. **hooks-notifier** (v2.0.0) — Audio/visual notifications when input needed or tasks complete (Python hooks)
2. **prompt-logger** (v1.3.0) — Logs user prompts and AskUserQuestion interactions to JSON (Python hooks)
3. **git-tools** (v1.3.0) — Git automation: commit messages, worktree management, branching workflows (commands + skills)
4. **agents-md** (v1.0.0) — Convert CLAUDE.md to multi-platform AI instruction files: GitHub Copilot, Gemini, OpenCode (agent + commands + skills)

**Development Specialists:**
5. **next-dev** (v1.0.0) — Next.js specialist with `next-devtools-mcp` for runtime diagnostics
6. **svelte-dev** (v1.0.0) — Svelte 5 specialist with `@sveltejs/mcp` for docs and code analysis
7. **flutter-dev** (v1.2.0) — Flutter/Dart specialist with Dart MCP server for code analysis and testing
8. **sentry-issue-fixer** (v1.0.0) — Sentry error investigation with `@modelcontextprotocol/server-sentry`

**Agent Collections:**
9. **agents** (v1.0.0) — 13 specialized agents: architecture, code review, testing, debugging, frontend, backend (Kotlin), mobile (iOS/Android), CI/CD, monitoring, refactoring, dependencies, Supabase

## Plugin Patterns

Plugins use one or more of these patterns:

### Pattern 1: Hooks (Python/uv)
Used by: `hooks-notifier`, `prompt-logger`

Hooks are defined inline in `plugin.json` and run Python scripts via `uv run`:
```json
{
  "hooks": {
    "Notification": [{
      "matcher": "",
      "hooks": [{ "type": "command", "command": "uv run ${CLAUDE_PLUGIN_ROOT}/hooks/notification.py" }]
    }]
  }
}
```

### Pattern 2: Agents + Commands + Skills (Markdown)
Used by: `git-tools`, `agents-md`, `agents`, `sentry-issue-fixer`, `flutter-dev`

Plugin manifest points to directories/files:
```json
{
  "agents": ["./agents/my-agent.md"],
  "commands": "./commands",
  "skills": "./skills"
}
```

### Pattern 3: External MCP Server
Used by: `next-dev`, `svelte-dev`, `flutter-dev`, `sentry-issue-fixer`

All MCP servers use external packages (no bundled servers):
```json
{
  "mcpServers": {
    "mcp": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

**Naming convention:** MCP servers should be named `mcp` in `.mcp.json` for consistency. Exception: `sentry-issue-fixer` uses `sentry` as the server name (requires env vars `SENTRY_AUTH_TOKEN`, `SENTRY_ORG_SLUG`).

### Plugin Manifest Structure

**`.claude-plugin/plugin.json`** — Individual plugin manifest
- Defines name, version, description, author, keywords
- Points to agents, commands, skills, hooks, mcpServers
- Must match entry in marketplace.json

**`.claude-plugin/marketplace.json`** — Root marketplace manifest
- Lists all plugins with metadata
- Used by `/plugin marketplace add` command
- Keep in sync when adding/updating plugins

## Development Workflow

### Adding a New Plugin

1. Create plugin directory with `.claude-plugin/plugin.json`
2. Add agents/commands/skills/hooks as needed
3. Add `.mcp.json` if MCP server required
4. Add entry to `.claude-plugin/marketplace.json`
5. Add README.md and CHANGELOG.md
6. Test locally with `/plugin marketplace add`

### Modifying Existing Plugins

1. Update version in plugin.json AND marketplace.json (semver)
2. Make changes to agents/commands/skills/hooks/MCP config
3. Update CHANGELOG.md
4. Test the plugin end-to-end

### Testing Plugins Locally

```bash
# Install marketplace locally
/plugin marketplace add /path/to/claude-code-plugins

# Install specific plugin
/plugin install hooks-notifier@applab-plugins

# Test slash commands
/sentry-fix https://sentry.io/...  # sentry-issue-fixer
```

## Important Constraints

1. **No package.json at root** — This is a markdown/config-only monorepo
2. **No bundled MCP servers** — All plugins use external packages via npx/dart
3. **Hook scripts use Python/uv** — Not Node.js
4. **Semver for versioning** — Both plugin.json and marketplace.json
5. **MIT License** — Standard across all plugins
6. **README.md required** — Per plugin documentation
