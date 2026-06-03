import { NextRequest, NextResponse } from 'next/server';
import { hcmErrorResponse } from '@/lib/hcm/api-utils';
import { hcmStore } from '@/lib/hcm/store';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { employeeId?: string };
  const employeeId = body.employeeId ?? 'emp-001';
  const result = hcmStore.applyAnniversaryBonus(employeeId);
  return NextResponse.json(result);
}
