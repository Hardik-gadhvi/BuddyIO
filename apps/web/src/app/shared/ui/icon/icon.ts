import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICONS, type IconDefinition, type IconName } from './icon-registry';

export type IconSize = 16 | 20 | 24 | 32;

/**
 * Inline SVG icon.
 *
 * Inline rather than a sprite or an <img> so the glyph inherits `currentColor`,
 * scales with the surrounding text, and costs no network request.
 *
 * Accessibility contract: an icon is decorative BY DEFAULT (`aria-hidden`).
 * Pass `label` only when the icon is the sole carrier of meaning; inside an
 * already-labelled control, leave it unlabelled so screen readers do not
 * announce the same thing twice.
 */
@Component({
  selector: 'bio-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label()"
      [attr.aria-hidden]="label() ? null : 'true'"
      focusable="false"
    >
      @for (path of definition().paths; track path) {
        <path [attr.d]="path" />
      }
      @for (dot of dots(); track dot) {
        <circle [attr.cx]="dot[0]" [attr.cy]="dot[1]" [attr.r]="dot[2]" class="bio-icon__dot" />
      }
    </svg>
  `,
  host: {
    class: 'bio-icon',
    '[class.bio-icon--filled]': 'definition().filled',
    '[style.--bio-icon-size.px]': 'size()',
  },
  styles: `
    .bio-icon {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: var(--bio-icon-size, 20px);
      height: var(--bio-icon-size, 20px);
      color: inherit;
    }

    svg {
      display: block;
      overflow: visible;
    }

    path {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.75;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .bio-icon__dot {
      fill: currentColor;
      stroke: none;
    }

    .bio-icon--filled path {
      fill: currentColor;
      stroke: currentColor;
      stroke-width: 1.4;
      stroke-linejoin: round;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input<IconSize>(20);
  /** Set ONLY when this icon is the sole carrier of meaning. */
  readonly label = input<string | null>(null);

  // Typed as the interface rather than the literal union, so `dots` is a
  // normal optional property instead of a member that only some icons have.
  protected readonly definition = computed<IconDefinition>(() => ICONS[this.name()]);

  protected readonly dots = computed(() => this.definition().dots ?? []);
}
