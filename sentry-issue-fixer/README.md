# Sentry Issue Fixer Plugin

**Automated Sentry Error Investigation & Resolution** - A comprehensive Claude Code plugin that fetches Sentry errors, analyzes device logs, and proposes production-ready fixes for iOS, Android, and web applications.

## Overview

The Sentry Issue Fixer plugin streamlines your debugging workflow by:
- Fetching error details directly from Sentry via MCP integration
- Analyzing device logs (iOS/Android) for crash investigation
- Correlating Sentry errors with local device debugging
- Providing comprehensive root cause analysis
- Proposing specific code fixes with examples
- Recommending monitoring and prevention improvements

## Features

### Sentry Integration
- **Direct MCP Integration**: Connects to Sentry via Model Context Protocol
- **Issue Fetching**: Retrieve issues by URL, ID, or search criteria
- **Stack Trace Analysis**: Parse and analyze errors from multiple platforms
- **Breadcrumb Review**: Understand user actions leading to errors
- **Environment Context**: Device info, OS versions, app versions
- **Release Health**: Track crash-free rates and adoption

### Device Debugging
- **iOS Support**:
  - Physical device log streaming via `idevicesyslog`
  - Simulator logs via `xcrun simctl`
  - Crash report analysis
  - Main Thread Checker violations
  - Permission error detection

- **Android Support**:
  - ADB logcat integration
  - Stack trace parsing
  - ANR detection
  - Permission analysis

### Multi-Platform Analysis
- **Flutter/Dart**: Null safety, lifecycle issues, platform channels
- **React Native**: Bridge errors, component lifecycle, networking
- **Native iOS**: Swift/Objective-C crashes, memory issues
- **Native Android**: Kotlin/Java exceptions, resource errors
- **Web**: JavaScript errors, network failures

### Comprehensive Solutions
- Root cause identification
- Specific code fixes with examples
- Defensive programming suggestions
- Error handling improvements
- Testing steps
- Prevention measures
- Enhanced monitoring recommendations

## Installation

### From Marketplace

```bash
/plugin marketplace add applab-nl/claude-code-plugins
/plugin install sentry-issue-fixer@applab-plugins
```

### Manual Installation

1. Clone this repository
2. Copy the `sentry-issue-fixer` directory to your plugins location
3. Enable the plugin in Claude Code

## Requirements

### Essential
- Claude Code CLI (latest version)
- Sentry account with API access

### Optional (for enhanced functionality)
- **Sentry MCP Server**: For direct Sentry API integration
- **iOS Development**:
  - Xcode command line tools
  - `libimobiledevice` for physical device access
- **Android Development**:
  - Android SDK with ADB

## Configuration

### Step 1: Sentry MCP Server Setup

The plugin includes Sentry MCP configuration. Set up your environment variables:

```bash
# Add to your shell profile (~/.zshrc, ~/.bashrc, etc.)
export SENTRY_AUTH_TOKEN="your-sentry-auth-token"
export SENTRY_ORG_SLUG="your-organization-slug"
```

**Getting Your Sentry Auth Token:**
1. Go to Sentry Settings → Account → API → Auth Tokens
2. Create a new token with `project:read`, `event:read`, `org:read` scopes
3. Copy the token and set it in your environment

**Finding Your Organization Slug:**
- It's in your Sentry URL: `https://sentry.io/organizations/{org-slug}/`

### Step 2: iOS Setup (Optional)

For physical iOS device debugging:

```bash
# Install libimobiledevice via Homebrew
brew install libimobiledevice
brew install ideviceinstaller

# Verify device connection
idevice_id -l
```

### Step 3: Android Setup (Optional)

For Android device debugging:

```bash
# Ensure ADB is in your PATH
# Usually installed with Android Studio

# Verify ADB
adb devices
```

## Usage

### Basic Usage

**1. Investigate Specific Sentry Issue**
```bash
/sentry-fix https://sentry.io/organizations/my-org/issues/12345/
```

**2. By Issue ID**
```bash
/sentry-fix ISSUE-67890
```

**3. By Error Description**
```bash
/sentry-fix App crashes when user taps login button
```

**4. Fetch Recent Critical Issues**
```bash
/sentry-fix
```

### Advanced Usage

**With Connected Devices:**
When iOS or Android devices are connected, the agent will automatically:
1. Detect connected devices
2. Fetch relevant logs
3. Correlate Sentry errors with device logs
4. Provide platform-specific analysis

**Example Workflow:**
```bash
# 1. Connect your iPhone/Android device
# 2. Run your app to reproduce the issue
# 3. Investigate with sentry-fix
/sentry-fix https://sentry.io/organizations/acme/issues/42/

# The agent will:
# - Fetch error details from Sentry
# - Pull device logs
# - Correlate timestamps
# - Analyze both sources
# - Propose comprehensive fix
```

## How It Works

### Phase 1: Sentry Analysis
1. Fetches issue from Sentry via MCP
2. Parses stack trace and error message
3. Reviews breadcrumbs for user context
4. Checks affected versions and platforms
5. Analyzes error frequency and impact

### Phase 2: Device Log Correlation
1. Checks for connected iOS/Android devices
2. Identifies relevant device by platform
3. Captures logs around error timestamp
4. Filters for app package/bundle ID
5. Correlates with Sentry error timing

### Phase 3: Root Cause Analysis
1. Pinpoints exact error location
2. Identifies error category and severity
3. Reviews code context
4. Checks for known platform issues
5. Determines contributing factors

### Phase 4: Solution Development
1. Proposes specific code fixes
2. Provides implementation examples
3. Explains root cause
4. Suggests defensive programming
5. Recommends testing approach

### Phase 5: Prevention & Monitoring
1. Suggests additional error handling
2. Recommends monitoring improvements
3. Proposes custom breadcrumbs/tags
4. Sets up alert recommendations

## Examples

### Example 1: Flutter Null Safety Violation

```
User: /sentry-fix https://sentry.io/my-org/issues/123/

Agent Response:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ISSUE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: Null check operator used on a null value
Severity: CRITICAL
Platform: Flutter (iOS & Android)
Affected Users: 234 (12% of active users)
Frequency: 456 events in last 24 hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 ROOT CAUSE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: lib/features/auth/login_screen.dart:45

The error occurs when accessing user.email! after login, but the
login API returns null when authentication fails silently.

Contributing factors:
- No null check before forced unwrapping
- API can return null on certain error conditions
- Missing error state handling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PROPOSED FIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Before (causes crash):
final email = user.email!;

// After (defensive):
final email = user.email;
if (email == null) {
  // Handle missing email
  await _handleAuthError('Email not available');
  return;
}

// Better: Use null-aware operator
final email = user.email ?? 'Unknown';

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ PREVENTION MEASURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Enable strict null safety linting:
   - Add to analysis_options.yaml:
     analyzer:
       strong-mode:
         implicit-dynamic: false

2. Add comprehensive error handling:
   try {
     final user = await authService.login();
     if (user?.email == null) {
       throw AuthException('Invalid user data');
     }
   } catch (e) {
     Sentry.captureException(e);
   }

3. Add custom breadcrumb:
   Sentry.addBreadcrumb(Breadcrumb(
     message: 'Login API response',
     data: {'hasEmail': user.email != null},
   ));

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Example 2: Android Permission Error

```
User: /sentry-fix App crashes when opening camera on Android

Agent Response:
[Searches Sentry for camera-related crashes]
[Finds matching issue]
[Fetches Android device logs via ADB]
[Correlates Sentry error with logcat output]

Found issue in Sentry: CAMERA-PERMISSION-DENIED

Device logs show:
  E/ActivityManager: Permission Denial: starting Intent requires
  android.permission.CAMERA

Root cause: Missing runtime permission request on Android 6.0+

[Provides fix with permission request code]
[Suggests adding permission rationale UI]
[Recommends monitoring permission grant rates]
```

## Troubleshooting

### Sentry MCP Not Available

If Sentry MCP server is not configured:
```bash
# Check MCP servers
claude mcp list

# Configure manually in ~/.claude/config.json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sentry"],
      "env": {
        "SENTRY_AUTH_TOKEN": "your-token",
        "SENTRY_ORG_SLUG": "your-org"
      }
    }
  }
}
```

### iOS Device Not Detected

```bash
# Check device connection
idevice_id -l

# If empty, check:
# 1. Device is unlocked
# 2. "Trust This Computer" was accepted
# 3. USB cable is working

# Restart usbmuxd if needed
sudo killall -9 usbmuxd
```

### Android Device Not Detected

```bash
# Check ADB
adb devices

# If "unauthorized":
# 1. Check device for USB debugging prompt
# 2. Revoke USB debugging authorizations in Developer Options
# 3. Reconnect and accept prompt

# Restart ADB server if needed
adb kill-server && adb start-server
```

### No Logs Captured

- Ensure app is running when logs are captured
- Check filter patterns match your app's bundle/package ID
- Try increasing log verbosity
- Clear old logs first: `adb logcat -c`

## Best Practices

### When to Use This Plugin

**Ideal for:**
- Investigating production crashes
- Understanding user-reported errors
- Debugging platform-specific issues
- Correlating Sentry errors with local testing
- Improving error monitoring

**Not ideal for:**
- Real-time debugging (use IDE debugger)
- Performance profiling (use platform tools)
- Security audits (use specialized tools)

### Effective Investigation

1. **Start with Sentry**: Always review Sentry context first
2. **Check Frequency**: High-frequency errors should be prioritized
3. **Review Breadcrumbs**: Understand user flow before error
4. **Test Locally**: Reproduce with device connected when possible
5. **Implement & Verify**: Test fix thoroughly before deploying

### Monitoring Hygiene

- Set up alerts for new error types
- Review resolved issues for regressions
- Track crash-free rates per release
- Monitor performance alongside errors
- Use custom tags for better categorization

## Contributing

Contributions are welcome! Please submit issues and pull requests to the main repository.

## License

MIT License - See LICENSE file for details

## Version

Current version: 1.0.0

## Support

For issues, feature requests, or questions:
- GitHub Issues: https://github.com/applab-nl/claude-code-plugins/issues
- Documentation: https://docs.claude.com/en/docs/claude-code/plugins-reference

## Acknowledgments

Built with:
- Sentry.io for error tracking
- Model Context Protocol for Sentry integration
- iOS/Android platform debugging tools

---

**Minimize debugging time, maximize solution quality** 🔍
