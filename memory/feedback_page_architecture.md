---
name: Page Architecture — Server Components and Data Fetching
description: How public pages should fetch data — directly from query functions, never via fetch to own API routes.
type: feedback
---

All public pages are Server Components by default. They must import query functions directly from `lib/db/queries/` and `await` them in the async page component.

**Why:** Server Components can call the database directly — there is no need to go through the HTTP layer. Fetching from your own API routes adds unnecessary latency and complexity.

**How to apply:**
- Page component signature: `export default async function EventsPage() { ... }`
- Data fetch: `const events = await getUpcomingEvents();`
- Never: `const res = await fetch('/api/events')`
- Pages in the `app/(public)/` route group get the public layout automatically — no need to wrap manually.
