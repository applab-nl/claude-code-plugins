# Flux Capacitor Session Management Redesign Proposal

**Date:** 2025-11-06
**Version:** 1.0
**Status:** Proposed

---

## Executive Summary

The flux-capacitor's recent migration to tmux-based session management (commit `df2cf83`) introduced reliability issues due to race conditions, timeout dependencies, and fragile prompt delivery. This proposal recommends migrating to an **atomic script-based architecture** using Claude CLI @ file references for guaranteed reliability.

**Key Changes:**
- Replace multi-step interactive approach with single atomic script
- Use `claude "Implement @prompt-file"` instead of typing prompts into tmux
- Remove tmux-cli dependency, use native tmux
- Fire-and-forget session launching (no blocking)
- Eliminate all race conditions and timing dependencies

**Benefits:**
- ✅ 100% reliable prompt delivery (Claude CLI @ file references)
- ✅ No race conditions or timeout failures
- ✅ Simpler architecture (~50 lines of bash vs 100+ lines of coordination)
- ✅ Observable (user can attach to tmux anytime)
- ✅ Testable (script can be tested independently)

---

## Table of Contents

1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Identified Issues](#identified-issues)
3. [Proposed Solution](#proposed-solution)
4. [Implementation Plan](#implementation-plan)
5. [Migration Strategy](#migration-strategy)
6. [Success Criteria](#success-criteria)
7. [Risk Analysis](#risk-analysis)

---

## Current Architecture Analysis

### Implementation: session.service.ts:launchSession()

Location: `flux-capacitor/mcp-server/src/services/session.service.ts:84-189`

**Current Approach (Multi-Step Interactive):**

```typescript
async launchSession(params: LaunchSessionParams): Promise<LaunchSessionResult> {
  // Step 1: Launch shell in tmux pane
  const paneId = await tmuxService.launch('zsh');

  // Step 2: Change to worktree directory
  await tmuxService.send(paneId, `cd "${worktreePath}"`, { delayEnter: 0.5 });
  await tmuxService.waitIdle(paneId, { idleTime: 2, timeout: 10 });

  // Step 3: Create prompt file
  const promptFile = await this.createPromptFile(worktreePath, prompt, agentName, contextFiles);

  // Step 4: Start Claude Code
  await tmuxService.send(paneId, 'claude', { delayEnter: 0.5 });
  await tmuxService.waitIdle(paneId, { idleTime: 3, timeout: 30 });

  // Step 5: Send the prompt by TYPING it into Claude
  const promptContent = await fs.readFile(promptFile, 'utf-8');
  await tmuxService.send(paneId, promptContent, { delayEnter: 1 });

  return { sessionId, tmuxPaneId: paneId, status: 'launched' };
}
```

**Flow Diagram:**

```
┌─────────────────────────────────────────────────────────────────┐
│ MCP: launch_session                                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
         1. Launch zsh in tmux
                 │
                 ▼
         2. Send "cd ..."
                 │
                 ▼
         3. Wait for idle (2s timeout)  ⚠️
                 │
                 ▼
         4. Create prompt file
                 │
                 ▼
         5. Send "claude"
                 │
                 ▼
         6. Wait for Claude (30s timeout)  ⚠️
                 │
                 ▼
         7. Read prompt file
                 │
                 ▼
         8. TYPE entire prompt into Claude  ❌
                 │
                 ▼
         9. Return (finally!)
```

**Dependencies:**
- tmux-cli (claude-code-tools package)
- 5 sequential operations with timing dependencies
- 3 separate timeout configurations
- Manual prompt typing via tmux

---

## Identified Issues

### 1. Race Conditions ⚠️

**Lines 122, 139**: `waitIdle()` with hardcoded timeouts

```typescript
await tmuxService.waitIdle(paneId, { idleTime: 2, timeout: 10 });   // Fails if shell slow
await tmuxService.waitIdle(paneId, { idleTime: 3, timeout: 30 });   // Fails if Claude slow
```

**Problem:**
- If Claude takes longer than 30s to start → timeout failure
- No reliable way to know when Claude is truly ready
- Different systems have different startup times
- No way to detect actual readiness

**Impact:** Intermittent failures on slow systems or during high load

### 2. Prompt Delivery Fragility ❌

**Lines 143-147**: Read prompt file, then type content into Claude

```typescript
const promptContent = await fs.readFile(promptFile, 'utf-8');
await tmuxService.send(paneId, promptContent, { delayEnter: 1 });
```

**Problems:**
- Large prompts (>2KB) can be truncated by tmux buffer limits
- No confirmation that prompt was received
- Special characters can cause issues (quotes, newlines, escape sequences)
- Line breaks may be mishandled
- No atomicity guarantee

**Impact:** Silent prompt truncation, leading to incomplete/incorrect behavior

### 3. No File Reference Usage 📥

**Current:** Types prompt interactively
**Should be:** `claude "Implement the plan in @prompt-file"`

**Why Claude CLI @ file references are superior:**
- ✅ Atomic operation (file read is built-in to Claude CLI)
- ✅ No buffer limits
- ✅ Handles any prompt size
- ✅ No escaping issues
- ✅ Guaranteed delivery
- ✅ This is how Claude Code is designed to be used in automation

### 4. Complex Error Surface 🔥

**5 sequential steps, each can fail independently:**

```
Launch zsh → Send cd → Wait idle → Send claude → Wait idle → Type prompt
   ❌         ❌         ❌            ❌           ❌           ❌
```

**Problems:**
- Partial failures leave orphaned tmux panes
- No transaction/rollback capability
- Difficult to debug (which step failed?)
- State management complexity
- Error recovery requires manual cleanup

**Impact:** Unreliable workflow, orphaned processes, debugging nightmares

### 5. No Process Isolation 🚫

**Problem:**
- All operations happen in same MCP server process
- Long-running operations (30s+ waits) block MCP responses
- Cannot serve other requests during session launch
- No way to monitor progress independently

**Impact:** Poor user experience, unresponsive MCP server

### 6. Dependency on tmux-cli 📦

**Current:** Requires `uv tool install claude-code-tools`

**Problems:**
- Extra installation step for users
- Another dependency to maintain
- tmux-cli adds abstraction layer (complexity)
- Native tmux is simpler and more reliable

**Impact:** Installation friction, maintenance burden

---

## Proposed Solution

### Architecture: Atomic Script-Based Launcher

**Core Principle:** One script, one execution, one atomic operation, fire-and-forget.

```
┌─────────────────────────────────────────────────────────────────┐
│ flux-capacitor Agent (Orchestrator)                             │
│  - Generates implementation plan                                │
│  - Calls MCP launch_session tool                                │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ MCP: launch_session                                             │
│  1. Validate inputs                                             │
│  2. Create prompt file: {worktree}/.claude/session-prompt.md    │
│  3. Execute: launch-claude-session.sh <params>                  │
│  4. Return session info immediately                             │
│  5. DONE (no waiting, no monitoring)                            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ launch-claude-session.sh (Atomic Script)                        │
│  Parameters:                                                    │
│   --repo-path      : Main repository path                       │
│   --branch         : Feature branch name                        │
│   --worktree-name  : Worktree directory name                    │
│   --prompt-file    : Path to prompt file                        │
│   --session-id     : Unique session identifier                  │
│                                                                  │
│  Actions (ONE ATOMIC EXECUTION):                                │
│   1. Create git worktree (if not exists)                        │
│   2. Create tmux session: "flux-{session-id}"                   │
│   3. Launch in tmux: cd {worktree} && claude "Implement @prompt"│
│   4. Detach from tmux (session runs in background)              │
│   5. Write session info to state file                           │
│   6. Exit (< 5 seconds total)                                   │
└─────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Claude Code Session (running in tmux)                           │
│  - Runs in isolated worktree                                    │
│  - Prompt delivered via @ file reference (reliable)             │
│  - User can attach: tmux attach -t flux-{session-id}            │
│  - User can monitor: get_session_status (captures tmux output)  │
│  - User can detach: Ctrl-B D (without stopping session)         │
└─────────────────────────────────────────────────────────────────┘
```

### Component 1: Atomic Launch Script

**File:** `flux-capacitor/mcp-server/scripts/launch-claude-session.sh`

```bash
#!/bin/bash
# launch-claude-session.sh - Atomic Claude Code session launcher
#
# This script performs ALL session setup in a single, atomic execution:
# - Creates git worktree
# - Creates tmux session
# - Launches Claude Code with @ file reference
# - Returns immediately (fire-and-forget)

set -euo pipefail  # Exit on any error

# Parse arguments
REPO_PATH=""
BRANCH=""
WORKTREE_NAME=""
PROMPT_FILE=""
SESSION_ID=""
BASE_BRANCH="main"

while [[ $# -gt 0 ]]; do
  case $1 in
    --repo-path)      REPO_PATH="$2"; shift 2 ;;
    --branch)         BRANCH="$2"; shift 2 ;;
    --worktree-name)  WORKTREE_NAME="$2"; shift 2 ;;
    --prompt-file)    PROMPT_FILE="$2"; shift 2 ;;
    --session-id)     SESSION_ID="$2"; shift 2 ;;
    --base-branch)    BASE_BRANCH="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Validate required parameters
[[ -z "$REPO_PATH" ]] && { echo "ERROR: Missing --repo-path"; exit 1; }
[[ -z "$BRANCH" ]] && { echo "ERROR: Missing --branch"; exit 1; }
[[ -z "$WORKTREE_NAME" ]] && { echo "ERROR: Missing --worktree-name"; exit 1; }
[[ -z "$PROMPT_FILE" ]] && { echo "ERROR: Missing --prompt-file"; exit 1; }
[[ -z "$SESSION_ID" ]] && { echo "ERROR: Missing --session-id"; exit 1; }
[[ ! -f "$PROMPT_FILE" ]] && { echo "ERROR: Prompt file not found: $PROMPT_FILE"; exit 1; }

# Calculate paths
WORKTREE_PATH="$(dirname "$REPO_PATH")/$WORKTREE_NAME"
TMUX_SESSION="flux-$SESSION_ID"
STATE_FILE="$WORKTREE_PATH/.claude/session-state.json"

# Step 1: Create worktree (if not exists)
if [[ ! -d "$WORKTREE_PATH" ]]; then
  cd "$REPO_PATH"

  # Create branch if doesn't exist
  if ! git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
    git branch "$BRANCH" "$BASE_BRANCH"
  fi

  # Create worktree
  git worktree add "$WORKTREE_PATH" "$BRANCH"
fi

# Step 2: Create tmux session with Claude Code
# Use -d to detach immediately (fire-and-forget)
# Use @ file reference for reliable prompt delivery
tmux new-session -d -s "$TMUX_SESSION" -c "$WORKTREE_PATH" \
  "claude \"Implement the plan in @$PROMPT_FILE\"; exec bash"
#  ^^^^^                           ^^^^^^^^^^^^^^^
#  @ file reference!               keep shell open after Claude exits

# Step 3: Save session state
mkdir -p "$(dirname "$STATE_FILE")"
cat > "$STATE_FILE" <<EOF
{
  "sessionId": "$SESSION_ID",
  "tmuxSession": "$TMUX_SESSION",
  "worktreePath": "$WORKTREE_PATH",
  "branch": "$BRANCH",
  "startedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "active"
}
EOF

# Step 4: Output session info (captured by MCP server)
echo "$TMUX_SESSION"

# Done! Session is running in background
exit 0
```

**Key Features:**

1. **File Reference:** `claude "Implement the plan in @$PROMPT_FILE"`
   - Atomic operation (Claude CLI handles @ references)
   - No buffer limits
   - Guaranteed delivery
   - No escaping issues
   - Natural language instruction + file reference

2. **Idempotent Worktree Creation:**
   - Checks if worktree exists before creating
   - Creates branch if needed
   - Safe to run multiple times

3. **Fire-and-Forget:**
   - `tmux new-session -d` detaches immediately
   - Script exits in < 5 seconds
   - Session runs independently in background

4. **Shell Preservation:**
   - `exec bash` keeps shell open after Claude exits
   - User can attach and see output/errors
   - No lost sessions

5. **State Management:**
   - Writes state file to worktree
   - JSON format for easy parsing
   - MCP server can read independently

### Component 2: Updated TypeScript Service

**File:** `flux-capacitor/mcp-server/src/services/session.service.ts`

```typescript
/**
 * Session service (REDESIGNED)
 * Atomic session launcher using external script
 */

export class SessionService {
  static async launchSession(
    params: LaunchSessionParams
  ): Promise<LaunchSessionResult> {

    const { worktreePath, prompt, contextFiles, agentName } = params;

    // 1. Generate session ID
    const sessionId = this.generateSessionId(worktreePath);

    // 2. Create prompt file
    const promptFile = await this.createPromptFile(
      worktreePath,
      prompt,
      agentName,
      contextFiles
    );

    // 3. Determine repository and worktree info
    const gitService = getGitService();
    const repoPath = await gitService.getRepositoryRoot(worktreePath);
    const worktreeName = path.basename(worktreePath);
    const branch = await gitService.getCurrentBranch(worktreePath) ||
                   `feature/${sessionId}`;

    // 4. Build script parameters
    const scriptPath = path.join(__dirname, '../scripts/launch-claude-session.sh');
    const scriptArgs = [
      '--repo-path', repoPath,
      '--branch', branch,
      '--worktree-name', worktreeName,
      '--prompt-file', promptFile,
      '--session-id', sessionId,
    ];

    try {
      // 5. Execute script (fire-and-forget)
      logger.info('Launching session via script', { sessionId, scriptPath });
      const result = await execa(scriptPath, scriptArgs, {
        timeout: 30000, // 30s max for git operations
      });

      const tmuxSession = result.stdout.trim();
      logger.info('Session launched', { sessionId, tmuxSession });

      // 6. Save session to state
      const session: Session = {
        sessionId,
        worktreePath,
        tmuxSession,
        branch,
        status: 'active',
        startedAt: new Date(),
        agentName,
        prompt,
      };

      const stateService = getStateService();
      await stateService.saveSession(session);

      // 7. Return immediately
      return {
        sessionId,
        tmuxSession,
        status: 'launched',
      };

    } catch (error) {
      logger.error('Session launch failed', error);
      return {
        sessionId,
        tmuxSession: '',
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Get session status (UPDATED)
   */
  static async getSessionStatus(sessionId: string): Promise<Session | null> {
    const stateService = getStateService();
    await stateService.init();

    const session = await stateService.getSession(sessionId);
    if (!session) return null;

    // Check if tmux session exists (native tmux)
    try {
      await execa('tmux', ['has-session', '-t', session.tmuxSession]);
      // Session exists
    } catch {
      // Session died
      if (session.status === 'active') {
        await stateService.updateSessionStatus(sessionId, 'terminated');
        session.status = 'terminated';
        session.completedAt = new Date();
      }
    }

    return session;
  }

  /**
   * Get recent output from session (UPDATED)
   */
  static async getSessionOutput(sessionId: string): Promise<string | null> {
    const session = await this.getSessionStatus(sessionId);
    if (!session) return null;

    try {
      // Capture last 100 lines from tmux pane (native tmux)
      const result = await execa('tmux', [
        'capture-pane',
        '-t', session.tmuxSession,
        '-p',        // print to stdout
        '-S', '-100' // last 100 lines
      ]);
      return result.stdout;
    } catch (error) {
      logger.error(`Failed to capture output for session ${sessionId}`, error);
      return null;
    }
  }

  /**
   * Terminate session (UPDATED)
   */
  static async terminateSession(sessionId: string): Promise<boolean> {
    const session = await this.getSessionStatus(sessionId);
    if (!session) {
      throw new SessionError(`Session not found: ${sessionId}`, 'SESSION_NOT_FOUND');
    }

    if (session.status !== 'active') {
      return false;
    }

    try {
      // Kill tmux session (native tmux)
      await execa('tmux', ['kill-session', '-t', session.tmuxSession]);

      // Update status
      const stateService = getStateService();
      await stateService.updateSessionStatus(sessionId, 'terminated');

      logger.info('Session terminated', { sessionId });
      return true;
    } catch (error) {
      logger.error('Failed to terminate session', error);
      return false;
    }
  }
}
```

**Key Changes:**

1. ✅ **Removed tmux-cli dependency** - Use native `tmux` commands
2. ✅ **Script-based launching** - Single atomic operation
3. ✅ **Fire-and-forget** - Returns immediately after script launch
4. ✅ **Native tmux integration** - Simpler, more reliable
5. ✅ **Output capture** - Direct tmux capture-pane usage

### Component 3: Updated Type Definitions

**File:** `flux-capacitor/mcp-server/src/types/index.ts`

```typescript
export interface Session {
  sessionId: string;
  worktreePath: string;
  tmuxSession: string;      // Changed from: tmuxPaneId
  branch: string;           // Added: track branch name
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
  lastActivity?: Date;
  agentName?: string;
  prompt: string;
}

export interface LaunchSessionResult {
  sessionId: string;
  tmuxSession: string;      // Changed from: tmuxPaneId
  status: 'launched' | 'failed';
  error?: string;
}
```

**Breaking Changes:**
- `tmuxPaneId` → `tmuxSession` (more accurate naming)
- Added `branch` field to Session
- Removed `terminalPid`, `terminalApp` (no longer used)

### User Interaction Model

**Before (Current):**
```
User: /run MEM-123

flux-capacitor:
  ⏳ Launching shell in tmux...
  ⏳ Waiting for shell to become idle...
  ⏳ Changing directory...
  ⏳ Waiting for directory change...
  ⏳ Starting Claude Code...
  ⏳ Waiting for Claude to start (up to 30s)...
  ⏳ Typing prompt (5000 characters)...
  [30+ seconds later]
  ✓ Session launched (maybe, if nothing timed out)
```

**After (Proposed):**
```
User: /run MEM-123

flux-capacitor:
  ✓ Worktree created: /Users/alice/projects/my-app-mem-123
  ✓ Session launched: flux-sess_my-app-mem-123_1730890123_abc123

  Monitor live: tmux attach -t flux-sess_my-app-mem-123_1730890123_abc123
  Detach: Ctrl-B D
  Status: /flux-capacitor-status sess_my-app-mem-123_1730890123_abc123

[< 5 seconds total]
```

**Monitor Session:**
```bash
# Attach to view Claude Code live
tmux attach -t flux-sess_my-app-mem-123_1730890123_abc123

# Now viewing Claude Code in action
# Press Ctrl-B D to detach without stopping
```

**Check Status Programmatically:**
```
User: How's the MEM-123 session doing?

flux-capacitor: [calls get_session_status]
  Session: sess_my-app-mem-123_1730890123_abc123
  Status: active
  Tmux session: flux-sess_my-app-mem-123_1730890123_abc123
  Branch: feature/mem-123-add-oauth
  Started: 12 minutes ago
  Last activity: 2 minutes ago

  Recent output (last 50 lines):
  ───────────────────────────────────────
  > Created authentication service
  > Running tests...
  ✓ 45 tests passed
  > Implementing OAuth flow...
  ───────────────────────────────────────
```

---

## Implementation Plan

### Phase 1: Script Development & Testing (Day 1)

**Goal:** Create and validate atomic launch script independently

**Tasks:**

1. **Create Launch Script**
   - File: `flux-capacitor/mcp-server/scripts/launch-claude-session.sh`
   - Features:
     - Parameter validation
     - Git worktree creation (idempotent)
     - Tmux session creation with @ file reference
     - State file creation
     - Error handling and logging
   - Make executable: `chmod +x launch-claude-session.sh`

2. **Test Script Independently** (without MCP server)
   ```bash
   # Create test prompt
   echo "List all files in the current directory" > /tmp/test-prompt.md

   # Run script
   ./scripts/launch-claude-session.sh \
     --repo-path /Users/dylan/projects/claude-swarm/pulse \
     --branch feature/test-script-launch \
     --worktree-name pulse-test-script \
     --prompt-file /tmp/test-prompt.md \
     --session-id test_$(date +%s)

   # Verify tmux session created
   tmux ls | grep flux-test

   # Attach and interact
   tmux attach -t flux-test_...

   # Verify Claude received prompt and is working
   # Press Ctrl-B D to detach

   # Clean up
   tmux kill-session -t flux-test_...
   ```

3. **Create Helper Scripts**
   - `scripts/attach-session.sh <session-id>` - Attach to session by ID
   - `scripts/kill-session.sh <session-id>` - Kill session by ID
   - `scripts/list-sessions.sh` - List all flux sessions
   - `scripts/cleanup-all-sessions.sh` - Clean up all flux sessions (dev tool)

4. **Test Edge Cases**
   - Worktree already exists
   - Branch already exists
   - Invalid repository path
   - Missing prompt file
   - Prompt file with special characters
   - Large prompt file (>10KB)
   - Tmux not installed
   - Git errors (permissions, conflicts)

**Success Criteria:**
- ✅ Script executes in < 5 seconds
- ✅ Tmux session created with Claude running
- ✅ Prompt delivered via @ file reference successfully
- ✅ Can attach/detach freely
- ✅ State file created correctly
- ✅ Error cases handled gracefully

### Phase 2: TypeScript Integration (Day 2)

**Goal:** Integrate script with MCP server, remove tmux-cli

**Tasks:**

1. **Update Type Definitions**
   - File: `src/types/index.ts`
   - Changes:
     - `tmuxPaneId: string` → `tmuxSession: string`
     - Add `branch: string` to Session
     - Remove `terminalPid`, `terminalApp` (no longer used)
   - Update all type consumers

2. **Rewrite session.service.ts**
   - Replace multi-step tmux approach with script execution
   - Use `execa` to run `launch-claude-session.sh`
   - Remove all `tmuxService` calls
   - Keep state management logic
   - Update `generateSessionId()` to be more readable
   - Update `createPromptFile()` (no changes needed)
   - New: `launchSession()` - script-based
   - New: `getSessionStatus()` - native tmux `has-session`
   - New: `getSessionOutput()` - native tmux `capture-pane`
   - New: `terminateSession()` - native tmux `kill-session`

3. **Remove tmux-cli Dependencies**
   - Delete: `src/services/tmux.service.ts` (no longer needed)
   - Update: `package.json` - remove claude-code-tools dependency
   - Update: All imports referencing TmuxService

4. **Update get-session-status.ts**
   ```typescript
   // Check if tmux session exists (native tmux)
   try {
     await execa('tmux', ['has-session', '-t', session.tmuxSession]);
     // Session exists
   } catch {
     // Session died
   }

   // Capture output (native tmux)
   const output = await execa('tmux', [
     'capture-pane',
     '-t', session.tmuxSession,
     '-p',        // print to stdout
     '-S', '-100' // last 100 lines
   ]);
   ```

5. **Update cleanup-worktree.ts**
   ```typescript
   // Kill tmux session before removing worktree
   const sessions = await SessionService.findSessionsByWorktree(worktreePath);
   for (const session of sessions) {
     if (session.tmuxSession) {
       await execa('tmux', ['kill-session', '-t', session.tmuxSession]);
     }
   }
   ```

6. **Update launch-session.ts Tool**
   - Update tool description (mention @ file reference)
   - Update input schema (remove terminalApp option)
   - Update response format (tmuxSession instead of tmuxPaneId)

**Success Criteria:**
- ✅ MCP server builds without errors
- ✅ launch_session tool uses script approach
- ✅ get_session_status checks tmux session correctly
- ✅ cleanup_worktree kills tmux sessions
- ✅ No references to tmux-cli remain

### Phase 3: Testing & Documentation (Day 3)

**Goal:** Comprehensive testing and documentation updates

**Tasks:**

1. **Unit Tests**
   - Test `generateSessionId()` uniqueness
   - Test `createPromptFile()` with various prompts
   - Test state management (save/load sessions)
   - Mock script execution for unit tests

2. **Integration Tests**
   ```bash
   # Test full workflow:
   cd pulse

   # 1. Launch session
   /run TEST-001

   # 2. Verify tmux session exists
   tmux ls | grep flux-

   # 3. Attach and verify Claude is running
   tmux attach -t flux-...
   # (Ctrl-B D to detach)

   # 4. Check status
   /flux-capacitor-status sess_...

   # 5. Cleanup
   /flux-capacitor-cleanup TEST-001

   # 6. Verify cleanup
   tmux ls | grep flux-  # Should be empty
   ```

3. **Error Scenario Testing**
   - Invalid repository path
   - Missing prompt file
   - Git errors (branch exists, worktree exists)
   - Tmux not available
   - Permissions issues
   - Script not executable
   - Disk full (prompt file creation fails)

4. **Performance Testing**
   - Measure script execution time (should be < 5s)
   - Test with large prompts (10KB, 50KB, 100KB)
   - Test with many concurrent sessions (10+)
   - Memory usage monitoring

5. **Update Documentation**

   **flux-capacitor Agent (agents/flux-capacitor.md):**
   - Update workspace orchestrator section
   - Change tmux-cli references to native tmux
   - Update session monitoring instructions
   - Add @ file reference explanation

   **MCP Tool Documentation (tools/*.ts):**
   - Update launch_session tool description
   - Explain @ file reference approach
   - Update examples

   **README.md:**
   - Update prerequisites (tmux instead of tmux-cli)
   - Add troubleshooting section
   - Add "How It Works" section explaining script approach

   **User Guide:**
   - How to monitor sessions (`tmux attach`)
   - How to detach (`Ctrl-B D`)
   - How to list sessions (`tmux ls | grep flux-`)
   - How to kill sessions manually if needed

6. **Create Troubleshooting Guide**
   ```markdown
   ## Troubleshooting

   ### Session launch fails
   - Check tmux is installed: `tmux -V`
   - Check script is executable: `ls -la scripts/launch-claude-session.sh`
   - Check git repository is valid: `git status`

   ### Cannot attach to session
   - List sessions: `tmux ls | grep flux-`
   - Check session exists: `tmux has-session -t flux-{session-id}`

   ### Orphaned sessions after cleanup
   - List all flux sessions: `tmux ls | grep flux-`
   - Kill manually: `tmux kill-session -t flux-{session-id}`
   - Or kill all: `tmux ls | grep flux- | cut -d: -f1 | xargs -I {} tmux kill-session -t {}`
   ```

**Success Criteria:**
- ✅ All tests pass
- ✅ Error cases handled gracefully
- ✅ Documentation comprehensive and accurate
- ✅ Troubleshooting guide covers common issues

### Phase 4: Build, Bundle & Release (Day 4)

**Goal:** Package and release new version

**Tasks:**

1. **Update Build Configuration**

   **package.json:**
   ```json
   {
     "name": "flux-capacitor-mcp",
     "version": "1.3.0",
     "dependencies": {
       // Remove: "claude-code-tools"
       "execa": "^8.0.1",
       "simple-git": "^3.20.0",
       // ... other deps
     }
   }
   ```

   **tsup.config.ts:**
   ```typescript
   export default defineConfig({
     entry: ['src/index.ts'],
     format: ['cjs'],
     bundle: true,
     minify: false,
     sourcemap: true,
     noExternal: [/.*/],  // Bundle all dependencies

     // NEW: Copy scripts directory to dist
     onSuccess: async () => {
       await fs.copy('scripts/', 'dist/scripts/');
       await fs.chmod('dist/scripts/launch-claude-session.sh', 0o755);
     }
   });
   ```

2. **Verify Bundle**
   ```bash
   cd flux-capacitor/mcp-server
   npm run build

   # Verify scripts are in dist/
   ls -la dist/scripts/

   # Verify script is executable
   ls -la dist/scripts/launch-claude-session.sh

   # Test bundled version
   node dist/index.cjs
   ```

3. **Update Version Numbers**

   **flux-capacitor/mcp-server/package.json:**
   ```json
   { "version": "1.3.0" }
   ```

   **flux-capacitor/.claude-plugin/plugin.json:**
   ```json
   { "version": "1.3.0" }
   ```

   **claude-code-plugins/.claude-plugin/marketplace.json:**
   ```json
   {
     "plugins": [
       {
         "name": "flux-capacitor",
         "version": "1.3.0",
         // ...
       }
     ]
   }
   ```

4. **Update CHANGELOG**

   **flux-capacitor/CHANGELOG.md:**
   ```markdown
   # Changelog

   ## [1.3.0] - 2025-11-06

   ### Changed
   - **BREAKING**: Migrated to atomic script-based session launcher
   - **BREAKING**: Replaced tmux-cli with native tmux (more reliable)
   - **BREAKING**: Session state format changed (tmuxPaneId → tmuxSession)
   - Removed tmux-cli dependency (uv tool install no longer needed)

   ### Added
   - Atomic launch-claude-session.sh script for reliable session creation
   - Claude CLI @ file references for guaranteed prompt delivery
   - Fire-and-forget session launching (no blocking on startup)
   - Native tmux integration (simpler, faster, more reliable)
   - Helper scripts: attach-session.sh, kill-session.sh, list-sessions.sh

   ### Fixed
   - Race conditions in session startup (no more waitIdle timeouts)
   - Prompt delivery failures with large prompts (now using @ file reference)
   - Timeout issues with slow Claude Code startup
   - Orphaned tmux panes on launch errors
   - Blocked MCP server during long session launches

   ### Removed
   - tmux-cli dependency and TmuxService (replaced with native tmux)
   - Multi-step interactive session launch (replaced with atomic script)
   - Hardcoded timeout values (no longer needed)

   ### Migration Guide

   **For Users:**
   1. Ensure `tmux` is installed (built-in on macOS, `apt install tmux` on Linux)
   2. Update to flux-capacitor v1.3.0: `/plugin update flux-capacitor`
   3. Old sessions can be manually cleaned: `tmux ls | grep flux- | cut -d: -f1 | xargs -I {} tmux kill-session -t {}`

   **For Developers:**
   - Session state now uses `tmuxSession` instead of `tmuxPaneId`
   - Use native tmux commands: `tmux has-session`, `tmux capture-pane`, `tmux kill-session`
   - Script can be tested independently: `./scripts/launch-claude-session.sh --help`

   ## [1.2.1] - 2025-11-03

   ### Fixed
   - Shell escaping bug in session launcher
   - Process termination bug in cleanup_worktree

   ## [1.2.0] - 2025-11-03

   ### Added
   - Tmux-based session management
   - Session monitoring and output capture

   ...
   ```

5. **End-to-End Testing**
   ```bash
   # Install from local marketplace
   cd claude-swarm
   /plugin marketplace add $(pwd)/claude-code-plugins
   /plugin install flux-capacitor@applab-plugins

   # Test full workflow
   cd pulse
   /run TEST-E2E

   # Verify session created
   tmux ls | grep flux-

   # Attach and verify Claude running
   tmux attach -t flux-...
   # (Ctrl-B D to detach)

   # Check status
   /flux-capacitor-status sess_...

   # Clean up
   /flux-capacitor-cleanup TEST-E2E

   # Verify cleanup
   tmux ls | grep flux-  # Should be empty
   ```

6. **Create Release**
   ```bash
   cd claude-code-plugins

   # Stage changes
   git add flux-capacitor/

   # Commit
   git commit -m "Release flux-capacitor v1.3.0 - Atomic script-based session launcher

   - Migrated to atomic script-based session launcher for 100% reliability
   - Replaced tmux-cli with native tmux (simpler, faster)
   - Claude CLI @ file references for guaranteed prompt delivery
   - Fire-and-forget session launching (no blocking)
   - Fixed race conditions, timeouts, and prompt delivery failures

   Breaking changes:
   - Requires native tmux instead of tmux-cli
   - Session state format changed (tmuxPaneId → tmuxSession)

   See CHANGELOG.md for full migration guide."

   # Tag release
   git tag v1.3.0

   # Push
   git push origin main
   git push origin v1.3.0
   ```

**Success Criteria:**
- ✅ Build completes without errors
- ✅ Bundle includes scripts directory
- ✅ Scripts are executable in bundle
- ✅ Version numbers consistent across all manifests
- ✅ CHANGELOG comprehensive and accurate
- ✅ End-to-end test passes
- ✅ Release tagged and pushed

---

## Migration Strategy

### For End Users

**Prerequisites:**
- Ensure `tmux` is installed (built-in on macOS)
  ```bash
  tmux -V  # Should show version 2.0+
  ```

**Migration Steps:**

1. **Update Plugin**
   ```bash
   /plugin update flux-capacitor
   ```

2. **Clean Up Old Sessions** (optional)
   ```bash
   # List old tmux-cli sessions
   tmux ls

   # Kill flux-capacitor sessions (if any)
   tmux ls | grep flux- | cut -d: -f1 | xargs -I {} tmux kill-session -t {}
   ```

3. **Test New Version**
   ```bash
   /run TEST-MIGRATION
   # Verify session launches successfully
   # Attach and verify Claude running: tmux attach -t flux-...
   # Detach: Ctrl-B D
   ```

**What Changes for Users:**

- ✅ **No more `uv tool install claude-code-tools`** - Just use native tmux
- ✅ **Faster session launches** - < 5 seconds vs 30+ seconds
- ✅ **More reliable** - No timeout failures
- ✅ **Better monitoring** - Native tmux commands work
- ⚠️ **Attach command changed**:
  - Old: `tmux-cli attach`
  - New: `tmux attach -t flux-{session-id}`

### For Developers

**Breaking Changes:**

1. **Type Definitions**
   ```typescript
   // Before:
   interface Session {
     tmuxPaneId: string;
     terminalPid: number;
     terminalApp: TerminalApp;
   }

   // After:
   interface Session {
     tmuxSession: string;
     branch: string;
   }
   ```

2. **Session Status Check**
   ```typescript
   // Before:
   const paneExists = await tmuxService.paneExists(session.tmuxPaneId);

   // After:
   try {
     await execa('tmux', ['has-session', '-t', session.tmuxSession]);
     // Session exists
   } catch {
     // Session died
   }
   ```

3. **Output Capture**
   ```typescript
   // Before:
   const output = await tmuxService.capture(session.tmuxPaneId);

   // After:
   const result = await execa('tmux', [
     'capture-pane', '-t', session.tmuxSession, '-p', '-S', '-100'
   ]);
   const output = result.stdout;
   ```

4. **Session Termination**
   ```typescript
   // Before:
   await tmuxService.kill(session.tmuxPaneId);

   // After:
   await execa('tmux', ['kill-session', '-t', session.tmuxSession]);
   ```

**Migration Script:**

```typescript
// scripts/migrate-state.ts
// Migrate old session state to new format

import { getStateService } from './src/services/state.service.js';

async function migrate() {
  const stateService = getStateService();
  await stateService.init();

  const sessions = await stateService.listSessions();

  for (const session of sessions) {
    if (session.tmuxPaneId && !session.tmuxSession) {
      // Old format - mark as terminated
      await stateService.updateSessionStatus(session.sessionId, 'terminated');
      console.log(`Marked old session as terminated: ${session.sessionId}`);
    }
  }

  // Clean up old completed sessions
  const cleaned = await stateService.cleanupOldSessions(7); // 7 days
  console.log(`Cleaned up ${cleaned} old sessions`);
}

migrate().catch(console.error);
```

---

## Success Criteria

### Functional Requirements

✅ **Session Launch**
- Script executes successfully in < 5 seconds
- Claude Code starts with prompt delivered via @ file reference
- No race conditions or timeout failures
- Works with prompts of any size (tested up to 100KB)

✅ **Session Monitoring**
- User can attach to tmux session: `tmux attach -t flux-{id}`
- User can detach without stopping: `Ctrl-B D`
- `get_session_status` returns accurate state
- Output capture works reliably (last N lines)

✅ **Session Cleanup**
- `cleanup_worktree` kills tmux session cleanly
- No orphaned processes or sessions
- State management updates correctly

✅ **Error Handling**
- Invalid inputs produce clear error messages
- Git errors handled gracefully
- Tmux errors handled gracefully
- Partial failures don't leave orphaned resources

✅ **Full Workflow**
- flux-capacitor agent workflow works end-to-end
- Issue tracker integration works
- Worktree creation + session launch successful
- User can monitor progress
- Cleanup works correctly

### Non-Functional Requirements

✅ **Performance**
- Session launch: < 5 seconds
- Script execution: < 3 seconds
- State save/load: < 100ms

✅ **Reliability**
- 100% prompt delivery success rate
- 0% race condition failures
- 0% timeout failures
- No orphaned processes on errors

✅ **Maintainability**
- Script can be tested independently
- Clear separation of concerns
- Native tmux (no extra dependencies)
- Comprehensive documentation

✅ **Usability**
- Clear user feedback
- Simple monitoring (native tmux commands)
- Easy troubleshooting
- Good error messages

---

## Risk Analysis

### Risk 1: Tmux Not Installed

**Probability:** Low (built-in on macOS, common on Linux)
**Impact:** High (session launch fails completely)

**Mitigation:**
- Check for tmux in script: `command -v tmux >/dev/null 2>&1`
- Provide clear error message with installation instructions
- Document prerequisite in README and agent instructions
- Fail fast with helpful error

**Detection:**
```bash
# In launch-claude-session.sh
if ! command -v tmux >/dev/null 2>&1; then
  echo "ERROR: tmux is not installed."
  echo "Install tmux:"
  echo "  macOS: tmux is built-in (or: brew install tmux)"
  echo "  Ubuntu/Debian: sudo apt install tmux"
  echo "  Fedora: sudo dnf install tmux"
  exit 1
fi
```

### Risk 2: Script Permissions in Bundled Distribution

**Probability:** Medium (tsup may not preserve execute bit)
**Impact:** High (script won't run)

**Mitigation:**
- Set executable in tsup onSuccess hook: `fs.chmod(..., 0o755)`
- Test bundled distribution before release
- Add verification script: `npm run bundle:verify`
- Document manual fix if needed: `chmod +x dist/scripts/*.sh`

**Verification:**
```bash
# In bundle:verify script
if [[ ! -x "dist/scripts/launch-claude-session.sh" ]]; then
  echo "ERROR: Script not executable"
  exit 1
fi
```

### Risk 3: Breaking Changes Affect Existing Users

**Probability:** High (type changes, behavior changes)
**Impact:** Medium (users need to update, old sessions won't work)

**Mitigation:**
- Clear migration guide in CHANGELOG
- Major version bump to signal breaking changes (v1.3.0 or v2.0.0)
- Provide migration script for state cleanup
- Document changes in flux-capacitor agent instructions
- Test upgrade path with existing installations

**Communication:**
```markdown
## Migration Required

flux-capacitor v1.3.0 includes breaking changes:

1. tmux-cli → native tmux (simpler, no install needed)
2. Session state format changed
3. Old sessions must be cleaned up manually

See CHANGELOG.md for full migration guide.
```

### Risk 4: Prompt File Path Issues (Spaces, Special Characters)

**Probability:** Medium (users may have complex paths)
**Impact:** Medium (session launch fails)

**Mitigation:**
- Proper quoting in bash script: `"$VARIABLE"`
- Validation in TypeScript before calling script
- Test with edge case paths (spaces, quotes, unicode)
- Clear error messages if path invalid

**Testing:**
```bash
# Test cases:
- /tmp/test prompt.md           # Space in filename
- /tmp/test\ prompt.md          # Escaped space
- /tmp/test'prompt.md           # Single quote
- /tmp/test"prompt.md           # Double quote
- /tmp/tëst-prømpt.md          # Unicode
```

### Risk 5: Git Worktree Conflicts

**Probability:** Medium (worktree may already exist)
**Impact:** Low (script handles gracefully)

**Mitigation:**
- Idempotent worktree creation (check before creating)
- Clear error messages for git conflicts
- Document expected behavior
- Allow reusing existing worktrees

**Handling:**
```bash
# In script
if [[ -d "$WORKTREE_PATH" ]]; then
  echo "Worktree already exists: $WORKTREE_PATH"
  echo "Reusing existing worktree"
  # Continue with session creation
fi
```

### Risk 6: File Reference Compatibility

**Probability:** Very Low (@ references are standard Claude CLI feature)
**Impact:** High (prompt not delivered)

**Mitigation:**
- Test with various prompt sizes
- Test with various prompt content (special chars, unicode)
- Verify Claude CLI @ references work correctly
- Test with different file path formats

**Verification:**
```bash
# Test @ file reference
echo "This is a test plan" > /tmp/test-plan.md
claude "Implement the plan in @/tmp/test-plan.md"
# Should read and process the file contents
```

### Risk 7: Performance Regression with Large Prompts

**Probability:** Very Low (@ references read files efficiently)
**Impact:** Low (slightly slower launch)

**Mitigation:**
- Benchmark with various prompt sizes (1KB, 10KB, 50KB, 100KB)
- Optimize prompt file creation if needed
- Set reasonable timeout (30s for git operations)
- Document expected performance

**Expected Performance:**
- Small prompt (<1KB): < 3 seconds
- Medium prompt (10KB): < 5 seconds
- Large prompt (100KB): < 10 seconds

---

## Appendix A: Script Reference

### launch-claude-session.sh

**Purpose:** Atomic session launcher for Claude Code

**Parameters:**
- `--repo-path <path>` - Main repository path (required)
- `--branch <name>` - Feature branch name (required)
- `--worktree-name <name>` - Worktree directory name (required)
- `--prompt-file <path>` - Path to prompt file (required)
- `--session-id <id>` - Unique session identifier (required)
- `--base-branch <name>` - Base branch for new branches (optional, default: main)

**Output:**
- Stdout: Tmux session name (e.g., `flux-sess_123_abc`)
- Exit code: 0 on success, 1 on failure

**Side Effects:**
- Creates git worktree (if not exists)
- Creates git branch (if not exists)
- Creates tmux session (detached)
- Writes state file to `{worktree}/.claude/session-state.json`

**Example:**
```bash
./launch-claude-session.sh \
  --repo-path /Users/alice/projects/my-app \
  --branch feature/mem-123 \
  --worktree-name my-app-mem-123 \
  --prompt-file /tmp/prompt.md \
  --session-id sess_123_abc
```

### attach-session.sh

**Purpose:** Attach to a flux-capacitor session

**Usage:**
```bash
./attach-session.sh <session-id>
```

**Implementation:**
```bash
#!/bin/bash
SESSION_ID=$1
TMUX_SESSION="flux-$SESSION_ID"
tmux attach -t "$TMUX_SESSION"
```

### kill-session.sh

**Purpose:** Kill a flux-capacitor session

**Usage:**
```bash
./kill-session.sh <session-id>
```

**Implementation:**
```bash
#!/bin/bash
SESSION_ID=$1
TMUX_SESSION="flux-$SESSION_ID"
tmux kill-session -t "$TMUX_SESSION"
```

### list-sessions.sh

**Purpose:** List all flux-capacitor sessions

**Usage:**
```bash
./list-sessions.sh
```

**Implementation:**
```bash
#!/bin/bash
tmux ls 2>/dev/null | grep '^flux-' || echo "No flux-capacitor sessions found"
```

---

## Appendix B: Type Definitions

### Session

```typescript
interface Session {
  // Unique session identifier
  sessionId: string;

  // Absolute path to worktree
  worktreePath: string;

  // Tmux session name (e.g., "flux-sess_123_abc")
  tmuxSession: string;

  // Git branch name
  branch: string;

  // Session status
  status: 'active' | 'completed' | 'failed' | 'terminated';

  // Timestamps
  startedAt: Date;
  completedAt?: Date;
  lastActivity?: Date;

  // Optional agent name
  agentName?: string;

  // Initial prompt
  prompt: string;
}
```

### LaunchSessionParams

```typescript
interface LaunchSessionParams {
  // Absolute path to worktree
  worktreePath: string;

  // Initial prompt for Claude Code
  prompt: string;

  // Optional context files to include
  contextFiles?: string[];

  // Optional agent name
  agentName?: string;
}
```

### LaunchSessionResult

```typescript
interface LaunchSessionResult {
  // Unique session identifier
  sessionId: string;

  // Tmux session name
  tmuxSession: string;

  // Launch status
  status: 'launched' | 'failed';

  // Error message (if failed)
  error?: string;
}
```

---

## Appendix C: Testing Checklist

### Unit Tests

- [ ] `generateSessionId()` returns unique IDs
- [ ] `generateSessionId()` includes worktree name
- [ ] `createPromptFile()` writes correct content
- [ ] `createPromptFile()` includes agent name if provided
- [ ] `createPromptFile()` includes context files if provided
- [ ] State service saves sessions correctly
- [ ] State service loads sessions correctly
- [ ] State service updates status correctly

### Integration Tests

- [ ] Launch session with issue key
- [ ] Launch session with description
- [ ] Launch session with large prompt (10KB+)
- [ ] Attach to session and verify Claude running
- [ ] Detach from session (Ctrl-B D)
- [ ] Check session status while running
- [ ] Capture session output
- [ ] Complete session and verify status update
- [ ] Cleanup session and verify tmux killed
- [ ] Cleanup worktree and verify removed

### Error Scenario Tests

- [ ] Invalid repository path
- [ ] Missing prompt file
- [ ] Prompt file with spaces in path
- [ ] Prompt file with special characters
- [ ] Branch already exists
- [ ] Worktree already exists
- [ ] Tmux not installed
- [ ] Git errors (permissions)
- [ ] Disk full (prompt file creation)
- [ ] Script not executable
- [ ] Concurrent session launches

### Performance Tests

- [ ] Session launch < 5 seconds
- [ ] Script execution < 3 seconds
- [ ] Small prompt (1KB) < 3 seconds
- [ ] Medium prompt (10KB) < 5 seconds
- [ ] Large prompt (100KB) < 10 seconds
- [ ] 10 concurrent sessions work correctly
- [ ] Memory usage reasonable (< 100MB per session)

### End-to-End Tests

- [ ] Full flux-capacitor workflow with Linear
- [ ] Full flux-capacitor workflow without Linear
- [ ] Issue key mode (`/run MEM-123`)
- [ ] Description mode (`/run Add feature`)
- [ ] Session monitoring during execution
- [ ] Session completion and status update
- [ ] PR creation after completion
- [ ] Cleanup after merge

---

## Appendix D: Documentation Updates

### Files to Update

1. **flux-capacitor/agents/flux-capacitor.md**
   - Update workspace orchestrator section
   - Change tmux-cli references to native tmux
   - Update session monitoring instructions
   - Add @ file reference explanation

2. **flux-capacitor/README.md**
   - Update prerequisites (tmux instead of tmux-cli)
   - Add "How It Works" section
   - Add troubleshooting section
   - Update installation instructions

3. **flux-capacitor/CHANGELOG.md**
   - Add v1.3.0 entry with breaking changes
   - Migration guide
   - Full list of changes

4. **flux-capacitor/mcp-server/README.md**
   - Update development instructions
   - Add script testing instructions
   - Update dependencies list

5. **claude-code-plugins/README.md**
   - Update flux-capacitor description
   - Update prerequisites

### New Documentation

1. **flux-capacitor/docs/TROUBLESHOOTING.md**
   - Common issues and solutions
   - Manual cleanup instructions
   - Debug tips

2. **flux-capacitor/docs/ARCHITECTURE.md**
   - Explain script-based approach
   - Diagram of components
   - Explain @ file reference approach

3. **flux-capacitor/docs/MIGRATION-1.3.md**
   - Step-by-step migration guide
   - Breaking changes explained
   - Before/after comparisons

---

## Conclusion

This redesign addresses fundamental reliability issues in the flux-capacitor's tmux session management by:

1. **Eliminating race conditions** - No more timeout-based waiting
2. **Guaranteeing prompt delivery** - Claude CLI @ file references are atomic and reliable
3. **Simplifying architecture** - Single script vs multi-step coordination
4. **Improving observability** - Native tmux commands for monitoring
5. **Reducing dependencies** - Native tmux instead of tmux-cli
6. **Enabling fire-and-forget** - MCP server doesn't block on session launch

The proposed solution is simpler, more reliable, and easier to maintain than the current implementation. The script-based approach provides clear separation of concerns and enables independent testing and debugging.

**Estimated Implementation Time:** 3-4 days
**Risk Level:** Medium (breaking changes, but clear migration path)
**Value:** High (significantly improved reliability and user experience)

**Recommendation:** Proceed with implementation.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-06
**Status:** Ready for Review
