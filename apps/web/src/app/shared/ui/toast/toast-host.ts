import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { BioButton } from '../button/button';
import { IconButton } from '../icon-button/icon-button';
import { ToastService, type Toast } from './toast.service';

/** One toast row. A component rather than an <ng-template>, so it stays typed. */
@Component({
  selector: 'bio-toast-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BioButton, IconButton],
  template: `
    <p class="bio-toast__message">{{ toast().message }}</p>
    @if (toast().action; as action) {
      <button bioButton variant="ghost" size="sm" class="bio-toast__action" (click)="run()">
        {{ action.label }}
      </button>
    }
    <bio-icon-button
      icon="x"
      label="Dismiss message"
      [boxSize]="32"
      [iconSize]="16"
      (action)="dismiss()"
    />
  `,
  host: {
    '[class]': '"bio-toast bio-toast--" + toast().tone',
  },
  styles: `
    .bio-toast {
      display: flex;
      align-items: center;
      gap: var(--bio-space-2);
      padding: var(--bio-space-3);
      padding-inline-start: var(--bio-space-4);
      border: 1px solid var(--bio-border-subtle);
      border-radius: var(--bio-radius-lg);
      background: var(--bio-surface-raised);
      box-shadow: var(--bio-elevation-4);
      pointer-events: auto;
      animation: bio-toast-in var(--bio-duration-slow) var(--bio-ease-decelerate);
    }

    .bio-toast--success {
      border-color: var(--bio-success-border);
    }

    .bio-toast--danger {
      border-color: var(--bio-danger-border);
    }

    .bio-toast__message {
      flex: 1;
      min-width: 0;
      font-size: var(--bio-font-size-body-sm);
      line-height: var(--bio-line-height-body-sm);
      color: var(--bio-text-primary);
      overflow-wrap: anywhere;
    }

    .bio-toast__action {
      flex: none;
      color: var(--bio-text-link);
    }

    @keyframes bio-toast-in {
      from {
        opacity: 0;
        translate: 0 8px;
      }
    }
  `,
})
export class ToastItem {
  private readonly toasts = inject(ToastService);

  readonly toast = input.required<Toast>();

  protected run(): void {
    const current = this.toast();
    current.action?.run();
    this.toasts.dismiss(current.id);
  }

  protected dismiss(): void {
    this.toasts.dismiss(this.toast().id);
  }
}

/**
 * Renders the toast stack. Mounted once, in the app shell.
 *
 * Two live regions, not one: routine confirmations are `polite` so they wait
 * for a pause in speech, while failures are `assertive` because a user who just
 * lost a mutation needs to know now. Politeness is a property of the REGION, so
 * it cannot be varied per message inside a single container.
 */
@Component({
  selector: 'bio-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToastItem],
  template: `
    <div class="bio-toast-region" aria-live="polite" aria-atomic="false">
      @for (toast of toasts.politeToasts(); track toast.id) {
        <bio-toast-item [toast]="toast" />
      }
    </div>

    <div class="bio-toast-region" aria-live="assertive" aria-atomic="false">
      @for (toast of toasts.assertiveToasts(); track toast.id) {
        <bio-toast-item [toast]="toast" />
      }
    </div>
  `,
  styles: `
    :host {
      display: contents;
    }

    .bio-toast-region {
      position: fixed;
      inset-block-end: calc(var(--bio-layout-bottomnav-h) + var(--bio-space-3));
      inset-inline: var(--bio-space-3);
      z-index: var(--bio-z-toast);
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-2);
      /* The region spans the viewport but must not swallow clicks. */
      pointer-events: none;
    }

    /* Empty regions must not stack invisible boxes over the bottom nav. */
    .bio-toast-region:empty {
      display: none;
    }

    @media (min-width: 768px) {
      .bio-toast-region {
        inset-block-end: var(--bio-space-6);
        inset-inline: auto var(--bio-space-6);
        max-width: 380px;
      }
    }
  `,
})
export class ToastHost {
  protected readonly toasts = inject(ToastService);
}
