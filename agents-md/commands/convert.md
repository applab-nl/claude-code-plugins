---
name: convert
description: Convert CLAUDE.md to multi-platform AI instruction files (AGENTS.md, GitHub Copilot, Gemini)
argument-hint: "[path/to/CLAUDE.md]"
allowed-tools: ["Read", "Write", "Grep", "Glob", "Task"]
---

# Convert CLAUDE.md to Multi-Platform Format

Convert an existing CLAUDE.md file into the AGENTS.md standard structure with platform-specific files.

## Instructions

1. **Locate the source file**:
   - If argument provided, use that path
   - Otherwise, look for `CLAUDE.md` in current directory
   - If not found, check `~/.claude/CLAUDE.md`

2. **Read and analyze the content**:
   - Use the `instruction-analyzer` agent (via Task tool) to classify content
   - Identify Claude-specific vs generic sections using keyword detection

3. **Classification criteria** (from ai-instructions skill):

   **Claude-specific keywords** (keep in CLAUDE.md):
   - Tools: `Task`, `TodoWrite`, `Edit`, `Write`, `Read`, `Bash`, `Grep`, `Glob`, `WebFetch`, `WebSearch`, `LSP`, `AskUserQuestion`, `EnterPlanMode`
   - Hooks: `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`, `SessionStart`, `SessionEnd`
   - System: `Claude Code`, `Anthropic`, `MCP`, `Model Context Protocol`, `mcpServers`, `.mcp.json`
   - Plugins: `/plugin`, `plugin.json`, `.claude-plugin`, `CLAUDE_PLUGIN_ROOT`
   - Subagents: `subagent`, `subagent_type`

   **Generic content** (move to AGENTS.md):
   - Project setup and installation
   - Coding standards and conventions
   - Testing commands
   - Git workflow
   - Architecture docs
   - Deployment procedures

4. **Generate output files**:

   **AGENTS.md** (universal, leading):
   ```markdown
   # AGENTS.md

   [All generic sections]
   ```

   **CLAUDE.md** (Claude-specific only):
   ```markdown
   # CLAUDE.md

   > See AGENTS.md for universal project guidelines.

   [Only Claude-specific sections]
   ```

   **.github/copilot-instructions.md**:
   ```markdown
   # Copilot Instructions

   [AGENTS.md content]

   ---

   ## Copilot-Specific

   [Any Copilot-specific additions]
   ```

   **GEMINI.md**:
   ```markdown
   # GEMINI.md

   [AGENTS.md content]

   ---

   ## Gemini-Specific

   [Any Gemini-specific additions]
   ```

5. **Create .github directory** if needed for copilot-instructions.md

6. **Report results**:
   - List files created
   - Show classification summary (X generic sections, Y Claude-specific)
   - Note any ambiguous sections for user review

## Example Usage

```
/agents-md:convert
/agents-md:convert ./docs/CLAUDE.md
/agents-md:convert ~/projects/my-app/CLAUDE.md
```

## Important Notes

- Back up original CLAUDE.md before conversion (recommend git commit first)
- AGENTS.md becomes the source of truth
- Use `/agents-md:sync` after editing AGENTS.md to regenerate platform files
