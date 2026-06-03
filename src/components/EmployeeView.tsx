'use client';

import { useEffect, useRef, useState } from 'react';
import { BalanceGrid } from '@/components/BalanceGrid';
import { ErrorBanner } from '@/components/ErrorBanner';
import { ReconciliationBanner } from '@/components/ReconciliationBanner';
import { RequestForm, type RequestFormState } from '@/components/RequestForm';
import { RequestHistory } from '@/components/RequestHistory';
import { useBalances } from '@/hooks/useBalances';
import { useEmployeeRequests } from '@/hooks/useEmployeeRequests';
import { useSubmitRequest } from '@/hooks/useSubmitRequest';
import { isHCMError } from '@/lib/hcm/client';

const EMPLOYEE_ID = 'emp-001';

export function EmployeeView() {
  const {
    balances,
    corpusVersion,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    isBalanceStale,
  } = useBalances(EMPLOYEE_ID);
  const requestsQuery = useEmployeeRequests(EMPLOYEE_ID);
  const submitMutation = useSubmitRequest(EMPLOYEE_ID);
  const previousCorpus = useRef(corpusVersion);
  const [anniversaryDetected, setAnniversaryDetected] = useState(false);
  const [rolledBackLocationId, setRolledBackLocationId] = useState<string | undefined>();
  const [optimisticLocationId, setOptimisticLocationId] = useState<string | undefined>();
  const [formState, setFormState] = useState<RequestFormState>('idle');
  const [formError, setFormError] = useState<string | undefined>();

  useEffect(() => {
    if (corpusVersion > previousCorpus.current && previousCorpus.current > 0) {
      setAnniversaryDetected(true);
    }
    previousCorpus.current = corpusVersion;
  }, [corpusVersion]);

  const hasMismatch = (requestsQuery.data ?? []).some(
    (request) => request.status === 'needs_review',
  );

  const handleSubmit = (payload: {
    locationId: string;
    days: number;
    startDate: string;
    endDate: string;
  }) => {
    setFormState('submitting');
    setFormError(undefined);
    setOptimisticLocationId(payload.locationId);
    setRolledBackLocationId(undefined);

    submitMutation.mutate(
      {
        employeeId: EMPLOYEE_ID,
        ...payload,
      },
      {
        onSuccess: (data) => {
          setOptimisticLocationId(undefined);
          if (data.confirmation.silentMismatch) {
            setFormState('idle');
            return;
          }
          setFormState('idle');
        },
        onError: (mutationError, variables) => {
          setOptimisticLocationId(undefined);
          setRolledBackLocationId(variables.locationId);
          if (isHCMError(mutationError)) {
            setFormState('hcmRejected');
            setFormError(mutationError.message);
            return;
          }
          setFormState('hcmRejected');
          setFormError('Submission failed.');
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">ExampleHR</p>
        <h1 className="text-3xl font-semibold text-slate-900">Time off</h1>
        <p className="text-slate-600">View balances by location and submit requests instantly.</p>
      </header>

      <ReconciliationBanner
        variant={hasMismatch ? 'mismatch' : anniversaryDetected ? 'anniversary' : 'hidden'}
        onRefresh={() => {
          setAnniversaryDetected(false);
          refetch();
        }}
      />

      {isError ? <ErrorBanner message={error?.message ?? 'Failed to load balances.'} /> : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Balances</h2>
        <BalanceGrid
          balances={balances}
          isLoading={isLoading}
          isFetching={isFetching}
          isBalanceStale={isBalanceStale}
          optimisticLocationId={optimisticLocationId}
          rolledBackLocationId={rolledBackLocationId}
          refreshedLocationId={anniversaryDetected ? balances[0]?.locationId : undefined}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <RequestForm
          balances={balances}
          onSubmit={handleSubmit}
          isSubmitting={submitMutation.isPending}
          errorMessage={formError}
          formState={formState}
          disabled={isFetching && !submitMutation.isPending}
        />
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Request history</h2>
          <RequestHistory
            requests={requestsQuery.data ?? []}
            variant={hasMismatch ? 'silentWrongRecovery' : 'default'}
          />
        </div>
      </section>
    </div>
  );
}
