# Changelog

All notable changes to the flutter-dev plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-23

### Added

- Initial release of flutter-dev plugin
- **flutter-specialist** agent with comprehensive Flutter & Dart expertise
- Integration with **Dart MCP server** (6 major capabilities)
- Automatic agent activation for Flutter/Dart projects
- Flutter brand colors (#42A5F5) and icon (📱)
- Support for Flutter and Dart development

#### Dart MCP Server Integration

Six powerful development tools automatically available:

1. **Code Analysis** - Analyze and fix errors automatically
   - Automatic error detection
   - Syntax error fixing during code generation
   - Self-correction capabilities
   - Comprehensive quality checks

2. **Symbol Resolution** - Access documentation and signatures
   - Class and method documentation
   - Function signatures
   - Type information
   - API reference

3. **Application Introspection** - Debug running Flutter apps
   - Real-time app debugging
   - Layout issue detection
   - Runtime error analysis
   - Widget tree inspection

4. **Package Management** - Intelligent pub.dev integration
   - Search for packages by use case
   - Automated dependency management
   - Add packages to pubspec.yaml
   - Generate integration boilerplate

5. **Testing** - Automated test execution
   - Run widget and unit tests
   - Analyze test failures
   - Coverage reporting
   - Test diagnostics

6. **Code Formatting** - Enforce Dart style guide
   - Automatic code formatting
   - Style consistency
   - Pre-delivery formatting

#### Flutter Development Expertise

**Widget Composition**
- Reusable, composable widget patterns
- Const constructors for performance
- Proper widget hierarchies
- Separation of concerns

**State Management**
- setState for simple state
- Riverpod 2.0+ for medium/complex apps
- BLoC pattern for enterprise applications
- Provider for dependency injection

**Platform-Specific Code**
- Method channels for native integration
- Android and iOS platform-specific UI
- Platform detection and conditional logic
- Safe area handling

**Performance Optimization**
- Rendering performance (const, RepaintBoundary, ListView.builder)
- Memory management (dispose pattern)
- App size optimization
- Profiling with Flutter DevTools

**Navigation & Routing**
- GoRouter implementation
- Deep linking support
- Route guards and redirects
- Type-safe navigation

**Supabase Integration**
- Authentication (email/password, OAuth)
- Database operations with RLS
- Real-time subscriptions
- Storage (upload/download)
- Auth state management

**Error Handling**
- Global error handling
- Sentry integration
- Try-catch patterns
- Error reporting

**UI/UX Best Practices**
- Material Design 3
- Dark mode support
- Responsive layouts
- Accessibility (Semantics)

**Testing**
- Widget tests
- Integration tests
- Unit tests
- Test coverage

#### Documentation

- Comprehensive README (400+ lines)
- Installation and requirements
- Automatic agent activation triggers
- 4 detailed workflow examples:
  1. Building widgets with code analysis
  2. Finding and adding packages
  3. Debugging runtime errors
  4. Integrating Supabase
- Complete MCP tools reference
- Flutter best practices guide
- Troubleshooting guide

#### Agent Features

- Automatic delegation for Flutter/Dart projects
- Proactive code analysis
- Package discovery and management
- Runtime debugging support
- Testing automation
- Code formatting enforcement
- Repository pattern implementation
- Riverpod dependency injection examples

### Technical Details

- Plugin version: 1.0.0
- Requires: Claude Code CLI
- Requires: Dart SDK 3.9+ (for MCP server)
- Requires: Flutter SDK (for Flutter projects)
- MCP Server: Dart MCP server (official, maintained by Dart team)
- Agent model: sonnet
- Agent tools: Read, Write, Edit, Bash, Grep, Glob
- Brand: #42A5F5 (Flutter blue), 📱 icon
- Experimental: MCP server subject to rapid evolution

### Notes

- This is the initial stable release
- All MCP tools automatically available when plugin is enabled
- Agent automatically activates in Flutter/Dart projects
- Code analysis runs before code delivery
- Requires Dart SDK 3.9+ for full MCP functionality
- MCP server is experimental and subject to changes
