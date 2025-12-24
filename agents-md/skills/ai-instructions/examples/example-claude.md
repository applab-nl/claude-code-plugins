# CLAUDE.md

> See AGENTS.md for universal project guidelines that apply to all AI assistants.

This file contains Claude Code-specific instructions and configurations.

## MCP Integration

This project uses the following MCP servers:

```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["-y", "@prisma/mcp-server"]
    }
  }
}
```

Use the database MCP server for:
- Querying data for debugging
- Checking schema information
- Validating migrations

## Tool Preferences

### File Operations

- Prefer `Edit` over `Write` for modifying existing files
- Use `Read` to understand file contents before editing
- Always verify changes with `Grep` after large refactors

### Task Management

- Use `TodoWrite` to track multi-step implementations
- Break complex features into manageable tasks
- Mark tasks complete immediately after finishing

### Code Search

- Use `Glob` to find files by pattern
- Use `Grep` to search file contents
- Combine for efficient codebase navigation

## Subagent Delegation

When implementing features, delegate to specialized agents:

| Task Type | Subagent |
|-----------|----------|
| React components | `frontend-specialist` |
| API routes | `backend-specialist` |
| Database queries | `database-specialist` |
| Test writing | `test-engineer` |
| Code review | `code-reviewer` |

Example delegation:
```
Use the Task tool with subagent_type='test-engineer' to generate comprehensive tests for the new UserProfile component.
```

## Hooks

This project uses the following hooks:

- **PreToolUse (Write/Edit)**: Validates code style before file changes
- **PostToolUse (Bash npm test)**: Runs affected tests after code changes
- **Stop**: Generates summary of changes made

## Workflow Guidelines

### Before Making Changes

1. Read relevant files to understand context
2. Create a todo list for multi-step changes
3. Check for existing patterns in the codebase

### After Making Changes

1. Run `npm test` to verify nothing broke
2. Use `Grep` to verify changes were applied correctly
3. Update documentation if public APIs changed

### For Large Features

1. Use `EnterPlanMode` to design the approach
2. Break into smaller tasks with `TodoWrite`
3. Implement incrementally, testing each step
4. Use `AskUserQuestion` if requirements are unclear
