# Claude Code Plugins Marketplace

A curated collection of Claude Code plugins designed to enhance your development workflow with powerful automation, intelligent planning, and seamless integrations.

## Overview

This marketplace provides production-ready Claude Code plugins that extend and customize your development experience. Each plugin is carefully designed to solve specific workflow challenges and integrate smoothly with your existing tools.

## Available Plugins

### Development Specialists

#### ⚛️ Next.js Development Specialist

**Next.js Expert with Integrated Devtools**

Expert Next.js developer for App Router applications with integrated runtime diagnostics, automated upgrades, and comprehensive testing.

- **Version**: 1.0.0
- **Category**: Frontend, Web Development
- **Integrations**: Next.js MCP (next-devtools-mcp), Playwright

[View Documentation](./next-dev/README.md)

**Key Features:**
- Runtime diagnostics via Next.js MCP integration
- Automated Next.js upgrades with official codemods
- Browser automation for page verification
- Server/Client Components expertise
- Comprehensive Next.js documentation access

#### ⚡ Svelte 5 Development Specialist

**Svelte 5 Expert with Runes Expertise**

Expert Svelte 5 developer with integrated MCP server for documentation access, static code analysis, and comprehensive runes expertise.

- **Version**: 1.0.0
- **Category**: Frontend, Web Development
- **Integrations**: Svelte MCP (svelte-devtools-mcp)

[View Documentation](./svelte-dev/README.md)

**Key Features:**
- Svelte 5 runes expertise ($state, $derived, $effect, $props)
- Static code analysis and documentation access
- SvelteKit routing and SSR
- TypeScript integration
- Reactive state management

#### 📱 Flutter Development Specialist

**Flutter & Dart Expert with MCP Integration**

Expert Flutter and Dart developer with integrated MCP server for code analysis, package management, testing, and runtime introspection.

- **Version**: 1.2.0
- **Category**: Mobile Development
- **Integrations**: Flutter MCP (dart-tooling-daemon)

[View Documentation](./flutter-dev/README.md)

**Key Features:**
- Code analysis and package management
- Dart fix and format automation
- Runtime error detection and hot reload
- Widget tree inspection
- pub.dev package search
- Cross-platform mobile development (Android & iOS)

#### 🐛 Sentry Issue Fixer

**Automated Sentry Error Investigation & Resolution**

Transform Sentry errors into comprehensive solutions with automated device log analysis and production-ready fixes.

- **Version**: 1.0.0
- **Category**: Debugging, Monitoring, Error Tracking
- **Integrations**: Sentry.io, iOS Debugging, Android Debugging

[View Documentation](./sentry-issue-fixer/README.md)

**Key Features:**
- Sentry MCP integration for direct API access
- iOS device log analysis (physical devices & simulators)
- Android ADB and logcat integration
- Multi-platform error analysis (Flutter, React Native, Native iOS/Android)
- Root cause identification with specific code fixes
- Enhanced monitoring recommendations

**Quick Start:**
```bash
/sentry-fix https://sentry.io/organizations/my-org/issues/12345/
/sentry-fix ISSUE-67890
/sentry-fix App crashes when opening camera
```

### Productivity Tools

#### 🔧 Git Tools

**Comprehensive Git Automation**

Intelligent commit message generation, git worktree management for isolated development, and streamlined Git workflows.

- **Version**: 1.3.0
- **Category**: Productivity, Version Control
- **Features**: Commit automation, worktree management

[View Documentation](./git-tools/README.md)

**Key Features:**
- Intelligent commit message generation following conventions
- Git worktree management for isolated feature development
- Streamlined branching workflows
- Conventional commit support

#### 🔔 Hooks Notifier

**Audio & Visual Notifications for Claude Code**

Get notified when Claude Code needs your attention or completes tasks.

- **Version**: 2.0.0
- **Category**: Productivity, Notifications
- **Platform**: macOS

[View Documentation](./hooks-notifier/README.md)

**Key Features:**
- Audio alerts when input is required
- Visual notifications when tasks complete
- Subagent completion notifications
- macOS native integration

#### 📝 Prompt Logger

**Prompt Logging & Analytics**

Logs user prompts and AskUserQuestion interactions to JSON files for analysis and review.

- **Version**: 1.3.0
- **Category**: Productivity, Analytics
- **Output**: JSON logs at `.claude/logs/prompts.json`

[View Documentation](./prompt-logger/README.md)

**Key Features:**
- Automatic prompt logging on submission
- AskUserQuestion interaction tracking
- JSON format for easy analysis
- Project-level log storage

#### 🔄 Agents MD

**Multi-Platform AI Instruction Converter**

Convert CLAUDE.md files to multi-platform AI instruction formats following the AGENTS.md standard.

- **Version**: 1.0.0
- **Category**: Productivity, Tooling
- **Supports**: GitHub Copilot, Gemini CLI, OpenCode

[View Documentation](./agents-md/README.md)

**Key Features:**
- Convert CLAUDE.md to AGENTS.md format
- GitHub Copilot instructions support
- Gemini CLI compatibility
- OpenCode integration
- Keep instructions in sync across platforms

### Agent Collections

#### 🤖 Agents Collection

**13 Specialized Development Agents**

Curated collection of specialized agents covering the entire development lifecycle from architecture to production monitoring.

- **Version**: 1.0.0
- **Category**: Development Tools, Subagents
- **Coverage**: Frontend, Backend, Mobile, Testing, Debugging, Architecture, DevOps

[View Documentation](./agents/README.md)

**Included Agents:**
- 🏛️ architecture-advisor - Architectural decisions and design patterns
- 🎨 frontend-specialist - React/Next.js and Svelte 5 development
- ⚙️ kotlin-backend-specialist - Spring Boot + Kotlin APIs
- 🗄️ supabase-integration-expert - Supabase backend implementation
- 🤖 android-debug-fixer - Android device debugging
- 📱 ios-debug-fixer - iOS device debugging
- 🔍 code-reviewer - Comprehensive code reviews
- ♻️ refactoring-specialist - Safe incremental refactoring
- ✅ test-engineer - Unit, integration, E2E testing
- 🚀 ci-cd-specialist - GitHub Actions workflows
- 🌿 git-workflow-manager - Git operations and worktrees
- 📦 dependency-auditor - Security auditing and updates
- 📊 monitoring-integration-specialist - Sentry.io integration

## Installation

### Add This Marketplace

```bash
/plugin marketplace add applab-nl/claude-code-plugins
```

### Install a Plugin

```bash
/plugin install git-tools@applab-plugins
```

### List Available Plugins

```bash
/plugin list
```

### Enable/Disable Plugins

```bash
/plugin enable git-tools
/plugin disable git-tools
```

## Developer Workflow

### Tmux Session Management

For managing multiple Claude Code sessions across different projects, you can use this handy alias that creates a tmux session named after your current directory:

```bash
alias claude-here='SESSION="claude-$(basename "$PWD")"; if [ -n "$TMUX" ]; then tmux has-session -t "$SESSION" 2>/dev/null || tmux new-session -d -s "$SESSION" claude; tmux switch-client -t "$SESSION"; else tmux new-session -A -s "$SESSION" claude; fi'
```

**Add to your shell configuration:**

```bash
# ~/.zshrc or ~/.bashrc
echo 'alias claude-here='"'"'SESSION="claude-$(basename "$PWD")"; if [ -n "$TMUX" ]; then tmux has-session -t "$SESSION" 2>/dev/null || tmux new-session -d -s "$SESSION" claude; tmux switch-client -t "$SESSION"; else tmux new-session -A -s "$SESSION" claude; fi'"'"'' >> ~/.zshrc
```

**Usage:**

```bash
cd ~/projects/my-app
claude-here  # Creates/attaches to session named "claude-my-app"
```

**Features:**
- Works both inside and outside tmux
- Automatically attaches to existing sessions
- Session names match directory names for easy identification
- Switches your current client when inside tmux

## Plugin Categories

### 🎨 Frontend Development
- **Next.js Development Specialist**: Next.js App Router expert with runtime diagnostics
- **Svelte 5 Development Specialist**: Svelte 5 with runes expertise
- **Frontend Specialist** (via Agents): React/Next.js and Svelte development

### 📱 Mobile Development
- **Flutter Development Specialist**: Flutter/Dart with MCP integration

### 🐛 Debugging & Monitoring
- **Sentry Issue Fixer**: Automated error investigation and resolution
- **Android Debug Fixer** (via Agents): Android device debugging
- **iOS Debug Fixer** (via Agents): iOS device debugging

### 🔧 Productivity & Automation
- **Git Tools**: Git workflow automation and commit generation
- **Hooks Notifier**: Audio/visual notifications
- **Prompt Logger**: Prompt analytics and logging
- **Agents MD**: Multi-platform AI instruction sync

### 🤖 Development Tools & Agents
- **Agents Collection**: 13 specialized agents for architecture, backend, testing, quality, DevOps, and monitoring

## Requirements

- Claude Code CLI (latest version)
- Git for project management
- Node.js 18+ (for MCP servers)
- Python 3.8+ with `uv` (for hook scripts)
- Optional: MCP servers for specific integrations
  - Sentry MCP for error tracking (Sentry Issue Fixer)
  - Supabase MCP (via Agents: supabase-integration-expert)
  - GitHub MCP for repository management
- Optional: Development tools
  - Next.js (for Next.js Development Specialist runtime features)
  - Flutter SDK (for Flutter Development Specialist)
  - iOS: Xcode, libimobiledevice for device debugging
  - Android: Android SDK with ADB

## Creating Your Own Plugins

This marketplace follows the official [Claude Code Plugin Reference](https://docs.claude.com/en/docs/claude-code/plugins-reference).

### Plugin Structure

```
your-plugin/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── agents/                   # Subagent definitions
│   └── your-agent.md
├── commands/                 # Slash commands
│   └── your-command.md
├── skills/                   # Skills (advanced commands)
│   └── your-skill.md
├── hooks/                    # Event hooks
│   └── your-hook.py
├── .mcp.json                # MCP servers (optional)
├── README.md                # Documentation
├── LICENSE                  # License
└── CHANGELOG.md             # Version history
```

### Contributing a Plugin

1. Fork this repository
2. Create a new directory for your plugin
3. Follow the plugin structure above
4. Add your plugin to `.claude-plugin/marketplace.json`
5. Submit a pull request

Example marketplace entry:
```json
{
  "name": "your-plugin",
  "source": "./your-plugin",
  "version": "1.0.0",
  "description": "Brief description",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "category": "category",
  "keywords": ["keyword1", "keyword2"],
  "license": "MIT"
}
```

## Best Practices

### Plugin Development
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Provide comprehensive documentation
- Include usage examples
- Add clear error messages
- Test with multiple project types

### User Experience
- Keep commands intuitive and memorable
- Provide helpful feedback during execution
- Handle errors gracefully
- Respect user preferences and context

### Integration
- Check for MCP server availability
- Fail gracefully when dependencies are missing
- Provide manual alternatives when automation fails
- Document all external requirements

## Support & Community

### Getting Help
- 📖 [Official Documentation](https://docs.claude.com/en/docs/claude-code/plugins-reference)
- 🐛 [Report Issues](https://github.com/applab-nl/claude-code-plugins/issues)
- 💬 [Discussions](https://github.com/applab-nl/claude-code-plugins/discussions)

### Contributing
We welcome contributions! Please:
1. Check existing issues and PRs
2. Follow the plugin structure guidelines
3. Add tests and documentation
4. Submit a detailed pull request

## Roadmap

### Completed ✅
- ✅ Sentry Issue Fixer v1.0.0 (Error investigation & debugging)
- ✅ Next.js Development Specialist v1.0.0 (Runtime diagnostics & upgrades)
- ✅ Svelte 5 Development Specialist v1.0.0 (Runes expertise)
- ✅ Flutter Development Specialist v1.2.0 (Mobile development with MCP)
- ✅ Agents Collection v1.0.0 (13 specialized development agents)
- ✅ Git Tools v1.3.0 (Commit automation & worktrees)
- ✅ Hooks Notifier v2.0.0 (Audio/visual notifications)
- ✅ Prompt Logger v1.3.0 (Prompt analytics)
- ✅ Agents MD v1.0.0 (Multi-platform AI instructions)

### Future
- ⏳ Additional framework-specific specialists
- ⏳ API documentation generator
- ⏳ Database migration helper
- ⏳ Performance profiling tools

## License

This marketplace and all included plugins are licensed under the MIT License unless otherwise specified. See individual plugin LICENSE files for details.

## Acknowledgments

Built for the Claude Code community with ❤️

Special thanks to:
- Anthropic for creating Claude Code
- Contributors and plugin developers
- The broader development community

---

**Marketplace Version**: 1.1.0
**Last Updated**: 2026-01-31
**Total Plugins**: 9
**Maintainer**: AppLab
