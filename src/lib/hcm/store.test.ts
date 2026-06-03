import { beforeEach, describe, expect, it } from 'vitest';
import { hcmStore } from './store';

describe('hcmStore', () => {
  beforeEach(() => {
    hcmStore.reset({
      silentFailureRate: 0,
      batchDelayMs: 0,
      cellDelayMs: 0,
      anniversaryIntervalMs: 0,
    });
  });

  it('returns batch balances for employee', async () => {
    const batch = await hcmStore.getBatchBalances('emp-001');
    expect(batch.balances).toHaveLength(3);
    expect(batch.corpusVersion).toBe(1);
  });

  it('rejects submit when balance is insufficient', async () => {
    const result = await hcmStore.submitRequest({
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
      days: 100,
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });
    expect(result).toMatchObject({ code: 'INSUFFICIENT_BALANCE' });
  });

  it('decrements balance on successful submit', async () => {
    const before = await hcmStore.getCellBalance('emp-001', 'loc-nyc');
    expect(before).not.toHaveProperty('code');

    const submit = await hcmStore.submitRequest({
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
      days: 2,
      startDate: '2026-06-01',
      endDate: '2026-06-02',
    });
    expect(submit).toHaveProperty('request');

    const after = await hcmStore.getCellBalance('emp-001', 'loc-nyc');
    if ('code' in after) {
      throw new Error('unexpected error');
    }
    if ('daysAvailable' in before) {
      expect(after.daysAvailable).toBe(before.daysAvailable - 2);
    }
  });

  it('marks silent mismatch on confirm when silent failure occurred', async () => {
    hcmStore.forceSilentFailureNext();
    const submit = await hcmStore.submitRequest({
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
      days: 2,
      startDate: '2026-06-01',
      endDate: '2026-06-02',
    });
    hcmStore.restoreSilentFailureRate();
    if ('code' in submit) {
      throw new Error('expected request');
    }

    const confirm = await hcmStore.confirmRequest(submit.request.id);
    if ('code' in confirm) {
      throw new Error('expected confirmation');
    }
    expect(confirm.silentMismatch).toBe(true);
    expect(confirm.request.status).toBe('needs_review');
  });

  it('returns conflict when balance changed since manager snapshot', async () => {
    const submit = await hcmStore.submitRequest({
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
      days: 2,
      startDate: '2026-06-01',
      endDate: '2026-06-02',
    });
    if ('code' in submit) {
      throw new Error('expected request');
    }

    hcmStore.applyAnniversaryBonus('emp-001');
    const result = await hcmStore.updateRequest(submit.request.id, {
      action: 'approve',
      snapshotBalance: 10,
    });
    expect(result).toMatchObject({ code: 'CONFLICT' });
  });

  it('applies anniversary bonus and bumps corpus version', () => {
    const beforeVersion = hcmStore.applyAnniversaryBonus('emp-001').corpusVersion;
    const after = hcmStore.applyAnniversaryBonus('emp-001');
    expect(after.corpusVersion).toBeGreaterThan(beforeVersion);
    expect(after.balances.every((balance) => balance.daysAvailable >= 8)).toBe(true);
  });

  it('confirms successful request', async () => {
    const submit = await hcmStore.submitRequest({
      employeeId: 'emp-001',
      locationId: 'loc-lon',
      days: 1,
      startDate: '2026-06-08',
      endDate: '2026-06-08',
    });
    if ('code' in submit) {
      throw new Error('expected request');
    }

    const confirm = await hcmStore.confirmRequest(submit.request.id);
    if ('code' in confirm) {
      throw new Error('expected confirmation');
    }
    expect(confirm.silentMismatch).toBe(false);
    expect(confirm.request.status).toBe('confirmed');
  });

  it('rejects invalid dimension combinations', async () => {
    const result = await hcmStore.submitRequest({
      employeeId: 'missing',
      locationId: 'loc-nyc',
      days: 1,
      startDate: '2026-06-01',
      endDate: '2026-06-01',
    });
    expect(result).toMatchObject({ code: 'INVALID_DIMENSION' });
  });

  it('restores balance when manager denies pending request', async () => {
    const cellBefore = await hcmStore.getCellBalance('emp-001', 'loc-sf');
    if ('code' in cellBefore) {
      throw new Error('missing cell');
    }

    const submit = await hcmStore.submitRequest({
      employeeId: 'emp-001',
      locationId: 'loc-sf',
      days: 1,
      startDate: '2026-06-05',
      endDate: '2026-06-05',
    });
    if ('code' in submit) {
      throw new Error('expected request');
    }

    await hcmStore.updateRequest(submit.request.id, { action: 'deny' });
    const cellAfter = await hcmStore.getCellBalance('emp-001', 'loc-sf');
    if ('code' in cellAfter) {
      throw new Error('missing cell');
    }
    expect(cellAfter.daysAvailable).toBe(cellBefore.daysAvailable);
  });
});
