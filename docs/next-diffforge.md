# next-diffforge Policy Mirror

Canonical graph: `policy-diffforge/projects/next-diffforge/graph.json`

## Project

- Framework: Next.js Pages Router
- Language: JavaScript
- Package manager: npm
- Checks: `npm run lint`, `npm run build`

## Accepted Flows

- `flow.next.appwrite_auth`: Appwrite account sessions provide initialization, refresh, email/password login, Google OAuth, registration, and logout.
- `flow.next.protected_dashboard`: `/dashboard` is client-gated by AuthContext and redirects unauthenticated users to `/signin`.
- `flow.next.placeholder_product_marketing`: home and pricing pages are static placeholder product surfaces.

## Accepted Routes

- `/`: public marketing page.
- `/pricing`: public static pricing page.
- `/signin`: public auth page that redirects authenticated users to `/dashboard`.
- `/signup`: public registration page that redirects authenticated users to `/dashboard`.
- `/dashboard`: client auth required dashboard shell.
- `/api/hello`: public placeholder API route returning static JSON.

## Rules

- Client session state does not replace server-side authorization for future sensitive behavior.
- Placeholder marketing and pricing copy does not define implemented billing, agent execution, quota, or entitlement behavior.

## Database

- `db.main`: CockroachDB database target for server-side Next.js database access.
- No CockroachDB tables, columns, indexes, constraints, or migrations are tracked yet.

## Test Gaps

- Appwrite auth flows are not covered by automated tests.
- Dashboard redirect behavior is not covered by route tests.
