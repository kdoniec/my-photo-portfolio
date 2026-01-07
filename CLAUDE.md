# AI Rules for My Photo Portfolio

A modern photo portfolio application built with Astro 5, React 19, TypeScript 5, and Tailwind CSS 4. Uses Supabase for backend services (PostgreSQL, Auth, Storage) and deploys via Docker to DigitalOcean.

## Tech Stack

- **Astro 5** - SSG/SSR framework with View Transitions and Partial Hydration
- **React 19** - Interactive components (admin panel, lightbox, forms)
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling with oklch() colors
- **Shadcn/ui** - Accessible UI components built on Radix UI
- **Supabase** - PostgreSQL database, authentication, and image storage
- **Docker** - Containerized deployment to DigitalOcean
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

## Project Architecture

### Rendering Strategy

The project uses **server-side rendering** (`output: "server"` in astro.config.mjs) with the Node.js adapter in standalone mode:
- All pages are server-rendered by default
- Use `export const prerender = false` for API routes
- Static components use Astro (.astro files)
- Interactive components use React (client-side islands)

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
│   ├── hooks/       # Custom React hooks
│   └── *.astro      # Static Astro components
├── lib/             # Services and helpers
│   ├── services/    # Business logic
│   └── utils.ts     # cn() utility for className merging
├── db/              # Supabase clients and types
├── types.ts         # Shared types (Entities, DTOs)
├── assets/          # Internal static assets
└── styles/          # Global CSS
    └── global.css   # Tailwind imports and theme
```

## Frontend Guidelines

### Astro Standards

- Use Astro components (.astro) for static content and layout
- Implement React components only when interactivity is needed
- Leverage View Transitions API for smooth page transitions
- Use content collections with type safety for structured content
- Implement middleware for request/response modification
- Use image optimization with the Astro Image integration
- Leverage Server Endpoints for API routes in `src/pages/api/`
- Implement hybrid rendering with server-side rendering where needed
- Use `Astro.cookies` for server-side cookie management
- Access environment variables via `import.meta.env`

### React Standards

- Use functional components with hooks (no class components)
- **Never use** "use client", "use server", or other Next.js directives
- Extract React logic into custom hooks in `src/components/hooks`
- Implement `React.memo()` for components with expensive renders
- Use `React.lazy()` and Suspense for code-splitting
- Use `useCallback` for event handlers passed to child components
- Use `useMemo` for expensive calculations
- Use `useId()` for generating unique IDs for accessibility attributes
- Use `useTransition` for non-urgent state updates to keep UI responsive
- Consider `useOptimistic` for optimistic UI updates in forms

### Tailwind CSS 4 Standards

- Global styles defined in `src/styles/global.css`
- Custom dark mode variant: `@custom-variant dark (&:is(.dark *))`
- Theme variables use `oklch()` color space for consistent colors
- Use `@theme inline` for CSS variable mappings
- Use `@layer` directive to organize styles into base, components, utilities
- Utility function: `cn()` from `src/lib/utils.ts` for className merging
- Use arbitrary values `[value]` for precise one-off designs
- Use responsive variants (sm:, md:, lg:, xl:, 2xl:) for adaptive designs
- Use state variants (hover:, focus:, active:, disabled:) for interactions
- Extract component patterns instead of copying utility classes

### Accessibility (ARIA) Standards

- Use ARIA landmarks to identify regions (main, navigation, search, etc.)
- Apply appropriate ARIA roles to custom elements lacking semantic HTML
- Set `aria-expanded` and `aria-controls` for expandable content (accordions, dropdowns)
- Use `aria-live` regions with appropriate politeness for dynamic updates
- Implement `aria-hidden` to hide decorative content from screen readers
- Apply `aria-label` or `aria-labelledby` for elements without visible text labels
- Use `aria-describedby` to associate descriptive text with form inputs
- Implement `aria-current` for indicating current item in navigation
- Avoid redundant ARIA that duplicates native HTML semantics
- Apply `aria-invalid` and error messaging for form validation

## Backend Integration

### Supabase

- Access via `context.locals.supabase` in Astro routes
- Use `SupabaseClient` type from `src/db/supabase.client.ts`
- Validate all data exchange with Zod schemas
- Row Level Security (RLS) for access control at database level
- Storage for images: thumbnails (400px) and previews (1200px)
- Authentication: email/password via built-in auth system

### Image Processing

- Use `browser-image-compression` for client-side compression
- Generate two versions: thumbnail (400px width), preview (1200px width)
- Maximum upload size: 10 MB
- Supported format: JPEG only
- Maximum photos: 200, Maximum categories: 10

### API Routes

- Server endpoints in `src/pages/api/`
- Use uppercase HTTP method exports: `POST`, `GET`, `PUT`, `DELETE`
- Always use `export const prerender = false`
- Validate input with Zod schemas
- Extract business logic into services in `src/lib/services`

## Coding Practices

### Error Handling

- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions (avoid deep nesting)
- Place happy path last in the function
- Avoid unnecessary else statements; use if-return pattern
- Use guard clauses for preconditions

### General Principles

- Keep solutions simple and focused on the task
- Avoid over-engineering - only make changes directly requested
- Don't add features, refactor code, or make "improvements" beyond scope
- Only add comments where logic isn't self-evident
- Don't create helpers or abstractions for one-time operations
- If something is unused, delete it completely

## Database Migrations

Migration files are stored in `supabase/migrations/` and managed by Supabase CLI.

### File Naming Convention

```
YYYYMMDDHHmmss_short_description.sql
```

Example: `20240906123045_create_profiles.sql`

### SQL Guidelines

- Write all SQL in lowercase
- Include header comments explaining migration purpose
- Add comments for destructive commands (DROP, TRUNCATE, ALTER)
- **Always enable RLS** on new tables, even for public access
- Create granular RLS policies:
  - Separate policies for each operation (`select`, `insert`, `update`, `delete`)
  - Separate policies for each role (`anon`, `authenticated`)
  - Never combine policies even if functionality is identical

## Shadcn/ui Components

Components are located in `src/components/ui/` with "new-york" style variant and "neutral" base color.

### Installation

```bash
npx shadcn@latest add [component-name]
```

Example: `npx shadcn@latest add accordion`

### Usage

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
```

### Available Components

Accordion, Alert, AlertDialog, AspectRatio, Avatar, Calendar, Checkbox, Collapsible, Command, ContextMenu, DataTable, DatePicker, DropdownMenu, Form, HoverCard, Menubar, NavigationMenu, Popover, Progress, RadioGroup, ScrollArea, Select, Separator, Sheet, Skeleton, Slider, Switch, Table, Tabs, Textarea, Sonner, Toggle, Tooltip

Full list: https://ui.shadcn.com/r

## Git Workflow

- **Husky** for Git hooks
- **lint-staged** for pre-commit checks:
  - Auto-fix ESLint on `.ts`, `.tsx`, `.astro`
  - Format with Prettier on `.json`, `.css`, `.md`
- **Conventional Commits** for commit messages: https://www.conventionalcommits.org/
  - Format: `<type>(<scope>): <description>`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`
  - Examples:
    - `feat(auth): add login with email`
    - `fix(gallery): resolve image loading issue`
    - `docs(readme): update installation steps`

## Technical Limits

| Parameter | Value |
|-----------|-------|
| Maximum photos | 200 |
| Maximum categories | 10 |
| Maximum file size | 10 MB |
| Supported format | JPEG |
| Thumbnail size | 400px width |
| Preview size | 1200px width |
| Supabase Storage | 1GB (free tier) |
