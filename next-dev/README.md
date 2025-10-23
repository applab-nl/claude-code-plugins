# Next-Dev Plugin

**Next.js Development Specialist** - A comprehensive Claude Code plugin that provides expert Next.js development capabilities with integrated devtools for runtime diagnostics, automated testing, documentation access, and seamless upgrades.

## Overview

The Next-Dev plugin enhances your Next.js development workflow by:
- Providing a specialized **nextjs-specialist** agent with deep Next.js expertise
- Integrating the **next-devtools-mcp** server for powerful development tools
- Enabling runtime diagnostics and error detection from your dev server
- Automating page testing with Playwright browser automation
- Offering instant access to Next.js documentation and knowledge base
- Simplifying upgrades and Cache Components setup

## Features

### 🎯 Specialized Next.js Agent

The **nextjs-specialist** agent automatically activates when working in Next.js projects and provides:
- **App Router Expertise**: Deep knowledge of Next.js 14-16 App Router patterns
- **Server/Client Components**: Best practices for component placement
- **Async APIs**: Next.js 15+ async params, searchParams, cookies, headers
- **Route Handlers**: API routes with proper TypeScript types
- **Data Fetching**: Fetch caching, revalidation, and optimization
- **Cache Components**: Next.js 16 caching patterns
- **Performance**: Streaming, Suspense, code splitting, image optimization
- **TypeScript**: Full type safety for all Next.js APIs

### 🔧 Integrated MCP Tools

#### 1. nextjs_docs
Search and retrieve official Next.js documentation:
- Access Next.js 16 knowledge base (12 resources)
- Smart keyword matching for common topics
- Falls back to official docs if needed

#### 2. browser_eval
Playwright browser automation for testing:
- **Critical for page verification**: Renders JavaScript, detects runtime errors
- Navigate, click, type, fill forms
- Take screenshots for visual regression
- Capture browser console messages
- Test complete user flows

#### 3. nextjs_runtime
Query running Next.js dev server diagnostics:
- **Proactive diagnostics**: Check state before making changes
- Get real-time errors from dev server
- Inspect route structure and components
- Check build status and compilation issues
- Agentic codebase search for running app

#### 4. upgrade_nextjs_16
Automated Next.js 16 upgrade:
- Runs official codemod automatically
- Upgrades Next.js, React, and React DOM
- Fixes async API issues
- Updates configuration files
- Handles deprecated APIs

#### 5. enable_cache_components
Complete Cache Components setup:
- Updates configuration flags
- Starts dev server with MCP
- Detects errors via browser automation
- Applies automated fixes (Suspense, "use cache", etc.)
- Verifies all routes work

## Installation

### From Marketplace

```bash
/plugin marketplace add applab-nl/claude-code-plugins
/plugin install next-dev@applab-plugins
```

### Manual Installation

1. Clone this repository
2. Copy the `next-dev` directory to your Claude Code plugins location
3. The MCP server will be automatically configured when the plugin is enabled

## Requirements

- **Claude Code CLI**
- **Node.js 20.19+** (for next-devtools-mcp)
- **Next.js 14+** (recommended: Next.js 16+)
- **Clean git state** (for automated upgrades)

## Usage

### Automatic Agent Activation

The **nextjs-specialist** agent automatically activates when:
- Working in a Next.js project (detects `"next"` in package.json)
- Files are in `app/` or `pages/` directories
- Modifying Next.js configuration files

### Example Workflows

#### 1. Upgrading to Next.js 16

```
User: Help me upgrade this Next.js app to version 16

nextjs-specialist:
I'll use the automated upgrade tool to handle the migration.

[Uses upgrade_nextjs_16 tool]

✓ Running official codemod...
✓ Upgraded Next.js: 14.2.0 → 16.0.1
✓ Upgraded React: 18.3.0 → 19.0.0
✓ Fixed async API issues in 12 files
✓ Updated next.config.js

Now let me verify all pages work correctly:

[Uses browser_eval to test pages]

✓ http://localhost:3000 - No errors
✓ http://localhost:3000/about - No errors
✓ http://localhost:3000/dashboard - No errors

Upgrade complete! All pages are working correctly.
```

#### 2. Debugging Runtime Errors

```
User: There's an error on my dashboard page but I'm not sure what's wrong

nextjs-specialist:
Let me check the runtime diagnostics first to understand what's happening.

[Uses nextjs_runtime to query dev server]

Found 2 errors in the dev server:
1. /dashboard/page.tsx: Cannot read property 'map' of undefined
2. /app/dashboard/stats.tsx: Hydration mismatch

Let me investigate the dashboard page:

[Reads the files and identifies issues]

The issues are:
1. The `users` prop is undefined - need to add null check
2. Server/client mismatch in stats component - need Suspense boundary

Here are the fixes:

[Provides code fixes with explanations]
```

#### 3. Implementing Cache Components

```
User: I want to enable Cache Components in my Next.js 16 app

nextjs-specialist:
I'll use the automated setup tool to enable and configure Cache Components.

[Uses enable_cache_components tool]

✓ Updated next.config.js: experimental.cacheComponents = true
✓ Started dev server with MCP enabled
✓ Testing all routes...
✓ Found 3 components that need caching setup
✓ Added Suspense boundaries: 2 files
✓ Added "use cache" directives: 3 files
✓ Configured cacheLife profiles: 1 file

All routes verified! Cache Components is now fully configured.

Here's what I did:
1. Added Suspense boundary to /dashboard/layout.tsx
2. Added "use cache" to ProductList component
3. Configured cacheLife("minutes") for real-time stats

Your app is now using Cache Components for optimal performance!
```

#### 4. Testing Page Interactions

```
User: Can you test the login flow on the app?

nextjs-specialist:
I'll use browser automation to test the complete login flow.

[Uses browser_eval for testing]

✓ Started Chrome browser
✓ Navigated to http://localhost:3000/login
✓ Filled email: test@example.com
✓ Filled password: ********
✓ Clicked submit button
✓ Waited for redirect
✓ Verified redirect to /dashboard
✓ No console errors detected

Login flow is working correctly! Here's a screenshot of the final state:

[Shows screenshot]
```

#### 5. Searching Documentation

```
User: How do I implement streaming in Next.js?

nextjs-specialist:
Let me search the Next.js documentation for streaming patterns.

[Uses nextjs_docs tool]

Here's how to implement streaming in Next.js:

[Provides comprehensive guide with code examples from official docs]
```

## MCP Tools Reference

### nextjs_docs

**Search Next.js documentation**

```typescript
// Query documentation
mcp__next-devtools__nextjs_docs({
  query: "How to use Server Actions",
  category: "guides" // optional: all, getting-started, guides, api-reference, architecture, community
})
```

### browser_eval

**Browser automation for testing**

```typescript
// Start browser
mcp__next-devtools__browser_eval({
  action: "start",
  browser: "chrome", // or firefox, webkit, msedge
  headless: false
})

// Navigate to page
mcp__next-devtools__browser_eval({
  action: "navigate",
  url: "http://localhost:3000"
})

// Fill form
mcp__next-devtools__browser_eval({
  action: "fill_form",
  fields: [
    {selector: "#email", value: "user@example.com"},
    {selector: "#password", value: "password123"}
  ]
})

// Click button
mcp__next-devtools__browser_eval({
  action: "click",
  element: "button[type='submit']"
})

// Get console messages
mcp__next-devtools__browser_eval({
  action: "console_messages",
  errorsOnly: true
})

// Take screenshot
mcp__next-devtools__browser_eval({
  action: "screenshot",
  fullPage: true
})
```

### nextjs_runtime

**Query running dev server**

```typescript
// Discover running servers
mcp__next-devtools__nextjs_runtime({
  action: "discover_servers"
})

// List available tools
mcp__next-devtools__nextjs_runtime({
  action: "list_tools",
  port: 3000
})

// Get errors
mcp__next-devtools__nextjs_runtime({
  action: "call_tool",
  port: 3000,
  toolName: "get_errors"
  // Note: omit 'args' parameter if tool doesn't need arguments
})

// Get routes
mcp__next-devtools__nextjs_runtime({
  action: "call_tool",
  port: 3000,
  toolName: "get_routes"
})
```

### upgrade_nextjs_16

**Automated upgrade to Next.js 16**

```typescript
mcp__next-devtools__upgrade_nextjs_16({
  project_path: "/path/to/your/nextjs/app" // optional, defaults to current directory
})
```

**Requirements**:
- Clean git working directory
- Node.js 18+
- npm/pnpm/yarn/bun installed

### enable_cache_components

**Setup Cache Components**

```typescript
mcp__next-devtools__enable_cache_components({
  project_path: "/path/to/your/nextjs/app" // optional, defaults to current directory
})
```

**Requirements**:
- Next.js 16.0.0+ (stable or canary, not beta)
- Clean working directory preferred

## Agent Capabilities

The **nextjs-specialist** agent knows:

### Next.js Architecture
- App Router structure and conventions
- Route groups, dynamic segments, parallel routes
- Layouts, pages, loading states, error boundaries
- Metadata API for SEO

### Components
- Server Components (default)
- Client Components ("use client")
- When to use each type
- Composition patterns

### Data Fetching
- fetch with caching and revalidation
- Parallel vs sequential fetching
- Streaming with Suspense
- Server Actions

### Async APIs (Next.js 15+)
- Async params and searchParams
- Async cookies() and headers()
- Async generateStaticParams

### Cache Components (Next.js 16)
- "use cache" directive
- cacheLife() profiles
- cacheTag() for invalidation
- Private vs public caching

### Performance
- Image optimization with next/image
- Font optimization with next/font
- Code splitting with dynamic imports
- Streaming and Suspense

### TypeScript
- Proper types for all Next.js APIs
- PageProps, LayoutProps, RouteContext
- Metadata types
- Server Action types

## Best Practices

### 1. Always Check Runtime First

Before making changes, use `nextjs_runtime` to understand the current state:

```typescript
// Get current errors
mcp__next-devtools__nextjs_runtime({
  action: "call_tool",
  port: 3000,
  toolName: "get_errors"
})
```

### 2. Use Browser Automation for Testing

Don't use curl or simple HTTP requests. Use browser automation to:
- Render JavaScript and detect runtime errors
- Test user interactions
- Verify the complete user experience

### 3. Search Documentation When Uncertain

Use `nextjs_docs` to verify patterns and APIs before implementing.

### 4. Leverage Automated Tools

For complex tasks like upgrades or Cache Components setup, use the automated tools instead of manual migration.

### 5. Follow Next.js Conventions

- Server Components by default
- Client Components only when needed (interactivity, browser APIs, hooks)
- Proper metadata for SEO
- Loading and error states for better UX

## Troubleshooting

### MCP Server Not Starting

If the next-devtools-mcp server doesn't start:

```bash
# Check if Node.js 20.19+ is installed
node --version

# Manually test the MCP server
npx -y next-devtools-mcp@latest
```

### Next.js Runtime Not Detected

For Next.js 15, you need to enable MCP support:

```javascript
// next.config.js
module.exports = {
  experimental: {
    mcpServer: true,
  },
};
```

For Next.js 16+, MCP is enabled by default.

### Browser Automation Fails

If Playwright fails to install:

```bash
# The first browser_eval action will auto-install Playwright
# If it fails, manually install:
npx playwright install
```

### Agent Not Activating

Ensure your project has:
- `package.json` with `"next"` dependency
- `app/` or `pages/` directory
- Or `next.config.js`/`next.config.ts`

## Contributing

Contributions are welcome! Please submit issues and pull requests to the main repository.

## License

MIT License - See LICENSE file for details

## Version

Current version: 1.0.0

## Support

For issues, feature requests, or questions:
- GitHub Issues: https://github.com/applab-nl/claude-code-plugins/issues
- Next-DevTools MCP: https://github.com/vercel/next-devtools-mcp
- Next.js Documentation: https://nextjs.org/docs

## Acknowledgments

This plugin integrates with the excellent [next-devtools-mcp](https://github.com/vercel/next-devtools-mcp) server created by Vercel.
