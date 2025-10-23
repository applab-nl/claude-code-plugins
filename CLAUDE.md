# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **Claude Code Plugins Marketplace** - a curated collection of production-ready plugins that extend Claude Code's capabilities. Each plugin provides specialized functionality through agents, slash commands, and MCP (Model Context Protocol) servers.

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
│   ├── .mcp.json               # MCP server configuration
│   ├── mcp-server/             # Custom MCP server (optional)
│   │   ├── src/                # TypeScript source
│   │   ├── dist/               # Built bundles
│   │   ├── package.json
│   │   └── tsup.config.ts      # Build configuration
│   ├── README.md
│   ├── CHANGELOG.md
│   └── LICENSE
```

### Available Plugins

1. **flux-capacitor** (v1.2.1) - Feature Development Lifecycle Orchestrator
   - Integrates with Linear for issue tracking
   - Creates git worktrees for isolated development
   - Launches dedicated Claude Code sessions in new terminals
   - Uses bundled MCP server for worktree/session management

2. **sentry-issue-fixer** (v1.0.0) - Automated Sentry Error Investigation
   - Fetches errors from Sentry
   - Analyzes iOS/Android device logs
   - Proposes comprehensive fixes

3. **next-dev** (v1.0.0) - Next.js Development Specialist
   - Runtime diagnostics via Next.js MCP integration
   - Automated upgrades, page testing
   - Uses external `next-devtools-mcp` package

4. **svelte-dev** (v1.0.0) - Svelte 5 Development Specialist
   - Documentation access, static code analysis
   - Svelte 5 runes expertise

5. **flutter-dev** (v1.0.0) - Flutter/Dart Development Specialist
   - Code analysis, package management
   - Runtime introspection, testing

## Plugin Development

### Building MCP Servers

Plugins with custom MCP servers (like flux-capacitor) use **tsup** for bundling:

```bash
# From plugin's mcp-server/ directory
cd flux-capacitor/mcp-server
npm install
npm run build          # Build production bundle
npm run dev            # Watch mode for development
npm test              # Run tests
npm run bundle:verify  # Verify bundle works
```

**Critical**: MCP servers MUST bundle ALL dependencies (`noExternal: [/.*/]` in tsup.config.ts) because plugins are distributed without node_modules.

### MCP Server Configuration

Two patterns for `.mcp.json`:

**Pattern 1: Bundled Server** (flux-capacitor)
```json
{
  "mcpServers": {
    "mcp": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-server/dist/index.cjs"]
    }
  }
}
```

**Pattern 2: External Package** (next-dev)
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

### Plugin Manifest Structure

**`.claude-plugin/plugin.json`** - Individual plugin manifest
- Defines name, version, description
- Points to agents, commands, mcpServers
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
3. Create agents/commands as needed
4. Add MCP server if required
5. Update marketplace.json
6. Test locally
7. Update README.md
8. Add CHANGELOG.md entry

### Modifying Existing Plugins

1. Update version in plugin.json and marketplace.json (follow semver)
2. Make changes to agents/commands/MCP server
3. If MCP server changed: rebuild (`npm run build`)
4. Update CHANGELOG.md
5. Test the plugin end-to-end
6. Commit with descriptive message

### Testing Plugins Locally

```bash
# Install marketplace locally
/plugin marketplace add /path/to/claude-code-plugins

# Install specific plugin
/plugin install flux-capacitor@applab-plugins

# Test slash commands
/run MEM-123  # flux-capacitor
/sentry-fix https://sentry.io/...  # sentry-issue-fixer
```

## Key Technical Details

### Agent Files (.md)

Agents are markdown files containing:
- Extended system prompt/instructions
- Agent-specific tools/capabilities
- Usage guidelines and examples
- Proactive behavior instructions

Example path: `flux-capacitor/agents/flux-capacitor.md`

### Command Files (.md)

Slash commands are markdown files that:
- Expand to full prompts when invoked
- Can accept arguments
- Are listed via `/help` when plugin enabled

Example: `/run` → `flux-capacitor/commands/run.md`

### MCP Server Architecture (flux-capacitor example)

The flux-capacitor MCP server provides:
- `create_worktree` - Create isolated git worktrees
- `list_worktrees` - Query active worktrees
- `cleanup_worktree` - Remove worktrees
- `launch_session` - Start Claude Code in new terminal
- `get_session_status` - Check session health
- `create_terminal` - Low-level terminal creation

Built with:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `simple-git` - Git operations
- `execa` - Process execution
- `node-persist` - State persistence
- `zod` - Schema validation

### Distribution Strategy

- Plugins are distributed via GitHub
- MCP servers with dependencies must be fully bundled
- Users install via `/plugin` commands
- No separate npm install required for end users

## Git Workflow

- Main branch: `main`
- Commit messages should be descriptive (no Claude attribution)
- Test changes locally before pushing
- Use branches for significant features
- Keep commits atomic and focused

## Important Constraints

1. **No package.json at root** - Each plugin's MCP server has its own
2. **All MCP dependencies bundled** - Essential for distribution
3. **Semver for versioning** - Both plugin.json and marketplace.json
4. **MIT License** - Standard across all plugins
5. **Comprehensive documentation** - README.md required per plugin
