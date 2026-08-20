import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Count or dot indicator.
 *
 * Decorative by default (`aria-hidden`): the surrounding control normally
 * carries the real accessible name, e.g. "Notifications, 3 unread". Pass
 * `srLabel` only when the badge stands alone.
 */
@Component({
  selector: 'bio-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!dot()) {
      <span aria-hidden="true">{{ display() }}</span>
    }
    @if (srLabel(); as label) {
      <span class="bio-visually-hidden">{{ label }}</span>
    }
  `,
  host: {
    class: 'bio-badge',
    '[class.bio-badge--accent]': 'variant() === "accent"',
    '[class.bio-badge--primary]': 'variant() === "primary"',
    '[class.bio-badge--neutral]': 'variant() === "neutral"',
    '[class.bio-badge--dot]': 'dot()',
    '[attr.aria-hidden]': 'srLabel() ? null : "true"',
    '[attr.role]': 'srLabel() ? "status" : null',
  },
  styles: `
    .bio-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding-inline: 5px;
      border-radius: var(--bio-radius-pill);
      font-size: var(--bio-font-size-overline);
      font-weight: var(--bio-weight-semibold);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    .bio-badge--dot {
      min-width: 9px;
      width: 9px;
      height: 9px;
      padding: 0;
    }

    .bio-badge--accent {
      background: var(--bio-action-accent-bg);
      color: var(--bio-action-accent-fg);
    }

    .bio-badge--primary {
      background: var(--bio-action-primary-bg);
      color: var(--bio-action-primary-fg);
    }

    .bio-badge--neutral {
      background: var(--bio-action-neutral-bg);
      color: var(--bio-action-neutral-fg);
    }
  `,
})
export class Badge {
  readonly count = input(0);
  readonly max = input(99);
  readonly dot = input(false);
  readonly variant = input<'accent' | 'primary' | 'neutral'>('accent');
  readonly srLabel = input<string | null>(null);

  protected readonly display = computed(() =>
    this.count() > this.max() ? `${this.max()}+` : `${this.count()}`,
  );
}
