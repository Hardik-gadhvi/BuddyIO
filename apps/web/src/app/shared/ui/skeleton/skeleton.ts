import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Loading placeholder.
 *
 * The point of a skeleton is that it occupies EXACTLY the box the real content
 * will occupy, so resolving the data shifts nothing. A skeleton that is only
 * roughly the right size is worse than a spinner, because it promises a layout
 * and then breaks it.
 *
 * Always `aria-hidden`: the loading state is announced once by the container's
 * `aria-busy`, not N times by N placeholder blocks.
 */
@Component({
  selector: 'bio-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant() === 'text') {
      @for (line of lineArray(); track $index) {
        <span
          class="bio-skeleton__block bio-skeleton__block--text"
          [style.width]="$last && lines() > 1 ? '62%' : '100%'"
        ></span>
      }
    } @else {
      <span
        class="bio-skeleton__block"
        [class.bio-skeleton__block--circle]="variant() === 'circle'"
        [style.width]="width()"
        [style.height]="height()"
      ></span>
    }
  `,
  host: {
    class: 'bio-skeleton',
    'aria-hidden': 'true',
  },
  styles: `
    .bio-skeleton {
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-2);
      width: 100%;
    }

    .bio-skeleton__block {
      display: block;
      background: var(--bio-surface-skeleton);
      border-radius: var(--bio-radius-sm);
      background-image: linear-gradient(
        90deg,
        var(--bio-surface-skeleton) 0%,
        var(--bio-surface-skeleton-shine) 50%,
        var(--bio-surface-skeleton) 100%
      );
      background-size: 200% 100%;
      animation: bio-skeleton-shimmer 1400ms ease-in-out infinite;
    }

    .bio-skeleton__block--text {
      height: 0.75rem;
      border-radius: var(--bio-radius-xs);
    }

    .bio-skeleton__block--circle {
      border-radius: var(--bio-radius-circle);
    }

    @keyframes bio-skeleton-shimmer {
      from {
        background-position: 200% 0;
      }
      to {
        background-position: -200% 0;
      }
    }

    /* The shimmer is decoration, not information - drop it entirely. */
    @media (prefers-reduced-motion: reduce) {
      .bio-skeleton__block {
        animation: none;
        background-image: none;
      }
    }
  `,
})
export class Skeleton {
  readonly variant = input<'text' | 'circle' | 'rect'>('text');
  readonly lines = input(3);
  readonly width = input('100%');
  readonly height = input('1rem');

  protected lineArray(): readonly number[] {
    return Array.from({ length: this.lines() }, (_, index) => index);
  }
}
