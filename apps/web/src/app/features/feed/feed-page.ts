import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { Post } from '@core/models';
import { EmptyState } from '@shared/patterns/empty-state/empty-state';
import { ErrorState } from '@shared/patterns/error-state/error-state';
import { Intersect } from '@shared/directives/intersect.directive';
import { BioButton } from '@shared/ui/button/button';
import { Icon } from '@shared/ui/icon/icon';
import { ToastService } from '@shared/ui/toast/toast.service';
import { FeedFacade } from './data-access/feed.facade';
import { PostCard, type PostMenuAction } from './ui/post-card/post-card';
import { PostCardSkeleton } from './ui/post-card-skeleton/post-card-skeleton';

/**
 * The home feed.
 *
 * The only component in this feature that injects the facade (ADR-0002).
 * Everything below it is presentational and driven by inputs.
 */
@Component({
  selector: 'bio-feed-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BioButton,
    EmptyState,
    ErrorState,
    Icon,
    Intersect,
    PostCard,
    PostCardSkeleton,
    RouterLink,
  ],
  providers: [FeedFacade],
  templateUrl: './feed-page.html',
  styleUrl: './feed-page.scss',
})
export class FeedPage implements OnInit {
  protected readonly facade = inject(FeedFacade);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);

  /** Placeholder rows for the first-load skeleton. */
  protected readonly skeletonRows = [0, 1, 2];

  ngOnInit(): void {
    this.facade.load();
  }

  protected onLike(post: Post): void {
    this.facade.toggleLike(post);
  }

  protected onSave(post: Post): void {
    this.facade.toggleSave(post);
  }

  protected onOpenComments(post: Post): void {
    void this.router.navigate(['/p', post.id]);
  }

  protected onShare(post: Post): void {
    void this.copyLink(post);
  }

  protected onMenuAction(event: { action: PostMenuAction; post: Post }): void {
    switch (event.action) {
      case 'copy-link':
        void this.copyLink(event.post);
        break;
      case 'mute':
        this.toasts.show(`Muted ${event.post.author.displayName}. Lands in a later increment.`);
        break;
      case 'unfollow':
        this.toasts.show(
          `Unfollowing ${event.post.author.displayName} lands with the social graph slice.`,
        );
        break;
      case 'report':
        this.toasts.show('Reporting arrives with the moderation slice in Phase 6.');
        break;
    }
  }

  private async copyLink(post: Post): Promise<void> {
    const url = `${location.origin}/p/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      this.toasts.show('Link copied to your clipboard.', { tone: 'success' });
    } catch {
      // Clipboard access is denied in plenty of legitimate contexts (insecure
      // origin, permission policy). Failing silently would look like a dead
      // control, so say what happened.
      this.toasts.error('We could not reach your clipboard. Copy the link from the address bar.');
    }
  }
}
