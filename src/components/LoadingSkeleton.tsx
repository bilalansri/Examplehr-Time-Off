type LoadingSkeletonProps = {
  rows?: number;
};

export function LoadingSkeleton({ rows = 3 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3" data-testid="loading-skeleton">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-xl bg-slate-200"
        />
      ))}
    </div>
  );
}
