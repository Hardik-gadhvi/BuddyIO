import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CurrentUser } from '@core/models';

export interface SignInRequest {
  readonly email: string;
  readonly password: string;
  readonly rememberMe: boolean;
}

export interface SignUpRequest {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
  readonly username: string;
  readonly dateOfBirth: string;
}

export interface AuthResult {
  readonly user: CurrentUser;
  /**
   * Where to send the user next. The SERVER decides this, not the client:
   * whether onboarding is complete is server state, and a client that guesses
   * will eventually guess wrong.
   */
  readonly next: 'feed' | 'onboarding';
}

/**
 * Authentication contract.
 *
 * Note what is absent: no token is returned. Per the spec's security posture,
 * long-lived access tokens never touch `localStorage`. Phase 3 implements this
 * against a BFF that sets an httpOnly session cookie, so the browser holds the
 * credential and JavaScript cannot read it. Keeping tokens out of this
 * interface now means no calling code can grow a dependency on having one.
 */
export interface AuthRepository {
  signIn(request: SignInRequest): Observable<AuthResult>;

  signUp(request: SignUpRequest): Observable<AuthResult>;

  /**
   * Always succeeds from the caller's point of view.
   *
   * Returning "no such account" would turn this endpoint into an account
   * enumeration oracle, so the UI says "if that address is registered, we sent
   * a link" regardless.
   */
  requestPasswordReset(email: string): Observable<void>;

  resetPassword(token: string, password: string): Observable<void>;

  /** Debounced availability check for the sign-up and onboarding forms. */
  isUsernameAvailable(username: string): Observable<boolean>;

  signOut(): Observable<void>;
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AUTH_REPOSITORY');
