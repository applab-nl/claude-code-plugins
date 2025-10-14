# Flux Capacitor Plugin

**Feature Development Lifecycle Orchestrator** - A comprehensive Claude Code plugin that transforms feature requests into detailed implementation plans with issue tracker integration and subagent delegation.

## Overview

The Flux Capacitor plugin streamlines your feature development workflow by:
- Integrating with issue trackers (Linear, GitHub Issues, Jira)
- Generating comprehensive implementation plans using ultrathink mode
- Providing clear subagent delegation strategies
- Managing the complete feature lifecycle from planning to completion

## Features

### 🎯 Multiple Workflow Modes

**Mode 1: Issue Key**
```bash
/flux-capacitor MEM-123
```
Fetches issue details from your tracker, generates a plan, updates issue status, and provides clear next steps.

**Mode 2: Description with Issue Tracker**
```bash
/flux-capacitor Add OAuth authentication with Google and GitHub
```
Searches for similar issues, optionally creates a new one, then follows Mode 1 workflow.

**Mode 3: Plain Description (No Tracker)**
```bash
/flux-capacitor Implement user profile management
```
Generates comprehensive plan without issue tracker integration.

### 🔗 Issue Tracker Integration

- **Linear**: Full integration with status updates, assignments, and comments
- **GitHub Issues**: Coming soon
- **Jira**: Coming soon

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
/plugin marketplace add dviersel/claude-code-plugins
/plugin install flux-capacitor@claude-code-plugins
```

### Manual Installation

1. Clone this repository
2. Copy the `flux-capacitor` directory to your plugins location
3. Enable the plugin in Claude Code

## Requirements

- Claude Code CLI
- Optional: Linear MCP server for issue tracking integration
- Git repository for your project

## Usage

### Basic Usage

1. **With Issue Key** (requires Linear MCP):
   ```bash
   /flux-capacitor MEM-123
   ```

2. **With Description**:
   ```bash
   /flux-capacitor Add real-time notifications with Supabase
   ```

3. **Approve the Plan**:
   Review the generated implementation plan and approve when ready

4. **Start Development**:
   Follow the provided next steps and use recommended subagents

### Advanced Usage

**Add context to issue key**:
```bash
/flux-capacitor MEM-123 Focus on mobile-first approach
```

**Create detailed feature request**:
```bash
/flux-capacitor Implement authentication system with OAuth (Google, GitHub), email/password, and magic links. Include MFA support.
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

6. **Next Steps**:
   - Provides clear guidance for starting development
   - Recommends branch naming
   - Lists specialized subagents to use

## Configuration

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

### Example 1: OAuth Implementation

```
User: /flux-capacitor MEM-123

✓ Detected issue key: MEM-123
✓ Linear MCP server found
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

🚀 Next steps:
1. Create branch: feature/mem-123-add-oauth
2. Use supabase-integration-expert for auth configuration
3. Use frontend-specialist for UI components
4. Test thoroughly before submitting for review
```

### Example 2: Feature Description

```
User: /flux-capacitor Add real-time chat with presence indicators

✓ Detected feature description
✓ Linear MCP server found
✓ Searching for similar issues...

Found 2 similar issues:
1. MEM-145: Real-time messaging (85% match)
2. MEM-098: User presence system (70% match)

Use existing issue or create new? [1/2/new]: new

✓ Creating new issue...
✓ Created MEM-156: Add real-time chat with presence indicators

⏳ Entering ultrathink mode to generate plan...

[... continues with planning workflow ...]
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
- GitHub Issues: https://github.com/dviersel/claude-code-plugins/issues
- Documentation: https://docs.claude.com/en/docs/claude-code/plugins-reference
