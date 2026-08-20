import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '@shared/ui/icon/icon';

/**
 * A compact, selectable or removable token.
 *
 * Renders a `<button>` when interactive and a `<span>` when it is only a label,
 * so a decorative chip never lands in the tab order. Selection uses
 * `aria-pressed` rather than a class, so the state is announced.
 */
@Component({
  selector: 'bio-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    @if (interactive()) {
      <button
        type="button"
        class="bio-chip__body"
        [attr.aria-pressed]="selectable() ? selected() : null"
        [disabled]="disabled()"
        (click)="toggle.emit()"
      >
        @if (selected() && selectable()) {
          <bio-icon name="check" [size]="16" />
        }
        <ng-content />
      </button>
    } @else {
      <span class="bio-chip__body">
        <ng-content />
      </span>
    }

    @if (removable()) {
      <button
        type="button"
        class="bio-chip__remove"
        [attr.aria-label]="removeLabel()"
        (click)="remove.emit()"
      >
        <bio-icon name="x" [size]="16" />
      </button>
    }
  `,
  host: {
    class: 'bio-chip',
    '[class.bio-chip--selected]': 'selected()',
    '[class.bio-chip--removable]': 'removable()',
  },
  styles: `
    .bio-chip {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--bio-border-default);
      border-radius: var(--bio-radius-pill);
      background: var(--bio-surface-default);
      overflow: hidden;
      transition:
        background-color var(--bio-duration-fast) var(--bio-ease-standard),
        border-color var(--bio-duration-fast) var(--bio-ease-standard);
    }

    .bio-chip__body {
      display: inline-flex;
      align-items: center;
      gap: var(--bio-space-2);
      min-height: 36px;
      padding-inline: var(--bio-space-3);
      border: none;
      background: transparent;
      color: var(--bio-text-primary);
      font-size: var(--bio-font-size-body-sm);
      font-weight: var(--bio-weight-medium);
      white-space: nowrap;
    }

    button.bio-chip__body {
      cursor: pointer;
    }

    button.bio-chip__body:focus-visible,
    .bio-chip__remove:focus-visible {
      outline: var(--bio-focus-ring-width) solid var(--bio-focus-ring);
      outline-offset: -2px;
    }

    .bio-chip:hover:has(button:not(:disabled)) {
      border-color: var(--bio-border-strong);
      background: var(--bio-action-ghost-bg-hover);
    }

    /* Selected carries a border, a tint AND a tick - never colour alone. */
    .bio-chip--selected {
      border-color: var(--bio-action-primary-bg);
      background: var(--bio-surface-tint);
    }

    .bio-chip--selected .bio-chip__body {
      color: var(--bio-text-link);
      font-weight: var(--bio-weight-semibold);
    }

    .bio-chip__remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin-inline-end: 2px;
      border: none;
      border-radius: var(--bio-radius-circle);
      background: transparent;
      color: var(--bio-text-muted);
      cursor: pointer;

      &:hover {
        background: var(--bio-action-ghost-bg-active);
        color: var(--bio-text-primary);
      }
    }

    .bio-chip--removable .bio-chip__body {
      padding-inline-end: var(--bio-space-1);
    }

    button.bio-chip__body:disabled {
      color: var(--bio-action-disabled-fg);
      cursor: not-allowed;
    }
  `,
})
export class Chip {
  readonly interactive = input(true);
  readonly selectable = input(false);
  readonly selected = input(false);
  readonly removable = input(false);
  readonly disabled = input(false);
  readonly removeLabel = input('Remove');

  readonly toggle = output<void>();
  readonly remove = output<void>();
}
