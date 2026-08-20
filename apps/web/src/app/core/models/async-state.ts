/**
 * The four states every async read in BuddyIO can be in.
 *
 * Modelled as a discriminated union rather than three loose booleans, because
 * `loading && error && data` is representable with booleans and meaningless in
 * practice. Templates narrow on `status` and the compiler enforces that every
 * state in the doc-03 matrix is actually handled.
 */
export type AsyncState<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly error: AppError };

/**
 * A user-facing failure.
 *
 * `message` is written for a human. `code` is stable and machine-readable, and
 * will map 1:1 onto the Problem Details `type` the API returns in Phase 2.
 * `correlationId` is shown small in the error state so a bug report is
 * traceable end to end.
 */
export interface AppError {
  readonly code: AppErrorCode;
  readonly message: string;
  readonly correlationId: string;
  readonly retryable: boolean;
}

export type AppErrorCode =
  | 'network_unavailable'
  | 'request_failed'
  | 'not_found'
  | 'forbidden'
  | 'rate_limited'
  | 'validation_failed'
  | 'unknown';

export const idle = <T>(): AsyncState<T> => ({ status: 'idle' });
export const loading = <T>(): AsyncState<T> => ({ status: 'loading' });
export const success = <T>(data: T): AsyncState<T> => ({ status: 'success', data });
export const failure = <T>(error: AppError): AsyncState<T> => ({ status: 'error', error });

/**
 * The lifecycle of a mutation (docs/04-user-flows.md section 9). Every mutating
 * action in the product - like, save, follow, comment, send, publish - moves
 * through exactly these states, so it is defined once here.
 */
export type MutationState = 'idle' | 'pending' | 'success' | 'failure';
