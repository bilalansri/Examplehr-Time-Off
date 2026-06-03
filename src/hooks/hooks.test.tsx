import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBalances, useCellBalance } from './useBalances';
import { useEmployeeRequests, usePendingRequests } from './useEmployeeRequests';
import { useApproveRequest, useDenyRequest } from './useApproveRequest';
import type { BatchBalancesResponse } from '@/lib/hcm/types';

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('balance and request hooks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads batch balances', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      Response.json({
        employeeId: 'emp-001',
        corpusVersion: 1,
        balances: [
          {
            employeeId: 'emp-001',
            locationId: 'loc-nyc',
            locationName: 'New York',
            daysAvailable: 12,
            asOf: new Date().toISOString(),
          },
        ],
      } satisfies BatchBalancesResponse),
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useBalances('emp-001'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.balances).toHaveLength(1));
    expect(result.current.corpusVersion).toBe(1);
    expect(result.current.isBalanceStale(result.current.balances[0])).toBe(false);
  });

  it('loads cell balance when enabled', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      Response.json({
        employeeId: 'emp-001',
        locationId: 'loc-nyc',
        locationName: 'New York',
        daysAvailable: 12,
        asOf: new Date().toISOString(),
        corpusVersion: 1,
      }),
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useCellBalance('emp-001', 'loc-nyc'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.data?.daysAvailable).toBe(12));
  });

  it('loads employee requests', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      Response.json([
        {
          id: 'req-1',
          employeeId: 'emp-001',
          employeeName: 'Alex',
          locationId: 'loc-nyc',
          locationName: 'New York',
          days: 1,
          startDate: '2026-06-01',
          endDate: '2026-06-01',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]),
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useEmployeeRequests('emp-001'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });

  it('loads pending manager queue', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      Response.json([
        {
          id: 'req-2',
          employeeId: 'emp-001',
          employeeName: 'Alex',
          locationId: 'loc-sf',
          locationName: 'San Francisco',
          days: 2,
          startDate: '2026-06-02',
          endDate: '2026-06-03',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]),
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => usePendingRequests(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.data?.length).toBe(1));
  });

  it('approves request with fresh cell read', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        Response.json({
          employeeId: 'emp-001',
          locationId: 'loc-nyc',
          locationName: 'New York',
          daysAvailable: 10,
          asOf: new Date().toISOString(),
          corpusVersion: 1,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          request: {
            id: 'req-1',
            status: 'approved',
          },
        }),
      );

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useApproveRequest(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      id: 'req-1',
      payload: { action: 'approve' },
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('denies request through deny helper', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        Response.json({
          employeeId: 'emp-001',
          locationId: 'loc-nyc',
          locationName: 'New York',
          daysAvailable: 10,
          asOf: new Date().toISOString(),
          corpusVersion: 1,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          request: {
            id: 'req-1',
            status: 'denied',
          },
        }),
      );

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    client.setQueryData(['requests', 'manager', 'pending'], [
      {
        id: 'req-1',
        employeeId: 'emp-001',
        employeeName: 'Alex',
        locationId: 'loc-nyc',
        locationName: 'New York',
        days: 1,
        startDate: '2026-06-01',
        endDate: '2026-06-01',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const { result } = renderHook(() => useApproveRequest(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      id: 'req-1',
      payload: { action: 'deny' },
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('rolls back pending queue when approval fails', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        Response.json({
          employeeId: 'emp-001',
          locationId: 'loc-nyc',
          locationName: 'New York',
          daysAvailable: 10,
          asOf: new Date().toISOString(),
          corpusVersion: 1,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ code: 'CONFLICT', message: 'changed' }, { status: 409 }),
      );

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    client.setQueryData(['requests', 'manager', 'pending'], [
      {
        id: 'req-1',
        employeeId: 'emp-001',
        employeeName: 'Alex',
        locationId: 'loc-nyc',
        locationName: 'New York',
        days: 1,
        startDate: '2026-06-01',
        endDate: '2026-06-01',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const { result } = renderHook(() => useApproveRequest(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate({
      id: 'req-1',
      payload: { action: 'approve' },
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(['requests', 'manager', 'pending'])).toHaveLength(1);
  });

  it('exposes deny mutation helper', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        Response.json({
          employeeId: 'emp-001',
          locationId: 'loc-nyc',
          locationName: 'New York',
          daysAvailable: 10,
          asOf: new Date().toISOString(),
          corpusVersion: 1,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ request: { id: 'req-1', status: 'denied' } }),
      );

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useDenyRequest(), {
      wrapper: createWrapper(client),
    });

    result.current.mutateDeny({
      id: 'req-1',
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
