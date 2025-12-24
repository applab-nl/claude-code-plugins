# AGENTS.md

This file provides guidance to AI coding assistants when working with this repository.

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

## Development Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
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

# Run specific test file
npm test -- src/components/Button.test.tsx
```

### Testing Requirements

- Minimum 80% code coverage
- Test user interactions, not implementation
- Mock external dependencies
- Use testing-library queries

## Git Workflow

### Branch Naming

- Features: `feature/short-description`
- Fixes: `fix/issue-number-description`
- Chores: `chore/description`

### Commit Messages

Follow conventional commits:

```
type(scope): description

- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance
```

### Pull Requests

- Keep PRs focused and small
- Include tests for new functionality
- Update documentation if needed
- Request review from relevant team members

## Deployment

```bash
# Build for production
npm run build

# Run production build locally
npm start
```

### Environment Variables

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `NEXTAUTH_URL` - Application URL

## Security Guidelines

- Never commit secrets or credentials
- Use environment variables for configuration
- Validate all user input
- Sanitize database queries (Prisma handles this)
- Use HTTPS in production
