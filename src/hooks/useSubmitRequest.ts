import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  confirmRequest,
  fetchCellBalance,
  isHCMError,
  submitTimeOffRequest,
} from '@/lib/hcm/client';
import type { BatchBalancesResponse, SubmitRequestPayload, TimeOffRequest } from '@/lib/hcm/types';
import { queryKeys } from '@/lib/query/keys';
import {
  clearOptimisticGuard,
  registerOptimisticGuard,
} from '@/lib/query/reconciliation';

type SubmitContext = {
  previousBatch: BatchBalancesResponse | undefined;
  optimisticRequest: TimeOffRequest;
};

export function useSubmitRequest(employeeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitRequestPayload) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.cellBalance(payload.employeeId, payload.locationId),
        queryFn: async () => {
          const result = await fetchCellBalance(payload.employeeId, payload.locationId);
          if (isHCMError(result)) {
            throw new Error(result.message);
          }
          return result;
        },
      });

      const result = await submitTimeOffRequest(payload);
      if (isHCMError(result)) {
        throw result;
      }

      const confirmation = await confirmRequest(result.request.id);
      if (isHCMError(confirmation)) {
        throw confirmation;
      }

      return { ...result, confirmation };
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.batchBalances(employeeId) });

      const previousBatch = queryClient.getQueryData<BatchBalancesResponse>(
        queryKeys.batchBalances(employeeId),
      );

      registerOptimisticGuard({
        employeeId: payload.employeeId,
        locationId: payload.locationId,
        adjustedDays: -payload.days,
      });

      if (previousBatch) {
        queryClient.setQueryData<BatchBalancesResponse>(queryKeys.batchBalances(employeeId), {
          ...previousBatch,
          balances: previousBatch.balances.map((balance) =>
            balance.locationId === payload.locationId
              ? {
                  ...balance,
                  daysAvailable: balance.daysAvailable - payload.days,
                  asOf: new Date().toISOString(),
                }
              : balance,
          ),
        });
      }

      const optimisticRequest: TimeOffRequest = {
        id: `optimistic-${Date.now()}`,
        employeeId: payload.employeeId,
        employeeName: 'Alex Rivera',
        locationId: payload.locationId,
        locationName: payload.locationId,
        days: payload.days,
        startDate: payload.startDate,
        endDate: payload.endDate,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<TimeOffRequest[]>(
        queryKeys.requests(employeeId, 'employee'),
        (current) => [optimisticRequest, ...(current ?? [])],
      );

      return { previousBatch, optimisticRequest } satisfies SubmitContext;
    },
    onError: (_error, payload, context) => {
      clearOptimisticGuard(payload.employeeId, payload.locationId);
      if (context?.previousBatch) {
        queryClient.setQueryData(queryKeys.batchBalances(employeeId), context.previousBatch);
      }
      if (context?.optimisticRequest) {
        queryClient.setQueryData<TimeOffRequest[]>(
          queryKeys.requests(employeeId, 'employee'),
          (current) =>
            (current ?? []).filter((request) => request.id !== context.optimisticRequest.id),
        );
      }
    },
    onSuccess: async (data, payload) => {
      clearOptimisticGuard(payload.employeeId, payload.locationId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.batchBalances(employeeId) });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.cellBalance(payload.employeeId, payload.locationId),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests(employeeId, 'employee') });
      if (data.confirmation.silentMismatch) {
        queryClient.setQueryData<TimeOffRequest[]>(
          queryKeys.requests(employeeId, 'employee'),
          (current) =>
            (current ?? []).map((request) =>
              request.id === data.request.id || request.id.startsWith('optimistic-')
                ? data.confirmation.request
                : request,
            ),
        );
      }
    },
  });
}
