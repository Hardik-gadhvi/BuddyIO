import type { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * One place that turns a validator key into something a human can act on.
 *
 * Two rules, both from docs/05:
 *  - The message says what to DO, not what is wrong. "Use at least 8 characters"
 *    beats "minlength". A user who is told a rule can satisfy it; a user who is
 *    told a constraint name cannot.
 *  - Messages never leak server internals or enumerate accounts.
 *
 * Field-specific overrides go in the component that owns the field; this is the
 * fallback so no control can ever render a raw error key.
 */
export type ValidationMessageMap = Readonly<Record<string, (error: never) => string>>;

const MESSAGES: Record<string, (error: never) => string> = {
  required: () => 'This field is required.',
  email: () => 'Enter a valid email address, like name@example.com.',
  minlength: (error: never) => {
    const { requiredLength } = error as unknown as { requiredLength: number };
    return `Use at least ${requiredLength} characters.`;
  },
  maxlength: (error: never) => {
    const { requiredLength } = error as unknown as { requiredLength: number };
    return `Use ${requiredLength} characters or fewer.`;
  },
  pattern: () => 'That format is not quite right.',
  min: (error: never) => {
    const { min } = error as unknown as { min: number };
    return `Enter ${min} or more.`;
  },
  max: (error: never) => {
    const { max } = error as unknown as { max: number };
    return `Enter ${max} or less.`;
  },

  // -- BuddyIO validators --
  usernameFormat: () => 'Use letters, numbers, dots and underscores only.',
  usernameTaken: () => 'That username is already taken.',
  passwordStrength: () => 'Mix in a number or a symbol to make this harder to guess.',
  passwordMismatch: () => 'These passwords do not match.',
  mustAccept: () => 'You need to accept this to continue.',
  minAge: () => 'You need to be at least 13 to use BuddyIO.',
  minSelection: (error: never) => {
    const { required } = error as unknown as { required: number };
    return `Choose at least ${required}.`;
  },
};

/**
 * The first error worth showing.
 *
 * Only ONE message is rendered at a time, deliberately: a field that lists four
 * simultaneous problems is a field the user gives up on. They fix one, and the
 * next one surfaces.
 */
export function firstErrorMessage(
  errors: ValidationErrors | null,
  overrides?: Record<string, string>,
): string | null {
  if (!errors) {
    return null;
  }

  for (const key of Object.keys(errors)) {
    const override = overrides?.[key];
    if (override) {
      return override;
    }
    const builder = MESSAGES[key];
    if (builder) {
      return builder(errors[key] as never);
    }
  }

  // A validator with no message is a bug, but the user must never see a raw key.
  return 'Please check this value.';
}

/**
 * Whether a control should be showing its error yet.
 *
 * `touched || submitted` matters: shouting "required" at someone who has not
 * typed in the field yet is hostile. Errors appear when they leave the field,
 * or when they try to submit.
 */
export function shouldShowError(control: AbstractControl | null, submitted = false): boolean {
  if (!control) {
    return false;
  }
  return control.invalid && (control.touched || submitted);
}
