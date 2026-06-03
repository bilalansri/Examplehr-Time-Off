import type { Balance } from '@/lib/hcm/types';
import { BalanceCard } from './BalanceCard';

type BalanceGridProps = {
  balances: Balance[];
  isLoading: boolean;
  isFetching: boolean;
  isBalanceStale: (balance: Balance | undefined) => boolean;
  optimisticLocationId?: string;
  rolledBackLocationId?: string;
  refreshedLocationId?: string;
};

export function BalanceGrid({
  balances,
  isLoading,
  isFetching,
  isBalanceStale,
  optimisticLocationId,
  rolledBackLocationId,
  refreshedLocationId,
}: BalanceGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <BalanceCard key={index} locationName="" daysAvailable={null} state="loading" />
        ))}
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <BalanceCard locationName="No locations" daysAvailable={null} state="empty" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3" data-testid="balance-grid">
      {balances.map((balance) => {
        let state: 'fresh' | 'stale' | 'optimisticPending' | 'optimisticRolledBack' | 'balanceRefreshedMidSession' =
          isBalanceStale(balance) || isFetching ? 'stale' : 'fresh';

        if (optimisticLocationId === balance.locationId) {
          state = 'optimisticPending';
        }
        if (rolledBackLocationId === balance.locationId) {
          state = 'optimisticRolledBack';
        }
        if (refreshedLocationId === balance.locationId) {
          state = 'balanceRefreshedMidSession';
        }

        return (
          <BalanceCard
            key={balance.locationId}
            locationName={balance.locationName}
            daysAvailable={balance.daysAvailable}
            asOf={balance.asOf}
            state={state}
            stale={isBalanceStale(balance)}
          />
        );
      })}
    </div>
  );
}
