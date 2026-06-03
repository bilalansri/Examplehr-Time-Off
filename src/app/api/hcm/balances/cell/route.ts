import { NextRequest, NextResponse } from 'next/server';
import { hcmErrorResponse, isHCMError, statusForError } from '@/lib/hcm/api-utils';
import { hcmStore } from '@/lib/hcm/store';

export async function GET(request: NextRequest) {
  const employeeId = request.nextUrl.searchParams.get('employeeId');
  const locationId = request.nextUrl.searchParams.get('locationId');
  const delayMs = request.nextUrl.searchParams.get('delayMs');

  if (!employeeId || !locationId) {
    return hcmErrorResponse(
      { code: 'INVALID_DIMENSION', message: 'employeeId and locationId are required' },
      400,
    );
  }

  if (delayMs) {
    const previousDelay = hcmStore.getConfig().cellDelayMs;
    hcmStore.setConfig({ cellDelayMs: Number(delayMs) });
    const result = await hcmStore.getCellBalance(employeeId, locationId);
    hcmStore.setConfig({ cellDelayMs: previousDelay });
    if (isHCMError(result)) {
      return hcmErrorResponse(result, statusForError(result.code));
    }
    return NextResponse.json(result);
  }

  const result = await hcmStore.getCellBalance(employeeId, locationId);
  if (isHCMError(result)) {
    return hcmErrorResponse(result, statusForError(result.code));
  }
  return NextResponse.json(result);
}
