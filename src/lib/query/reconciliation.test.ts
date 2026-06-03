import { describe, expect, it } from 'vitest';
import type { Balance, BatchBalancesResponse } from '@/lib/hcm/types';
import {
  clearOptimisticGuard,
  isBalanceStale,
  latestBatchAsOf,
  mergeBatchWithGuards,
  registerOptimisticGuard,
} from './reconciliation';

const balances: Balance[] = [
  {
    employeeId: 'emp-001',
    locationId: 'loc-nyc',
    locationName: 'New York',
    daysAvailable: 10,
    asOf: '2026-06-01T10:00:00.000Z',
  },
];

const incoming: BatchBalancesResponse = {
  employeeId: 'emp-001',
  balances: [
    {
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
      locationName: 'New York',
      daysAvailable: 12,
      asOf: '2026-06-01T11:00:00.000Z',
    },
  ],
  corpusVersion: 2,
};

describe('reconciliation', () => {
  it('preserves optimistic balance during batch merge', () => {
    registerOptimisticGuard({
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
      adjustedDays: -2,
    });

    const merged = mergeBatchWithGuards(incoming, balances);
    expect(merged.balances[0].daysAvailable).toBe(10);
    clearOptimisticGuard('emp-001', 'loc-nyc');
  });

  it('detects stale balances from batch timestamp', () => {
    const stale = isBalanceStale(
      balances[0],
      '2026-06-01T11:00:00.000Z',
      false,
    );
    expect(stale).toBe(true);
  });

  it('returns latest batch asOf', () => {
    expect(latestBatchAsOf(balances)).toBe('2026-06-01T10:00:00.000Z');
  });

  it('marks balance stale while fetching', () => {
    expect(isBalanceStale(balances[0], balances[0].asOf, true)).toBe(true);
  });

  it('merges without guard using incoming values', () => {
    const merged = mergeBatchWithGuards(incoming, undefined);
    expect(merged.balances[0].daysAvailable).toBe(12);
  });
});
