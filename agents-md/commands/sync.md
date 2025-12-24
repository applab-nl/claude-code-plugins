---
name: sync
description: Regenerate platform-specific instruction files from AGENTS.md
argument-hint: "[path/to/directory]"
allowed-tools: ["Read", "Write", "Grep", "Glob"]
---

# Sync Platform Files from AGENTS.md

Regenerate all platform-specific instruction files from the AGENTS.md source of truth.

## Instructions

1. **Locate source files**:
   - If argument provided, look in that directory
   - Otherwise, use current directory
   - Required: `AGENTS.md` must exist
   - Optional: `CLAUDE.md` (for Claude-specific sections)

2. **Read current state**:
   - Read `AGENTS.md` content (source of truth)
   - Read `CLAUDE.md` if exists (extract Claude-specific sections only)
   - Read any existing platform files to preserve platform-specific sections

3. **Extract platform-specific sections**:

   From existing files, find sections after the `---` separator or under platform-specific headers:
   - `## Claude Code Specific` or `## Claude-Specific`
   - `## Copilot-Specific` or `## Copilot-Specific Guidelines`
   - `## Gemini-Specific` or `## Gemini-Specific Guidelines`

4. **Regenerate each platform file**:

   **CLAUDE.md**:
   ```markdown
   # CLAUDE.md

   > See AGENTS.md for universal project guidelines.

   [Preserved Claude-specific sections]
   ```

   **.github/copilot-instructions.md**:
   ```markdown
   # Copilot Instructions

   [Current AGENTS.md content]

   ---

   ## Copilot-Specific Guidelines

   [Preserved Copilot-specific sections, if any]
   ```

   **GEMINI.md**:
   ```markdown
   # GEMINI.md

   [Current AGENTS.md content]

   ---

   ## Gemini-Specific Guidelines

   [Preserved Gemini-specific sections, if any]
   ```

5. **Report results**:
   - List files updated
   - Show what AGENTS.md content was synced
   - Note any preserved platform-specific sections

## Example Usage

```
/agents-md:sync
/agents-md:sync ./projects/my-app
```

## Workflow

Typical workflow after initial conversion:

1. Edit `AGENTS.md` with universal changes
2. Run `/agents-md:sync` to propagate changes
3. Optionally edit platform-specific sections in each file
4. Repeat as needed

## Important Notes

- **AGENTS.md is always leading** - changes there propagate to all platform files
- **Platform-specific sections are preserved** - they won't be overwritten
- **CLAUDE.md references AGENTS.md** - it only contains Claude-specific additions
- **Copilot and Gemini files include AGENTS.md inline** - for tools that don't support references
