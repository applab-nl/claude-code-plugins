# Changelog

All notable changes to the svelte-dev plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-23

### Added

- Initial release of svelte-dev plugin
- **svelte-specialist** agent with comprehensive Svelte 5 runes expertise
- Integration with **@sveltejs/mcp** server (4 powerful tools)
- Automatic agent activation for Svelte projects
- Svelte brand colors (#FF3E00) and icon (⚡)
- Support for Svelte 5 and SvelteKit

#### Svelte 5 Runes Expertise

Complete coverage of Svelte 5's new reactivity system:
- **$state** - Reactive state management for primitives, objects, and arrays
- **$derived** - Computed values with automatic dependency tracking
- **$effect** - Side effects and lifecycle management with cleanup
- **$props** - Component props with TypeScript support and defaults
- **$bindable** - Two-way binding for component props
- **$inspect** - Development debugging for reactive state

#### MCP Tools Integration

1. **list-sections** - Discover available documentation sections
   - Returns titles, use cases, and paths
   - Should be called first for Svelte topics
   - Navigate comprehensive documentation

2. **get-documentation** - Retrieve documentation content
   - Support for single or multiple sections
   - Access Svelte 5 and SvelteKit documentation
   - Core concepts, patterns, routing, data loading

3. **svelte-autofixer** - Static code analysis and improvement
   - **REQUIRED** before delivering any Svelte code
   - Identifies issues and suggests improvements
   - Iterates until no issues remain
   - Critical quality assurance tool

4. **playground-link** - Generate Svelte Playground links
   - Only after explicit user confirmation
   - For sharing examples and demonstrations
   - Not for project files

#### SvelteKit Support

- File-based routing patterns
- Data loading with load functions
- Form actions for server-side mutations
- API routes
- Layouts and nested routing
- SSR and SSG patterns
- TypeScript support throughout

#### Component Patterns

- Snippets (render blocks replacing some slot patterns)
- Event handling without event forwarding
- Bindings (value, checked, group, element references)
- Transitions and animations
- Context API for shared state

#### State Management

- Rune-based stores (.svelte.ts files)
- Context API patterns
- When to use each approach
- Performance optimization

#### Documentation

- Comprehensive README with runes examples (400+ lines)
- MCP tools reference guide
- Complete runes guide with examples
- SvelteKit patterns and conventions
- Best practices for Svelte 5 development
- Troubleshooting guide
- Agent capabilities overview

#### Agent Features

- Automatic delegation for Svelte projects
- Proactive documentation search
- Code quality validation with svelte-autofixer
- TypeScript best practices
- Performance optimization patterns
- Accessibility guidance

### Technical Details

- Plugin version: 1.0.0
- Requires: Claude Code CLI
- Requires: Node.js 18+
- Supports: Svelte 5, SvelteKit
- MCP Server: @sveltejs/mcp@latest (via npx)
- Agent model: sonnet
- Agent tools: Read, Write, Edit, Bash, Grep, Glob
- Brand color: #FF3E00 (Svelte orange)
- Icon: ⚡ (representing speed and reactivity)

### Notes

- This is the initial stable release
- All MCP tools are automatically available when plugin is enabled
- Agent automatically activates in Svelte projects
- svelte-autofixer runs before code delivery to ensure quality
- No additional configuration required for basic usage
- Svelte 5 required for full runes support
- Legacy Svelte 4 patterns not recommended (use runes instead)
