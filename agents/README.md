# Agents Plugin

**Curated Collection of Specialized Development Agents** - A comprehensive Claude Code plugin providing 13 expert agents for frontend, backend, mobile, testing, debugging, architecture, and DevOps workflows.

## Overview

This plugin provides a complete suite of specialized agents, each with distinctive colors and icons for easy identification. These agents cover the full development lifecycle from architecture planning to production monitoring, ensuring you have expert assistance at every stage.

## Available Agents

### 🏗️ Architecture & Design

#### 🏛️ architecture-advisor
- **Color**: `#9B59B6` (Purple)
- **Purpose**: High-level architectural decisions, design patterns, system design reviews
- **Use Cases**: Planning new features, refactoring system structure, ensuring SOLID principles
- **Expertise**: Multi-platform architecture (Flutter, React/Next.js, Svelte, Spring Boot + Kotlin)

### 💻 Frontend Development

#### 🎨 frontend-specialist
- **Color**: `#1ABC9C` (Teal)
- **Purpose**: Expert React/Next.js and Svelte 5 development
- **Use Cases**: Building UI components, state management, TypeScript, server/client components
- **Expertise**: Next.js App Router, React 18+, Svelte 5 runes, performance optimization

### ⚙️ Backend Development

#### ⚙️ kotlin-backend-specialist
- **Color**: `#E67E22` (Orange)
- **Purpose**: Spring Boot + Kotlin backend APIs
- **Use Cases**: RESTful APIs, JPA/Hibernate, OAuth2/JWT security, dependency injection
- **Expertise**: Spring Boot best practices, database optimization, API design

#### 🗄️ supabase-integration-expert
- **Color**: `#16A085` (Teal-Green)
- **Purpose**: Supabase backend-as-a-service implementation
- **Use Cases**: Database schemas, RLS policies, authentication, Edge Functions, real-time subscriptions
- **Expertise**: PostgreSQL, Supabase Auth, Storage, real-time features

### 📱 Mobile Debugging

#### 🤖 android-debug-fixer
- **Color**: `#4CAF50` (Material Green)
- **Purpose**: Android device debugging and crash analysis
- **Use Cases**: Logcat analysis, crash investigation, ADB operations, permission errors
- **Expertise**: Android platform, stack traces, ANR issues, device-specific problems

#### 📱 ios-debug-fixer
- **Color**: `#007AFF` (iOS Blue)
- **Purpose**: iOS device and simulator debugging
- **Use Cases**: Device log analysis, crash reports, Xcode debugging, iOS-specific errors
- **Expertise**: iOS platform, symbolication, keychain issues, threading problems

### 🔍 Code Quality

#### 🔍 code-reviewer
- **Color**: `#E74C3C` (Red)
- **Purpose**: Comprehensive code quality reviews
- **Use Cases**: Pre-commit reviews, pull request analysis, security audits
- **Expertise**: SOLID principles, security vulnerabilities, best practices, maintainability

#### ♻️ refactoring-specialist
- **Color**: `#F39C12` (Yellow-Orange)
- **Purpose**: Safe, incremental code refactoring
- **Use Cases**: Reducing technical debt, extracting reusable components, performance optimization
- **Expertise**: Incremental refactoring, test coverage maintenance, code smell elimination

### ✅ Testing

#### ✅ test-engineer
- **Color**: `#27AE60` (Green)
- **Purpose**: Comprehensive automated testing
- **Use Cases**: Unit tests, integration tests, E2E tests, test coverage analysis
- **Expertise**: Jest, Vitest, Playwright, Flutter testing, mocking strategies

### 🚀 DevOps & CI/CD

#### 🚀 ci-cd-specialist
- **Color**: `#2C3E50` (Dark Blue-Gray)
- **Purpose**: GitHub Actions workflows and deployment automation
- **Use Cases**: Pipeline setup, build optimization, deployment configuration
- **Expertise**: GitHub Actions, matrix builds, caching strategies, secrets management

#### 🌿 git-workflow-manager
- **Color**: `#F44336` (Material Red)
- **Purpose**: Git operations and workflow management
- **Use Cases**: Branch management, worktrees, merging, conflict resolution
- **Expertise**: Git internals, branching strategies, version history management

### 📦 Dependencies & Monitoring

#### 📦 dependency-auditor
- **Color**: `#795548` (Brown)
- **Purpose**: Dependency management and security auditing
- **Use Cases**: Version updates, vulnerability scanning, breaking change analysis
- **Expertise**: npm, pub, Gradle, security best practices

#### 📊 monitoring-integration-specialist
- **Color**: `#8E44AD` (Purple)
- **Purpose**: Sentry.io integration and error tracking
- **Use Cases**: Error tracking setup, performance monitoring, alert configuration
- **Expertise**: Sentry integration across Flutter, React, and backend platforms

## Installation

### From Marketplace

```bash
/plugin marketplace add applab-nl/claude-code-plugins
/plugin install agents@applab-plugins
```

### Manual Installation

1. Clone this repository
2. Copy the `agents` directory to your plugins location
3. Enable the plugin in Claude Code

## Usage

### Automatic Agent Selection

Many agents are configured to activate automatically when working with their respective tech stacks:

- **frontend-specialist**: Activates for React/Next.js/Svelte projects
- **kotlin-backend-specialist**: Activates for Spring Boot + Kotlin projects
- **supabase-integration-expert**: Activates when working with Supabase
- **android-debug-fixer**: Activates when debugging Android devices
- **ios-debug-fixer**: Activates when debugging iOS devices

### Manual Agent Invocation

Use the Task tool to invoke specific agents:

```bash
# Code review before committing
I'm going to use the code-reviewer agent to review these changes

# Refactor existing code
Let me use the refactoring-specialist to improve this module

# Update dependencies
I'll use the dependency-auditor to check for updates

# Architecture planning
Let me consult the architecture-advisor for this feature design
```

## Agent Categories

### Development Lifecycle
1. **Plan**: architecture-advisor
2. **Build**: frontend-specialist, kotlin-backend-specialist, supabase-integration-expert
3. **Test**: test-engineer
4. **Review**: code-reviewer
5. **Refactor**: refactoring-specialist
6. **Debug**: android-debug-fixer, ios-debug-fixer
7. **Deploy**: ci-cd-specialist
8. **Monitor**: monitoring-integration-specialist

### Support Functions
- **Version Control**: git-workflow-manager
- **Dependencies**: dependency-auditor

## Tech Stack Coverage

### Frontend
- React 18+ with Next.js 14+ (App Router)
- Svelte 5 with runes
- TypeScript

### Backend
- Spring Boot + Kotlin
- Supabase (PostgreSQL, Auth, Storage, Edge Functions)

### Mobile
- Flutter + Dart
- Android native debugging
- iOS native debugging

### Testing
- Jest, Vitest, React Testing Library
- Playwright, Cypress
- Flutter test, widget tests, integration tests

### DevOps
- GitHub Actions
- Git workflows and worktrees

### Monitoring
- Sentry.io error tracking
- Performance monitoring

## Best Practices

### When to Use Each Agent

**Before Starting Work:**
- **architecture-advisor**: Design the approach
- **dependency-auditor**: Check for outdated packages

**During Development:**
- **frontend-specialist** / **kotlin-backend-specialist** / **supabase-integration-expert**: Implementation
- **test-engineer**: Write comprehensive tests

**Before Committing:**
- **code-reviewer**: Review code quality
- **test-engineer**: Ensure test coverage

**During Debugging:**
- **android-debug-fixer** / **ios-debug-fixer**: Platform-specific issues

**Deployment:**
- **ci-cd-specialist**: Configure pipelines
- **monitoring-integration-specialist**: Set up error tracking

**Maintenance:**
- **refactoring-specialist**: Improve code quality
- **git-workflow-manager**: Manage branches and merges

## Agent Coordination

Agents can work together for complex tasks:

```bash
# Full feature workflow
1. architecture-advisor → Plan approach
2. frontend-specialist → Implement UI
3. kotlin-backend-specialist → Build API
4. supabase-integration-expert → Configure database
5. test-engineer → Write tests
6. code-reviewer → Review quality
7. ci-cd-specialist → Deploy
8. monitoring-integration-specialist → Monitor production
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
