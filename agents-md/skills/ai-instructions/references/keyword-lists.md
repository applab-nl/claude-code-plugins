# Keyword Classification Lists

Complete reference for classifying instruction content as platform-specific or generic.

## Claude-Specific Keywords

### Tool Names (High Confidence)

These tool names are unique to Claude Code:

```
Task
TodoWrite
Edit
Write
Read
Bash
Grep
Glob
WebFetch
WebSearch
LSP
AskUserQuestion
EnterPlanMode
ExitPlanMode
NotebookEdit
KillShell
TaskOutput
```

**Pattern**: Match as whole words, case-sensitive.

### System Terms (High Confidence)

```
Claude Code
Claude Code CLI
Anthropic
CLAUDE.md
claude.ai/code
claude-code
```

**Pattern**: Case-insensitive matching.

### MCP Terms (High Confidence)

```
MCP
Model Context Protocol
mcpServers
.mcp.json
mcp_
MCP server
```

**Pattern**: Match as whole words or prefixes.

### Hook Events (High Confidence)

```
PreToolUse
PostToolUse
Stop
SubagentStop
SessionStart
SessionEnd
UserPromptSubmit
PreCompact
Notification
hooks.json
```

**Pattern**: Match as whole words, case-sensitive (they're PascalCase).

### Plugin Terms (High Confidence)

```
/plugin
slash command
plugin.json
.claude-plugin
CLAUDE_PLUGIN_ROOT
plugin marketplace
```

**Pattern**: Various matching strategies.

### Subagent Terms (Medium Confidence)

```
subagent
subagent_type
Task tool
launch.*agent
spawn.*agent
delegate.*agent
```

**Pattern**: Includes regex patterns.

### Claude-Specific Formatting (Medium Confidence)

```
<system-reminder>
<example>
<commentary>
ultrathink
extended thinking
thinking mode
```

**Pattern**: XML tags and specific phrases.

### Claude-Specific Phrases (Medium Confidence)

```
"use the Task tool"
"call the Edit tool"
"with the Bash tool"
"TodoWrite to track"
"subagent delegation"
"MCP integration"
```

**Pattern**: Phrase matching.

---

## GitHub Copilot-Specific Keywords

### File Locations (High Confidence)

```
.github/copilot-instructions.md
.github/instructions/
.instructions.md
copilot-instructions
```

### Frontmatter (High Confidence)

```
applyTo:
---
```

**Context**: Only when discussing Copilot path-specific rules.

### Copilot Features (Medium Confidence)

```
Copilot
GitHub Copilot
Copilot Chat
code completion
inline suggestions
```

---

## Gemini-Specific Keywords

### File Locations (High Confidence)

```
GEMINI.md
.gemini/
styleguide.md
.gemini/styleguide.md
```

### Gemini Features (Medium Confidence)

```
Gemini CLI
Gemini Code Assist
agent mode
agentic chat
Gemini
Google Gemini
```

---

## OpenCode-Specific Keywords

### Configuration (High Confidence)

```
opencode.json
.opencode/
opencode
```

### Features (Medium Confidence)

```
OpenCode
open code
tui
```

---

## Generic Content Indicators

Content is likely generic if it discusses:

### Project Structure

```
directory structure
file organization
project layout
architecture
```

### Development Workflow

```
setup
installation
dependencies
environment
configuration
```

### Coding Standards

```
style guide
naming convention
code style
formatting
linting
```

### Testing

```
unit test
integration test
test coverage
testing strategy
test command
npm test
pytest
jest
```

### Git/Version Control

```
commit message
branch naming
pull request
merge
git workflow
gitflow
```

### Deployment

```
deployment
CI/CD
pipeline
docker
kubernetes
```

### Security

```
security
authentication
authorization
secrets management
environment variables
```

### Documentation

```
README
documentation
API docs
changelog
```

---

## Classification Algorithm

### Step 1: Extract Sections

Split content by `##` headings into sections.

### Step 2: Scan Each Section

For each section:
1. Initialize `claude_score = 0`
2. For each Claude-specific keyword found:
   - High confidence: `claude_score += 2`
   - Medium confidence: `claude_score += 1`
3. If `claude_score >= 2`: Mark as Claude-specific
4. Otherwise: Mark as generic

### Step 3: Handle Edge Cases

**Mixed sections**: If a section contains both generic and Claude-specific content:
- Split into sub-sections if possible
- Otherwise, keep in Claude-specific (conservative approach)

**Unclear sections**: When confidence is low:
- Default to generic (AGENTS.md)
- User can manually adjust later

### Step 4: Validate Classification

After classification:
- Ensure AGENTS.md has meaningful content (not empty)
- Ensure CLAUDE.md has value (not just duplicating AGENTS.md)
- If all content is generic, CLAUDE.md may reference AGENTS.md without additional content

---

## Regex Patterns

For programmatic matching:

```javascript
// Claude-specific tools (whole word, case-sensitive)
/\b(Task|TodoWrite|Edit|Write|Read|Bash|Grep|Glob|WebFetch|WebSearch|LSP|AskUserQuestion|EnterPlanMode)\b/

// Hook events (whole word, case-sensitive)
/\b(PreToolUse|PostToolUse|Stop|SubagentStop|SessionStart|SessionEnd|UserPromptSubmit|PreCompact|Notification)\b/

// MCP terms (case-insensitive)
/\b(MCP|mcpServers|Model Context Protocol)\b/i

// Claude references (case-insensitive)
/Claude Code|Anthropic|claude\.ai\/code/i

// Plugin terms
/\.claude-plugin|plugin\.json|CLAUDE_PLUGIN_ROOT|\/plugin\s/

// Subagent patterns
/subagent|subagent_type|Task tool|launch.*agent/i
```

---

## Confidence Scoring

| Keyword Category | Confidence | Score |
|------------------|------------|-------|
| Tool names | High | +2 |
| Hook events | High | +2 |
| MCP terms | High | +2 |
| Plugin terms | High | +2 |
| "Claude Code" | High | +2 |
| Subagent terms | Medium | +1 |
| Claude formatting | Medium | +1 |
| Claude phrases | Medium | +1 |

**Classification threshold**: Score >= 2 = Claude-specific
