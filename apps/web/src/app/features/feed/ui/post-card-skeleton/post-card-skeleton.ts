import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Skeleton } from '@shared/ui/skeleton/skeleton';

/**
 * Loading placeholder for a post card.
 *
 * Mirrors the real card's geometry exactly - 40px avatar, 4:5 media box, the
 * same paddings - so resolving the feed shifts nothing. A skeleton that is only
 * approximately the right shape is worse than no skeleton, because it promises
 * a layout and then breaks it.
 */
@Component({
  selector: 'bio-post-card-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Skeleton],
  template: `
    <div class="skeleton-card">
      <div class="skeleton-card__header">
        <bio-skeleton variant="circle" width="40px" height="40px" />
        <div class="skeleton-card__header-text">
          <bio-skeleton variant="rect" width="120px" height="12px" />
          <bio-skeleton variant="rect" width="76px" height="10px" />
        </div>
      </div>

      <bio-skeleton variant="rect" width="100%" height="100%" class="skeleton-card__media" />

      <div class="skeleton-card__body">
        <bio-skeleton variant="rect" width="140px" height="14px" />
        <bio-skeleton variant="text" [lines]="2" />
      </div>
    </div>
  `,
  host: {
    class: 'bio-post-card-skeleton',
  },
  styles: `
    :host {
      display: block;
    }

    .skeleton-card {
      background: var(--bio-surface-default);
      border-block: 1px solid var(--bio-border-subtle);
    }

    @media (min-width: 768px) {
      .skeleton-card {
        border: 1px solid var(--bio-border-subtle);
        border-radius: var(--bio-radius-lg);
        overflow: hidden;
      }
    }

    .skeleton-card__header {
      display: flex;
      align-items: center;
      gap: var(--bio-space-3);
      padding: var(--bio-space-3) var(--bio-space-4);
    }

    .skeleton-card__header-text {
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-2);
    }

    .skeleton-card__media {
      display: block;
      aspect-ratio: 4 / 5;
    }

    .skeleton-card__body {
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-2);
      padding: var(--bio-space-4);
    }
  `,
})
export class PostCardSkeleton {}
