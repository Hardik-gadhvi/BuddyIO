import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';
import { toAppError } from '@core/mock/mock-transport';
import {
  FEED_PAGE_SIZE,
  type AppError,
  type IdempotencyKey,
  type Post,
  type PostEngagement,
  type PostId,
  newIdempotencyKey,
} from '@core/models';
import { ToastService } from '@shared/ui/toast/toast.service';
import { FEED_REPOSITORY } from './feed.repository';

export type FeedStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * The home feed's state and intents.
 *
 * The ONLY thing a page component injects (ADR-0002). Everything below the page
 * receives data through inputs and emits intent through outputs, which is what
 * keeps the Phase 3 REST cutover a one-provider change.
 *
 * Two deliberate design points:
 *
 * 1. **First-page and next-page failures are separate state.** A failed page 5
 *    must not blank out pages 1-4. `status`/`error` cover the initial load;
 *    `loadMoreError` is rendered inline beneath the existing content
 *    (docs/04 section 2).
 * 2. **Mutations follow the four-state contract** in docs/04 section 9:
 *    optimistic apply, confirm on success, REVERT AND EXPLAIN on failure. A
 *    silent revert is treated as a bug.
 */
@Injectable()
export class FeedFacade {
  private readonly repository = inject(FEED_REPOSITORY);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly items = signal<readonly Post[]>([]);
  private readonly feedStatus = signal<FeedStatus>('idle');
  private readonly feedError = signal<AppError | null>(null);
  private readonly cursor = signal<string | null>(null);
  private readonly endReached = signal(false);
  private readonly loadingMore = signal(false);
  private readonly moreError = signal<AppError | null>(null);
  private readonly pendingPosts = signal<ReadonlySet<PostId>>(new Set());

  readonly posts = this.items.asReadonly();
  readonly status = this.feedStatus.asReadonly();
  readonly error = this.feedError.asReadonly();
  readonly isLoadingMore = this.loadingMore.asReadonly();
  readonly loadMoreError = this.moreError.asReadonly();

  readonly isEmpty = computed(() => this.feedStatus() === 'ready' && this.items().length === 0);
  readonly hasMore = computed(() => !this.endReached());
  readonly isPending = (id: PostId) => this.pendingPosts().has(id);

  /** Idempotent: navigating back to /feed must not refetch what we already have. */
  load(): void {
    if (this.feedStatus() === 'loading' || this.feedStatus() === 'ready') {
      return;
    }
    this.fetchFirstPage();
  }

  /** Explicit user-initiated retry after a first-page failure. */
  retry(): void {
    this.fetchFirstPage();
  }

  loadMore(): void {
    if (this.loadingMore() || this.endReached() || this.feedStatus() !== 'ready') {
      return;
    }

    this.loadingMore.set(true);
    this.moreError.set(null);

    this.repository
      .getHomeFeed({ cursor: this.cursor(), limit: FEED_PAGE_SIZE })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.items.update((current) => [...current, ...page.items]);
          this.cursor.set(page.nextCursor);
          this.endReached.set(page.nextCursor === null);
          this.loadingMore.set(false);
        },
        error: (cause: unknown) => {
          // Existing content stays on screen; the error renders below it.
          this.moreError.set(toAppError(cause));
          this.loadingMore.set(false);
        },
      });
  }

  toggleLike(post: Post): void {
    const liked = !post.engagement.viewerHasLiked;
    this.applyMutation(
      post,
      (current) => ({
        ...current,
        viewerHasLiked: liked,
        likeCount: Math.max(0, current.likeCount + (liked ? 1 : -1)),
      }),
      (id, key) => this.repository.setLike(id, liked, key),
      liked ? 'We could not like that post.' : 'We could not remove your like.',
    );
  }

  toggleSave(post: Post): void {
    const saved = !post.engagement.viewerHasSaved;
    this.applyMutation(
      post,
      (current) => ({ ...current, viewerHasSaved: saved }),
      (id, key) => this.repository.setSaved(id, saved, key),
      saved ? 'We could not save that post.' : 'We could not remove that save.',
    );
  }

  private fetchFirstPage(): void {
    this.feedStatus.set('loading');
    this.feedError.set(null);
    this.moreError.set(null);

    this.repository
      .getHomeFeed({ cursor: null, limit: FEED_PAGE_SIZE })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.items.set(page.items);
          this.cursor.set(page.nextCursor);
          this.endReached.set(page.nextCursor === null);
          this.feedStatus.set('ready');
        },
        error: (cause: unknown) => {
          this.feedError.set(toAppError(cause));
          this.feedStatus.set('error');
        },
      });
  }

  /**
   * The optimistic-mutation contract, implemented once.
   *
   * `previous` is captured before the optimistic write so the revert restores
   * the exact prior value rather than recomputing an inverse, which would drift
   * if two mutations raced.
   */
  private applyMutation(
    post: Post,
    optimistic: (current: PostEngagement) => PostEngagement,
    call: (id: PostId, key: IdempotencyKey) => Observable<PostEngagement>,
    failureMessage: string,
  ): void {
    const previous = post.engagement;
    const id = post.id;

    this.patchEngagement(id, optimistic(previous));
    this.markPending(id, true);

    call(id, newIdempotencyKey())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (engagement) => {
          this.patchEngagement(id, engagement);
          this.markPending(id, false);
        },
        error: () => {
          this.patchEngagement(id, previous);
          this.markPending(id, false);
          this.toasts.error(failureMessage, {
            label: 'Retry',
            run: () => {
              const current = this.items().find((candidate) => candidate.id === id);
              if (current) {
                this.applyMutation(current, optimistic, call, failureMessage);
              }
            },
          });
        },
      });
  }

  private patchEngagement(id: PostId, engagement: PostEngagement): void {
    this.items.update((current) =>
      current.map((post) => (post.id === id ? { ...post, engagement } : post)),
    );
  }

  private markPending(id: PostId, pending: boolean): void {
    this.pendingPosts.update((current) => {
      const next = new Set(current);
      if (pending) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}
