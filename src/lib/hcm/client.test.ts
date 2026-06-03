import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  confirmRequest,
  fetchBatchBalances,
  fetchCellBalance,
  fetchRequests,
  isHCMError,
  submitTimeOffRequest,
  triggerAnniversaryBonus,
  updateRequest,
} from './client';

describe('hcm client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detects HCM errors', () => {
    expect(isHCMError({ code: 'CONFLICT', message: 'x' })).toBe(true);
  });

  it('fetches batch balances', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      Response.json({
        employeeId: 'emp-001',
        balances: [],
        corpusVersion: 1,
      }),
    );
    const result = await fetchBatchBalances('emp-001');
    expect(result).toHaveProperty('corpusVersion', 1);
  });

  it('returns parsed HCM errors', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      Response.json({ code: 'CONFLICT', message: 'changed' }, { status: 409 }),
    );
    const result = await fetchCellBalance('emp-001', 'loc-nyc');
    expect(isHCMError(result)).toBe(true);
  });

  it('submits and updates requests', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        Response.json({
          request: { id: 'req-1', status: 'pending' },
        }, { status: 201 }),
      )
      .mockResolvedValueOnce(Response.json([{ id: 'req-1', status: 'pending' }]))
      .mockResolvedValueOnce(Response.json({ request: { id: 'req-1', status: 'approved' } }));

    const submit = await submitTimeOffRequest({
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
      days: 1,
      startDate: '2026-06-01',
      endDate: '2026-06-01',
    });
    expect(submit).toHaveProperty('request');

    const requests = await fetchRequests('pending');
    expect(Array.isArray(requests)).toBe(true);

    const updated = await updateRequest('req-1', { action: 'approve' });
    expect(updated).toHaveProperty('request');
  });

  it('confirms and triggers anniversary', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        Response.json({ request: { id: 'req-1', status: 'confirmed' }, silentMismatch: false }),
      )
      .mockResolvedValueOnce(
        Response.json({ employeeId: 'emp-001', balances: [], corpusVersion: 2 }),
      );

    const confirm = await confirmRequest('req-1');
    expect(confirm).toHaveProperty('silentMismatch', false);

    const anniversary = await triggerAnniversaryBonus('emp-001');
    expect(anniversary).toHaveProperty('corpusVersion', 2);
  });
});
