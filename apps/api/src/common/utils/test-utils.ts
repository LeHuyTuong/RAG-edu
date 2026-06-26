/**
 * Shared test utilities for NestJS API tests.
 *
 * Reduces repetitive `as any` casts when mocking ExecutionContext,
 * CallHandler, HTTP responses, and other NestJS internals.
 */

import type { ExecutionContext, CallHandler } from '@nestjs/common';
import type { Response } from 'express';
import { of } from 'rxjs';

// ── ExecutionContext mock ───────────────────────────────────────────────────

export interface MockContextResult {
  ctx: ExecutionContext;
  req: Record<string, unknown>;
}

/**
 * Creates a minimal ExecutionContext mock for guard/decorator/filter/interceptor tests.
 *
 * Example:
 *   const { ctx } = createMockExecutionContext(
 *     { headers: { authorization: 'Bearer token' } },
 *     { statusCode: 500 },
 *   );
 *   await guard.canActivate(ctx);
 */
export function createMockExecutionContext(
  reqOverrides: Record<string, unknown> = {},
  options?: { statusCode?: number },
): MockContextResult {
  const req: Record<string, unknown> = {
    headers: {},
    cookies: {},
    ...reqOverrides,
  };

  const statusCode = options?.statusCode ?? 200;

  const ctx = {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({
        statusCode,
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;

  return { ctx, req };
}

// ── CallHandler mock (for interceptors) ─────────────────────────────────────

/**
 * Creates a mock CallHandler that synchronously returns the given data.
 *
 * Example:
 *   const next = createMockCallHandler({ key: 'value' });
 *   interceptor.intercept(context, next);
 */
export function createMockCallHandler<T = unknown>(data: T): CallHandler {
  return { handle: () => of(data) };
}

// ── HTTP response mock (for filters) ────────────────────────────────────────

export interface MockHostResult {
  ctx: ExecutionContext;
  status: jest.Mock;
  json: jest.Mock;
}

/**
 * Creates a mock ExecutionContext + Response for exception filter tests.
 *
 * Example:
 *   const { ctx, status, json } = createMockResponse();
 *   filter.catch(exception, ctx);
 */
export function createMockResponse(): MockHostResult {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const res = { status } as unknown as Response;
  const ctx = {
    switchToHttp: () => ({ getResponse: () => res }),
  } as unknown as ExecutionContext;

  return { ctx, status, json };
}
