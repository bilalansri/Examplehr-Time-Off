import type { TimeOffRequest } from '@/lib/hcm/types';
import { EmptyState } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';

type PendingQueueProps = {
  requests: TimeOffRequest[];
  isLoading: boolean;
  selectedId?: string;
  onSelect: (request: TimeOffRequest) => void;
};

export function PendingQueue({
  requests,
  isLoading,
  selectedId,
  onSelect,
}: PendingQueueProps) {
  if (isLoading) {
    return <LoadingSkeleton rows={4} />;
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        title="No pending requests"
        description="Employee submissions waiting for approval will show up here."
      />
    );
  }

  return (
    <div className="space-y-3" data-testid="pending-queue">
      {requests.map((request) => (
        <button
          key={request.id}
          type="button"
          onClick={() => onSelect(request)}
          className={`w-full rounded-xl border px-4 py-3 text-left transition ${
            selectedId === request.id
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-200 bg-white hover:border-slate-400'
          }`}
        >
          <p className="font-medium text-slate-900">{request.employeeName}</p>
          <p className="text-sm text-slate-600">
            {request.locationName} · {request.days} days · {request.startDate}
          </p>
        </button>
      ))}
    </div>
  );
}
