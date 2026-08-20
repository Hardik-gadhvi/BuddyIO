import { Injectable, inject } from '@angular/core';
import { Observable, defer, delay, of, throwError, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { MockControlService } from '../config/app-config';
import type { AppError } from '../models/async-state';

/**
 * Simulated network transport for the mock repositories.
 *
 * Exists because mocks that resolve instantly and always succeed produce a UI
 * that has never actually rendered a skeleton or an error (ADR-0003 rules 2-3).
 * Every mock repository call goes through here, so latency and failure are
 * uniform and centrally controllable.
 */
@Injectable({ providedIn: 'root' })
export class MockTransport {
  private readonly controls = inject(MockControlService);

  /**
   * Wraps a pure factory in simulated latency and failure.
   *
   * `defer` matters: the factory must run at subscribe time, not at call time,
   * so a retry re-reads the current mock store rather than replaying a stale
   * snapshot.
   */
  respond<T>(factory: () => T, options: { latencyMs?: number } = {}): Observable<T> {
    const latency = options.latencyMs ?? this.controls.latencyMs();

    return defer(() => {
      if (this.controls.shouldFail()) {
        return timer(latency).pipe(mergeMap(() => throwError(() => simulatedError())));
      }
      return of(factory()).pipe(delay(latency));
    });
  }
}

function simulatedError(): AppError {
  return {
    code: 'request_failed',
    message: 'We could not reach BuddyIO just now.',
    correlationId: `sim-${Math.random().toString(36).slice(2, 10)}`,
    retryable: true,
  };
}

/** Normalises anything thrown into the `AppError` the UI knows how to render. */
export function toAppError(cause: unknown): AppError {
  if (isAppError(cause)) {
    return cause;
  }
  return {
    code: 'unknown',
    message: 'Something went wrong. Please try again.',
    correlationId: `err-${Math.random().toString(36).slice(2, 10)}`,
    retryable: true,
  };
}

function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    'correlationId' in value
  );
}
