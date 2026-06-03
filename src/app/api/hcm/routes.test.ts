import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { GET as getBatch } from '@/app/api/hcm/balances/route';
import { GET as getCell } from '@/app/api/hcm/balances/cell/route';
import { GET as listRequests, POST as createRequest } from '@/app/api/hcm/requests/route';
import { GET as getRequestById, PATCH as patchRequest } from '@/app/api/hcm/requests/[id]/route';
import { POST as confirmRequest } from '@/app/api/hcm/requests/[id]/confirm/route';
import { POST as anniversary } from '@/app/api/hcm/simulate/anniversary/route';
import { hcmStore } from '@/lib/hcm/store';

describe('hcm api routes', () => {
  beforeEach(() => {
    hcmStore.reset({
      silentFailureRate: 0,
      batchDelayMs: 0,
      cellDelayMs: 0,
      anniversaryIntervalMs: 0,
    });
  });

  it('returns batch balances', async () => {
    const request = new NextRequest('http://localhost/api/hcm/balances?employeeId=emp-001');
    const response = await getBatch(request);
    const body = await response.json();
    expect(body.balances).toHaveLength(3);
  });

  it('returns cell balance', async () => {
    const request = new NextRequest(
      'http://localhost/api/hcm/balances/cell?employeeId=emp-001&locationId=loc-nyc',
    );
    const response = await getCell(request);
    const body = await response.json();
    expect(body.daysAvailable).toBe(12);
  });

  it('creates and confirms request', async () => {
    const create = new NextRequest('http://localhost/api/hcm/requests', {
      method: 'POST',
      body: JSON.stringify({
        employeeId: 'emp-001',
        locationId: 'loc-nyc',
        days: 1,
        startDate: '2026-06-01',
        endDate: '2026-06-01',
      }),
    });
    const created = await createRequest(create);
    const createdBody = await created.json();
    expect(created.status).toBe(201);

    const confirm = await confirmRequest(new Request('http://localhost'), {
      params: Promise.resolve({ id: createdBody.request.id }),
    });
    const confirmBody = await confirm.json();
    expect(confirmBody.request.status).toBe('confirmed');
  });

  it('lists pending requests and approves', async () => {
    const create = new NextRequest('http://localhost/api/hcm/requests', {
      method: 'POST',
      body: JSON.stringify({
        employeeId: 'emp-001',
        locationId: 'loc-sf',
        days: 1,
        startDate: '2026-06-03',
        endDate: '2026-06-03',
      }),
    });
    const created = await createRequest(create);
    const createdBody = await created.json();

    const list = new NextRequest('http://localhost/api/hcm/requests?status=pending');
    const listed = await listRequests(list);
    const listedBody = await listed.json();
    expect(listedBody.length).toBeGreaterThan(0);

    const cell = await hcmStore.getCellBalance('emp-001', 'loc-sf');
    if ('code' in cell) {
      throw new Error('missing cell');
    }

    const patch = new NextRequest('http://localhost/api/hcm/requests/abc', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'approve', snapshotBalance: cell.daysAvailable }),
    });
    const patched = await patchRequest(patch, {
      params: Promise.resolve({ id: createdBody.request.id }),
    });
    expect(patched.status).toBe(200);

    const byId = await getRequestById(new NextRequest('http://localhost'), {
      params: Promise.resolve({ id: createdBody.request.id }),
    });
    expect(byId.status).toBe(200);
  });

  it('rejects submit when POST body is invalid dimension', async () => {
    const create = new NextRequest('http://localhost/api/hcm/requests', {
      method: 'POST',
      body: JSON.stringify({
        employeeId: 'missing',
        locationId: 'loc-nyc',
        days: 1,
        startDate: '2026-06-01',
        endDate: '2026-06-01',
      }),
    });
    const created = await createRequest(create);
    expect(created.status).toBe(400);
  });

  it('triggers anniversary bonus', async () => {
    const request = new NextRequest('http://localhost/api/hcm/simulate/anniversary', {
      method: 'POST',
      body: JSON.stringify({ employeeId: 'emp-001' }),
    });
    const response = await anniversary(request);
    const body = await response.json();
    expect(body.corpusVersion).toBeGreaterThan(1);
  });

  it('returns validation errors', async () => {
    const batch = new NextRequest('http://localhost/api/hcm/balances');
    expect((await getBatch(batch)).status).toBe(400);

    const cell = new NextRequest('http://localhost/api/hcm/balances/cell?employeeId=emp-001');
    expect((await getCell(cell)).status).toBe(400);

    const delayed = new NextRequest(
      'http://localhost/api/hcm/balances/cell?employeeId=emp-001&locationId=loc-nyc&delayMs=0',
    );
    expect((await getCell(delayed)).status).toBe(200);

    const missing = new NextRequest('http://localhost/api/hcm/requests/missing', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'approve' }),
    });
    const missingResponse = await patchRequest(missing, {
      params: Promise.resolve({ id: 'does-not-exist' }),
    });
    expect(missingResponse.status).toBe(404);

    const confirmMissing = await confirmRequest(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'missing-id' }),
    });
    expect(confirmMissing.status).toBe(404);
  });
});
