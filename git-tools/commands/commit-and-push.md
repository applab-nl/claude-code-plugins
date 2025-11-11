---
allowed-tools: Bash
max-tool-calls: 1
description: Commit and push (single-shot optimized)
---

## Context (Pre-computed - Use Directly)

**Changed Files:**
!`git diff --name-only HEAD`

**File Stats:**
!`git diff --stat HEAD`

**Recent Commit Style:**
!`git log -5 --format="%s"`

**Current Branch:**
!`git branch --show-current`

**Remote Status:**
!`git status -sb`

## Your Task (Execute Immediately - No Analysis)

Generate a commit message following the style patterns from "Recent Commit Style" above, then execute this SINGLE atomic command:

```bash
git add -A && \
  git commit -m "$(cat <<'EOF'
<YOUR_GENERATED_MESSAGE_HERE>
EOF
)" && \
  git push && \
  echo "✓ Committed and pushed successfully"
```

**Message Format Rules:**
- Line 1: Imperative verb + what changed (max 50 chars) + optional emoji
- Line 2: Blank
- Line 3+: Why this matters, context, details (wrap at 72 chars)

**Critical Constraints:**
- Execute ONLY ONE bash command (enforced by max-tool-calls: 1)
- Use && chaining for atomic operation (stops on any failure)
- Follow recent commit message style patterns
- Use 0-2 tasteful emojis maximum
- Never mention AI/Claude/automated tools
- No additional tools, no explanations - just execute the command above

