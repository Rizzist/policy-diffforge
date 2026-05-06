# Diffforge PolicyGraph

This folder is the PolicyGraph source for the `diffforge` workspace.

JSON files under `policy-diffforge` are canonical. Markdown files in `policy-diffforge/docs` are generated mirrors for quick review.

## Workspace

- Scope: `multi_project`
- Active project: `next-diffforge`
- Empty placeholder project: `rust-diffforge`
- Validator: `node policy-diffforge/validators/validate-policy.js`

## Policy-First Workflow

Before behavior-changing code work:

1. Load `policy-diffforge/policy.config.json`.
2. Load `policy-diffforge/graph.json`.
3. Load the impacted project graph.
4. Load only the impacted file, route, flow, rule, test, or contract nodes.
5. If code behavior would diverge from accepted policy, create a pending proposal under `policy-diffforge/proposals`.
6. Run the policy validator when policy files change.

## Coverage

- Appwrite client configuration
- Appwide auth provider wiring
- Email/password and Google auth flows
- Client-protected dashboard flow
- Public marketing and pricing placeholder boundaries
- Placeholder `/api/hello` route
- CockroachDB database target with no tracked tables yet
- Existing lint and build checks

## Gaps

- No automated auth flow tests detected.
- No route tests detected for dashboard redirects.
- No implemented billing, agent execution, project memory, database write, webhook, installer, or cross-project contract behavior detected.
- No CockroachDB tables, columns, indexes, constraints, migrations, or table-level data policies are tracked yet.
- `rust-diffforge` is empty and has no behavior policy yet.
