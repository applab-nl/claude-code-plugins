# Changelog

All notable changes to the Sentry Issue Fixer plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-14

### Added
- Initial release of Sentry Issue Fixer plugin
- Sentry MCP server integration for direct API access
- iOS device debugging support via idevicesyslog and xcrun simctl
- Android device debugging support via ADB and logcat
- Multi-platform error analysis (Flutter, React Native, Native iOS/Android, Web)
- `/sentry-fix` command for investigating Sentry issues
- Comprehensive agent with monitoring and debugging expertise
- Support for Sentry issue investigation via URL, ID, or description
- Automatic device log correlation with Sentry errors
- Root cause analysis with specific code fixes
- Prevention measures and monitoring improvement suggestions
- Support for breadcrumb analysis and environment context
- Documentation and troubleshooting guides

### Features
- **Sentry Integration**: Fetch issues, parse stack traces, review breadcrumbs
- **iOS Debugging**: Physical device and simulator log analysis
- **Android Debugging**: ADB integration and logcat parsing
- **Root Cause Analysis**: Automated error investigation
- **Solution Proposals**: Specific fixes with code examples
- **Monitoring Enhancements**: Recommendations for better error tracking

### Platforms Supported
- Flutter/Dart
- React Native
- Native iOS (Swift/Objective-C)
- Native Android (Kotlin/Java)
- Web (JavaScript/TypeScript)
- Spring Boot/Kotlin (backend)

## [Unreleased]

### Planned Features
- Integration with GitHub Issues for issue creation
- Automatic fix application (with user approval)
- Batch issue processing
- Error trend analysis
- Performance monitoring integration
- Custom rule configuration for error categorization
- Integration with Linear for project management
- Slack/Discord notifications for critical errors
- Team collaboration features

---

For more information, visit: https://github.com/applab-nl/claude-code-plugins
