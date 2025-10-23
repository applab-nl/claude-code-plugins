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
- Git 2.30+ (for worktree support)
- Optional but recommended: flux-capacitor-mcp MCP server for worktree and session management
- Optional: Linear MCP server for issue tracking integration

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

### Workspace Orchestrator MCP (Recommended)

The flux-capacitor-mcp MCP server enables worktree creation and session launching. See the [flux-capacitor-mcp documentation](../../claude-code-config/mcp-servers/flux-capacitor-mcp/README.md) for full installation instructions.

**Quick Setup:**

Add to `~/.claude/mcp_config.json`:
```json
{
  "mcpServers": {
    "flux-capacitor-mcp": {
      "command": "node",
      "args": [
        "/path/to/claude-code-config/mcp-servers/flux-capacitor-mcp/dist/index.js"
      ],
      "env": {
        "LOG_LEVEL": "info",
        "TERMINAL_APP": "auto-detect"
      }
    }
  }
}
```

**Features Enabled:**
- Isolated git worktree creation
- Dedicated Claude Code session launching
- Parallel feature development
- Session lifecycle management
- Automated worktree initialization scripts

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

### Example 1: Full Workflow with Workspace Orchestrator

```
User: /run MEM-123

✓ Detected issue key: MEM-123
✓ Linear MCP server found
✓ Workspace-orchestrator MCP server found
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

### Example 2: Fallback Without Workspace Orchestrator

```
User: /run Add real-time notifications

✓ Detected feature description
✓ Linear MCP server found
⚠️  Workspace-orchestrator not available (will provide manual steps)
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Manual Implementation Steps
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Since flux-capacitor-mcp MCP is not available:

1. Create feature branch:
   git checkout -b feature/mem-156-add-real-time-notifications

2. Review the implementation plan above

3. Use these specialized subagents:
   - supabase-integration-expert for real-time subscriptions
   - frontend-specialist for notification UI
   - test-engineer for testing

4. Test thoroughly before committing

5. Update issue status to "Review" when complete

💡 Tip: Install flux-capacitor-mcp MCP for automated workflow!
   See installation section above.
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

## Version

Current version: 1.0.0

## Support

For issues, feature requests, or questions:
- GitHub Issues: https://github.com/applab-nl/claude-code-plugins/issues
- Documentation: https://docs.claude.com/en/docs/claude-code/plugins-reference
