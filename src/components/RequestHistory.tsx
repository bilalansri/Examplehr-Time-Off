import type { TimeOffRequest } from '@/lib/hcm/types';
import { EmptyState } from './EmptyState';
import { StatusChip } from './StatusChip';

type RequestHistoryProps = {
  requests: TimeOffRequest[];
  variant?: 'default' | 'silentWrongRecovery';
};

export function RequestHistory({ requests, variant = 'default' }: RequestHistoryProps) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title="No requests yet"
        description="Submitted time-off requests will appear here with live status updates."
      />
    );
  }

  return (
    <div className="space-y-3" data-testid={`request-history-${variant}`}>
      {requests.map((request) => (
        <article
          key={request.id}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-slate-900">
                {request.locationName} · {request.days} day{request.days === 1 ? '' : 's'}
              </p>
              <p className="text-sm text-slate-600">
                {request.startDate} to {request.endDate}
              </p>
            </div>
            <StatusChip status={request.status} />
          </div>
          {request.status === 'needs_review' ? (
            <p className="mt-2 text-sm text-orange-700" data-testid="silent-wrong-recovery">
              HR system mismatch detected. Balance was not updated as expected.
            </p>
          ) : null}
          {request.status === 'pending' ? (
            <p className="mt-2 text-sm text-amber-700">Awaiting HR confirmation…</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
