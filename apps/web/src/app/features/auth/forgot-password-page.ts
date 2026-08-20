import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toAppError } from '@core/mock/mock-transport';
import type { AppError } from '@core/models';
import { BioField, BioInput } from '@shared/forms/field';
import { FormError } from '@shared/forms/form-error';
import { BioButton } from '@shared/ui/button/button';
import { Icon } from '@shared/ui/icon/icon';
import { AUTH_REPOSITORY } from './data-access/auth.repository';
import { AuthCard } from './ui/auth-card';

/**
 * Request a password reset link.
 *
 * The success state is shown whether or not the address is registered, and the
 * copy is written to be true either way ("if that address has an account").
 * A form that says "no account found" is a free account-enumeration oracle:
 * anyone can test an email list against it.
 *
 * The resend control has a cooldown so the same reasoning cannot be defeated by
 * hammering the endpoint.
 */
@Component({
  selector: 'bio-forgot-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AuthCard,
    BioButton,
    BioField,
    BioInput,
    FormError,
    Icon,
    ReactiveFormsModule,
    RouterLink,
  ],
  template: `
    @if (sent()) {
      <bio-auth-card title="Check your inbox">
        <div class="done">
          <p class="done__icon"><bio-icon name="check" [size]="32" /></p>
          <p class="done__body">
            If <strong>{{ form.controls.email.value }}</strong> has a BuddyIO account, we have
            sent a link to reset the password. It expires in 30 minutes.
          </p>
          <p class="done__hint">
            Nothing yet? Check your spam folder before requesting another link.
          </p>

          <button
            bioButton
            variant="neutral"
            size="md"
            [disabled]="cooldown() > 0"
            [loading]="busy()"
            (click)="submit()"
          >
            {{ cooldown() > 0 ? 'Resend in ' + cooldown() + 's' : 'Send another link' }}
          </button>
        </div>

        <span authAside><a routerLink="/sign-in">Back to sign in</a></span>
      </bio-auth-card>
    } @else {
      <bio-auth-card
        title="Reset your password"
        subtitle="Enter the email you signed up with and we will send you a link."
      >
        <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <bio-form-error [error]="error()" />

          <bio-field label="Email" [submitted]="submitted()">
            <input
              bioInput
              type="email"
              formControlName="email"
              autocomplete="email"
              inputmode="email"
            />
          </bio-field>

          <button bioButton variant="primary" size="lg" [fullWidth]="true" [loading]="busy()">
            Send reset link
          </button>
        </form>

        <span authAside>
          Remembered it? <a routerLink="/sign-in">Back to sign in</a>
        </span>
      </bio-auth-card>
    }
  `,
  styles: `
    .form {
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-4);
    }

    .done {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--bio-space-3);
    }

    .done__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: var(--bio-radius-circle);
      background: var(--bio-success-bg);
      color: var(--bio-success-fg);
    }

    .done__body {
      font-size: var(--bio-font-size-body);
      line-height: var(--bio-line-height-body);
      color: var(--bio-text-secondary);
      overflow-wrap: anywhere;
      text-wrap: pretty;
    }

    .done__hint {
      font-size: var(--bio-font-size-body-sm);
      color: var(--bio-text-muted);
    }
  `,
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly repository = inject(AUTH_REPOSITORY);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly busy = signal(false);
  protected readonly submitted = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<AppError | null>(null);
  protected readonly cooldown = signal(0);

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.stopCooldown());
  }

  protected submit(): void {
    this.submitted.set(true);
    this.error.set(null);

    if (this.form.invalid || this.cooldown() > 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.repository
      .requestPasswordReset(this.form.controls.email.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.sent.set(true);
          this.startCooldown(30);
        },
        error: (cause: unknown) => {
          this.busy.set(false);
          this.error.set(toAppError(cause));
        },
      });
  }

  private startCooldown(seconds: number): void {
    this.stopCooldown();
    this.cooldown.set(seconds);
    this.cooldownTimer = setInterval(() => {
      this.cooldown.update((value) => Math.max(0, value - 1));
      if (this.cooldown() === 0) {
        this.stopCooldown();
      }
    }, 1000);
  }

  private stopCooldown(): void {
    if (this.cooldownTimer !== null) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }
}
