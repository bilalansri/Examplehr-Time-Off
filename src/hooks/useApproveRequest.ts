import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCellBalance, isHCMError, updateRequest } from '@/lib/hcm/client';
import type { ApproveRequestPayload, TimeOffRequest } from '@/lib/hcm/types';
import { queryKeys } from '@/lib/query/keys';

type ApproveVariables = {
  id: string;
  payload: ApproveRequestPayload;
  employeeId: string;
  locationId: string;
};

type ApproveContext = {
  previousPending: TimeOffRequest[] | undefined;
};

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload, employeeId, locationId }: ApproveVariables) => {
      const cell = await fetchCellBalance(employeeId, locationId);
      if (isHCMError(cell)) {
        throw cell;
      }

      const result = await updateRequest(id, {
        ...payload,
        snapshotBalance: cell.daysAvailable,
      });

      if (isHCMError(result)) {
        throw result;
      }

      return { request: result.request, decisionBalance: cell.daysAvailable };
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.requests('manager', 'pending') });
      const previousPending = queryClient.getQueryData<TimeOffRequest[]>(
        queryKeys.requests('manager', 'pending'),
      );

      queryClient.setQueryData<TimeOffRequest[]>(
        queryKeys.requests('manager', 'pending'),
        (current) => (current ?? []).filter((request) => request.id !== id),
      );

      return { previousPending } satisfies ApproveContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(
          queryKeys.requests('manager', 'pending'),
          context.previousPending,
        );
      }
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests('manager', 'pending') });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.batchBalances(variables.employeeId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.cellBalance(variables.employeeId, variables.locationId),
      });
    },
  });
}

export function useDenyRequest() {
  const approveMutation = useApproveRequest();
  return {
    ...approveMutation,
    mutateDeny: (variables: Omit<ApproveVariables, 'payload'>) =>
      approveMutation.mutate({ ...variables, payload: { action: 'deny' } }),
    mutateDenyAsync: (variables: Omit<ApproveVariables, 'payload'>) =>
      approveMutation.mutateAsync({ ...variables, payload: { action: 'deny' } }),
  };
}
