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
│   └── marketplace.json          # Marketplace manifest (all plugins)
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
- **hooks-notifier** (v2.1.0) — Audio and visual notifications for Claude Code
- **prompt-logger** (v1.3.0) — Logs user prompts and AskUserQuestion interactions to .claude/logs/prompts.json at project root for analysis and review
- **git-tools** (v1.3.0) — Comprehensive Git automation tools
- **agents-md** (v1.1.0) — Convert CLAUDE.md to multi-platform AI instruction files following the AGENTS.md standard
- **linear** (v1.1.1) — Start and shepherd work on a Linear ticket end-to-end
- **ship-it** (v1.3.0) — End-of-session shipping workflow
- **backlog** (v1.3.0) — Provider-agnostic backlog automation
- **status-report** (v2.0.0) — Audit every piece of outstanding work
- **cache-tax** (v2.2.1) — Keeps the one-hour prompt cache warm during breaks (/keepwarm), stops a cold send once with its estimated rewrite cost, and tracks cold writes
- **claude-reflect** (v3.3.1) — Self-learning for Claude Code: captures your corrections and "remember:" notes as you work, then /reflect reviews them and writes the approved ones to CLAUDE.md, rules and auto-memory
- **roadmap-status-mod** (v1.1.0) — Live sidebar pane showing which phase or slice of a plan you are in and how far along it is
- **branch-status-mod** (v1.0.0) — Pane listing the branches and worktrees that run parallel to main

**Debugging:**
- **sentry-issue-fixer** (v1.0.0) — Automated Sentry error investigation and resolution

**Development:**
- **next-dev** (v1.0.0) — Next.js development specialist with integrated next-devtools MCP server for runtime diagnostics, automated upgrades, page testing, and comprehensive documentation access
- **svelte-dev** (v1.0.0) — Svelte 5 development specialist with integrated MCP server for documentation access, static code analysis, and comprehensive runes expertise ($state, $derived, $effect, $props)
- **flutter-dev** (v1.2.0) — Flutter and Dart development specialist with integrated MCP server for code analysis, package management, testing, runtime introspection, and cross-platform mobile development
- **agents** (v1.0.0) — Curated collection of 13 specialized agents for comprehensive development workflows across frontend, backend, mobile, testing, debugging, architecture, and DevOps
- **android-dev** (v1.0.0) — Android device testing over adb: device selection, reconnect-safe log capture, UI driving, ANR/crash diagnosis, APK symbol checks and Android Auto Desktop Head Unit sessions
- **terminal-browser** (v0.0.2) — Renders a terminal browser inside Claude Code's pane to preview sites and HTML documents, with an optional open/close tool for the agent

**Security:**
- **repo-audit** (v1.0.0) — Security audit for cloned repositories

**Documentation:**
- **diagram-images** (v1.0.1) — Render Mermaid diagrams in markdown to SVG/PNG with one shared hand-drawn theme and a drift linter

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
