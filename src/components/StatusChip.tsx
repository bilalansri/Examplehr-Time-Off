import type { RequestStatus } from '@/lib/hcm/types';

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  needs_review: 'bg-orange-100 text-orange-800',
  approved: 'bg-emerald-100 text-emerald-800',
  denied: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  needs_review: 'Needs Review',
  approved: 'Approved',
  denied: 'Denied',
};

type StatusChipProps = {
  status: RequestStatus;
};

export function StatusChip({ status }: StatusChipProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
      data-testid={`status-chip-${status}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
