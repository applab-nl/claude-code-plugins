# Git Tools Plugin

**Comprehensive Git Automation** - Intelligent commit message generation, git worktree management, and streamlined workflows for modern version control.

## Overview

The Git Tools plugin provides slash commands that automate common Git workflows. From intelligent commit message generation to git worktree management for isolated parallel development, these commands help you work more efficiently with Git.

**Key Features:**
- Automated commit workflow with intelligent message generation
- Git worktree management for isolated feature development
- Merge and cleanup workflows with safety checks
- Best practices enforcement and error handling

## Available Commands

### Commit Automation

> **⚡ Performance Optimized (v1.3.0)**: Commit commands now use single-shot execution for 40-50% faster performance and 50% reduced token usage. All git operations execute atomically in one command with automatic rollback on failure.

### `/commit`

Review and commit all changes with an elaborate, descriptive commit message.

**What it does:**
1. Pre-computes git context (status, diff, recent commits, branch)
2. Generates a comprehensive commit message that:
   - Follows your recent commit message style patterns
   - Describes what changed and why
   - Uses appropriate emojis (0-2 maximum, tastefully)
   - Never mentions AI/Claude as an author
3. Executes atomic git operation: stage all → commit → verify
4. Single-shot execution (one command, all-or-nothing)

**Performance:**
- **Execution time**: ~3-5 seconds (was 5-10s)
- **Token usage**: ~1,000-2,000 tokens (was 2,000-5,000)
- **Reliability**: Atomic operation with automatic rollback on failure

**Usage:**
```bash
/commit
```

**Example output:**
```
✓ Committed successfully
```

**Commit message example:**
```
Add user authentication with JWT tokens 🔐

Implements secure authentication flow using JSON Web Tokens.
Includes login, registration, and token refresh endpoints.
Adds password hashing with bcrypt and validation middleware.
```

### `/commit-and-push`

Review, commit, and push all changes to the remote repository.

**What it does:**
Everything `/commit` does, plus:
- Pushes the commit to the remote repository
- All operations atomic (stops on any failure)
- Single-shot execution for maximum performance

**Performance:**
- **Execution time**: ~4-7 seconds (was 7-15s)
- **Token usage**: ~1,000-2,000 tokens (was 2,500-6,000)
- **Reliability**: Atomic operation chain (add → commit → push)

**Usage:**
```bash
/commit-and-push
```

**Example output:**
```
✓ Committed and pushed successfully
```

### Git Worktree Management

#### `/create-worktree`

Create an isolated git worktree for parallel feature development.

**What it does:**
1. Asks for branch name and optional base branch
2. Generates worktree directory name (e.g., `my-app-feature-oauth`)
3. Creates the worktree in a sibling directory
4. Creates the branch if it doesn't exist
5. Provides navigation command to the new worktree

**Usage:**
```bash
/create-worktree
```

**Benefits:**
- Work on multiple features simultaneously without branch switching
- Complete isolation between features
- No stashing or context switching required
- Clean separation of concerns

**Example:**
```
Current repo: /Users/alice/projects/my-app
Branch: feature/oauth-implementation

✓ Created worktree at: /Users/alice/projects/my-app-feature-oauth-implementation
✓ Branch: feature/oauth-implementation

Navigate with: cd /Users/alice/projects/my-app-feature-oauth-implementation
```

#### `/merge-worktree`

Merge a feature branch from a worktree back to the main/base branch.

**What it does:**
1. Verifies working directory is clean
2. Asks for source branch and target branch
3. Switches to target branch if needed
4. Performs the merge with chosen strategy
5. Handles conflicts with clear guidance
6. Verifies successful merge

**Usage:**
```bash
/merge-worktree
```

**Safety features:**
- Checks for clean working directory
- Detects and reports conflicts
- Multiple merge strategies (--ff-only, --no-ff, default)
- Never auto-resolves conflicts
- Post-merge verification

**Example:**
```
Source branch: feature/oauth-implementation
Target branch: main
Merge strategy: default

✓ Switched to branch 'main'
✓ Merged feature/oauth-implementation into main
✓ Merge successful - no conflicts

You can now remove the worktree with: /remove-worktree
```

#### `/remove-worktree`

Remove a git worktree and optionally delete its associated branch.

**What it does:**
1. Lists existing worktrees
2. Asks which worktree to remove
3. Checks for uncommitted changes
4. Optionally deletes the associated branch
5. Confirms removal and cleanup

**Usage:**
```bash
/remove-worktree
```

**Safety features:**
- Warns about uncommitted changes
- Interactive confirmation for branch deletion
- Prevents removal of main/master branches
- Cannot remove current worktree
- Force option available if needed

**Example:**
```
Existing worktrees:
  - /Users/alice/projects/my-app (main)
  - /Users/alice/projects/my-app-feature-oauth (feature/oauth)

Remove worktree: /Users/alice/projects/my-app-feature-oauth
Delete branch 'feature/oauth'? yes

✓ Worktree removed
✓ Branch 'feature/oauth' deleted

Remaining worktrees: 1
```

#### `/merge-push-cleanup-worktree`

Complete workflow to merge a worktree branch, push changes, cleanup worktree and delete branch in one operation.

**What it does:**
1. Verifies working directory is clean
2. Asks for source branch to merge and cleanup
3. Detects target branch (main/master)
4. Shows comprehensive plan of all operations
5. Switches to target branch
6. Merges source branch
7. Pushes changes to origin
8. Removes the worktree
9. Deletes the source branch
10. Reports final status

**Usage:**
```bash
/merge-push-cleanup-worktree
```

**Safety features:**
- Comprehensive pre-flight checks
- Stops immediately if any step fails
- Clear error reporting with recovery instructions
- Handles common failure scenarios (conflicts, push failures, locked worktrees)
- Never auto-resolves merge conflicts
- Provides detailed status after each operation

**Example:**
```
Plan Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Source branch: feature/oauth-implementation
Target branch: main
Worktree path: /Users/alice/projects/my-app-feature-oauth
Commits to merge: 5 commits

Operations to perform:
1. Switch to main
2. Merge feature/oauth-implementation into main
3. Push main to origin
4. Remove worktree at /Users/alice/projects/my-app-feature-oauth
5. Delete feature/oauth-implementation

Proceed with merge, push, and cleanup? yes

✓ Switched to main
✓ Merged feature/oauth-implementation into main
✓ Pushed main to origin
✓ Removed worktree
✓ Deleted branch feature/oauth-implementation

✅ Merge, Push, and Cleanup Complete
```

**When to use:**
- Feature is complete and ready to merge to main
- You want to clean up the worktree in one operation
- All changes are committed and tested
- You're confident the merge will be clean

**Benefits:**
- Streamlines the complete feature workflow
- Reduces manual steps from ~8 commands to 1
- Ensures proper sequence of operations
- Automatic cleanup after successful merge
- Clear failure handling at each step

## Commit Message Quality

Both commands generate high-quality commit messages that:

- **Explain the "why"** - Focus on the purpose and context, not just what changed
- **Follow conventions** - Use imperative mood, clear structure
- **Are concise yet comprehensive** - Detailed enough to understand without being verbose
- **Include emojis tastefully** - One or two relevant emojis when appropriate
- **Never credit AI** - Messages appear as regular developer commits
- **Use proper formatting** - Multi-line when needed, with proper line breaks

## Features

### Automated Workflow
- Single command to review, stage, commit (and push)
- No manual `git add`, `git commit -m`, or `git push` needed
- Automatic verification of success

### Intelligent Analysis
- Examines all changed files
- Reviews diffs to understand the nature of changes
- Considers file types and patterns
- Groups related changes logically

### Best Practices
- Follows Git commit message conventions
- Never commits secrets or sensitive files
- Warns if attempting to commit potentially dangerous files
- Verifies repository state before and after

### Error Handling
- Handles pre-commit hook failures gracefully
- Retries with amendments when appropriate
- Provides clear error messages
- Maintains repository integrity

## Installation

### From Marketplace

```bash
/plugin marketplace add applab-nl/claude-code-plugins
/plugin install git-tools@applab-plugins
```

### Manual Installation

1. Clone this repository
2. Copy the `git-tools` directory to your plugins location
3. Enable the plugin in Claude Code

## Requirements

- Claude Code CLI (latest version)
- Git 2.0+ installed and configured
- A Git repository in your working directory

## Usage Tips

### When to use `/commit`
- You want to commit changes but review before pushing
- Working on a local branch
- Want to batch multiple commits before pushing
- Unsure if you're ready to push to remote

### When to use `/commit-and-push`
- Changes are ready for remote repository
- Working directly on main/master branch (with caution)
- Want to immediately share changes with team
- Following a commit-and-push workflow

### Best Practices

**Do:**
- Review the generated commit message
- Let the tool analyze all changes together
- Use `/commit` for local work, `/commit-and-push` when ready to share
- Trust the commit message generation for routine commits

**Don't:**
- Run on repositories with uncommitted secrets
- Use `/commit-and-push` on protected branches without review
- Manually stage files before running (the command handles it)
- Expect the tool to force-push (it never will)

## How It Works

### Commit Message Generation Process

1. **Discovery Phase**
   - Runs `git status` to find all changes
   - Runs `git diff` to see actual modifications
   - Runs `git log` to understand commit history style

2. **Analysis Phase**
   - Categorizes changes (new feature, bug fix, refactor, etc.)
   - Identifies affected components/modules
   - Determines the scope and impact
   - Considers best practices for the project

3. **Message Composition**
   - Writes clear, imperative summary line
   - Adds detailed body when changes are complex
   - Includes context about "why" not just "what"
   - Applies appropriate emoji (1-2 max)
   - Ensures no AI attribution

4. **Commit Execution**
   - Stages relevant files (excludes likely secrets)
   - Creates commit with generated message
   - Handles pre-commit hooks if they modify files
   - Verifies success

5. **Push (if `/commit-and-push`)**
   - Pushes to configured remote
   - Verifies push succeeded
   - Reports any errors

## Examples

### Feature Addition
```
Add real-time notifications with WebSocket 🔔

Implements WebSocket-based notification system for instant updates.
Includes connection management, event handlers, and fallback polling.
Updates UI to display notifications with toast messages.
```

### Bug Fix
```
Fix memory leak in event listener cleanup 🐛

Removes event listeners properly on component unmount to prevent
memory accumulation. Adds cleanup logic for all subscriptions.
```

### Refactoring
```
Refactor authentication module for better testability ♻️

Extracts authentication logic into separate service class.
Adds dependency injection for easier mocking in tests.
Improves separation of concerns between auth and routing.
```

### Documentation
```
Update API documentation with new endpoints 📚

Adds documentation for v2 API endpoints including request/response
examples. Updates authentication section with OAuth2 flow details.
```

## Comparison with Manual Commits

### Manual Workflow
```bash
git status
git diff
# Think about commit message...
git add .
git commit -m "update stuff"  # Often too brief
git push
```

### With Commit Tools
```bash
/commit-and-push
# Done! Comprehensive message, proper staging, verified push
```

## Contributing

Found an issue or have a suggestion? Please open an issue on the [GitHub repository](https://github.com/applab-nl/claude-code-plugins).

## License

MIT License - See LICENSE file for details

## Version

**Current Version**: 1.2.0

---

**Maintained by**: AppLab
**Part of**: [Claude Code Plugins Marketplace](https://github.com/applab-nl/claude-code-plugins)
