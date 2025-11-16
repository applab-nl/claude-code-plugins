# flux-agent

**Agent-based feature implementation orchestrator with comprehensive planning, quality gates, and intelligent subagent delegation.**

## Overview

The `flux-agent` plugin provides an agent-based approach to complex feature implementation. It orchestrates the entire development lifecycle through comprehensive planning, intelligent delegation to specialist subagents, and rigorous quality gates.

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

# Install flux-agent
/plugin install flux-agent@applab-plugins
```

## Usage

### Prerequisites

- Must be running in a **tmux session** (for isolation and session management)
- Git repository initialized

### Basic Usage

```bash
/invoke-flux-agent <task description>
```

### Examples

```bash
# Add a new feature
/invoke-flux-agent Add OAuth authentication with Google and GitHub

# Fix a bug
/invoke-flux-agent Fix performance issue in dashboard data loading

# Implement a component
/invoke-flux-agent Implement user profile management with avatar upload

# Refactor code
/invoke-flux-agent Refactor authentication logic to use middleware pattern
```

## How It Works

### 1. Validation

The `/invoke-flux-agent` command validates:
- Task description is provided
- Running in a tmux session

### 2. Agent Launch

The command launches the `flux-agent` subagent using the Task tool, providing your task description.

### 3. Orchestrated Process

The agent follows a rigorous 7-step process:

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

The flux-agent orchestrates these specialists:

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

## Agent-Based Approach

### What is an Agent?

An **agent** in Claude Code is launched via the Task tool and represents an autonomous entity that can execute complex, multi-step tasks. Agents are ideal for:

- Autonomous task execution
- Adaptive workflows (not rigidly structured)
- Exploratory problem-solving
- Complex decision-making with many branches

### Why Use an Agent for Flux?

The agent-based approach provides:

1. **Autonomy** - Agent can adapt strategy based on findings
2. **Flexibility** - Not locked into rigid workflow stages
3. **Full Context** - Has complete conversation history
4. **Adaptive Planning** - Can revise plan as implementation progresses

### Trade-offs

**Advantages:**
- More flexible and adaptive
- Better for exploratory or uncertain tasks
- Can handle unexpected discoveries
- Feels more conversational

**Disadvantages:**
- Higher token usage (full context always available)
- Less structured than skill-based approach
- May feel less predictable

## Comparison: flux-agent vs flux-skill

| Feature | flux-agent | flux-skill |
|---------|-----------|-----------|
| **Invocation** | Launched via Task tool | `/skill flux-skill` |
| **Structure** | Freeform orchestration | Structured stages |
| **Token Usage** | Higher (full context) | Optimized (progressive) |
| **Flexibility** | Higher (adaptive) | Lower (workflow-driven) |
| **Best For** | Exploratory tasks | Predictable tasks |

**Recommendation:** Try both approaches and see which fits your workflow better!

## Philosophy

### Orchestration, Not Solo Development

The flux-agent is an **orchestrator**, not a solo developer:

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
/invoke-flux-agent Add OAuth authentication with Google and GitHub
```

**What the agent does:**

1. **Planning**
   - Analyzes OAuth flow requirements
   - Plans database schema changes (user table, OAuth tokens)
   - Identifies components (backend API, frontend UI, OAuth callbacks)
   - Launches architecture-advisor subagent for design decisions

2. **Implementation**
   - Launches kotlin-backend-specialist (OAuth endpoints)
   - Launches supabase-integration-expert (user table, RLS policies)
   - Launches frontend-specialist (login UI, OAuth buttons)
   - Implements incrementally with frequent commits

3. **Testing**
   - Launches test-engineer subagent
   - Unit tests (OAuth token validation)
   - Integration tests (OAuth callback flow)
   - E2E tests (complete login flow)

4. **Quality**
   - Launches code-reviewer subagent
   - Security review (token storage, CSRF protection)
   - Addresses all findings

5. **Completion**
   - Reports what was built
   - Test coverage metrics
   - Code review results
   - Next steps (deploy, manual testing)

### Example 2: Fix Performance Bug

```bash
/invoke-flux-agent Fix performance issue in dashboard data loading
```

**What the agent does:**

1. **Planning**
   - Analyzes current implementation
   - Identifies bottlenecks (N+1 queries, large payloads)
   - Plans optimizations (query batching, pagination, caching)
   - Estimates impact and risks

2. **Implementation**
   - Launches kotlin-backend-specialist (optimize queries)
   - Launches supabase-integration-expert (database indexes)
   - Launches frontend-specialist (lazy loading, virtualization)
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
/invoke-flux-agent <your task description here>
```

### Error: Not running in a tmux session

The flux-agent requires tmux for proper isolation and session management.

**Fix:**
```bash
# Start tmux
tmux

# Or attach to existing session
tmux attach
```

### Agent not available

The plugin might not be installed.

**Fix:**
```bash
/plugin install flux-agent@applab-plugins
```

## Best Practices

### 1. Be Specific in Task Descriptions

**Bad:**
```bash
/invoke-flux-agent Fix the bug
```

**Good:**
```bash
/invoke-flux-agent Fix the race condition in user session management where concurrent requests can create duplicate sessions
```

### 2. Trust the Agent's Process

The agent enforces quality gates for a reason. Don't try to skip steps or rush through.

### 3. Provide Context When Asked

The agent may ask clarifying questions. Provide detailed context to help it make informed decisions.

### 4. Review the Plan

When the agent presents its ultrathink plan, review it carefully. Suggest adjustments if needed.

### 5. Let Specialists Do Their Work

The agent will launch specialist subagents. Trust their domain expertise and wait for them to complete.

## Agent Lifecycle

### Launch
```bash
/invoke-flux-agent <task>
```

The command validates requirements and launches the agent with full context.

### Execution

The agent:
1. Creates comprehensive plan
2. Launches specialist subagents as needed
3. Implements incrementally
4. Tests thoroughly
5. Reviews code and security
6. Reports completion

### Completion

The agent provides a detailed completion report and stops automatically.

## License

MIT

## Contributing

Contributions welcome! Please see the [main repository](https://github.com/applab-nl/claude-code-plugins) for guidelines.

## Support

- Issues: https://github.com/applab-nl/claude-code-plugins/issues
- Discussions: https://github.com/applab-nl/claude-code-plugins/discussions

## Related Plugins

- **flux-skill** - Skill-based implementation orchestrator (alternative approach)
- **agents** - Collection of specialist subagents used by flux
- **git-tools** - Git workflow automation
- **next-dev** - Next.js development specialist
- **flutter-dev** - Flutter development specialist

---

**Built with ❤️ by AppLab**
