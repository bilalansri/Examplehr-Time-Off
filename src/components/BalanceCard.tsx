import { StaleIndicator } from './StaleIndicator';

export type BalanceCardState =
  | 'loading'
  | 'empty'
  | 'fresh'
  | 'stale'
  | 'optimisticPending'
  | 'optimisticRolledBack'
  | 'balanceRefreshedMidSession';

type BalanceCardProps = {
  locationName: string;
  daysAvailable: number | null;
  asOf?: string;
  state: BalanceCardState;
  stale?: boolean;
};

const STATE_BADGES: Partial<Record<BalanceCardState, string>> = {
  optimisticPending: 'Updating',
  optimisticRolledBack: 'Reverted',
  balanceRefreshedMidSession: 'Refreshed',
};

export function BalanceCard({
  locationName,
  daysAvailable,
  asOf,
  state,
  stale = false,
}: BalanceCardProps) {
  if (state === 'loading') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="balance-card-loading">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-8 w-16 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  if (state === 'empty' || daysAvailable === null) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="balance-card-empty">
        <p className="text-sm font-medium text-slate-500">{locationName}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-400">—</p>
      </div>
    );
  }

  const badge = STATE_BADGES[state];

  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm ${
        state === 'optimisticRolledBack' ? 'border-red-200' : 'border-slate-200'
      }`}
      data-testid={`balance-card-${state}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-600">{locationName}</p>
        <div className="flex items-center gap-2">
          <StaleIndicator visible={stale || state === 'stale'} />
          {badge ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {badge}
            </span>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{daysAvailable}</p>
      <p className="mt-1 text-xs text-slate-500">
        {asOf ? `Updated ${new Date(asOf).toLocaleTimeString()}` : 'Awaiting sync'}
      </p>
    </div>
  );
}
