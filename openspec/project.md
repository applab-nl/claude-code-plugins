# Project Context

## Purpose

**Claude Code Plugins Marketplace** - A curated collection of production-ready plugins that extend Claude Code's capabilities. The repository serves as both:
1. A **plugin marketplace** for end users to discover and install plugins
2. A **plugin development reference** demonstrating best practices for building Claude Code plugins

Goals:
- Provide high-quality, production-ready plugins for common development workflows
- Establish patterns and conventions for Claude Code plugin development
- Enable specialized AI-assisted development across multiple tech stacks (Flutter, Next.js, Svelte, etc.)

## Tech Stack

### Plugin Components
- **Markdown (.md)** - Agent definitions, slash commands, skills
- **Python (3.8+)** - Hook scripts (using `uv run --script` for dependency management)
- **JSON** - Plugin manifests (`plugin.json`), MCP configs (`.mcp.json`), marketplace manifest
- **TypeScript/Node.js** - Custom MCP servers (when bundled, e.g., flux-capacitor pattern)

### Build Tools (for MCP servers with custom code)
- **tsup** - TypeScript bundling with full dependency bundling (`noExternal: [/.*/]`)
- **npm** - Package management for MCP server dependencies

### MCP Server Patterns
- **Bundled servers**: Node.js executables with all dependencies bundled (e.g., `mcp-server/dist/index.cjs`)
- **External packages**: npx-based servers using published npm packages (e.g., `npx -y next-devtools-mcp@latest`)

## Project Conventions

### Code Style

**Markdown files (agents/commands/skills):**
- YAML frontmatter for metadata (name, description, tools, model, color, icon)
- Clear section headers using `##`
- Actionable instructions using imperative mood
- Example usage patterns with code blocks

**Python hooks:**
- Shebang: `#!/usr/bin/env -S uv run --script`
- PEP 723 inline script metadata for dependencies
- Type hints where practical
- Docstrings for modules and functions

**JSON manifests:**
- 2-space indentation
- camelCase for keys (following Claude Code schema conventions)
- Semantic versioning (semver)

**Naming conventions:**
- Plugin directories: `kebab-case` (e.g., `flutter-dev`, `git-tools`)
- Agent files: `kebab-case.md` (e.g., `code-reviewer.md`)
- MCP servers: Always named `mcp` in `.mcp.json` for consistency

### Architecture Patterns

**Monorepo Structure:**
```
claude-code-plugins/
├── .claude-plugin/marketplace.json   # Root marketplace manifest
├── {plugin-name}/
│   ├── .claude-plugin/plugin.json   # Plugin manifest
│   ├── agents/                       # Subagent definitions
│   ├── commands/                     # Slash commands
│   ├── hooks/                        # Event hooks (Python)
│   ├── skills/                       # Skills (if applicable)
│   ├── .mcp.json                    # MCP server config
│   ├── mcp-server/                  # Custom MCP server (optional)
│   ├── README.md
│   ├── CHANGELOG.md
│   └── LICENSE
```

**Plugin Types:**
1. **Agent-only plugins** - Collection of specialized subagents (e.g., `agents/`)
2. **Command-only plugins** - Slash commands for workflows (e.g., `git-tools/`)
3. **Hook plugins** - Event-driven automation (e.g., `prompt-logger/`, `hooks-notifier/`)
4. **MCP-integrated plugins** - External tooling integration (e.g., `flutter-dev/`, `next-dev/`)
5. **Full-featured plugins** - Agents + commands + MCP servers combined

**MCP Server Design:**
- Bundled servers MUST include ALL dependencies (no `node_modules` in distribution)
- Use `noExternal: [/.*/]` in tsup config
- Prefer external npm packages when available to reduce maintenance

### Testing Strategy

**Proposed approach (plugin validation):**

1. **Schema Validation**
   - Validate `plugin.json` against Claude Code plugin schema
   - Validate `marketplace.json` structure and version consistency
   - Ensure all referenced files exist (agents, commands, MCP configs)

2. **Hook Script Validation**
   - Syntax validation: `python -m py_compile {script}`
   - Dependency check: Verify `uv run` can resolve inline dependencies
   - Basic smoke tests: Run hooks with sample input

3. **MCP Server Validation** (for bundled servers)
   - Bundle verification: `node -e "require('./dist/index.cjs')"`
   - Tool listing: Verify MCP protocol handshake works

4. **Manual Integration Testing**
   - Install plugin via `/plugin install`
   - Test key commands and agent invocations
   - Verify MCP tools appear in Claude Code

**Validation commands (recommended):**
```bash
# Validate Python hooks
python -m py_compile hooks/*.py

# Verify MCP bundle loads
cd mcp-server && npm run bundle:verify

# Check JSON validity
jq empty .claude-plugin/plugin.json
```

### Git Workflow

**Branching:**
- Main branch: `main`
- Feature branches for significant changes
- Direct commits to main acceptable for minor fixes/docs

**Commit conventions:**
- Descriptive commit messages explaining the "why"
- No Claude attribution or co-author mentions
- Emoji prefixes optional but accepted (e.g., ✨ for features, 🐛 for fixes)

**Version management:**
- Semantic versioning (MAJOR.MINOR.PATCH)
- Update both `plugin.json` and `marketplace.json` in sync
- Update CHANGELOG.md for each release

## Domain Context

### Claude Code Plugin System

**Agents** are markdown files containing extended system prompts that define specialized AI assistants. They include:
- Frontmatter metadata (name, description, tools, model, color, icon)
- System instructions and behavioral guidelines
- Domain-specific knowledge and checklists

**Commands** are slash-invoked prompts that expand to full instructions when users type `/{command-name}`.

**Hooks** are Python scripts triggered by Claude Code events:
- `UserPromptSubmit` - When user submits a prompt
- `PreToolUse` / `PostToolUse` - Before/after tool execution
- `Stop` - When Claude completes a response

**MCP (Model Context Protocol)** servers expose external tools to Claude Code:
- Defined in `.mcp.json` per plugin
- Can be bundled Node.js servers or external npm packages
- Tools appear in Claude's available tool set when plugin is enabled

### Plugin Distribution

Users install plugins via:
```bash
# Add marketplace
/plugin marketplace add https://github.com/applab-nl/claude-code-plugins

# Install specific plugin
/plugin install flutter-dev@applab-plugins
```

Plugins are installed by cloning/copying, not via npm. This is why MCP servers must bundle all dependencies.

## Important Constraints

1. **No root package.json** - Each plugin's MCP server manages its own dependencies
2. **All MCP dependencies bundled** - Essential for distribution without node_modules
3. **Semver versioning** - Both plugin.json and marketplace.json must stay in sync
4. **MIT License** - Standard across all plugins
5. **Comprehensive documentation** - README.md required per plugin
6. **No secrets in code** - API keys, tokens must be configured by end users

## External Dependencies

### Service Integrations
- **Sentry** - Error tracking and monitoring (sentry-issue-fixer plugin)
- **Linear** - Issue tracking and project management (flux-capacitor references)
- **Flutter DevTools** - Runtime introspection via `flutter_mcp` package
- **Next.js DevTools** - Runtime diagnostics via `next-devtools-mcp` package
- **Svelte** - Documentation access via custom MCP

### External MCP Packages
- `flutter_mcp` - Dart/Flutter tooling integration
- `next-devtools-mcp` - Next.js development server integration
- `@anthropic/mcp-docs-server` - Documentation fetching (Svelte plugin)

### System Dependencies
- **Python 3.8+** with `uv` for hook scripts
- **Node.js** for MCP server execution
- **Git** for version control and worktree features
