import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import type { UserSummary } from '@core/models';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 96,
};

/**
 * User avatar with a generated initials fallback.
 *
 * Three things this component exists to guarantee:
 *
 * 1. **No layout shift.** The box is sized from the token BEFORE any image
 *    loads, and `width`/`height` attributes are set on the <img> itself.
 * 2. **No broken-image state.** A failed load falls back to initials rather
 *    than the browser's broken-image glyph.
 * 3. **Stable identity colour.** The fallback hue is derived from the user id,
 *    so the same person is always the same colour across every surface. A
 *    random or index-based hue would make the same person change colour between
 *    the feed and their profile.
 */
@Component({
  selector: 'bio-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (imageUrl(); as url) {
      <img
        [src]="url"
        [width]="pixels()"
        [height]="pixels()"
        [alt]="alt()"
        loading="lazy"
        decoding="async"
        (error)="onImageError()"
      />
    } @else {
      <span class="bio-avatar__initials" [style.--bio-avatar-hue]="hue()" aria-hidden="true">
        {{ initials() }}
      </span>
      @if (alt()) {
        <span class="bio-visually-hidden">{{ alt() }}</span>
      }
    }
  `,
  host: {
    class: 'bio-avatar',
    '[class.bio-avatar--ring-default]': 'ring() === "default"',
    '[class.bio-avatar--ring-accent]': 'ring() === "accent"',
    '[style.--bio-avatar-size.px]': 'pixels()',
  },
  styles: `
    .bio-avatar {
      position: relative;
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: var(--bio-avatar-size, 40px);
      height: var(--bio-avatar-size, 40px);
      border-radius: var(--bio-radius-circle);
      overflow: hidden;
      background: var(--bio-surface-sunken);
      /* Keeps a light avatar legible on a light card. */
      box-shadow: inset 0 0 0 1px rgb(0 0 0 / 6%);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .bio-avatar__initials {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      font-size: calc(var(--bio-avatar-size, 40px) * 0.4);
      font-weight: var(--bio-weight-semibold);
      letter-spacing: 0.01em;
      user-select: none;

      /*
       * The hue is dynamic, so this pair cannot live in _tokens.scss. It uses
       * light-dark() rather than a :host-context selector because
       * `:not([data-theme='light'])` also matches an unset root and would
       * therefore apply the dark pair in light mode. light-dark() reads
       * `color-scheme`, which the token sheet already sets correctly for
       * explicit AND system themes.
       */
      color: light-dark(hsl(var(--bio-avatar-hue) 62% 26%), hsl(var(--bio-avatar-hue) 70% 86%));
      background: light-dark(
        hsl(var(--bio-avatar-hue) 58% 88%),
        hsl(var(--bio-avatar-hue) 32% 26%)
      );
    }

    .bio-avatar--ring-default {
      box-shadow:
        inset 0 0 0 1px rgb(0 0 0 / 6%),
        0 0 0 2px var(--bio-surface-default),
        0 0 0 3px var(--bio-border-default);
    }

    .bio-avatar--ring-accent {
      box-shadow:
        inset 0 0 0 1px rgb(0 0 0 / 6%),
        0 0 0 2px var(--bio-surface-default),
        0 0 0 3px var(--bio-action-accent-bg);
    }
  `,
})
export class Avatar {
  readonly user = input.required<UserSummary | null>();
  readonly size = input<AvatarSize>('md');
  readonly ring = input<'none' | 'default' | 'accent'>('none');
  /**
   * Accessible name. Defaults to empty: in almost every context the username is
   * rendered right next to the avatar, so naming it too makes screen readers
   * announce the same person twice.
   */
  readonly alt = input('');

  private readonly imageFailed = signal(false);

  protected readonly pixels = computed(() => SIZE_PX[this.size()]);

  protected readonly imageUrl = computed(() =>
    this.imageFailed() ? null : (this.user()?.avatarUrl ?? null),
  );

  protected readonly initials = computed(() => {
    const name = this.user()?.displayName?.trim();
    if (!name) {
      return '?';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase();
  });

  /** Stable hue per user id - see point 3 in the class comment. */
  protected readonly hue = computed(() => {
    const id = this.user()?.id ?? '';
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) % 360;
    }
    return hash;
  });

  protected onImageError(): void {
    this.imageFailed.set(true);
  }
}
