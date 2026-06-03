type ReconciliationBannerVariant = 'hidden' | 'anniversary' | 'mismatch';

type ReconciliationBannerProps = {
  variant: ReconciliationBannerVariant;
  onRefresh?: () => void;
};

const MESSAGES: Record<Exclude<ReconciliationBannerVariant, 'hidden'>, string> = {
  anniversary: 'Your balances were refreshed by HR. Review updated totals before submitting.',
  mismatch: 'HR system reported a mismatch. Your recent request needs review.',
};

export function ReconciliationBanner({ variant, onRefresh }: ReconciliationBannerProps) {
  if (variant === 'hidden') {
    return null;
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      data-testid={`reconciliation-banner-${variant}`}
      role="status"
    >
      <p className="text-sm text-amber-900">{MESSAGES[variant]}</p>
      {onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg bg-amber-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          Refresh balances
        </button>
      ) : null}
    </div>
  );
}
