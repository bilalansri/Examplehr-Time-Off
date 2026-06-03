import type {
  ApproveRequestPayload,
  BatchBalancesResponse,
  CellBalanceResponse,
  HCMError,
  SubmitRequestPayload,
  TimeOffRequest,
} from './types';

const API_BASE = '/api/hcm';

async function parseResponse<T>(response: Response): Promise<T | HCMError> {
  const data = await response.json();
  if (!response.ok) {
    return data as HCMError;
  }
  return data as T;
}

export async function fetchBatchBalances(employeeId: string): Promise<BatchBalancesResponse | HCMError> {
  const response = await fetch(`${API_BASE}/balances?employeeId=${employeeId}`);
  return parseResponse<BatchBalancesResponse>(response);
}

export async function fetchCellBalance(
  employeeId: string,
  locationId: string,
  delayMs?: number,
): Promise<CellBalanceResponse | HCMError> {
  const delayQuery = delayMs !== undefined ? `&delayMs=${delayMs}` : '';
  const response = await fetch(
    `${API_BASE}/balances/cell?employeeId=${employeeId}&locationId=${locationId}${delayQuery}`,
  );
  return parseResponse<CellBalanceResponse>(response);
}

export async function submitTimeOffRequest(
  payload: SubmitRequestPayload,
): Promise<{ request: TimeOffRequest } | HCMError> {
  const response = await fetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ request: TimeOffRequest }>(response);
}

export async function fetchRequests(status?: string): Promise<TimeOffRequest[] | HCMError> {
  const query = status ? `?status=${status}` : '';
  const response = await fetch(`${API_BASE}/requests${query}`);
  return parseResponse<TimeOffRequest[]>(response);
}

export async function updateRequest(
  id: string,
  payload: ApproveRequestPayload,
): Promise<{ request: TimeOffRequest } | HCMError> {
  const response = await fetch(`${API_BASE}/requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ request: TimeOffRequest }>(response);
}

export async function confirmRequest(
  id: string,
): Promise<{ request: TimeOffRequest; silentMismatch: boolean } | HCMError> {
  const response = await fetch(`${API_BASE}/requests/${id}/confirm`, {
    method: 'POST',
  });
  return parseResponse<{ request: TimeOffRequest; silentMismatch: boolean }>(response);
}

export async function triggerAnniversaryBonus(
  employeeId: string,
): Promise<BatchBalancesResponse | HCMError> {
  const response = await fetch(`${API_BASE}/simulate/anniversary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  });
  return parseResponse<BatchBalancesResponse>(response);
}

export function isHCMError(value: unknown): value is HCMError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value
  );
}
