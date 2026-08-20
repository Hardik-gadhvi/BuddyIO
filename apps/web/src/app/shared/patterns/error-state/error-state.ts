import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { AppError } from '@core/models';
import { BioButton } from '@shared/ui/button/button';
import { Icon } from '@shared/ui/icon/icon';

/**
 * The "it broke" state.
 *
 * Three rules, all from docs/03:
 *  - Say what happened in human language. Never surface a status code or stack.
 *  - Offer a way forward. `retryable` errors get a Retry button; others do not
 *    get a button that will obviously fail again.
 *  - Show the correlation id, quietly. It is the only thing that makes a user's
 *    bug report traceable to a server trace, and it costs one line of muted text.
 *
 * `role="alert"` because an error replacing content is not something the user
 * should have to discover by re-reading the page.
 */
@Component({
  selector: 'bio-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BioButton, Icon],
  template: `
    <bio-icon name="alert-circle" [size]="32" />
    <p class="bio-error-state__title">{{ title() }}</p>
    <p class="bio-error-state__body">{{ error().message }}</p>

    @if (error().retryable) {
      <button bioButton variant="neutral" size="md" (click)="retry.emit()">
        <bio-icon name="refresh" [size]="16" />
        Try again
      </button>
    }

    <p class="bio-error-state__ref">
      Reference
      <code>{{ error().correlationId }}</code>
    </p>
  `,
  host: {
    class: 'bio-error-state',
    role: 'alert',
  },
  styles: `
    .bio-error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--bio-space-3);
      padding: var(--bio-space-10) var(--bio-space-6);
      text-align: center;
      color: var(--bio-text-secondary);
    }

    bio-icon {
      color: var(--bio-danger-fg);
    }

    .bio-error-state__title {
      font-size: var(--bio-font-size-h4);
      line-height: var(--bio-line-height-h4);
      font-weight: var(--bio-weight-semibold);
      color: var(--bio-text-primary);
    }

    .bio-error-state__body {
      max-width: 46ch;
      font-size: var(--bio-font-size-body-sm);
      line-height: var(--bio-line-height-body-sm);
      text-wrap: pretty;
    }

    .bio-error-state__ref {
      margin-block-start: var(--bio-space-2);
      font-size: var(--bio-font-size-caption);
      color: var(--bio-text-muted);
    }

    code {
      font-family: var(--bio-font-mono);
      user-select: all;
    }
  `,
})
export class ErrorState {
  readonly error = input.required<AppError>();
  readonly title = input('That did not load');
  readonly retry = output<void>();
}
