import { NextRequest, NextResponse } from 'next/server';
import { hcmErrorResponse, isHCMError, statusForError } from '@/lib/hcm/api-utils';
import { hcmStore } from '@/lib/hcm/store';

export async function GET(request: NextRequest) {
  const employeeId = request.nextUrl.searchParams.get('employeeId');
  if (!employeeId) {
    return hcmErrorResponse({ code: 'INVALID_DIMENSION', message: 'employeeId is required' }, 400);
  }

  const result = await hcmStore.getBatchBalances(employeeId);
  return NextResponse.json(result);
}
