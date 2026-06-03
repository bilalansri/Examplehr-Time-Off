import { NextResponse } from 'next/server';
import { hcmErrorResponse, isHCMError, statusForError } from '@/lib/hcm/api-utils';
import { hcmStore } from '@/lib/hcm/store';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await hcmStore.confirmRequest(id);
  if (isHCMError(result)) {
    return hcmErrorResponse(result, statusForError(result.code));
  }
  return NextResponse.json(result);
}
