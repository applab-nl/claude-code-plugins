# Copilot Instructions

> This file combines AGENTS.md content with GitHub Copilot-specific guidelines.

## Project Overview

A Next.js application with TypeScript, Prisma ORM, and PostgreSQL database.

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Prisma
- **Styling**: Tailwind CSS v4
- **Testing**: Jest + React Testing Library

### Directory Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Utility functions
├── server/           # Server-side code
│   ├── api/          # API routes logic
│   └── db/           # Database queries
└── types/            # TypeScript types
```

## Coding Standards

### TypeScript

- Enable strict mode
- Use explicit return types for functions
- Prefer interfaces over type aliases for objects
- No `any` types - use `unknown` and narrow

### React Components

- Use functional components with hooks
- Props interface named `{ComponentName}Props`
- Export as named exports
- Co-locate component tests

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Tests: `*.test.ts` or `*.spec.ts`

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

### Testing Requirements

- Minimum 80% code coverage
- Test user interactions, not implementation
- Mock external dependencies

## Git Workflow

### Commit Messages

Follow conventional commits:

```
type(scope): description

- feat: New feature
- fix: Bug fix
- docs: Documentation
- refactor: Code restructuring
- test: Adding tests
```

---

## Copilot-Specific Guidelines

### Code Generation Preferences

When generating code for this project:

1. **TypeScript First**: Always generate TypeScript, never JavaScript
2. **Strict Types**: Include explicit types, avoid inference for function returns
3. **Modern Patterns**: Use modern React patterns (hooks, suspense)
4. **Error Handling**: Include proper error handling with typed errors

### Import Preferences

```typescript
// Preferred: Named imports from specific paths
import { Button } from '@/components/ui/Button';
import { useUser } from '@/hooks/useUser';

// Avoid: Default imports and relative paths
import Button from '../../../components/Button';
```

### Component Template

When generating React components, follow this structure:

```typescript
interface ComponentNameProps {
  // Props here
}

export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  // Implementation
  return (
    // JSX
  );
}

ComponentName.displayName = 'ComponentName';
```

### API Route Template

When generating API routes:

```typescript
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const requestSchema = z.object({
  // Schema definition
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = requestSchema.parse(body);

  // Implementation

  return NextResponse.json({ success: true });
}
```
