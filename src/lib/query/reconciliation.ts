import type { Balance, BatchBalancesResponse } from '@/lib/hcm/types';

type OptimisticGuard = {
  employeeId: string;
  locationId: string;
  adjustedDays: number;
};

const activeGuards = new Map<string, OptimisticGuard>();

function guardKey(employeeId: string, locationId: string): string {
  return `${employeeId}:${locationId}`;
}

export function registerOptimisticGuard(guard: OptimisticGuard): void {
  activeGuards.set(guardKey(guard.employeeId, guard.locationId), guard);
}

export function clearOptimisticGuard(employeeId: string, locationId: string): void {
  activeGuards.delete(guardKey(employeeId, locationId));
}

export function mergeBatchWithGuards(
  incoming: BatchBalancesResponse,
  currentBalances: Balance[] | undefined,
): BatchBalancesResponse {
  const mergedBalances = incoming.balances.map((balance) => {
    const guard = activeGuards.get(guardKey(balance.employeeId, balance.locationId));
    if (!guard) {
      return balance;
    }
    const current = currentBalances?.find(
      (entry) => entry.employeeId === balance.employeeId && entry.locationId === balance.locationId,
    );
    if (!current) {
      return {
        ...balance,
        daysAvailable: balance.daysAvailable + guard.adjustedDays,
      };
    }
    return {
      ...balance,
      daysAvailable: current.daysAvailable,
      asOf: current.asOf,
    };
  });

  return {
    ...incoming,
    balances: mergedBalances,
  };
}

export function isBalanceStale(
  balance: Balance | undefined,
  batchAsOf: string | undefined,
  isFetching: boolean,
): boolean {
  if (!balance) {
    return false;
  }
  if (isFetching) {
    return true;
  }
  if (!batchAsOf) {
    return false;
  }
  return new Date(balance.asOf).getTime() < new Date(batchAsOf).getTime();
}

export function latestBatchAsOf(balances: Balance[]): string | undefined {
  if (balances.length === 0) {
    return undefined;
  }
  return balances.reduce((latest, balance) =>
    new Date(balance.asOf).getTime() > new Date(latest).getTime() ? balance.asOf : latest,
  balances[0].asOf);
}
