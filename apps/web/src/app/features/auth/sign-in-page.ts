import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { toAppError } from '@core/mock/mock-transport';
import type { AppError } from '@core/models';
import { BioField, BioInput } from '@shared/forms/field';
import { FormError } from '@shared/forms/form-error';
import { BioButton } from '@shared/ui/button/button';
import { AUTH_REPOSITORY } from './data-access/auth.repository';
import { AuthCard } from './ui/auth-card';

/**
 * Sign in.
 *
 * Notes that matter more than the layout:
 *  - `autocomplete` tokens are set so password managers work (SC 1.3.5), and
 *    paste is never blocked (SC 3.3.8).
 *  - The failure message is identical for a wrong email and a wrong password.
 *    Distinguishing them tells an attacker which addresses are registered.
 *  - The form-level error is `role="alert"` and focus moves to it, so a
 *    keyboard or screen-reader user is not left wondering why nothing happened.
 */
@Component({
  selector: 'bio-sign-in-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuthCard, BioButton, BioField, BioInput, FormError, ReactiveFormsModule, RouterLink],
  template: `
    <bio-auth-card title="Welcome back" subtitle="Sign in to pick up where you left off.">
      <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <bio-form-error [error]="error()" />

        <bio-field label="Email" [submitted]="submitted()">
          <input
            bioInput
            type="email"
            formControlName="email"
            autocomplete="email"
            inputmode="email"
            placeholder="you@example.com"
          />
        </bio-field>

        <bio-field label="Password" [submitted]="submitted()">
          <input
            bioInput
            [type]="showPassword() ? 'text' : 'password'"
            formControlName="password"
            autocomplete="current-password"
          />
        </bio-field>

        <div class="form__row">
          <label class="form__checkbox">
            <input type="checkbox" formControlName="rememberMe" />
            Keep me signed in
          </label>

          <button type="button" class="form__toggle" (click)="togglePassword()">
            {{ showPassword() ? 'Hide' : 'Show' }} password
          </button>
        </div>

        <button bioButton variant="primary" size="lg" [fullWidth]="true" [loading]="busy()">
          Sign in
        </button>

        <a class="form__link" routerLink="/forgot-password">Forgot your password?</a>
      </form>

      <span authAside>
        New to BuddyIO? <a routerLink="/sign-up">Create an account</a>
      </span>
    </bio-auth-card>
  `,
  styles: `
    .form {
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-4);
    }

    .form__row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--bio-space-3);
    }

    .form__checkbox {
      display: inline-flex;
      align-items: center;
      gap: var(--bio-space-2);
      font-size: var(--bio-font-size-body-sm);
      color: var(--bio-text-secondary);
      cursor: pointer;
    }

    .form__checkbox input {
      width: 18px;
      height: 18px;
      accent-color: var(--bio-action-primary-bg);
    }

    .form__toggle {
      padding: 0;
      border: none;
      background: none;
      color: var(--bio-text-link);
      font-size: var(--bio-font-size-body-sm);
      cursor: pointer;
      border-radius: var(--bio-radius-xs);

      &:focus-visible {
        outline: var(--bio-focus-ring-width) solid var(--bio-focus-ring);
        outline-offset: var(--bio-focus-ring-offset);
      }
    }

    .form__link {
      align-self: center;
      font-size: var(--bio-font-size-body-sm);
    }
  `,
})
export class SignInPage {
  private readonly fb = inject(FormBuilder);
  private readonly repository = inject(AUTH_REPOSITORY);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [true],
  });

  protected readonly busy = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal<AppError | null>(null);
  protected readonly showPassword = signal(false);

  protected togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  protected submit(): void {
    this.submitted.set(true);
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.repository
      .signIn(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.busy.set(false);
          void this.router.navigate([result.next === 'onboarding' ? '/onboarding' : '/feed']);
        },
        error: (cause: unknown) => {
          this.busy.set(false);
          this.error.set(toAppError(cause));
        },
      });
  }
}
