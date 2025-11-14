# Flux Capacitor - Robustness Improvements

## Problem Statement
The flux-capacitor system encountered interactive shell prompts (specifically dotenv plugin) that blocked automated Claude Code startup in isolated worktrees.

## Root Causes
1. **Interactive dotenv prompt**: Shell plugin asking for user confirmation to source .env files
2. **Shell initialization**: Standard shell startup files (.zshrc, .bashrc) running in tmux sessions
3. **No error detection**: System couldn't detect when Claude failed to start
4. **Missing environment isolation**: Worktrees inherited all interactive shell behaviors

## Solution: 5-Layer Defense-in-Depth

### Layer 1: Environment Variables (Prevention)
**File**: `launch-session.sh:55-58, 93-96`

Set environment variables before launching Claude to disable interactive prompts:
```bash
export DOTENV_CONFIG_SILENT=1        # Silence dotenv prompts
export FLUX_CAPACITOR_MODE=1         # Signal non-interactive context
export ZSH_DOTENV_PROMPT=false       # Disable zsh dotenv plugin prompts
```

**Benefits**:
- Prevents prompts before they appear
- Works with most dotenv implementations
- Clean, declarative approach

### Layer 2: Pre-Answer Prompts (Mitigation)
**File**: `launch-session.sh:60-64, 109-113`

If prompts still appear, automatically answer them:
```bash
tmux send-keys -t "$target" -l "a"   # Send 'a' (always) to dotenv prompt
sleep 0.2                             # Brief pause for prompt processing
send_keys_to_target "$target" "claude --dangerously-skip-permissions"
```

**Benefits**:
- Handles cases where env vars don't propagate in time
- Gracefully degrades if Layer 1 fails
- No harm if prompt doesn't appear (just sends 'a' character)

### Layer 3: Worktree-Specific Configuration (Isolation)
**File**: `.worktree-init/00-disable-dotenv-prompts.sh`

Create `.zshenv` and `.envrc` files in each worktree:
```bash
# .zshenv loads BEFORE .zshrc, setting vars early
export DOTENV_CONFIG_SILENT=1
export ZSH_DOTENV_PROMPT=false
export FLUX_CAPACITOR_MODE=1
```

**Benefits**:
- Isolates worktree environment from user's main shell
- Catches prompts even before tmux session starts
- Persists across shell restarts in the worktree

### Layer 4: Improved Worktree Initialization
**File**: `lib/worktree-utils.sh:47-61`

Fixed init script parameter passing:
```bash
# Now passes source repo path to all init scripts
"$script" "$git_root" || log_warn "Init script failed"
```

**Benefits**:
- Enables init scripts to copy files from source repo
- Fixes `.env` file copying errors
- Allows contextual worktree setup

### Layer 5: Health Checks (Detection & Recovery)
**File**: `launch-session.sh:66-76, 115-125`

Verify Claude started successfully:
```bash
sleep 2
pane_output=$(capture_pane_output "$target" 10)

if echo "$pane_output" | grep -q "Claude Code"; then
  log_info "✓ Claude Code started successfully"
else
  log_warn "Could not verify Claude Code startup. Check manually."
fi
```

**Benefits**:
- Detects startup failures immediately
- Provides actionable feedback to user
- Allows for future auto-recovery logic

## Additional Fixes

### Fix 1: Template Path Resolution
**File**: `send-prompt.sh:28`

**Before**: `template_path="$SCRIPT_DIR/../templates/meta-prompt.md"`
**After**: `template_path="$(cd "$SCRIPT_DIR/.." && pwd)/templates/meta-prompt.md"`

**Why**: Ensures absolute path resolution works reliably

### Fix 2: Target Parameter Parsing
**File**: `send-prompt.sh:27-34`

Added parsing for "SESSION:" and "PANE:" prefixes:
```bash
if [[ "$target_param" == SESSION:* ]]; then
  target="${target_param#SESSION:}"
elif [[ "$target_param" == PANE:* ]]; then
  target="${target_param#PANE:}"
fi
```

**Why**: launch-session.sh outputs prefixed format, send-prompt.sh now understands it

### Fix 3: Send-Keys Flag Protection
**File**: `send-prompt.sh:71`

**Before**: `tmux send-keys -t "$target" -l "$line"`
**After**: `tmux send-keys -t "$target" -l -- "$line"`

**Why**: Prevents lines starting with `-` from being interpreted as tmux flags

## Testing Strategy

### Manual Test
```bash
# Clean up existing worktree
git worktree remove ../main-069795a9a3a3 --force
git branch -D feature/069795a9a3a3

# Run full flux-capacitor cycle
task_id=$(source ~/.claude/plugins/.../lib/common.sh && generate_task_id)
worktree=$(.../scripts/create-worktree.sh "$task_id" "main")
target=$(.../scripts/launch-session.sh "$worktree" "$task_id" "main")
.../scripts/send-prompt.sh "$target" "Test task" "$worktree" "feature/$task_id" "main"

# Verify
tmux attach -t flux-main-$task_id
# Should see Claude Code running without prompts
```

### Automated Test (Future)
Create `.worktree-init/99-test-env.sh` that verifies:
- All environment variables are set
- .zshenv exists and is correct
- No interactive prompts during shell startup

## Rollback Plan
If issues arise:
1. Comment out Layer 2 (pre-answer) in launch-session.sh
2. Remove `.worktree-init/00-disable-dotenv-prompts.sh`
3. Revert to manual tmux attachment workflow

## Future Enhancements

### 1. Detect Specific Failures
Enhance health check to detect specific failure modes:
- dotenv prompt (look for "Source it?" in output)
- Permission errors
- Claude not found

### 2. Auto-Recovery
If health check fails, automatically retry with different strategies:
```bash
if ! verify_claude_started; then
  log_warn "Startup failed, retrying with different method..."
  send_keys_to_target "$target" "clear && claude --dangerously-skip-permissions"
fi
```

### 3. Project-Specific Init Scripts
Allow projects to define custom initialization in `.flux-capacitor/init.sh`

### 4. Startup Timeout
Add configurable timeout for Claude startup:
```bash
FLUX_STARTUP_TIMEOUT=${FLUX_STARTUP_TIMEOUT:-10}
```

## Metrics & Monitoring

Track success rates:
- Worktree creation success/failure
- Claude startup success/failure
- Prompt detection frequency
- Average startup time

## Documentation Updates

Updated files:
- `launch-session.sh` - Added multi-layer prompt handling
- `send-prompt.sh` - Fixed target parsing and send-keys
- `worktree-utils.sh` - Fixed init script parameters
- `.worktree-init/00-disable-dotenv-prompts.sh` - NEW: Environment isolation
- `IMPROVEMENTS.md` - THIS FILE: Comprehensive documentation

## Lessons Learned

1. **Defense in depth works**: Multiple fallback layers handle edge cases
2. **Early detection is key**: Health checks catch problems immediately
3. **Isolation matters**: Worktree-specific config prevents pollution from main environment
4. **Test interactivity early**: Interactive prompts are common in development environments

## Version History

- **v1.1.0** (2025-01-13): Added 5-layer prompt handling, health checks, improved init scripts
- **v1.0.0**: Initial flux-capacitor implementation
