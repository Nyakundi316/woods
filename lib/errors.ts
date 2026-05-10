import * as Sentry from '@sentry/react-native';

export type AppError =
  | { kind: 'network'; message: string }
  | { kind: 'auth'; message: string }
  | { kind: 'not_found'; message: string }
  | { kind: 'validation'; message: string; field?: string }
  | { kind: 'ai'; message: string }
  | { kind: 'unknown'; message: string; raw?: unknown };

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T>(error: AppError): Result<T> {
  return { ok: false, error };
}

export function captureError(error: AppError, context?: Record<string, unknown>) {
  Sentry.captureException(new Error(error.message), {
    extra: { ...context, kind: error.kind },
  });
}
