import { useQuery } from '@tanstack/react-query';
import { fetchRequests, isHCMError } from '@/lib/hcm/client';
import { QUEUE_REFETCH_INTERVAL } from '@/lib/query/client';
import { queryKeys } from '@/lib/query/keys';

export function usePendingRequests() {
  return useQuery({
    queryKey: queryKeys.requests('manager', 'pending'),
    queryFn: async () => {
      const result = await fetchRequests('pending');
      if (isHCMError(result)) {
        throw new Error(result.message);
      }
      return result;
    },
    refetchInterval: QUEUE_REFETCH_INTERVAL,
  });
}

export function useEmployeeRequests(employeeId: string) {
  return useQuery({
    queryKey: queryKeys.requests(employeeId, 'employee'),
    queryFn: async () => {
      const result = await fetchRequests(undefined);
      if (isHCMError(result)) {
        throw new Error(result.message);
      }
      return result.filter((request) => request.employeeId === employeeId);
    },
  });
}
