# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **Claude Code Plugins Marketplace** - a curated collection of production-ready plugins that extend Claude Code's capabilities. Each plugin provides specialized functionality through agents, slash commands, hooks, and MCP (Model Context Protocol) servers.

### Core Architecture

The repository follows a **monorepo structure** where each plugin is a self-contained directory:

```
claude-code-plugins/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace manifest (all plugins)
├── {plugin-name}/
│   ├── .claude-plugin/
│   │   └── plugin.json          # Individual plugin manifest
│   ├── agents/                  # Subagent definitions (.md files)
│   ├── commands/                # Slash commands (.md files)
│   ├── skills/                  # Skill definitions (.md files)
│   ├── hooks/                   # Hook scripts (Python/shell)
│   ├── .mcp.json               # MCP server configuration
│   ├── README.md
│   ├── CHANGELOG.md
│   └── LICENSE
```

### Available Plugins

#### Development Specialists (MCP-powered)

1. **next-dev** (v1.0.0) - Next.js Development Specialist
   - Runtime diagnostics via next-devtools MCP integration
   - Automated upgrades, page testing
   - Server/Client Components expertise

2. **svelte-dev** (v1.0.0) - Svelte 5 Development Specialist
   - Documentation access, static code analysis
   - Svelte 5 runes expertise ($state, $derived, $effect, $props)

3. **flutter-dev** (v1.2.0) - Flutter/Dart Development Specialist
   - Code analysis, package management
   - Runtime introspection, testing
   - Cross-platform mobile development

4. **sentry-issue-fixer** (v1.0.0) - Automated Sentry Error Investigation
   - Fetches errors from Sentry
   - Analyzes iOS/Android device logs
   - Proposes comprehensive fixes

#### Productivity Tools

5. **git-tools** (v1.3.0) - Git Automation Tools
   - Intelligent commit message generation
   - Git worktree management for isolated development
   - Streamlined Git workflows

6. **hooks-notifier** (v2.0.0) - Audio & Visual Notifications
   - Alerts when input is required
   - Notifications when tasks complete
   - macOS native integration

7. **prompt-logger** (v1.3.0) - Prompt Logging & Analytics
   - Logs user prompts to JSON files
   - Tracks AskUserQuestion interactions
   - Useful for analysis and review

8. **agents-md** (v1.0.0) - AI Instruction Converter
   - Convert CLAUDE.md to multi-platform formats
   - Supports GitHub Copilot, Gemini CLI, OpenCode
   - AGENTS.md standard compliance

#### Agent Collections

9. **agents** (v1.0.0) - 13 Specialized Development Agents
   - Architecture, frontend, backend specialists
   - Mobile debugging (iOS/Android)
   - Testing, CI/CD, refactoring
   - Code review, dependency auditing

## Plugin Development

### MCP Server Configuration

Pattern for `.mcp.json` using external packages:

```json
{
  "mcpServers": {
    "mcp": {
      "command": "npx",
      "args": ["-y", "package-name@latest"]
    }
  }
}
```

### Plugin Manifest Structure

**`.claude-plugin/plugin.json`** - Individual plugin manifest
- Defines name, version, description
- Points to agents, commands, hooks, mcpServers
- Must match entry in marketplace.json

**`.claude-plugin/marketplace.json`** - Root marketplace manifest
- Lists all plugins with metadata
- Used by `/plugin marketplace add` command
- Keep in sync when adding/updating plugins

### Naming Convention

All MCP servers should be named **`mcp`** in their respective `.mcp.json` files for consistency and brevity. This is standardized across all plugins.

## Development Workflow

### Adding a New Plugin

1. Create plugin directory structure
2. Write plugin.json manifest
3. Create agents/commands/hooks as needed
4. Add MCP server if required
5. Update marketplace.json
6. Test locally
7. Update README.md
8. Add CHANGELOG.md entry

### Modifying Existing Plugins

1. Update version in plugin.json and marketplace.json (follow semver)
2. Make changes to agents/commands/hooks/MCP server
3. Update CHANGELOG.md
4. Test the plugin end-to-end
5. Commit with descriptive message

### Testing Plugins Locally

```bash
# Install marketplace locally
/plugin marketplace add /path/to/claude-code-plugins

# Install specific plugin
/plugin install git-tools@applab-plugins

# Test slash commands
/sentry-fix https://sentry.io/...  # sentry-issue-fixer
/sync-instructions                  # agents-md
```

## Key Technical Details

### Agent Files (.md)

Agents are markdown files containing:
- Extended system prompt/instructions
- Agent-specific tools/capabilities
- Usage guidelines and examples
- Proactive behavior instructions

Example path: `sentry-issue-fixer/agents/sentry-issue-fixer.md`

### Command Files (.md)

Slash commands are markdown files that:
- Expand to full prompts when invoked
- Can accept arguments
- Are listed via `/help` when plugin enabled

Example: `/sentry-fix` → `sentry-issue-fixer/commands/sentry-fix.md`

### Hook Scripts

Hooks are event-driven scripts that run on specific triggers:
- `UserPromptSubmit` - When user submits a prompt
- `Notification` - When Claude requests user attention
- `Stop` / `SubagentStop` - When processing completes

Example: `hooks-notifier/hooks/notification.py`

### Distribution Strategy

- Plugins are distributed via GitHub
- Users install via `/plugin` commands
- No separate npm install required for end users
- Hooks use `uv run` for Python dependency management

## Git Workflow

- Main branch: `main`
- Commit messages should be descriptive (no Claude attribution)
- Test changes locally before pushing
- Use branches for significant features
- Keep commits atomic and focused

## Important Constraints

1. **No package.json at root** - Each plugin manages its own dependencies
2. **Semver for versioning** - Both plugin.json and marketplace.json
3. **MIT License** - Standard across all plugins
4. **Comprehensive documentation** - README.md required per plugin
5. **Hook scripts use uv** - For consistent Python dependency management
