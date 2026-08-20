import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '@shared/ui/icon/icon';

/**
 * Chrome for anything opened in a CDK Dialog: title, close affordance, a
 * scrollable body and an optional footer.
 *
 * The title is an `<h2>` carrying the id that the dialog's `aria-labelledby`
 * points at, so the dialog announces its own name on open. Body scrolls
 * independently of header and footer, so a long form never pushes its actions
 * off screen - the single most common bottom-sheet defect on mobile.
 */
@Component({
  selector: 'bio-dialog-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <header class="bio-dialog__head">
      @if (showBack()) {
        <button type="button" class="bio-dialog__icon" aria-label="Back" (click)="back.emit()">
          <bio-icon name="chevron-left" [size]="20" />
        </button>
      }

      <h2 class="bio-dialog__title" [id]="titleId()">{{ title() }}</h2>

      @if (dismissible()) {
        <button type="button" class="bio-dialog__icon" aria-label="Close" (click)="close.emit()">
          <bio-icon name="x" [size]="20" />
        </button>
      }
    </header>

    <div class="bio-dialog__body">
      <ng-content />
    </div>

    <footer class="bio-dialog__foot">
      <ng-content select="[dialogFooter]" />
    </footer>
  `,
  host: {
    class: 'bio-dialog',
  },
  styles: `
    .bio-dialog {
      display: flex;
      flex-direction: column;
      max-height: inherit;
      min-height: 0;
    }

    .bio-dialog__head {
      display: flex;
      align-items: center;
      gap: var(--bio-space-2);
      flex: none;
      padding: var(--bio-space-3) var(--bio-space-3) var(--bio-space-3) var(--bio-space-5);
      border-block-end: 1px solid var(--bio-border-subtle);
    }

    .bio-dialog__title {
      flex: 1;
      min-width: 0;
      font-size: var(--bio-font-size-h4);
      line-height: var(--bio-line-height-h4);
      font-weight: var(--bio-weight-semibold);
      overflow-wrap: anywhere;
    }

    .bio-dialog__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      flex: none;
      border: none;
      border-radius: var(--bio-radius-circle);
      background: transparent;
      color: var(--bio-text-secondary);
      cursor: pointer;

      &:hover {
        background: var(--bio-action-ghost-bg-hover);
      }

      &:focus-visible {
        outline: var(--bio-focus-ring-width) solid var(--bio-focus-ring);
        outline-offset: -2px;
      }
    }

    /* Scrolls independently so the footer actions are always reachable. */
    .bio-dialog__body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: var(--bio-space-5);
    }

    .bio-dialog__foot {
      display: flex;
      justify-content: flex-end;
      gap: var(--bio-space-2);
      flex: none;
      padding: var(--bio-space-4) var(--bio-space-5);
      border-block-start: 1px solid var(--bio-border-subtle);
    }

    .bio-dialog__foot:not(:has(*)) {
      display: none;
    }
  `,
})
export class DialogShell {
  readonly title = input.required<string>();
  readonly titleId = input('bio-dialog-title');
  readonly dismissible = input(true);
  readonly showBack = input(false);

  readonly close = output<void>();
  readonly back = output<void>();
}
