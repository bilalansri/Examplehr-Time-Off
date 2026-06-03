import { NextRequest, NextResponse } from 'next/server';
import { hcmErrorResponse, isHCMError, statusForError } from '@/lib/hcm/api-utils';
import { hcmStore } from '@/lib/hcm/store';
import type { SubmitRequestPayload } from '@/lib/hcm/types';

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status') ?? undefined;
  const employeeId = request.nextUrl.searchParams.get('employeeId') ?? undefined;
  const requests = await hcmStore.listRequests(status);
  const filtered = employeeId
    ? requests.filter((entry) => entry.employeeId === employeeId)
    : requests;
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as SubmitRequestPayload;
  const result = await hcmStore.submitRequest(payload);
  if (isHCMError(result)) {
    return hcmErrorResponse(result, statusForError(result.code));
  }
  return NextResponse.json(result, { status: 201 });
}
