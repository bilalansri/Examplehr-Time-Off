import { NextRequest, NextResponse } from 'next/server';
import { hcmErrorResponse, isHCMError, statusForError } from '@/lib/hcm/api-utils';
import { hcmStore } from '@/lib/hcm/store';
import type { ApproveRequestPayload } from '@/lib/hcm/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const payload = (await request.json()) as ApproveRequestPayload;
  const result = await hcmStore.updateRequest(id, payload);
  if (isHCMError(result)) {
    return hcmErrorResponse(result, statusForError(result.code));
  }
  return NextResponse.json(result);
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const requestEntry = await hcmStore.getRequest(id);
  if (!requestEntry) {
    return hcmErrorResponse({ code: 'NOT_FOUND', message: 'Request not found' }, 404);
  }
  return NextResponse.json({ request: requestEntry });
}
