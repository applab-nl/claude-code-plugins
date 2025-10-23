# Claude Code Plugins Marketplace

A curated collection of Claude Code plugins designed to enhance your development workflow with powerful automation, intelligent planning, and seamless integrations.

## Overview

This marketplace provides production-ready Claude Code plugins that extend and customize your development experience. Each plugin is carefully designed to solve specific workflow challenges and integrate smoothly with your existing tools.

## Available Plugins

### 🚀 Flux Capacitor

**Feature Development Lifecycle Orchestrator**

Transform feature requests into comprehensive implementation plans with issue tracker integration and intelligent subagent delegation.

- **Version**: 1.2.1
- **Category**: Workflow, Planning, Issue Tracking
- **Integrations**: Linear, GitHub Issues (planned), Jira (planned)

[View Documentation](./flux-capacitor/README.md)

**Key Features:**
- Multi-mode workflow (Issue Key, Description, Plain Text)
- Linear integration with automatic status updates
- Ultrathink planning for comprehensive feature breakdown
- Intelligent subagent delegation recommendations
- Success criteria and testing plan generation
- Git worktree management and session orchestration

**Quick Start:**
```bash
/run MEM-123
/run Add OAuth authentication
```

### 🐛 Sentry Issue Fixer

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

### ⚛️ Next.js Development Specialist

**Next.js Expert with Integrated Devtools**

Expert Next.js developer for App Router applications with integrated runtime diagnostics, automated upgrades, and comprehensive testing.

- **Version**: 1.0.0
- **Category**: Frontend, Web Development
- **Integrations**: Next.js MCP (next-devtools-mcp), Playwright

[View Documentation](./next-dev/README.md)

**Key Features:**
- Runtime diagnostics via Next.js MCP integration
- Automated Next.js 16 upgrades with official codemods
- Browser automation for page verification
- Cache Components setup and error detection
- Server/Client Components expertise
- Comprehensive Next.js documentation access

### ⚡ Svelte 5 Development Specialist

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

### 📱 Flutter Development Specialist

**Flutter & Dart Expert with MCP Integration**

Expert Flutter and Dart developer with integrated MCP server for code analysis, package management, testing, and runtime introspection.

- **Version**: 1.0.0
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

### 🤖 Agents Collection

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
/plugin install flux-capacitor@applab-plugins
```

### List Available Plugins

```bash
/plugin list
```

### Enable/Disable Plugins

```bash
/plugin enable flux-capacitor
/plugin disable flux-capacitor
```

## Plugin Categories

### 📋 Workflow & Planning
- **Flux Capacitor**: Feature development lifecycle orchestration with Linear integration

### 🐛 Debugging & Monitoring
- **Sentry Issue Fixer**: Automated error investigation and resolution
- **Android Debug Fixer** (via Agents): Android device debugging
- **iOS Debug Fixer** (via Agents): iOS device debugging

### 🎨 Frontend Development
- **Next.js Development Specialist**: Next.js App Router expert with runtime diagnostics
- **Svelte 5 Development Specialist**: Svelte 5 with runes expertise
- **Frontend Specialist** (via Agents): React/Next.js and Svelte development

### 📱 Mobile Development
- **Flutter Development Specialist**: Flutter/Dart with MCP integration

### 🤖 Development Tools & Agents
- **Agents Collection**: 13 specialized agents for architecture, backend, testing, quality, DevOps, and monitoring

## Requirements

- Claude Code CLI (latest version)
- Git for project management
- Node.js 18+ (for MCP servers)
- Optional: MCP servers for specific integrations
  - Linear MCP for issue tracking (Flux Capacitor)
  - Sentry MCP for error tracking (Sentry Issue Fixer)
  - Supabase MCP (via Agents: supabase-integration-expert)
  - GitHub MCP for repository management
- Optional: Development tools
  - Next.js 16+ (for Next.js Development Specialist runtime features)
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
├── hooks/                    # Event hooks (optional)
│   └── hooks.json
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
  "path": "./your-plugin",
  "version": "1.0.0",
  "description": "Brief description",
  "author": "Your Name",
  "keywords": ["category", "feature"],
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
- ✅ Flux Capacitor v1.2.1 (Feature planning, issue tracking & worktree orchestration)
- ✅ Sentry Issue Fixer v1.0.0 (Error investigation & debugging)
- ✅ Next.js Development Specialist v1.0.0 (Runtime diagnostics & upgrades)
- ✅ Svelte 5 Development Specialist v1.0.0 (Runes expertise)
- ✅ Flutter Development Specialist v1.0.0 (Mobile development with MCP)
- ✅ Agents Collection v1.0.0 (13 specialized development agents)

### Q4 2025
- ⏳ GitHub Issues integration (Flux Capacitor)
- ⏳ Jira integration (Flux Capacitor)
- ⏳ Additional framework-specific specialists

### Future
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
**Last Updated**: 2025-10-23
**Total Plugins**: 6
**Maintainer**: AppLab
