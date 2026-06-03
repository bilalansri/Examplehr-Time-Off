import { describe, expect, it } from 'vitest';
import { hcmErrorResponse, isHCMError, statusForError } from './api-utils';

describe('api-utils', () => {
  it('identifies HCM errors', () => {
    expect(isHCMError({ code: 'CONFLICT', message: 'x' })).toBe(true);
    expect(isHCMError({ message: 'x' })).toBe(false);
  });

  it('maps error codes to status', () => {
    expect(statusForError('INSUFFICIENT_BALANCE')).toBe(409);
    expect(statusForError('NOT_FOUND')).toBe(404);
  });

  it('creates error responses', async () => {
    const response = hcmErrorResponse(
      { code: 'INVALID_DIMENSION', message: 'bad' },
      400,
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: 'INVALID_DIMENSION',
      message: 'bad',
    });
  });
});
