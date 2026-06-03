type StaleIndicatorProps = {
  visible: boolean;
};

export function StaleIndicator({ visible }: StaleIndicatorProps) {
  if (!visible) {
    return null;
  }

  return (
    <span
      className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700"
      data-testid="stale-indicator"
    >
      Stale
    </span>
  );
}
