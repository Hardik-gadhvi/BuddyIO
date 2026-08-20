import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * BuddyIO validators.
 *
 * Each returns an error key that `validation-messages.ts` knows how to phrase,
 * so no component ever has to write its own copy of a message.
 */

/** Assumption A-05: 3-30 chars, lowercase letters, digits, dots, underscores. */
export function usernameFormat(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '');
    if (!value) {
      return null; // `required` owns emptiness.
    }
    return /^[a-z0-9._]{3,30}$/.test(value) ? null : { usernameFormat: true };
  };
}

/**
 * Deliberately NOT a character-class checklist.
 *
 * "One uppercase, one number, one symbol" rules push people towards
 * `Password1!` and are actively discouraged by NIST SP 800-63B. Length is what
 * matters, so this only asks for a little variety once the password is short.
 */
export function passwordStrength(minLength = 8): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '');
    if (!value) {
      return null;
    }
    if (value.length >= 12) {
      return null; // Long is strong enough on its own.
    }
    if (value.length < minLength) {
      return null; // `minlength` owns this, and says it better.
    }
    const hasVariety = /[0-9]/.test(value) || /[^A-Za-z0-9]/.test(value);
    return hasVariety ? null : { passwordStrength: true };
  };
}

/**
 * Cross-field match, applied to the GROUP.
 *
 * The error is also written onto the confirm control so the message renders
 * next to the field the user must actually fix, not at the top of the form.
 */
export function fieldsMatch(sourceName: string, confirmName: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const source = group.get(sourceName);
    const confirm = group.get(confirmName);
    if (!source || !confirm || !confirm.value) {
      return null;
    }

    if (source.value === confirm.value) {
      // Clear only OUR error; never stomp another validator's.
      if (confirm.hasError('passwordMismatch')) {
        const { passwordMismatch, ...rest } = confirm.errors ?? {};
        void passwordMismatch;
        confirm.setErrors(Object.keys(rest).length ? rest : null);
      }
      return null;
    }

    confirm.setErrors({ ...(confirm.errors ?? {}), passwordMismatch: true });
    return { passwordMismatch: true };
  };
}

/** For chip pickers: "choose at least N". */
export function minSelection(required: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    const count = Array.isArray(value) ? value.length : 0;
    return count >= required ? null : { minSelection: { required, actual: count } };
  };
}

/** A checkbox that must be ticked (terms, age confirmation). */
export function mustAccept(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    control.value === true ? null : { mustAccept: true };
}

/** Assumption Q-03: self-declared 13+ gate. */
export function minAge(years: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }
    const born = new Date(String(value));
    if (Number.isNaN(born.getTime())) {
      return null;
    }
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - years);
    return born <= cutoff ? null : { minAge: { required: years } };
  };
}
