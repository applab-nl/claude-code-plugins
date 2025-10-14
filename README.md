# Claude Code Plugins Marketplace

A curated collection of Claude Code plugins designed to enhance your development workflow with powerful automation, intelligent planning, and seamless integrations.

## Overview

This marketplace provides production-ready Claude Code plugins that extend and customize your development experience. Each plugin is carefully designed to solve specific workflow challenges and integrate smoothly with your existing tools.

## Available Plugins

### 🚀 Flux Capacitor

**Feature Development Lifecycle Orchestrator**

Transform feature requests into comprehensive implementation plans with issue tracker integration and intelligent subagent delegation.

- **Version**: 1.0.0
- **Category**: Workflow, Planning, Issue Tracking
- **Integrations**: Linear, GitHub Issues (planned), Jira (planned)

[View Documentation](./flux-capacitor/README.md)

**Key Features:**
- Multi-mode workflow (Issue Key, Description, Plain Text)
- Linear integration with automatic status updates
- Ultrathink planning for comprehensive feature breakdown
- Intelligent subagent delegation recommendations
- Success criteria and testing plan generation

**Quick Start:**
```bash
/flux-capacitor MEM-123
/flux-capacitor Add OAuth authentication
```

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
- **Flux Capacitor**: Feature development lifecycle orchestration

### 🔗 Integration (Coming Soon)
- API integration helpers
- Database migration tools
- CI/CD automation

### 🧪 Testing & Quality (Coming Soon)
- Comprehensive test generation
- Code review automation
- Security scanning

### 📚 Documentation (Coming Soon)
- API documentation generation
- Changelog automation
- README maintenance

## Requirements

- Claude Code CLI (latest version)
- Git for project management
- Optional: MCP servers for specific integrations
  - Linear MCP for issue tracking
  - GitHub MCP for repository management

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

### Q1 2025
- ✅ Flux Capacitor v1.0 (Feature planning & issue tracking)
- ⏳ GitHub Issues integration
- ⏳ Jira integration
- ⏳ Git worktree automation

### Q2 2025
- ⏳ Comprehensive test generation plugin
- ⏳ API documentation generator
- ⏳ Security scanning plugin
- ⏳ Database migration helper

### Q3 2025
- ⏳ CI/CD automation suite
- ⏳ Code review automation
- ⏳ Performance profiling tools
- ⏳ Deployment automation

## License

This marketplace and all included plugins are licensed under the MIT License unless otherwise specified. See individual plugin LICENSE files for details.

## Acknowledgments

Built for the Claude Code community with ❤️

Special thanks to:
- Anthropic for creating Claude Code
- Contributors and plugin developers
- The broader development community

---

**Version**: 1.0.0
**Last Updated**: 2025-10-14
**Maintainer**: Dylan
