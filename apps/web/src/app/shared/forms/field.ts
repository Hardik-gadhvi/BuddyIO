import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  computed,
  contentChild,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { Icon } from '@shared/ui/icon/icon';
import { firstErrorMessage, shouldShowError } from './validation-messages';

let nextFieldId = 0;

/**
 * Styling + identity for a native form control.
 *
 * Applied to a real `<input>`, `<textarea>` or `<select>`, exactly like
 * `[bioButton]` and for the same reason: the native element already handles
 * form association, validation plumbing, mobile keyboards, autofill and
 * accessibility. We only add appearance and an id.
 */
@Directive({
  selector: 'input[bioInput], textarea[bioInput], select[bioInput]',
  host: {
    class: 'bio-input',
    '[id]': 'id()',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class BioInput {
  /** The owning BioField sets these; they are not part of the public API. */
  readonly id = signal(`bio-input-${nextFieldId++}`);
  readonly invalid = signal(false);
  readonly describedBy = signal<string | null>(null);

  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Optional: present when the control participates in a form. */
  readonly ngControl = inject(NgControl, { optional: true, self: true });

  focus(): void {
    this.element.focus();
  }
}

/**
 * Label + control + hint + error, wired together correctly.
 *
 * The control is PROJECTED rather than rendered by this component, so reactive
 * forms bind straight to the native element and there is no
 * ControlValueAccessor indirection to debug.
 *
 * What this guarantees, every time:
 *  - a persistent visible <label>, never a placeholder standing in for one
 *  - `for`/`id` association, so clicking the label focuses the control
 *  - `aria-describedby` pointing at the hint AND the error
 *  - `aria-invalid` while the error is showing
 *  - the error replaces the hint rather than stacking, so the box never grows
 */
@Component({
  selector: 'bio-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <label class="bio-field__label" [attr.for]="controlId()">
      {{ label() }}
      @if (optional()) {
        <span class="bio-field__optional">Optional</span>
      }
    </label>

    <div class="bio-field__control">
      <ng-content />
    </div>

    @if (errorText(); as error) {
      <p class="bio-field__error" [id]="errorId()">
        <bio-icon name="alert-circle" [size]="16" />
        {{ error }}
      </p>
    } @else if (hint(); as hintText) {
      <p class="bio-field__hint" [id]="hintId()">{{ hintText }}</p>
    }
  `,
  host: {
    class: 'bio-field',
    '[class.bio-field--invalid]': '!!errorText()',
  },
  styles: `
    .bio-field {
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-2);
      min-width: 0;
    }

    .bio-field__label {
      display: flex;
      align-items: baseline;
      gap: var(--bio-space-2);
      font-size: var(--bio-font-size-body-sm);
      font-weight: var(--bio-weight-semibold);
      color: var(--bio-text-primary);
    }

    .bio-field__optional {
      font-size: var(--bio-font-size-caption);
      font-weight: var(--bio-weight-regular);
      color: var(--bio-text-muted);
    }

    .bio-field__control {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .bio-field__hint,
    .bio-field__error {
      display: flex;
      align-items: flex-start;
      gap: var(--bio-space-1);
      font-size: var(--bio-font-size-caption);
      line-height: var(--bio-line-height-caption);
      text-wrap: pretty;
    }

    .bio-field__hint {
      color: var(--bio-text-muted);
    }

    /* Error carries an icon as well as colour - colour alone is not a signal. */
    .bio-field__error {
      color: var(--bio-danger-fg);
    }

    .bio-field__error bio-icon {
      flex: none;
      margin-block-start: 1px;
    }
  `,
})
export class BioField {
  readonly label = input.required<string>();
  readonly hint = input<string | null>(null);
  readonly optional = input(false);
  /** Per-field message overrides, keyed by validator name. */
  readonly errors = input<Record<string, string> | undefined>(undefined);
  /** Set by the owning form on submit, so untouched invalid fields light up. */
  readonly submitted = input(false);

  /** The projected control. Queried rather than rendered - see class comment. */
  private readonly control = contentChild(BioInput);

  protected readonly controlId = computed(() => this.control()?.id() ?? null);
  protected readonly hintId = computed(() => `${this.controlId() ?? 'bio-field'}-hint`);
  protected readonly errorId = computed(() => `${this.controlId() ?? 'bio-field'}-error`);

  protected readonly errorText = computed(() => {
    const ngControl = this.control()?.ngControl;
    if (!ngControl?.control) {
      return null;
    }
    if (!shouldShowError(ngControl.control, this.submitted())) {
      return null;
    }
    return firstErrorMessage(ngControl.control.errors, this.errors());
  });

  constructor() {
    // Pushes the field's a11y wiring down onto the projected native control.
    // The control owns the attributes (it is the element screen readers read);
    // the field owns the state that decides them.
    effect(() => {
      const control = this.control();
      if (!control) {
        return;
      }
      const error = this.errorText();
      control.invalid.set(!!error);
      control.describedBy.set(error ? this.errorId() : this.hint() ? this.hintId() : null);
    });
  }
}
