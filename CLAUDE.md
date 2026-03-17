# Westmont PTO Website

PTO website for Westmont Elementary School (westmontpto.org). Built by a solo operator using AI-assisted development.

## Tech Stack
- **Framework:** Next.js 15 (App Router) + TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **ORM:** Drizzle ORM → Neon Postgres (serverless)
- **Auth:** Clerk (protects all /admin/* routes)
- **File Storage:** Cloudflare R2 (presigned URL uploads — files never pass through API)
- **Validation:** Zod schemas on all API inputs
- **Testing:** Vitest (unit/integration), Playwright (e2e)

## Architecture Rules

### Server vs Client Components
- Default to Server Components. Only add `'use client'` for: event handlers, useState/useEffect, browser APIs.
- Server Components fetch data and pass safe props down. Client Components handle interactivity only.
- Never pass API keys, database results, or server-only data to Client Components.

### API Route Pattern
Every API route follows this exact order:
1. Auth check (admin routes: `const { userId } = await auth(); if (!userId) return 401`)
2. Parse + validate input with Zod (`schema.safeParse(body)`)
3. Business logic in try/catch
4. Response shape: `{ data: T }` for success, `{ error: string }` for failure

### Database
- All queries live in `lib/db/queries/` — no inline Drizzle calls in routes or components.
- Use transactions for multi-table writes.
- No raw SQL — use Drizzle query builder only.

### Imports
- Use `@/` path alias for all internal imports. Never use `../` going up more than one level.
- Import order: React/Next → third-party → internal lib/types → internal components → relative.
- Type-only imports use `import type` syntax.

## Security (Non-Negotiable)
- Zod validation on every POST/PUT route before any database operation.
- No `dangerouslySetInnerHTML`, no `eval()`, no `new Function()`.
- No `any` types. Find the correct type or create an interface.
- Environment variables without `NEXT_PUBLIC_` are server-only — never import in Client Components.
- Rate limiting on all public POST routes via Upstash Redis.
- File uploads: validate type + size client-side AND server-side.

## Accessibility (WCAG 2.1 AA)
- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<section>` — not div soup.
- Every `<img>` has `alt` text. Every `<input>` has a `<label>`.
- Keyboard-navigable: all interactive elements reachable via Tab/Enter/Space.
- Visible focus indicators on all interactive elements.
- One `<h1>` per page, headings in order (no skipping levels).
- Minimum 4.5:1 contrast ratio on text.

## Project Structure
```
app/(public)/        → Public pages (homepage, events, newsletters, etc.)
app/admin/           → Admin panel (Clerk-protected)
app/api/             → Route handlers (public/ and admin/)
components/ui/       → shadcn/ui primitives
components/shared/   → PTO-specific components
lib/db/              → Drizzle schema, client, queries/
lib/validators/      → Zod schemas
lib/r2/              → R2 upload helpers
lib/rate-limit/      → Upstash config
tests/unit/          → Vitest
tests/e2e/           → Playwright
```

## Commands
```bash
npm run dev          # Start dev server
npm run lint         # ESLint
npm run build        # Production build
npm run test         # Vitest
npx tsc --noEmit     # Type check
npx drizzle-kit generate  # Generate migration from schema changes
npx drizzle-kit migrate   # Apply pending migrations
```

## Context
- This is a school website — COPPA-adjacent posture. No data collection from minors.
- Elementary school PTO audience: parents, volunteers, community members.
- Admin panel is desktop-only for MVP. Public pages are mobile-first responsive.
- $50/month hard cost ceiling. All services on free tiers (~$1.25/month baseline).
