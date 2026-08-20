import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  viewChild,
} from '@angular/core';
import type { AppError } from '@core/models';
import { Icon } from '@shared/ui/icon/icon';

/**
 * A form-level failure banner that takes focus when it appears.
 *
 * The focus move is the whole point. A submit that fails and only renders a
 * message somewhere above the button leaves a keyboard or screen-reader user
 * with no signal that anything happened at all - they pressed Enter and,
 * as far as they can tell, nothing changed.
 *
 * `role="alert"` announces it; `tabindex="-1"` plus the focus call puts the
 * user's cursor on it so the next Tab continues from the error, not from the
 * top of the document.
 */
@Component({
  selector: 'bio-form-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    @if (error(); as failure) {
      <p class="form-error" role="alert" tabindex="-1" #banner>
        <bio-icon name="alert-circle" [size]="20" />
        <span>{{ failure.message }}</span>
      </p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .form-error {
      display: flex;
      align-items: flex-start;
      gap: var(--bio-space-2);
      padding: var(--bio-space-3);
      border: 1px solid var(--bio-danger-border);
      border-radius: var(--bio-radius-md);
      background: var(--bio-danger-bg);
      color: var(--bio-danger-fg);
      font-size: var(--bio-font-size-body-sm);
      line-height: var(--bio-line-height-body-sm);
      text-wrap: pretty;
    }

    .form-error bio-icon {
      flex: none;
      margin-block-start: 1px;
    }

    .form-error:focus-visible {
      outline: var(--bio-focus-ring-width) solid var(--bio-focus-ring);
      outline-offset: var(--bio-focus-ring-offset);
    }
  `,
})
export class FormError {
  readonly error = input<AppError | null>(null);

  private readonly banner = viewChild<ElementRef<HTMLElement>>('banner');

  constructor() {
    effect(() => {
      if (!this.error()) {
        return;
      }
      // Deferred: the @if block has not rendered the element yet at the moment
      // the signal changes.
      queueMicrotask(() => this.banner()?.nativeElement.focus());
    });
  }
}
