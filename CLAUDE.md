# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

10x Astro Starter - A modern, opinionated starter template for building fast, accessible, and AI-friendly web applications using Astro 5, React 19, TypeScript 5, and Tailwind CSS 4.

## Tech Stack

- **Astro 5** - Server-side rendering framework with hybrid rendering support
- **React 19** - UI library for interactive components (no Next.js directives)
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS with custom variants
- **Shadcn/ui** - UI component library built with Radix UI
- **Node.js v22.14.0** - Runtime (see `.nvmrc`)

## Development Commands

```bash
npm run dev        # Start dev server on port 3000
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues automatically
npm run format     # Format code with Prettier
```

## Architecture

### Rendering Strategy

The project uses **server-side rendering** (`output: "server"` in astro.config.mjs) with the Node.js adapter in standalone mode. This means:
- All pages are server-rendered by default
- Use `export const prerender = false` for API routes
- Static components use Astro (.astro files)
- Interactive components use React (client-side)

### Directory Structure

```
src/
├── layouts/           # Astro layouts
├── pages/            # Astro pages (file-based routing)
│   └── api/          # API endpoints
├── middleware/
│   └── index.ts      # Astro middleware
├── components/       # UI components
│   ├── ui/          # Shadcn/ui components
│   └── *.astro      # Static Astro components
├── lib/             # Services and helpers
│   └── utils.ts     # cn() utility for className merging
├── db/              # Supabase clients and types
├── types.ts         # Shared types (Entities, DTOs)
├── assets/          # Internal static assets
└── styles/          # Global CSS
    └── global.css   # Tailwind imports and theme
```

### Component Strategy

- **Astro components (.astro)**: Use for static content and layouts
- **React components**: Only when interactivity is needed
- **Never use** "use client" or other Next.js directives
- Extract React logic into custom hooks in `src/components/hooks`

### API Routes

- Server endpoints in `src/pages/api/`
- Use uppercase HTTP method exports: `POST`, `GET`
- Always use `export const prerender = false`
- Validate input with Zod schemas
- Extract business logic into services in `src/lib/services`

### Styling with Tailwind CSS 4

The project uses Tailwind v4 with custom variants:
- Global styles in `src/styles/global.css`
- Custom dark mode variant: `@custom-variant dark (&:is(.dark *))`
- Theme variables use `oklch()` color space
- Use `@theme inline` for CSS variable mappings
- Utility function: `cn()` from `src/lib/utils.ts` for className merging

### Backend Integration

- **Supabase** for authentication and database
- Access via `context.locals.supabase` in Astro routes
- Use `SupabaseClient` type from `src/db/supabase.client.ts`
- Validate all data exchange with Zod schemas

## Coding Practices

### Error Handling

- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions (avoid deep nesting)
- Place happy path last in the function
- Avoid unnecessary else statements; use if-return pattern
- Use guard clauses for preconditions

### React Best Practices

- Functional components with hooks (no class components)
- Use `React.memo()` for components with expensive renders
- Use `React.lazy()` and Suspense for code-splitting
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive calculations
- Use `useId()` for accessibility IDs
- Use `useTransition` for non-urgent state updates

### Accessibility

- Use ARIA landmarks (main, navigation, search)
- Set `aria-expanded`, `aria-controls` for expandable content
- Use `aria-live` regions for dynamic updates
- Apply `aria-label` or `aria-labelledby` when no visible label
- Avoid redundant ARIA that duplicates native HTML semantics

### Astro Patterns

- Leverage View Transitions API with ClientRouter
- Use content collections with type safety
- Use `Astro.cookies` for server-side cookie management
- Access environment variables via `import.meta.env`
- Implement hybrid rendering where needed

## Git Workflow

The project uses:
- **Husky** for Git hooks
- **lint-staged** for pre-commit checks
  - Auto-fix ESLint on `.ts`, `.tsx`, `.astro`
  - Format with Prettier on `.json`, `.css`, `.md`
