type ErrorBannerProps = {
  message: string;
  onDismiss?: () => void;
};

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      data-testid="error-banner"
      role="alert"
    >
      <span>{message}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="font-medium underline"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
