import type { TimeOffRequest } from '@/lib/hcm/types';

export type ApprovalPanelState =
  | 'idle'
  | 'fetchingBalance'
  | 'approving'
  | 'hcmRejected'
  | 'conflict409'
  | 'silentlyWrong';

type ApprovalPanelProps = {
  request: TimeOffRequest | null;
  decisionBalance: number | null;
  decisionAsOf?: string;
  state: ApprovalPanelState;
  errorMessage?: string;
  onApprove: () => void;
  onDeny: () => void;
};

export function ApprovalPanel({
  request,
  decisionBalance,
  decisionAsOf,
  state,
  errorMessage,
  onApprove,
  onDeny,
}: ApprovalPanelProps) {
  if (!request) {
    return (
      <div
        className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600"
        data-testid="approval-panel-empty"
      >
        Select a pending request to review balance context.
      </div>
    );
  }

  return (
    <div
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      data-testid={`approval-panel-${state}`}
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{request.employeeName}</h2>
        <p className="text-sm text-slate-600">
          {request.locationName} · {request.days} days · {request.startDate} to {request.endDate}
        </p>
      </div>

      <div className="rounded-lg bg-slate-50 px-4 py-3">
        <p className="text-sm font-medium text-slate-700">Balance at decision</p>
        {state === 'fetchingBalance' ? (
          <p className="mt-1 text-sm text-slate-500" data-testid="fetching-balance">
            Fetching fresh balance from HR…
          </p>
        ) : (
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {decisionBalance ?? '—'} days
          </p>
        )}
        {decisionAsOf ? (
          <p className="mt-1 text-xs text-slate-500">
            As of {new Date(decisionAsOf).toLocaleTimeString()}
          </p>
        ) : null}
      </div>

      {state === 'conflict409' ? (
        <p className="text-sm text-red-700" data-testid="conflict-message">
          {errorMessage ?? 'Balance changed since review. Approval rejected.'}
        </p>
      ) : null}

      {state === 'hcmRejected' ? (
        <p className="text-sm text-red-700" data-testid="approval-rejected-message">
          {errorMessage ?? 'HR system rejected this approval.'}
        </p>
      ) : null}

      {state === 'silentlyWrong' ? (
        <p className="text-sm text-orange-700" data-testid="silent-wrong-message">
          HR reported success but balance verification failed.
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onApprove}
          disabled={state === 'approving' || state === 'fetchingBalance'}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:bg-emerald-300"
        >
          {state === 'approving' ? 'Approving…' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={onDeny}
          disabled={state === 'approving'}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800"
        >
          Deny
        </button>
      </div>
    </div>
  );
}
