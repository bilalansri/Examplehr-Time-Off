import { NextResponse } from 'next/server';
import type { HCMError } from './types';

export function hcmErrorResponse(error: HCMError, status: number): NextResponse {
  return NextResponse.json(error, { status });
}

export function isHCMError(value: unknown): value is HCMError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value
  );
}

export const HCM_STATUS: Record<HCMError['code'], number> = {
  INVALID_DIMENSION: 400,
  INSUFFICIENT_BALANCE: 409,
  CONFLICT: 409,
  NOT_FOUND: 404,
  SILENT_MISMATCH: 409,
};

export function statusForError(code: HCMError['code']): number {
  return HCM_STATUS[code] ?? 500;
}
