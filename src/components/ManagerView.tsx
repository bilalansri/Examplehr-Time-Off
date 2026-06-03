'use client';

import { useEffect, useRef, useState } from 'react';
import { ApprovalPanel, type ApprovalPanelState } from '@/components/ApprovalPanel';
import { ErrorBanner } from '@/components/ErrorBanner';
import { PendingQueue } from '@/components/PendingQueue';
import { fetchCellBalance, isHCMError } from '@/lib/hcm/client';
import type { TimeOffRequest } from '@/lib/hcm/types';
import { useApproveRequest } from '@/hooks/useApproveRequest';
import { usePendingRequests } from '@/hooks/useEmployeeRequests';

export function ManagerView() {
  const pendingQuery = usePendingRequests();
  const approveMutation = useApproveRequest();
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  const [decisionBalance, setDecisionBalance] = useState<number | null>(null);
  const [decisionAsOf, setDecisionAsOf] = useState<string | undefined>();
  const [panelState, setPanelState] = useState<ApprovalPanelState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!selectedRequest) {
      setDecisionBalance(null);
      setDecisionAsOf(undefined);
      setPanelState('idle');
      return;
    }

    let cancelled = false;
    setPanelState('fetchingBalance');
    fetchCellBalance(selectedRequest.employeeId, selectedRequest.locationId)
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (isHCMError(result)) {
          setPanelState('hcmRejected');
          setErrorMessage(result.message);
          return;
        }
        setDecisionBalance(result.daysAvailable);
        setDecisionAsOf(result.asOf);
        setPanelState('idle');
      })
      .catch(() => {
        if (!cancelled) {
          setPanelState('hcmRejected');
          setErrorMessage('Unable to load balance context.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRequest]);

  const handleApprove = () => {
    if (!selectedRequest) {
      return;
    }
    setPanelState('approving');
    setErrorMessage(undefined);
    approveMutation.mutate(
      {
        id: selectedRequest.id,
        payload: { action: 'approve' },
        employeeId: selectedRequest.employeeId,
        locationId: selectedRequest.locationId,
      },
      {
        onSuccess: () => {
          setSelectedRequest(null);
          setPanelState('idle');
        },
        onError: (error) => {
          if (isHCMError(error)) {
            if (error.code === 'CONFLICT') {
              setPanelState('conflict409');
              setErrorMessage(error.message);
              return;
            }
            if (error.code === 'INSUFFICIENT_BALANCE') {
              setPanelState('hcmRejected');
              setErrorMessage(error.message);
              return;
            }
            setPanelState('hcmRejected');
            setErrorMessage(error.message);
            return;
          }
          setPanelState('hcmRejected');
          setErrorMessage('Approval failed.');
        },
      },
    );
  };

  const handleDeny = () => {
    if (!selectedRequest) {
      return;
    }
    setPanelState('approving');
    approveMutation.mutate(
      {
        id: selectedRequest.id,
        payload: { action: 'deny' },
        employeeId: selectedRequest.employeeId,
        locationId: selectedRequest.locationId,
      },
      {
        onSuccess: () => {
          setSelectedRequest(null);
          setPanelState('idle');
        },
        onError: (error) => {
          if (isHCMError(error)) {
            setPanelState('hcmRejected');
            setErrorMessage(error.message);
            return;
          }
          setPanelState('hcmRejected');
          setErrorMessage('Deny action failed.');
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">ExampleHR</p>
        <h1 className="text-3xl font-semibold text-slate-900">Manager approvals</h1>
        <p className="text-slate-600">Review pending requests with live HR balance context.</p>
      </header>

      {pendingQuery.isError ? (
        <ErrorBanner message={pendingQuery.error?.message ?? 'Failed to load pending requests.'} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Pending queue</h2>
          <PendingQueue
            requests={pendingQuery.data ?? []}
            isLoading={pendingQuery.isLoading}
            selectedId={selectedRequest?.id}
            onSelect={setSelectedRequest}
          />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Decision panel</h2>
          <ApprovalPanel
            request={selectedRequest}
            decisionBalance={decisionBalance}
            decisionAsOf={decisionAsOf}
            state={panelState}
            errorMessage={errorMessage}
            onApprove={handleApprove}
            onDeny={handleDeny}
          />
        </section>
      </div>
    </div>
  );
}
