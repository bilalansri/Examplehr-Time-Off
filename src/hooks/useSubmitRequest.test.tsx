import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSubmitRequest } from './useSubmitRequest';
import { queryKeys } from '@/lib/query/keys';
import type { BatchBalancesResponse } from '@/lib/hcm/types';

const batchData: BatchBalancesResponse = {
  employeeId: 'emp-001',
  balances: [
    {
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
      locationName: 'New York',
      daysAvailable: 12,
      asOf: new Date().toISOString(),
    },
  ],
  corpusVersion: 1,
};

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useSubmitRequest', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rolls back optimistic balance on HCM rejection', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    client.setQueryData(queryKeys.batchBalances('emp-001'), batchData);

    vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/balances/cell')) {
        return Response.json({ ...batchData.balances[0], corpusVersion: 1 });
      }
      if (url.includes('/requests') && init?.method === 'POST') {
        return Response.json(
          { code: 'INSUFFICIENT_BALANCE', message: 'Not enough balance' },
          { status: 409 },
        );
      }
      return Response.json({});
    });

    const { result } = renderHook(() => useSubmitRequest('emp-001'), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
      days: 2,
      startDate: '2026-06-01',
      endDate: '2026-06-02',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const restored = client.getQueryData<BatchBalancesResponse>(queryKeys.batchBalances('emp-001'));
    expect(restored?.balances[0].daysAvailable).toBe(12);
  });

  it('confirms successful submit and updates cache', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    client.setQueryData(queryKeys.batchBalances('emp-001'), batchData);

    vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('/balances/cell')) {
        return Response.json({ ...batchData.balances[0], corpusVersion: 1 });
      }
      if (url.includes('/confirm')) {
        return Response.json({
          request: { id: 'req-1', status: 'confirmed' },
          silentMismatch: false,
        });
      }
      if (url.includes('/requests') && init?.method === 'POST') {
        return Response.json(
          { request: { id: 'req-1', status: 'pending' } },
          { status: 201 },
        );
      }
      return Response.json({});
    });

    const { result } = renderHook(() => useSubmitRequest('emp-001'), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
      days: 2,
      startDate: '2026-06-01',
      endDate: '2026-06-02',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
