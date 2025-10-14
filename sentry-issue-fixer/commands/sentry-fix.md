---
description: Investigate and fix Sentry errors with automated log analysis and solution proposals
---

You are tasked with investigating and resolving a Sentry error. Use the **sentry-issue-fixer** agent to perform comprehensive error analysis and propose solutions.

## Input Handling

The user can provide:
1. **Sentry Issue URL**: `https://sentry.io/organizations/.../issues/...`
2. **Sentry Issue ID**: `ISSUE-123456`
3. **Error Description**: Description of the error they're seeing
4. **No Arguments**: Will fetch recent issues from Sentry

## Workflow

### Step 1: Parse Input
- If URL provided: Extract organization, project, and issue ID
- If Issue ID provided: Use with Sentry MCP server
- If description provided: Search Sentry for matching issues
- If no input: Fetch recent unresolved issues

### Step 2: Launch Agent
Delegate to the **sentry-issue-fixer** agent with this prompt:

```
Investigate the following Sentry issue and provide a comprehensive fix:

[If URL/ID provided:]
Sentry Issue: {URL or ID}

[If description provided:]
Error Description: {description}
Please search Sentry for issues matching this description.

[If no input provided:]
Please fetch and analyze the most recent critical/unresolved issues from Sentry.

Your tasks:
1. Fetch issue details from Sentry (stack trace, breadcrumbs, environment, frequency)
2. Check for connected iOS/Android devices and fetch relevant logs if applicable
3. Correlate Sentry error with device logs (if available)
4. Perform root cause analysis
5. Propose specific code fixes with examples
6. Recommend monitoring improvements

Provide a comprehensive report with:
- Issue summary and severity
- Root cause analysis
- Proposed fix with code examples
- Testing steps
- Prevention measures
- Enhanced monitoring suggestions
```

### Step 3: Present Results
After the agent completes:
1. Summarize key findings
2. Highlight proposed fixes
3. Provide next steps for implementation

## Examples

```bash
# Investigate specific Sentry issue
/sentry-fix https://sentry.io/organizations/my-org/issues/12345/

# By issue ID
/sentry-fix ISSUE-67890

# By description
/sentry-fix App crashes when user taps the login button

# Fetch recent critical issues
/sentry-fix
```

## Usage Notes

- The Sentry MCP server must be configured for full functionality
- Device logs will only be fetched if iOS/Android devices are connected
- Ensure you have proper Sentry API access configured
- The agent will work in read-only mode on Sentry (no modifications)

Now, launch the sentry-issue-fixer agent with the appropriate prompt based on the user's input.
