# flux-skill

**Skill-based feature implementation orchestrator with comprehensive planning, quality gates, and intelligent subagent delegation.**

## Overview

The `flux-skill` plugin provides a skill-based approach to complex feature implementation. It orchestrates the entire development lifecycle through comprehensive planning, intelligent delegation to specialist subagents, and rigorous quality gates.

### Key Features

- 🧠 **Ultrathink Planning** - Deep analysis with 5-15 step implementation plans
- 🤝 **Intelligent Delegation** - Orchestrates 14+ specialist subagents for domain expertise
- 🔨 **Incremental Implementation** - Small, tested, committed changes
- ✅ **Quality Gates** - Mandatory tests, code review, and security review
- 📊 **Completion Reports** - Comprehensive summaries of work done

## Installation

```bash
# Add the AppLab plugins marketplace (if not already added)
/plugin marketplace add https://github.com/applab-nl/claude-code-plugins

# Install flux-skill
/plugin install flux-skill@applab-plugins
```

## Usage

### Prerequisites

- Must be running in a **tmux session** (for isolation and session management)
- Git repository initialized

### Basic Usage

```bash
/invoke-flux-skill <task description>
```

### Examples

```bash
# Add a new feature
/invoke-flux-skill Add OAuth authentication with Google and GitHub

# Fix a bug
/invoke-flux-skill Fix performance issue in dashboard data loading

# Implement a component
/invoke-flux-skill Implement user profile management with avatar upload

# Refactor code
/invoke-flux-skill Refactor authentication logic to use middleware pattern
```

## How It Works

### 1. Validation

The `/invoke-flux-skill` command validates:
- Task description is provided
- Running in a tmux session

### 2. Skill Invocation

The command invokes the `flux-skill` skill with your task description.

### 3. Orchestrated Process

The skill follows a rigorous 7-step process:

```
1. 🧠 Ultrathink Planning
   ├─ Deep analysis of requirements
   ├─ Architectural considerations
   ├─ 5-15 detailed implementation steps
   ├─ Delegation strategy
   ├─ Success criteria
   └─ Risk assessment

2. 🤝 Intelligent Delegation
   ├─ architecture-advisor (design decisions)
   ├─ frontend-specialist (React/Next.js/Svelte)
   ├─ kotlin-backend-specialist (Spring Boot APIs)
   ├─ supabase-integration-expert (DB/Auth)
   ├─ flutter-specialist (Mobile apps)
   ├─ test-engineer (comprehensive testing)
   ├─ code-reviewer (quality & security)
   └─ ... (and 7 more specialists)

3. 🔨 Incremental Implementation
   ├─ Follow the plan step-by-step
   ├─ Small, testable chunks
   ├─ Frequent commits
   └─ Clear communication

4. ✅ Comprehensive Testing (NON-NEGOTIABLE)
   ├─ Unit tests (business logic)
   ├─ Component tests (UI)
   ├─ Integration tests (APIs/services)
   └─ E2E tests (critical flows)

5. 👀 Code Review (NON-NEGOTIABLE)
   ├─ Quality standards (SOLID, DRY, clean code)
   ├─ Tech-stack best practices
   ├─ Security review (OWASP top 10)
   └─ Documentation quality

6. 🔒 Security Review (NON-NEGOTIABLE)
   ├─ Authentication & authorization
   ├─ Input validation
   ├─ Data protection
   └─ Dependency security

7. 📊 Completion Report
   ├─ Implementation summary
   ├─ Test coverage metrics
   ├─ Code review results
   ├─ Security review results
   ├─ Commit history
   └─ Next steps
```

## Quality Gates

All tasks **MUST** satisfy these quality gates:

- ✅ Comprehensive ultrathink plan
- ✅ Appropriate subagent delegation
- ✅ Complete test coverage
- ✅ Code review passed
- ✅ Security review passed
- ✅ Clear commit history
- ✅ Documentation updated

**No exceptions. Quality is non-negotiable.**

## Available Specialist Subagents

The flux-skill orchestrates these specialists:

| Specialist | Domain |
|-----------|---------|
| `architecture-advisor` | System design, patterns, decisions |
| `frontend-specialist` | React, Next.js, Svelte, UI |
| `kotlin-backend-specialist` | Spring Boot, Kotlin, APIs |
| `supabase-integration-expert` | Database, auth, Supabase |
| `flutter-specialist` | Flutter/Dart mobile apps |
| `test-engineer` | Comprehensive testing |
| `code-reviewer` | Quality, security, best practices |
| `refactoring-specialist` | Safe code improvements |
| `ci-cd-specialist` | GitHub Actions, deployments |
| `monitoring-integration-specialist` | Sentry, observability |
| `git-workflow-manager` | Git operations |
| `dependency-auditor` | Security, dependency updates |
| `android-debug-fixer` | Android debugging |
| `ios-debug-fixer` | iOS debugging |

## Skill-Based Approach

### What is a Skill?

A **skill** in Claude Code is invoked via `/skill <skill-name>` and represents a specialized capability or workflow. Skills are ideal for:

- Multi-step processes with clear stages
- Orchestration of multiple tools and subagents
- Workflows that require state management
- Complex decision trees

### Why Use a Skill for Flux?

The skill-based approach provides:

1. **Progressive Disclosure** - Content is revealed as needed, minimizing token usage
2. **Structured Workflow** - Clear stages with defined inputs/outputs
3. **State Management** - Maintains context across steps
4. **Reusability** - Same skill can be invoked for different tasks

### Trade-offs

**Advantages:**
- Optimized token usage (progressive disclosure)
- Clear workflow stages
- Better for complex, multi-stage processes

**Disadvantages:**
- Requires explicit skill invocation
- Less flexible than agent-based approach
- May feel more rigid for exploratory tasks

## Comparison: flux-skill vs flux-agent

| Feature | flux-skill | flux-agent |
|---------|-----------|-----------|
| **Invocation** | `/skill flux-skill` | Launched via Task tool |
| **Structure** | Structured stages | Freeform orchestration |
| **Token Usage** | Optimized (progressive) | Higher (full context) |
| **Flexibility** | Lower (workflow-driven) | Higher (adaptive) |
| **Best For** | Predictable tasks | Exploratory tasks |

**Recommendation:** Try both approaches and see which fits your workflow better!

## Philosophy

### Orchestration, Not Solo Development

The flux-skill is an **orchestrator**, not a solo developer:

- ✅ Delegates specialized work to expert subagents
- ✅ Coordinates their outputs
- ✅ Ensures quality across all components
- ❌ Does NOT try to do everything itself

### Quality Over Speed

- ✅ Comprehensive planning before coding
- ✅ Rigorous testing as you build
- ✅ Mandatory code and security reviews
- ❌ No shortcuts or quality compromises

### Incremental & Safe

- ✅ Small, testable changes
- ✅ Frequent commits
- ✅ Clear communication
- ❌ No large, risky changes

## Examples

### Example 1: Add Authentication

```bash
/invoke-flux-skill Add OAuth authentication with Google and GitHub
```

**What the skill does:**

1. **Planning**
   - Analyzes OAuth flow requirements
   - Plans database schema changes (user table, OAuth tokens)
   - Identifies components (backend API, frontend UI, OAuth callbacks)
   - Delegates to architecture-advisor for design decisions

2. **Implementation**
   - Delegates to kotlin-backend-specialist (OAuth endpoints)
   - Delegates to supabase-integration-expert (user table, RLS policies)
   - Delegates to frontend-specialist (login UI, OAuth buttons)
   - Implements incrementally with frequent commits

3. **Testing**
   - Delegates to test-engineer
   - Unit tests (OAuth token validation)
   - Integration tests (OAuth callback flow)
   - E2E tests (complete login flow)

4. **Quality**
   - Delegates to code-reviewer
   - Security review (token storage, CSRF protection)
   - Addresses all findings

5. **Completion**
   - Reports what was built
   - Test coverage metrics
   - Code review results
   - Next steps (deploy, manual testing)

### Example 2: Fix Performance Bug

```bash
/invoke-flux-skill Fix performance issue in dashboard data loading
```

**What the skill does:**

1. **Planning**
   - Analyzes current implementation
   - Identifies bottlenecks (N+1 queries, large payloads)
   - Plans optimizations (query batching, pagination, caching)
   - Estimates impact and risks

2. **Implementation**
   - Delegates to kotlin-backend-specialist (optimize queries)
   - Delegates to supabase-integration-expert (database indexes)
   - Delegates to frontend-specialist (lazy loading, virtualization)
   - Measures performance improvements

3. **Testing**
   - Performance benchmarks (before/after)
   - Load tests (high data volumes)
   - Regression tests (functionality unchanged)

4. **Quality**
   - Code review (maintainability of optimizations)
   - Documentation (why optimizations were made)

5. **Completion**
   - Performance metrics (X% faster, Y% less data)
   - Test results
   - Monitoring recommendations

## Troubleshooting

### Error: Task description required

You forgot to provide a task description.

**Fix:**
```bash
/invoke-flux-skill <your task description here>
```

### Error: Not running in a tmux session

The flux-skill requires tmux for proper isolation and session management.

**Fix:**
```bash
# Start tmux
tmux

# Or attach to existing session
tmux attach
```

### Skill not found

The plugin might not be installed.

**Fix:**
```bash
/plugin install flux-skill@applab-plugins
```

## Best Practices

### 1. Be Specific in Task Descriptions

**Bad:**
```bash
/invoke-flux-skill Fix the bug
```

**Good:**
```bash
/invoke-flux-skill Fix the race condition in user session management where concurrent requests can create duplicate sessions
```

### 2. Trust the Skill's Process

The skill enforces quality gates for a reason. Don't try to skip steps or rush through.

### 3. Provide Context When Asked

The skill may ask clarifying questions. Provide detailed context to help it make informed decisions.

### 4. Review the Plan

When the skill presents its ultrathink plan, review it carefully. Suggest adjustments if needed.

### 5. Let Specialists Do Their Work

The skill will delegate to specialists. Trust their domain expertise.

## License

MIT

## Contributing

Contributions welcome! Please see the [main repository](https://github.com/applab-nl/claude-code-plugins) for guidelines.

## Support

- Issues: https://github.com/applab-nl/claude-code-plugins/issues
- Discussions: https://github.com/applab-nl/claude-code-plugins/discussions

## Related Plugins

- **flux-agent** - Agent-based implementation orchestrator (alternative approach)
- **agents** - Collection of specialist subagents used by flux
- **git-tools** - Git workflow automation
- **next-dev** - Next.js development specialist
- **flutter-dev** - Flutter development specialist

---

**Built with ❤️ by AppLab**
