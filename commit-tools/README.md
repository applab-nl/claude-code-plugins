# Commit Tools Plugin

**Git Commit Automation** - Intelligent commit message generation and workflow automation for streamlined version control.

## Overview

The Commit Tools plugin provides slash commands that automate the Git commit workflow. These commands analyze your changes, generate comprehensive commit messages following best practices, and handle the entire commit (and optionally push) process with a single command.

## Available Commands

### `/commit`

Review and commit all changes with an elaborate, descriptive commit message.

**What it does:**
1. Runs `git status` to see all changes
2. Runs `git diff` to review staged and unstaged changes
3. Analyzes the changes and their purpose
4. Generates a comprehensive commit message that:
   - Describes what changed and why
   - Follows commit message best practices
   - Uses appropriate emojis (tastefully, not overdone)
   - Never mentions AI/Claude as an author
5. Stages relevant files
6. Creates the commit with the generated message
7. Verifies the commit was successful

**Usage:**
```bash
/commit
```

**Example output:**
```
Analyzing changes...
Found 3 modified files and 2 new files

Staging changes and creating commit...

✓ Commit created successfully:
  "Add user authentication with JWT tokens 🔐

  Implements secure authentication flow using JSON Web Tokens.
  Includes login, registration, and token refresh endpoints.
  Adds password hashing with bcrypt and validation middleware."
```

### `/commit-and-push`

Review, commit, and push all changes to the remote repository.

**What it does:**
Everything `/commit` does, plus:
- Pushes the commit to the remote repository
- Verifies the push was successful

**Usage:**
```bash
/commit-and-push
```

**Example output:**
```
Analyzing changes...
Found 2 modified files

Staging changes and creating commit...

✓ Commit created successfully:
  "Update README with installation instructions 📚"

Pushing to remote...

✓ Pushed to origin/main successfully
```

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
/plugin install commit-tools@applab-plugins
```

### Manual Installation

1. Clone this repository
2. Copy the `commit-tools` directory to your plugins location
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

**Current Version**: 1.0.0

---

**Maintained by**: AppLab
**Part of**: [Claude Code Plugins Marketplace](https://github.com/applab-nl/claude-code-plugins)
