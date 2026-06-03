export type RequestStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'needs_review'
  | 'approved'
  | 'denied';

export type Balance = {
  employeeId: string;
  locationId: string;
  locationName: string;
  daysAvailable: number;
  asOf: string;
};

export type BatchBalancesResponse = {
  employeeId: string;
  balances: Balance[];
  corpusVersion: number;
};

export type CellBalanceResponse = Balance & {
  corpusVersion: number;
};

export type TimeOffRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  locationId: string;
  locationName: string;
  days: number;
  startDate: string;
  endDate: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  snapshotBalance?: number;
  silentMismatch?: boolean;
};

export type SubmitRequestPayload = {
  employeeId: string;
  locationId: string;
  days: number;
  startDate: string;
  endDate: string;
};

export type ApproveRequestPayload = {
  action: 'approve' | 'deny';
  snapshotBalance?: number;
};

export type HCMErrorCode =
  | 'INSUFFICIENT_BALANCE'
  | 'INVALID_DIMENSION'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'SILENT_MISMATCH';

export type HCMError = {
  code: HCMErrorCode;
  message: string;
};

export type EmployeeProfile = {
  id: string;
  name: string;
  managerId: string;
};

export type LocationProfile = {
  id: string;
  name: string;
};

export type SimulationConfig = {
  silentFailureRate: number;
  batchDelayMs: number;
  cellDelayMs: number;
  anniversaryBonusDays: number;
  anniversaryIntervalMs: number;
};
