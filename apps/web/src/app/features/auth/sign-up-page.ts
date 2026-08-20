import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type AsyncValidatorFn,
  type ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, first, map, of, switchMap, timer, type Observable } from 'rxjs';
import { toAppError } from '@core/mock/mock-transport';
import type { AppError } from '@core/models';
import { BioField, BioInput } from '@shared/forms/field';
import { FormError } from '@shared/forms/form-error';
import { minAge, mustAccept, passwordStrength, usernameFormat } from '@shared/forms/validators';
import { BioButton } from '@shared/ui/button/button';
import { Icon } from '@shared/ui/icon/icon';
import { AUTH_REPOSITORY } from './data-access/auth.repository';
import { AuthCard } from './ui/auth-card';

/**
 * Create an account.
 *
 * The interesting part is the username field: availability is an ASYNC
 * validator with a 350ms debounce built in, so it does not fire a request per
 * keystroke, and it fails OPEN - a network error resolves to "no error" rather
 * than blocking signup on an infrastructure problem the user cannot fix. The
 * server checks again on submit regardless, which is the check that counts.
 */
@Component({
  selector: 'bio-sign-up-page',
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
    <bio-auth-card
      title="Create your account"
      subtitle="A few details and you are in. You can change all of this later."
    >
      <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <bio-form-error [error]="error()" />

        <bio-field label="Display name" [submitted]="submitted()">
          <input bioInput type="text" formControlName="displayName" autocomplete="name" />
        </bio-field>

        <bio-field
          label="Username"
          [hint]="usernameHint()"
          [submitted]="submitted()"
          [errors]="{ usernameTaken: 'That username is taken. Try another.' }"
        >
          <input
            bioInput
            type="text"
            formControlName="username"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
          />
        </bio-field>

        @if (usernameState() === 'available') {
          <p class="form__ok">
            <bio-icon name="check" [size]="16" />
            {{ '@' + form.controls.username.value }} is available
          </p>
        }

        <bio-field label="Email" [submitted]="submitted()">
          <input
            bioInput
            type="email"
            formControlName="email"
            autocomplete="email"
            inputmode="email"
          />
        </bio-field>

        <bio-field
          label="Password"
          hint="At least 8 characters. Longer beats complicated."
          [submitted]="submitted()"
        >
          <input
            bioInput
            [type]="showPassword() ? 'text' : 'password'"
            formControlName="password"
            autocomplete="new-password"
          />
        </bio-field>

        <button type="button" class="form__toggle" (click)="togglePassword()">
          {{ showPassword() ? 'Hide' : 'Show' }} password
        </button>

        <bio-field
          label="Date of birth"
          hint="BuddyIO is for people aged 13 and over. We do not show this on your profile."
          [submitted]="submitted()"
        >
          <input bioInput type="date" formControlName="dateOfBirth" autocomplete="bday" />
        </bio-field>

        <!--
          Not a bio-field: that component wires a projected [bioInput], and a
          checkbox carries its own inline label. Wrapping it would produce two
          labels and an error that never renders.
        -->
        <div class="form__terms">
          <label class="form__checkbox">
            <input
              type="checkbox"
              formControlName="acceptTerms"
              [attr.aria-invalid]="termsError() ? 'true' : null"
              [attr.aria-describedby]="termsError() ? 'terms-error' : null"
            />
            <span>
              I agree to the <a routerLink="/legal/terms">Terms</a> and
              <a routerLink="/legal/privacy">Privacy Policy</a>.
            </span>
          </label>

          @if (termsError()) {
            <p class="form__field-error" id="terms-error" role="alert">
              <bio-icon name="alert-circle" [size]="16" />
              You need to accept this to continue.
            </p>
          }
        </div>

        <button bioButton variant="primary" size="lg" [fullWidth]="true" [loading]="busy()">
          Create account
        </button>
      </form>

      <span authAside> Already have an account? <a routerLink="/sign-in">Sign in</a> </span>
    </bio-auth-card>
  `,
  styles: `
    .form {
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-4);
    }

    .form__ok {
      display: flex;
      align-items: center;
      gap: var(--bio-space-1);
      margin-block-start: calc(var(--bio-space-4) * -1 + var(--bio-space-1));
      font-size: var(--bio-font-size-caption);
      color: var(--bio-success-fg);
    }

    .form__toggle {
      align-self: flex-start;
      margin-block-start: calc(var(--bio-space-4) * -1 + var(--bio-space-1));
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

    .form__checkbox {
      display: flex;
      align-items: flex-start;
      gap: var(--bio-space-2);
      font-size: var(--bio-font-size-body-sm);
      color: var(--bio-text-secondary);
      cursor: pointer;
      text-wrap: pretty;
    }

    .form__terms {
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-2);
    }

    .form__field-error {
      display: flex;
      align-items: center;
      gap: var(--bio-space-1);
      font-size: var(--bio-font-size-caption);
      color: var(--bio-danger-fg);
    }

    .form__checkbox input {
      flex: none;
      width: 18px;
      height: 18px;
      margin-block-start: 2px;
      accent-color: var(--bio-action-primary-bg);
    }
  `,
})
export class SignUpPage {
  private readonly fb = inject(FormBuilder);
  private readonly repository = inject(AUTH_REPOSITORY);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(50)]],
    username: [
      '',
      [Validators.required, usernameFormat()],
      [this.usernameAvailable()],
    ],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(8), passwordStrength()],
    ],
    dateOfBirth: ['', [Validators.required, minAge(13)]],
    acceptTerms: [false, [mustAccept()]],
  });

  protected readonly busy = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal<AppError | null>(null);
  protected readonly showPassword = signal(false);

  /** Drives the "checking / available" affordance under the username field. */
  private readonly usernameStatus = toSignal(this.form.controls.username.statusChanges, {
    initialValue: this.form.controls.username.status,
  });

  protected readonly usernameState = computed<'idle' | 'checking' | 'available' | 'taken'>(() => {
    const status = this.usernameStatus();
    const control = this.form.controls.username;
    if (status === 'PENDING') {
      return 'checking';
    }
    if (control.hasError('usernameTaken')) {
      return 'taken';
    }
    if (status === 'VALID' && control.value) {
      return 'available';
    }
    return 'idle';
  });

  private readonly termsStatus = toSignal(this.form.controls.acceptTerms.statusChanges, {
    initialValue: this.form.controls.acceptTerms.status,
  });

  /** Only surfaces after a submit attempt - see shouldShowError's rationale. */
  protected readonly termsError = computed(
    () => this.submitted() && this.termsStatus() === 'INVALID',
  );

  protected readonly usernameHint = computed(() =>
    this.usernameState() === 'checking'
      ? 'Checking availability...'
      : '3 to 30 characters. Letters, numbers, dots and underscores.',
  );

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

    const { displayName, username, email, password, dateOfBirth } = this.form.getRawValue();

    this.busy.set(true);
    this.repository
      .signUp({ displayName, username, email, password, dateOfBirth })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          void this.router.navigate(['/onboarding']);
        },
        error: (cause: unknown) => {
          this.busy.set(false);
          this.error.set(toAppError(cause));
        },
      });
  }

  /**
   * Debounce lives INSIDE the validator, so Angular restarts it on every
   * keystroke and only the last one survives to make a request.
   */
  private usernameAvailable(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> =>
      timer(350).pipe(
        switchMap(() => this.repository.isUsernameAvailable(String(control.value ?? ''))),
        map((available) => (available ? null : { usernameTaken: true })),
        // Fails open: a network problem must not block account creation. The
        // server re-checks on submit, and that is the authoritative check.
        catchError(() => of(null)),
        first(),
      );
  }
}
