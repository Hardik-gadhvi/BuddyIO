import { ChangeDetectionStrategy, Component, forwardRef, input, model } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

/**
 * A settings toggle.
 *
 * This one IS a ControlValueAccessor, unlike the text inputs: there is no
 * native element with `role="switch"` semantics, so the control has to be
 * built. It wraps a real `<button role="switch">` rather than a checkbox,
 * because a switch takes effect immediately while a checkbox implies a
 * pending save.
 */
@Component({
  selector: 'bio-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BioSwitch),
      multi: true,
    },
  ],
  template: `
    <button
      type="button"
      role="switch"
      class="bio-switch__track"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="label()"
      [attr.aria-describedby]="describedBy()"
      [disabled]="disabled()"
      (click)="toggle()"
    >
      <span class="bio-switch__thumb"></span>
    </button>
  `,
  host: {
    class: 'bio-switch',
  },
  styles: `
    .bio-switch {
      display: inline-flex;
      flex: none;
    }

    .bio-switch__track {
      position: relative;
      display: inline-flex;
      align-items: center;
      width: 44px;
      height: 26px;
      padding: 3px;
      border: none;
      border-radius: var(--bio-radius-pill);
      background: var(--bio-border-strong);
      cursor: pointer;
      transition: background-color var(--bio-duration-base) var(--bio-ease-standard);

      &:focus-visible {
        outline: var(--bio-focus-ring-width) solid var(--bio-focus-ring);
        outline-offset: var(--bio-focus-ring-offset);
      }

      &[aria-checked='true'] {
        background: var(--bio-action-primary-bg);
      }

      &:disabled {
        background: var(--bio-action-disabled-bg);
        cursor: not-allowed;
      }
    }

    .bio-switch__thumb {
      width: 20px;
      height: 20px;
      border-radius: var(--bio-radius-circle);
      background: var(--bio-neutral-0);
      box-shadow: var(--bio-elevation-1);
      transition: translate var(--bio-duration-base) var(--bio-ease-standard);
    }

    .bio-switch__track[aria-checked='true'] .bio-switch__thumb {
      translate: 18px 0;
    }

    /* In forced-colours mode the track colour is overridden, so the thumb
       position is the only remaining signal - keep it moving. */
    @media (forced-colors: active) {
      .bio-switch__track {
        border: 1px solid ButtonBorder;
      }
    }
  `,
})
export class BioSwitch implements ControlValueAccessor {
  readonly checked = model(false);
  readonly disabled = model(false);
  readonly label = input<string | null>(null);
  readonly describedBy = input<string | null>(null);

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }
    const next = !this.checked();
    this.checked.set(next);
    this.onChange(next);
    this.onTouched();
  }

  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
