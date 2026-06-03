# ExampleHR Time-Off — Technical Requirement Document

## 1. Problem Statement

ExampleHR surfaces time-off balances and request workflows while Workday/SAP (HCM) remains the source of truth. Employees expect instant feedback; HCM may reject requests, refresh balances on anniversaries, or occasionally return misleading success responses. The frontend must feel responsive without claiming final approval before HCM confirms.

## 2. Personas and Journeys

### Employee (Alex Rivera — `emp-001`)

1. Open `/employee` and view per-location balances.
2. Submit a time-off request for a location and date range.
3. See optimistic balance decrement and pending request status.
4. Receive confirmed, rejected, or needs_review outcome after HCM verification.
5. Reconcile when anniversary bonus or background refresh changes balances.

### Manager (Jordan Lee — `mgr-001`)

1. Open `/manager` and review pending queue.
2. Select a request and fetch authoritative cell balance at decision time.
3. Approve or deny with honest status — never show approved until HCM confirms.
4. Recover from 409 conflict when balance changed since review.

## 3. Challenges

| Challenge | Impact |
|-----------|--------|
| Stale batch corpus | User sees outdated totals after HCM refresh |
| Authoritative cell reads | Submit/approve must use fresh per-cell data |
| Optimistic UI vs HCM truth | Must rollback or flag mismatch without lying |
| Silent HCM success | 201 response but balance unchanged |
| Multi-location rows | Independent balances per employee × location |
| Concurrent mutation + refetch | Background batch must not clobber in-flight optimism |

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  EmployeeView / ManagerView                                 │
│  BalanceGrid, RequestForm, RequestHistory, ApprovalPanel    │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  TanStack Query hooks                                       │
│  useBalances, useSubmitRequest, useApproveRequest             │
│  useEmployeeRequests, usePendingRequests                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Next.js Route Handlers (/api/hcm/*)                        │
│  In-memory hcmStore + simulation (anniversary, silent fail)  │
└─────────────────────────────────────────────────────────────┘
```

### Component tree mapping

- **EmployeeView** — orchestrates balances, submit mutation, reconciliation banner, history.
- **ManagerView** — orchestrates queue, cell prefetch on selection, approve/deny mutation.
- **Presentational components** — render explicit UI states for Storybook and tests; no data fetching.

## 5. State Management — TanStack Query v5

### Query keys (`src/lib/query/keys.ts`)

- `['balances', 'batch', employeeId]` — expensive corpus hydration
- `['balances', 'cell', employeeId, locationId]` — authoritative cell
- `['requests', scope, filter]` — employee history or manager pending queue

### Timing

| Query | staleTime | refetchInterval |
|-------|-----------|-----------------|
| Batch balances | 30s | 60s |
| Pending queue | 30s | 30s |
| Cell balance | 30s | on-demand |

### Mutation guard

During optimistic submit, `registerOptimisticGuard` stores `{ employeeId, locationId, adjustedDays }`. When batch refetch completes, `mergeBatchWithGuards` preserves optimistic rows instead of overwriting with stale HCM corpus.

## 6. Optimistic vs Pessimistic Analysis

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Full optimistic | Instant UX | Risk of lying about approval | Used for balance display only |
| Full pessimistic | Always accurate | Sluggish UX | Rejected for reads |
| Hybrid | Fast UI + honest confirmation | More complexity | **Selected** |

**Hybrid policy:**

- Optimistically decrement balance and add pending request on submit.
- Never show `approved` or `confirmed` until HCM confirm endpoint validates.
- Manager approval prefetches cell balance; approval mutation sends `snapshotBalance` for conflict detection.

### Alternatives considered

- **SWR** — less mature optimistic rollback patterns.
- **Redux Toolkit Query** — heavier boilerplate for this scope.
- **WebSockets** — HCM mock exposes pull APIs; polling + cell reads sufficient.
- **MSW-only mocks** — chosen Next handlers for same-origin integration tests.

## 7. Cache Invalidation Strategy

| Event | Invalidate |
|-------|------------|
| Successful submit | batch + cell + employee requests |
| Failed submit | rollback via onMutate context (no invalidation) |
| Manager approve/deny | pending queue + employee batch + cell |
| Anniversary detected | batch refetch; banner prompts user review |

Cell reads are authoritative before mutations. Batch provides hydration and periodic reconciliation.

## 8. Reconciliation Algorithm

```
onBatchRefetch(incoming):
  if activeOptimisticGuard(employeeId, locationId):
    return merge(incoming, optimisticCacheRow)
  return incoming

onSubmitSuccess(response):
  confirm = POST /requests/:id/confirm
  if confirm.silentMismatch:
    status = needs_review
    show ReconciliationBanner
  else:
    status = confirmed
  invalidate cell + batch

onManagerApprove(request):
  cell = GET /balances/cell
  PATCH /requests/:id { action, snapshotBalance: cell.daysAvailable }
  if 409 CONFLICT: restore queue item, show conflict message
```

## 9. Mock HCM Specification

### Endpoints

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/api/hcm/balances?employeeId=` | Batch corpus + `corpusVersion` |
| GET | `/api/hcm/balances/cell?employeeId=&locationId=` | Authoritative cell |
| POST | `/api/hcm/requests` | Submit; 409 insufficient; 5% silent fail |
| GET | `/api/hcm/requests?status=pending` | Manager queue |
| PATCH | `/api/hcm/requests/:id` | Approve/deny; 409 conflict on snapshot mismatch |
| POST | `/api/hcm/requests/:id/confirm` | Verify post-submit; detect silent mismatch |
| POST | `/api/hcm/simulate/anniversary` | Trigger bonus (+3 days) |

### Simulated failures

- **Silent failure** — POST returns 201, request stored, balance not decremented; confirm sets `needs_review`.
- **Conflict** — PATCH approve when cell balance ≠ manager snapshot (e.g. after anniversary).
- **Slow HCM** — configurable `batchDelayMs` / `cellDelayMs`; UI shows stale badge.

## 10. Testing Strategy

| Layer | Tool | Guards |
|-------|------|--------|
| HCM store | Vitest | Balance math, silent fail, conflict, deny restore |
| API routes | Vitest + NextRequest | HTTP contracts, status codes |
| Reconciliation | Vitest | Mutation guard merge, stale detection |
| Hooks | Vitest + RTL + QueryClient | Optimistic rollback, approve/deny |
| Components | Vitest + RTL | Status rendering, form validation |
| Storybook | `@storybook/test` + Vitest browser | Visual state matrix |

**Coverage target:** ≥80% statements/lines on `src/lib/hcm`, `src/hooks`, `src/app/api/hcm` (see `npm run test:coverage`).

### Critical test cases

1. Submit 2 days from 12 → optimistic 10 → confirm → persisted
2. Insufficient balance → rollback to 12
3. Silent success → `needs_review` banner
4. Batch refresh during mutation → guard preserves optimistic value
5. Manager approve after anniversary → 409 → queue restored
6. Anniversary trigger → reconciliation banner path

## 11. Runbook

```bash
npm install
npm run dev          # App at http://localhost:3000
npm run storybook    # Storybook at http://localhost:6006
npm test             # Unit/integration tests
npm run test:coverage
npm run build        # Production build
```

### Routes

- `/` — landing with links
- `/employee` — employee balances and submit
- `/manager` — approval queue

## 12. Deliverables Checklist

- [x] TRD (this document)
- [x] Next.js application with mock HCM
- [x] Storybook state matrix
- [x] Test suite with coverage report
- [ ] GitHub repository URL (push locally initialized repo)
