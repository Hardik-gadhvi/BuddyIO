import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon, type IconSize } from '../icon/icon';
import type { IconName } from '../icon/icon-registry';

export type IconButtonVariant = 'ghost' | 'neutral' | 'accent';

/**
 * An icon-only control.
 *
 * `label` is REQUIRED and describes the ACTION, not the glyph ("Like this
 * post", never "heart"). That requirement is enforced by the type system rather
 * than by review, because an unlabelled icon button is invisible to a screen
 * reader and it is the single most common a11y defect in a social UI.
 *
 * The visual box may be smaller than 44px, but the hit area never is - the
 * ::after pseudo-element pads it out without disturbing layout (SC 2.5.8).
 */
@Component({
  selector: 'bio-icon-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <button
      type="button"
      class="bio-icon-button__control"
      [class.bio-icon-button__control--neutral]="variant() === 'neutral'"
      [class.bio-icon-button__control--accent]="variant() === 'accent'"
      [attr.aria-label]="label()"
      [attr.aria-pressed]="pressed()"
      [disabled]="disabled()"
      (click)="action.emit($event)"
    >
      <bio-icon [name]="icon()" [size]="iconSize()" />
    </button>
  `,
  host: {
    class: 'bio-icon-button',
    '[style.--bio-icon-button-size.px]': 'boxSize()',
  },
  styles: `
    .bio-icon-button {
      display: inline-flex;
      flex: none;
    }

    .bio-icon-button__control {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--bio-icon-button-size, 40px);
      height: var(--bio-icon-button-size, 40px);
      padding: 0;
      border: none;
      border-radius: var(--bio-radius-circle);
      background: transparent;
      color: var(--bio-action-ghost-fg);
      cursor: pointer;
      transition:
        background-color var(--bio-duration-fast) var(--bio-ease-standard),
        color var(--bio-duration-fast) var(--bio-ease-standard);
    }

    /* Hit area is always at least 44px even when the visual box is smaller. */
    .bio-icon-button__control::after {
      content: '';
      position: absolute;
      inset: 50% auto auto 50%;
      width: max(100%, 44px);
      height: max(100%, 44px);
      translate: -50% -50%;
    }

    .bio-icon-button__control:hover {
      background: var(--bio-action-ghost-bg-hover);
    }

    .bio-icon-button__control:active {
      background: var(--bio-action-ghost-bg-active);
    }

    .bio-icon-button__control:focus-visible {
      outline: var(--bio-focus-ring-width) solid var(--bio-focus-ring);
      outline-offset: var(--bio-focus-ring-offset);
    }

    .bio-icon-button__control:disabled {
      color: var(--bio-action-disabled-fg);
      background: transparent;
      cursor: not-allowed;
    }

    .bio-icon-button__control--neutral {
      background: var(--bio-action-neutral-bg);
      color: var(--bio-action-neutral-fg);
      border: 1px solid var(--bio-border-subtle);
    }

    .bio-icon-button__control--accent {
      color: var(--bio-text-accent);
    }

    /* Pressed is a real state, not just a colour: aria-pressed drives it. */
    .bio-icon-button__control[aria-pressed='true'] {
      color: var(--bio-text-accent);
    }
  `,
})
export class IconButton {
  readonly icon = input.required<IconName>();
  /** Describes the action. Required - see the class comment. */
  readonly label = input.required<string>();
  readonly variant = input<IconButtonVariant>('ghost');
  readonly iconSize = input<IconSize>(20);
  readonly boxSize = input(40);
  readonly disabled = input(false);
  /** Only set for toggle controls (like, save, mute). Otherwise leave null. */
  readonly pressed = input<boolean | null>(null);

  /**
   * Bind this, NOT `(click)`.
   *
   * `(click)` on the host element also fires for the 44px hit-area padding that
   * extends past the inner <button>, and that padding is still clickable while
   * the button is disabled - which would let a user "comment" on a post that has
   * comments turned off. This output originates on the button itself, so
   * `disabled` genuinely suppresses it.
   */
  readonly action = output<MouseEvent>();
}
