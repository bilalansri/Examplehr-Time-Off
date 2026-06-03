# ExampleHR Time-Off Assessment

Next.js time-off frontend with mock HCM endpoints, TanStack Query optimistic reconciliation, employee/manager views, Storybook state coverage, and Vitest test suite.

## Quick start

```bash
npm install
npm run dev
npm run storybook
npm test
npm run test:coverage
```

| Command | Description |
|---------|-------------|
| `npm run dev` | App at http://localhost:3000 |
| `npm run storybook` | Storybook at http://localhost:6006 |
| `npm test` | Unit and integration tests |
| `npm run test:coverage` | Coverage report for HCM, hooks, API routes |

## Architecture

- **UI** — Employee and manager views with presentational components for every meaningful state
- **State** — TanStack Query with optimistic mutations, mutation guards, and cell-level reconciliation
- **Mock HCM** — Next.js route handlers backed by in-memory store with anniversary bonus, silent failures, and conflict responses

See [docs/TRD.md](docs/TRD.md) for full technical requirements, alternatives analysis, and testing strategy.

## Routes

- `/employee` — view balances by location, submit requests, track history
- `/manager` — review pending requests with live balance context at approval time

## Storybook states

Stories cover loading, empty, stale, optimistic pending/rollback, HCM rejected, silent mismatch, anniversary reconciliation, and manager conflict (409).

## Testing

Coverage thresholds (80%+ lines/statements) apply to:

- `src/lib/hcm/**`
- `src/hooks/**`
- `src/app/api/hcm/**`

Run `npm run test:coverage` and inspect the terminal summary or `coverage/` output.

## Mock HCM triggers

- Anniversary bonus: `POST /api/hcm/simulate/anniversary` with `{ "employeeId": "emp-001" }`
- Silent failure: ~5% rate on submit (configurable in `hcmStore`)

## Seeded data

- Employee: Alex Rivera (`emp-001`)
- Manager: Jordan Lee (`mgr-001`)
- Locations: New York, San Francisco, London
