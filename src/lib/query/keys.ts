export const queryKeys = {
  batchBalances: (employeeId: string) => ['balances', 'batch', employeeId] as const,
  cellBalance: (employeeId: string, locationId: string) =>
    ['balances', 'cell', employeeId, locationId] as const,
  requests: (scope: string, filter?: string) => ['requests', scope, filter ?? 'all'] as const,
  corpusVersion: (employeeId: string) => ['corpusVersion', employeeId] as const,
};
