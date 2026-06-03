import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBatchBalances, fetchCellBalance, isHCMError } from '@/lib/hcm/client';
import type { Balance, BatchBalancesResponse } from '@/lib/hcm/types';
import { BATCH_REFETCH_INTERVAL } from '@/lib/query/client';
import { queryKeys } from '@/lib/query/keys';
import {
  isBalanceStale,
  latestBatchAsOf,
  mergeBatchWithGuards,
} from '@/lib/query/reconciliation';

export function useBatchBalances(employeeId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.batchBalances(employeeId),
    queryFn: async () => {
      const result = await fetchBatchBalances(employeeId);
      if (isHCMError(result)) {
        throw new Error(result.message);
      }
      const previous = queryClient.getQueryData<BatchBalancesResponse>(
        queryKeys.batchBalances(employeeId),
      );
      return mergeBatchWithGuards(result, previous?.balances);
    },
    refetchInterval: BATCH_REFETCH_INTERVAL,
  });
}

export function useCellBalance(employeeId: string, locationId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.cellBalance(employeeId, locationId),
    queryFn: async () => {
      const result = await fetchCellBalance(employeeId, locationId);
      if (isHCMError(result)) {
        throw new Error(result.message);
      }
      return result;
    },
    enabled,
  });
}

export function useBalances(employeeId: string) {
  const batchQuery = useBatchBalances(employeeId);

  const balances: Balance[] = batchQuery.data?.balances ?? [];
  const corpusVersion = batchQuery.data?.corpusVersion ?? 0;
  const batchAsOf = latestBatchAsOf(balances);

  return {
    balances,
    corpusVersion,
    batchAsOf,
    isLoading: batchQuery.isLoading,
    isFetching: batchQuery.isFetching,
    isError: batchQuery.isError,
    error: batchQuery.error,
    refetch: batchQuery.refetch,
    isBalanceStale: (balance: Balance | undefined) =>
      isBalanceStale(balance, batchAsOf, batchQuery.isFetching),
  };
}
