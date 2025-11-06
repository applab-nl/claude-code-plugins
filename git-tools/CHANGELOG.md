# Changelog

All notable changes to the Git Tools plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-06

### Added

#### Git Worktree Management
- `/create-worktree` - Create isolated git worktrees for parallel feature development
  - Interactive branch name and base branch selection
  - Automatic worktree naming convention (repo-name-branch-name)
  - Creates worktrees in sibling directories for clean isolation
  - Handles branch creation if needed
- `/merge-worktree` - Merge feature branch back to main/base branch
  - Safety checks for clean working directory
  - Automatic branch switching to target branch
  - Conflict detection and clear resolution guidance
  - Multiple merge strategies supported (--ff-only, --no-ff, default)
  - Post-merge verification
- `/remove-worktree` - Clean up git worktrees and associated branches
  - Safety checks to prevent data loss
  - Interactive confirmation for branch deletion
  - Force removal option for uncommitted changes
  - Prevents removal of main/master branches
  - Clear status reporting after removal

**Worktree Features:**
- Parallel feature development without branch switching
- Complete isolation between features
- No stashing or context switching required
- Easy cleanup when features are complete
- Safe merge workflows with conflict handling

### Changed
- Plugin renamed from `commit-tools` to `git-tools`
- Updated description to reflect comprehensive Git automation capabilities
- Added keywords: `worktree`, `branching`

## [1.0.0] - 2025-10-23

### Added

#### Initial Release - Git Commit Automation

**Commands:**
- `/commit` - Review and commit all changes with intelligent message generation
- `/commit-and-push` - Review, commit, and push changes to remote repository

**Features:**
- Automated Git workflow (status, diff, add, commit, push)
- Intelligent commit message generation based on actual changes
- Analysis of file diffs to understand the nature of changes
- Commit message best practices enforcement:
  - Imperative mood in summary
  - Clear explanation of "why" not just "what"
  - Tasteful emoji usage (1-2 maximum)
  - Proper formatting with multi-line when needed
  - Never mentions AI/Claude as author
- Automatic file staging with secret detection
- Pre-commit hook handling
- Success verification for commits and pushes
- Error handling and graceful failures

**Commit Message Quality:**
- Categorizes changes (feature, bug fix, refactor, docs, etc.)
- Identifies affected components and scope
- Generates comprehensive yet concise messages
- Follows Git commit message conventions
- Adapts to project's existing commit style

**Safety Features:**
- Warns about committing potential secrets (.env, credentials, etc.)
- Never force-pushes
- Never skips hooks
- Verifies repository state before and after operations
- Handles pre-commit hook modifications appropriately

**Use Cases:**
- Daily development commits
- Feature branch commits
- Bug fixes and refactoring
- Documentation updates
- Quick iteration cycles

---

[1.0.0]: https://github.com/applab-nl/claude-code-plugins/releases/tag/commit-tools-v1.0.0
