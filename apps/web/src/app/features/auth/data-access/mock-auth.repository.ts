import { Injectable, inject } from '@angular/core';
import { type Observable, throwError } from 'rxjs';
import { CURRENT_USER, USERS } from '@core/mock/fixtures/users.fixture';
import { MockTransport } from '@core/mock/mock-transport';
import type { AppError } from '@core/models';
import type {
  AuthRepository,
  AuthResult,
  SignInRequest,
  SignUpRequest,
} from './auth.repository';

/** Any password works except this one, which exercises the failure path. */
const WRONG_PASSWORD = 'wrongpassword';

/** Signing in as this address routes into the onboarding wizard. */
const NEW_USER_EMAIL = 'new@buddyio.test';

@Injectable({ providedIn: 'root' })
export class MockAuthRepository implements AuthRepository {
  private readonly transport = inject(MockTransport);

  private readonly takenUsernames = new Set(USERS.map((user) => user.username));

  signIn(request: SignInRequest): Observable<AuthResult> {
    if (request.password === WRONG_PASSWORD) {
      // One message for both wrong-email and wrong-password, deliberately:
      // distinguishing them tells an attacker which addresses are registered.
      return throwError(
        (): AppError => ({
          code: 'forbidden',
          message: 'That email or password is not right. Please try again.',
          correlationId: `auth-${Math.random().toString(36).slice(2, 10)}`,
          retryable: false,
        }),
      );
    }

    return this.transport.respond<AuthResult>(() => ({
      user: CURRENT_USER,
      next: request.email === NEW_USER_EMAIL ? 'onboarding' : 'feed',
    }));
  }

  signUp(request: SignUpRequest): Observable<AuthResult> {
    if (this.takenUsernames.has(request.username)) {
      return throwError(
        (): AppError => ({
          code: 'validation_failed',
          message: 'That username is already taken.',
          correlationId: `auth-${Math.random().toString(36).slice(2, 10)}`,
          retryable: false,
        }),
      );
    }

    return this.transport.respond<AuthResult>(() => {
      this.takenUsernames.add(request.username);
      return {
        user: { ...CURRENT_USER, username: request.username, displayName: request.displayName },
        // A brand-new account always lands in onboarding.
        next: 'onboarding',
      };
    });
  }

  requestPasswordReset(): Observable<void> {
    // Never reveals whether the address exists - see the interface comment.
    return this.transport.respond<void>(() => undefined);
  }

  resetPassword(): Observable<void> {
    return this.transport.respond<void>(() => undefined);
  }

  isUsernameAvailable(username: string): Observable<boolean> {
    return this.transport.respond(() => !this.takenUsernames.has(username.toLowerCase()), {
      // Snappier than the default: this fires while the user is still typing.
      latencyMs: 320,
    });
  }

  signOut(): Observable<void> {
    return this.transport.respond<void>(() => undefined);
  }
}
