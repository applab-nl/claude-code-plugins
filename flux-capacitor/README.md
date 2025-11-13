# Flux Capacitor Plugin

**Parallel Feature Development Orchestrator** - A Claude Code plugin that enables true parallel development by delegating complex tasks to isolated Claude agents running in git worktrees with tmux sessions.

## Overview

The Flux Capacitor plugin solves a fundamental problem: **how to work on multiple features simultaneously without conflicts**. It creates isolated environments for each task, launches dedicated Claude Code sessions, and provides built-in quality gates to ensure production-ready code.

### Core Concept

```
Main Project (you keep working)
    │
    ├─→ Flux Session 1: OAuth implementation
    │   └─ Isolated worktree + tmux session
    │
    ├─→ Flux Session 2: Notifications feature
    │   └─ Isolated worktree + tmux session
    │
    └─→ Flux Session 3: Payment integration
        └─ Isolated worktree + tmux session

All three develop in parallel without conflicts!
```

## Features

### 🚀 True Parallel Development
- Multiple features developing simultaneously
- Complete isolation via git worktrees
- No context switching or git stashing
- Safe merge-back when complete

### 🎯 Intelligent Orchestration
- Tmux panes (if in tmux) or new sessions (if not)
- Automatic worktree creation and management
- Meta prompt with comprehensive task instructions
- Built-in quality gates and subagent delegation

### ✅ Quality Assurance
Every task automatically includes:
- Ultrathink comprehensive planning
- Intelligent subagent delegation
- Comprehensive test coverage
- Code review before completion
- Security review for all changes

### 🔧 Simple & Robust
- Pure shell scripts (no complex dependencies)
- Automatic session management
- Safe cleanup with merge verification
- Status monitoring and progress tracking

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

- **Claude Code CLI** (latest version)
- **tmux** - Session/pane management:
  ```bash
  # macOS
  brew install tmux

  # Linux
  sudo apt-get install tmux  # Debian/Ubuntu
  sudo yum install tmux      # CentOS/RHEL
  ```
- **Git 2.30+** - Worktree support
- **Bash 4.0+** - Script execution

## Commands

### `/run <task-description>`
Launch a new flux-capacitor session for parallel development.

**Examples:**
```bash
/run Add OAuth authentication with Google and GitHub
/run Implement real-time notifications using Supabase
/run Refactor authentication system for better security
```

**What it does:**
1. Generates unique task ID
2. Creates isolated git worktree
3. Launches tmux pane/session with Claude Code
4. Sends meta prompt with quality gates
5. Provides instructions to attach/monitor

### `/cleanup <task-id>`
Safely merge changes and cleanup session.

**Examples:**
```bash
/cleanup oauth-a1b2c3
```

**What it does:**
1. Checks for uncommitted changes (prompts to commit/discard/abort)
2. Merges feature branch to current branch
3. Handles merge conflicts gracefully
4. Removes worktree
5. Deletes feature branch
6. Kills tmux session

**Safety features:**
- Never loses uncommitted work
- Always merges before cleanup
- Preserves state on conflicts
- Can retry after fixes

### `/flux-list`
List all active flux-capacitor sessions.

**Example output:**
```
Active Flux Capacitor Sessions:

1. flux-myapp-oauth-a1b2c3
   Task ID: oauth-a1b2c3
   Worktree: /Users/alice/projects/myapp-oauth-a1b2c3
   Branch: feature/oauth-a1b2c3
   Uptime: 2h 34m

2. flux-myapp-notifications-def456
   Task ID: notifications-def456
   Worktree: /Users/alice/projects/myapp-notifications-def456
   Branch: feature/notifications-def456
   Uptime: 45m

Total: 2 active session(s)
```

### `/flux-status <task-id>`
Get detailed status of a specific session.

**Examples:**
```bash
/flux-status oauth-a1b2c3
```

**Shows:**
- Session health (running/stopped)
- Worktree status (uncommitted changes, commits ahead)
- Recent activity (last 15 lines from tmux pane)
- Next steps

## Usage Workflow

### 1. Start a New Task

```bash
# In your main Claude Code session
/run Add OAuth authentication with Google and GitHub
```

**Output:**
```
🎯 Flux Capacitor Session Created!

  Task ID: oauth-a1b2c3
  Session: flux-myapp-oauth-a1b2c3
  Worktree: ../myapp-oauth-a1b2c3
  Branch: feature/oauth-a1b2c3

📍 Attach to session:
   tmux attach -t flux-myapp-oauth-a1b2c3

The flux-capacitor agent is working on your task in the background.

When complete: /cleanup oauth-a1b2c3
```

### 2. Monitor Progress

**Option A: Check status without attaching**
```bash
/flux-status oauth-a1b2c3
```

**Option B: Attach to the session**
```bash
tmux attach -t flux-myapp-oauth-a1b2c3
```

Detach anytime with: `Ctrl+b, d`

### 3. Work on Multiple Tasks

```bash
# Start second task (first one still running)
/run Implement real-time notifications

# Start third task (both previous still running)
/run Add payment integration with Stripe

# List all active sessions
/flux-list
```

All three tasks develop in parallel!

### 4. Merge Completed Work

When a task is complete (check with `/flux-status`):

```bash
/cleanup oauth-a1b2c3
```

This merges the changes to your current branch and cleans up the isolated environment.

## How It Works

### Architecture

```
┌─────────────────────────────────────────┐
│  /run "Add OAuth authentication"        │
│  (Command - thin wrapper)               │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  flux-orchestrator Skill                │
│  (Orchestration logic)                  │
│  - Invokes scripts                      │
│  - Manages workflow                     │
│  - Reports results                      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Shell Scripts Execute                  │
│  1. create-worktree.sh                  │
│  2. launch-session.sh                   │
│  3. send-prompt.sh                      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Git Worktree Created                   │
│  ../myapp-oauth-a1b2c3/                 │
│  (isolated, parallel development)       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Tmux Pane/Session Created              │
│  Claude Code launched                   │
│  --dangerously-skip-permissions         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Meta Prompt Sent                       │
│  • Task description                     │
│  • Quality gate requirements            │
│  • Subagent delegation strategy         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Flux-Capacitor Agent Executes          │
│  1. Ultrathink comprehensive plan       │
│  2. Delegate to specialist subagents    │
│  3. Implement with tests                │
│  4. Code review                         │
│  5. Security review                     │
│  6. Complete & summarize                │
└─────────────────────────────────────────┘
```

### Quality Gates

Every flux-capacitor session enforces:

✅ **Ultrathink Planning** - Comprehensive 5-15 step plan before coding
✅ **Subagent Delegation** - Use specialists, don't do everything yourself
✅ **Comprehensive Tests** - Unit, component, integration, E2E
✅ **Code Review** - Quality assurance via `/agent code-reviewer`
✅ **Security Review** - OWASP top 10, auth, input validation
✅ **Clear Commits** - Frequent commits with descriptive messages
✅ **Documentation** - Updated docs for all changes

### Subagent Delegation

The flux-capacitor agent intelligently delegates to specialists:

**Architecture & Design:**
- `architecture-advisor` - Design patterns, system architecture

**Frontend:**
- `frontend-specialist` - React, Next.js, Svelte

**Backend:**
- `kotlin-backend-specialist` - Spring Boot, Kotlin, APIs
- `supabase-integration-expert` - Database, auth, Supabase

**Mobile:**
- `flutter-specialist` - Flutter/Dart applications
- `android-debug-fixer` - Android debugging
- `ios-debug-fixer` - iOS debugging

**Quality:**
- `test-engineer` - Comprehensive test coverage
- `code-reviewer` - Quality & security review
- `refactoring-specialist` - Safe code improvements

**DevOps:**
- `ci-cd-specialist` - GitHub Actions, deployments
- `monitoring-integration-specialist` - Sentry, observability

## Configuration

### Worktree Initialization Scripts

Create `.worktree-init/` directory in your project root with executable scripts:

```bash
mkdir -p .worktree-init
```

**Example: Install dependencies on worktree creation**

`.worktree-init/01-install-deps.sh`:
```bash
#!/usr/bin/env bash
npm install
```

```bash
chmod +x .worktree-init/01-install-deps.sh
```

These scripts run automatically when a worktree is created.

### Environment Variables

Optional configuration via environment variables:

```bash
# Logging level for scripts
export FLUX_LOG_LEVEL=debug  # debug, info, warn, error (default: info)
```

## Examples

### Example 1: Single Feature Development

```bash
# Start OAuth feature
$ /run Add OAuth authentication with Google and GitHub

🎯 Session created: flux-myapp-oauth-a1b2c3

# Check status later
$ /flux-status oauth-a1b2c3

📊 Session Status: oauth-a1b2c3
  Status: ✓ Running
  Commits ahead: 8
  Last commit: 5 minutes ago - Add OAuth tests

# When complete
$ /cleanup oauth-a1b2c3

✅ Cleanup complete!
  • Changes merged to: main
  • All tests passing
```

### Example 2: Parallel Feature Development

```bash
# Main session - you're working on UI refactoring
[main] $ /run Add OAuth authentication with Google

✓ Created session: flux-myapp-oauth-a1b2c3

# Continue working while OAuth develops in parallel
[main] $ /run Implement real-time notifications

✓ Created session: flux-myapp-notifications-def456

# Start third parallel task
[main] $ /run Add payment integration with Stripe

✓ Created session: flux-myapp-payments-ghi789

# List all parallel work
[main] $ /flux-list

Active Flux Capacitor Sessions:
  1. oauth-a1b2c3 (running 45m)
  2. notifications-def456 (running 12m)
  3. payments-ghi789 (running 2m)

# First one completes
[main] $ /cleanup oauth-a1b2c3

✅ OAuth merged! Notifications and payments still developing.

# Now you have OAuth in main while others continue in parallel
```

### Example 3: Conflict Resolution

```bash
$ /cleanup oauth-a1b2c3

❌ Merge conflicts detected!

CONFLICT (content): Merge conflict in src/auth/index.ts

Please resolve conflicts manually, then run:
  git merge --continue
  /cleanup oauth-a1b2c3  # Run cleanup again

# Resolve conflicts manually
$ vim src/auth/index.ts
$ git add src/auth/index.ts
$ git merge --continue

# Retry cleanup
$ /cleanup oauth-a1b2c3

✅ Cleanup complete!
```

## Troubleshooting

### Tmux Not Installed

```bash
❌ tmux not found

Install tmux:
  macOS: brew install tmux
  Linux: sudo apt-get install tmux
```

### Not in Git Repository

```bash
❌ Not in a git repository

Navigate to your project directory:
  cd /path/to/your/project
```

### Session Already Exists

```bash
❌ Session already exists: flux-myapp-oauth-a1b2c3

This session is already running.

Attach: tmux attach -t flux-myapp-oauth-a1b2c3
Or cleanup: /cleanup oauth-a1b2c3
```

### Worktree Creation Failed

```bash
❌ Failed to create worktree

Common causes:
  1. Disk space full
  2. Permission issues
  3. Branch already exists

Check: git worktree list
```

## Technical Details

### Directory Structure

```
flux-capacitor/
├── .claude-plugin/
│   └── plugin.json                  # Plugin manifest
├── agents/
│   └── flux-capacitor.md            # Agent for flux sessions
├── commands/
│   ├── run.md                       # /run - invokes flux-orchestrator
│   ├── cleanup.md                   # /cleanup - invokes flux-orchestrator
│   ├── list.md                      # /flux-list - invokes flux-orchestrator
│   └── status.md                    # /flux-status - invokes flux-orchestrator
├── skills/
│   └── flux-orchestrator/           # Orchestration skill
│       ├── SKILL.md                 # Skill logic and operations
│       ├── scripts/                 # Shell scripts used by skill
│       │   ├── lib/                 # Shared utilities
│       │   │   ├── common.sh        # Logging, ID generation
│       │   │   ├── tmux-utils.sh    # Tmux operations
│       │   │   └── worktree-utils.sh # Git worktree operations
│       │   ├── create-worktree.sh   # Create isolated worktree
│       │   ├── launch-session.sh    # Launch tmux + Claude
│       │   ├── send-prompt.sh       # Send meta prompt
│       │   ├── cleanup-session.sh   # Merge & cleanup
│       │   ├── list-sessions.sh     # List active sessions
│       │   └── session-status.sh    # Get session status
│       └── templates/
│           └── meta-prompt.md       # Meta prompt template
├── README.md
├── CHANGELOG.md
└── LICENSE
```

### Skill-Based Architecture

Flux Capacitor uses a **skill-based architecture**:
- **Commands** are thin wrappers that invoke skills
- **Skills** contain orchestration logic and know how to execute scripts
- **Scripts** handle low-level operations (git, tmux, etc.)
- No complex dependencies - pure shell scripts
- Easy to debug and customize
- Transparent operations
- Portable across systems

The `flux-orchestrator` skill is the heart of the plugin, managing the complete lifecycle of parallel development sessions.

### Session Naming Convention

Format: `flux-<project>-<task-id>`

Examples:
- `flux-myapp-oauth-a1b2c3`
- `flux-dashboard-notifications-def456`
- `flux-api-refactor-ghi789`

## Best Practices

### Task Descriptions

**Good:**
- "Add OAuth authentication with Google and GitHub providers"
- "Implement real-time notifications using Supabase subscriptions"
- "Refactor authentication system for improved security and maintainability"

**Avoid:**
- "Fix stuff" (too vague)
- "Do the thing" (not descriptive)
- Just a ticket number without context

### When to Use Flux Capacitor

**Perfect for:**
- ✅ Complex features requiring multiple components
- ✅ Long-running development tasks
- ✅ Experimental features you might not merge
- ✅ Parallel development of multiple features
- ✅ Work requiring specialist subagent delegation

**Not needed for:**
- ❌ Quick bug fixes (just fix directly)
- ❌ Single file edits
- ❌ Documentation updates
- ❌ Simple refactoring

### Cleanup Regularly

Don't let sessions accumulate:
```bash
# Check what's running
/flux-list

# Clean up completed sessions
/cleanup <task-id>
```

## Version

Current version: 2.0.0

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or questions:
- GitHub Issues: https://github.com/applab-nl/claude-code-plugins/issues
- Documentation: https://docs.claude.com/en/docs/claude-code/plugins-reference

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.

---

**Built for parallel development with quality assurance** 🚀
