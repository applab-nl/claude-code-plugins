# Flux Capacitor Plugin

**Feature Development Lifecycle Orchestrator** - A comprehensive Claude Code plugin that transforms feature requests into detailed implementation plans with issue tracker integration, isolated worktree environments, and dedicated session orchestration.

## Overview

The Flux Capacitor plugin streamlines your feature development workflow by:
- Integrating with issue trackers (Linear, GitHub Issues, Jira)
- Generating comprehensive implementation plans using ultrathink mode
- Creating isolated git worktrees for parallel development
- Launching dedicated Claude Code sessions in new terminals
- Providing clear subagent delegation strategies
- Managing the complete feature lifecycle from planning to completion and cleanup

## Features

### 🎯 Multiple Workflow Modes

**Mode 1: Issue Key**
```bash
/run MEM-123
```
Fetches issue details from your tracker, generates a plan, updates issue status, and provides clear next steps.

**Mode 2: Description with Issue Tracker**
```bash
/run Add OAuth authentication with Google and GitHub
```
Searches for similar issues, optionally creates a new one, then follows Mode 1 workflow.

**Mode 3: Plain Description (No Tracker)**
```bash
/run Implement user profile management
```
Generates comprehensive plan without issue tracker integration.

### 🔗 Issue Tracker Integration

- **Linear**: Full integration with status updates, assignments, and comments
- **GitHub Issues**: Coming soon
- **Jira**: Coming soon

### 🛠️ Workspace Orchestration (via flux-capacitor-mcp MCP)

- **Git Worktrees**: Create isolated development environments automatically
- **Session Launch**: Open dedicated Claude Code sessions in new terminal windows
- **Parallel Development**: Work on multiple features simultaneously without context switching
- **Auto-initialization**: Run setup scripts on worktree creation
- **Lifecycle Management**: Track sessions, check status, and clean up when done

### 🧠 Ultrathink Planning

Every feature gets a comprehensive implementation plan including:
- Technical approach and strategy
- 5-15 detailed implementation steps
- Subagent delegation recommendations
- Success criteria and testing plan
- Effort estimation

### 🤖 Subagent Delegation

Intelligent recommendations for specialized agents:
- `architecture-advisor` for design decisions
- `flutter-specialist` for mobile development
- `kotlin-backend-specialist` for backend APIs
- `frontend-specialist` for React/Next.js/Svelte
- `supabase-integration-expert` for database/auth
- `test-engineer` for comprehensive testing
- `code-reviewer` for quality assurance

## Installation

### From Marketplace

```bash
/plugin marketplace add applab-nl/claude-code-plugins
/plugin install flux-capacitor@applab-plugins
```

### Manual Installation

1. Clone this repository
2. Copy the `flux-capacitor` directory to your plugins location
3. Enable the plugin in Claude Code

## Requirements

- Claude Code CLI
- Node.js 18+ (for bundled MCP server)
- Git 2.30+ (for worktree support)
- Optional: Linear MCP server for issue tracking integration

**Note**: The flux-capacitor-mcp server is now bundled with the plugin and starts automatically when the plugin is enabled. No separate installation required!

## Usage

### Basic Usage

1. **With Issue Key** (requires Linear MCP):
   ```bash
   /run MEM-123
   ```

2. **With Description**:
   ```bash
   /run Add real-time notifications with Supabase
   ```

3. **Approve the Plan**:
   Review the generated implementation plan and approve when ready

4. **Start Development**:
   Follow the provided next steps and use recommended subagents

### Advanced Usage

**Add context to issue key**:
```bash
/run MEM-123 Focus on mobile-first approach
```

**Create detailed feature request**:
```bash
/run Implement authentication system with OAuth (Google, GitHub), email/password, and magic links. Include MFA support.
```

## How It Works

1. **Input Detection**: Parses your input to determine workflow mode (issue key vs description)

2. **Issue Tracker Integration**:
   - Detects available MCP servers (Linear, GitHub, Jira)
   - Fetches or creates issues as needed
   - Searches for similar existing issues

3. **Ultrathink Planning**:
   - Analyzes requirements and codebase
   - Generates comprehensive 5-15 step plan
   - Identifies appropriate subagents for each step
   - Defines success criteria and testing approach

4. **User Approval**:
   - Presents complete plan for review
   - Waits for explicit approval before proceeding

5. **Issue Updates** (if applicable):
   - Updates issue status to "In Progress"
   - Assigns issue to current user
   - Adds implementation plan as comment

6. **Worktree Creation** (if flux-capacitor-mcp available):
   - Creates feature branch if needed
   - Creates isolated git worktree as sibling directory
   - Executes initialization scripts (`.worktree-init/`)

7. **Session Launch** (if flux-capacitor-mcp available):
   - Opens new terminal window (Warp, iTerm2, or Terminal.app)
   - Launches Claude Code in the worktree
   - Passes full implementation plan to the session
   - Assigns appropriate specialized agent

8. **Parallel Development**:
   - Original session remains active for other work
   - New session works independently in isolated worktree
   - No context switching or git stashing needed

9. **Lifecycle Management**:
   - Check session status anytime
   - Clean up worktrees when feature is complete
   - Update issue tracker through completion

## Configuration

### Workspace Orchestrator MCP (Bundled) ✨

The flux-capacitor-mcp MCP server is **now bundled with the plugin** and starts automatically when you enable the plugin. No manual configuration required!

**Features Enabled Automatically:**
- ✅ Isolated git worktree creation
- ✅ Dedicated Claude Code session launching
- ✅ Parallel feature development
- ✅ Session lifecycle management
- ✅ Automated worktree initialization scripts

**Advanced Configuration (Optional):**

If you want to customize the MCP server behavior, you can override settings by adding to `~/.claude/mcp_config.json`:
```json
{
  "mcpServers": {
    "flux-capacitor-mcp": {
      "env": {
        "LOG_LEVEL": "debug",
        "TERMINAL_APP": "warp"
      }
    }
  }
}
```

Available environment variables:
- `LOG_LEVEL`: `debug`, `info`, `warn`, `error` (default: `info`)
- `TERMINAL_APP`: `auto-detect`, `warp`, `iterm2`, `terminal` (default: `auto-detect`)

### Linear Integration

Install and configure the Linear MCP server:

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-linear"]
    }
  }
}
```

Set your Linear API key:
```bash
export LINEAR_API_KEY=your_api_key
```

## Examples

### Example 1: Full Workflow (Default Experience)

```
User: /run MEM-123

✓ Detected issue key: MEM-123
✓ Linear MCP server found
✓ flux-capacitor-mcp server active (bundled)
✓ Fetching issue details...

📋 Issue: Add OAuth authentication with Google and GitHub
   Status: Todo
   Team: Product

⏳ Entering ultrathink mode to generate plan...

📋 Implementation Plan: Add OAuth Authentication
[... comprehensive 10-step plan ...]

❓ Do you approve this plan?

User: yes

✓ Plan approved
✓ Updating Linear issue → In Progress
✓ Assigning issue to you
✓ Adding comment with plan summary

🔧 Creating isolated worktree...
✓ Branch created: feature/mem-123-add-oauth
✓ Worktree created: /Users/alice/projects/my-app-mem-123
✓ Initialization scripts executed: 3

🚀 Launching dedicated Claude Code session...

✓ Session launched successfully!
  Session ID: sess_my-app-mem-123_1729012345_abc123
  Terminal: Warp (PID: 54321)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Feature Development Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A new terminal window has opened with Claude Code running in the worktree.

The session will implement OAuth authentication using:
- supabase-integration-expert for auth configuration
- frontend-specialist for UI components
- test-engineer for comprehensive testing
- code-reviewer for security review

You can:
✓ Switch to the new terminal to monitor progress
✓ Continue working in this session on other tasks
✓ Check status anytime

When complete, clean up with: /flux-capacitor-cleanup mem-123
```

### Example 2: Description-Based Workflow

```
User: /run Add real-time notifications

✓ Detected feature description
✓ Linear MCP server found
✓ flux-capacitor-mcp server active (bundled)
✓ Searching for similar issues...

Found 1 similar issue:
1. MEM-145: Real-time messaging (85% match)

Use existing issue or create new? [1/new]: new

✓ Creating new issue...
✓ Created MEM-156: Add real-time notifications

⏳ Entering ultrathink mode to generate plan...

📋 Implementation Plan: Real-time Notifications
[... comprehensive plan ...]

❓ Do you approve this plan?

User: yes

✓ Plan approved
✓ Updating Linear issue → In Progress
✓ Assigning issue to you
✓ Adding comment with plan summary

🔧 Creating isolated worktree...
✓ Branch created: feature/mem-156-add-real-time-notifications
✓ Worktree created: /Users/alice/projects/my-app-mem-156
✓ Initialization scripts executed: 2

🚀 Launching dedicated Claude Code session...

✓ Session launched successfully!
  Session ID: sess_my-app-mem-156_1729034567_xyz789
  Terminal: iTerm2 (PID: 67890)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Feature Development Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The session will implement real-time notifications using:
- supabase-integration-expert for real-time subscriptions
- frontend-specialist for notification UI
- test-engineer for testing
```

### Example 3: Parallel Feature Development

```
User: I need to work on authentication and payment features simultaneously

Claude: I'll set up parallel worktrees for both features.

[Creates first worktree for MEM-123: authentication]
✓ Worktree 1: /Users/alice/projects/my-app-mem-123
✓ Session launched in Terminal 1

[Creates second worktree for MEM-124: payment]
✓ Worktree 2: /Users/alice/projects/my-app-mem-124
✓ Session launched in Terminal 2

Both features are now running in isolated environments:
- Terminal 1: OAuth authentication (supabase-integration-expert)
- Terminal 2: Payment integration (kotlin-backend-specialist)

You can switch between terminals to monitor both features.
No git stashing or context switching needed!
```

## Troubleshooting

### Issue Tracker Not Detected

If Linear or other trackers aren't detected:
```bash
claude mcp list
```
Verify your MCP server is configured and running.

### Plan Generation Fails

The plugin will fall back to Mode 3 (plain mode) if issue tracker integration fails. You'll still get a comprehensive plan, just without issue tracking features.

## Contributing

Contributions are welcome! Please submit issues and pull requests to the main repository.

## License

MIT License - See LICENSE file for details

## Technical Details

### MCP Server Bundling

The flux-capacitor-mcp server is distributed as a **self-contained CommonJS bundle** (~920KB) that includes all dependencies. This ensures zero-configuration installation without requiring `npm install` in the plugin directory.

**Build System:**
- **Bundler**: [tsup](https://tsup.egoist.dev/) (esbuild-based)
- **Format**: CommonJS (for compatibility with Node.js dynamic requires)
- **Bundle Size**: ~920KB (bundled) vs ~100MB+ (with node_modules)
- **Dependencies Included**: All runtime dependencies bundled into single file

**Why CommonJS Instead of ESM?**
- Some dependencies (e.g., `simple-git` via `@kwsites/file-exists`) use dynamic `require()` calls
- ESM doesn't support dynamic require, causing "Dynamic require not supported" errors
- CommonJS provides better compatibility with existing Node.js ecosystem packages

**Building from Source:**
```bash
cd mcp-server/
npm install
npm run build
# Output: dist/index.cjs (bundled executable)
```

**Bundle Configuration:**
The bundling is configured in `mcp-server/tsup.config.ts`:
- `noExternal: [/.*/]` - Bundles all dependencies
- `format: ['cjs']` - CommonJS output
- `platform: 'node'` - Node.js runtime optimizations
- `treeshake: true` - Removes unused code

## Version

Current version: 1.2.1

## Support

For issues, feature requests, or questions:
- GitHub Issues: https://github.com/applab-nl/claude-code-plugins/issues
- Documentation: https://docs.claude.com/en/docs/claude-code/plugins-reference
