/**
 * Route-handler plumbing: one error contract for the whole API.
 *
 * Handlers stay declarative — they throw, and `route` translates the
 * throw into the right status code and a stable JSON error envelope.
 */
import 'server-only';

import { NextResponse } from 'next/server';

import { UnauthorizedError } from './auth';
import { InvalidTransitionError } from './domain';

export interface ApiError {
  error: { code: string; message: string };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

function fail(code: string, message: string, status: number): NextResponse {
  return NextResponse.json<ApiError>({ error: { code, message } }, { status });
}

/**
 * Wrap a handler so every failure mode maps to a predictable response.
 * Unexpected errors log server-side and surface as a generic 500 — the
 * message is never leaked to the client.
 */
export function route<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse>,
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return fail('unauthorized', 'Not authenticated', 401);
      }
      if (error instanceof ValidationError) {
        return fail('invalid_request', error.message, 400);
      }
      if (error instanceof NotFoundError) {
        return fail('not_found', error.message, 404);
      }
      if (error instanceof InvalidTransitionError) {
        return fail('invalid_state', error.message, 409);
      }

      console.error('[api] unhandled error', error);
      return fail('internal_error', 'Something went wrong', 500);
    }
  };
}

/** Parse a JSON body, rejecting anything that is not an object. */
export async function readJson<T extends Record<string, unknown>>(
  request: Request,
): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Request body must be valid JSON');
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ValidationError('Request body must be a JSON object');
  }
  return body as T;
}

export function requireString(
  value: unknown,
  field: string,
  { maxLength = 500 }: { maxLength?: number } = {},
): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`"${field}" is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new ValidationError(`"${field}" is too long`);
  }
  return trimmed;
}

export function requireInt(
  value: unknown,
  field: string,
  { min = 0, max = Number.MAX_SAFE_INTEGER }: { min?: number; max?: number } = {},
): number {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    throw new ValidationError(`"${field}" must be a number`);
  }
  const rounded = Math.round(n);
  if (rounded < min || rounded > max) {
    throw new ValidationError(`"${field}" is out of range`);
  }
  return rounded;
}

export function optionalString(value: unknown, maxLength = 500): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, maxLength);
}
