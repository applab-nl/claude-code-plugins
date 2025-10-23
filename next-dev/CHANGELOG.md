# Changelog

All notable changes to the next-dev plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-23

### Added

- Initial release of next-dev plugin
- **nextjs-specialist** agent with comprehensive Next.js expertise (versions 14-16)
- Integration with **next-devtools-mcp** server (5 powerful tools)
- Automatic agent activation for Next.js projects
- Support for App Router architecture and patterns
- Server/Client Components best practices
- Async APIs support (Next.js 15+ params, searchParams, cookies, headers)
- Route handlers with TypeScript types
- Data fetching patterns and caching strategies
- Cache Components support (Next.js 16)
- Performance optimization guidance (streaming, Suspense, code splitting)

#### MCP Tools Integration

1. **nextjs_docs** - Search official Next.js documentation and knowledge base
   - Access to 12 Next.js 16 resources
   - Smart keyword matching
   - Fallback to official docs

2. **browser_eval** - Playwright browser automation for comprehensive testing
   - Page navigation and interaction
   - Form filling and submission
   - Screenshot capture
   - Console message monitoring
   - Full user flow testing

3. **nextjs_runtime** - Runtime diagnostics from running dev server
   - Error detection and reporting
   - Route structure inspection
   - Build status monitoring
   - Agentic codebase search

4. **upgrade_nextjs_16** - Automated Next.js 16 upgrade
   - Official codemod execution
   - Dependency upgrades (Next.js, React, React DOM)
   - Async API migration
   - Configuration updates
   - Deprecated API handling

5. **enable_cache_components** - Complete Cache Components setup
   - Configuration updates
   - Dev server management
   - Automated error detection
   - Fix application (Suspense, "use cache", cacheLife)
   - Route verification

#### Documentation

- Comprehensive README with usage examples
- MCP tools reference guide
- Best practices for Next.js development
- Troubleshooting guide
- Agent capabilities overview

#### Agent Features

- Automatic delegation for Next.js projects
- Proactive runtime diagnostics
- Browser-based page verification
- Documentation search integration
- Upgrade automation support
- TypeScript best practices
- Performance optimization patterns
- SEO and metadata guidance

### Technical Details

- Plugin version: 1.0.0
- Requires: Claude Code CLI
- Requires: Node.js 20.19+
- Supports: Next.js 14, 15, 16+
- MCP Server: next-devtools-mcp@latest (via npx)
- Agent model: sonnet
- Agent tools: Read, Write, Edit, Bash, Grep, Glob

### Notes

- This is the initial stable release
- All MCP tools are automatically available when plugin is enabled
- Agent automatically activates in Next.js projects
- No additional configuration required for basic usage
- Clean git state required for automated upgrades
- Next.js 16+ recommended for full MCP runtime support
