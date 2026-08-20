import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { POSTS } from '@core/mock/fixtures/posts.fixture';
import type { CursorPage, Post, PostEngagement, PostId } from '@core/models';
import { ToastService } from '@shared/ui/toast/toast.service';
import { FeedFacade } from './feed.facade';
import { FEED_REPOSITORY, type FeedPageRequest, type FeedRepository } from './feed.repository';

/**
 * A deterministic, synchronous fake - NOT the mock repository.
 *
 * The mock repository deliberately adds latency and random failure, which is
 * exactly what a unit test must not have. This fake resolves immediately and
 * fails only when told to.
 */
class FakeFeedRepository implements FeedRepository {
  failNextMutation = false;
  failFeed = false;
  lastRequest: FeedPageRequest | null = null;

  constructor(private readonly pages: readonly Post[][]) {}

  getHomeFeed(request: FeedPageRequest): Observable<CursorPage<Post>> {
    this.lastRequest = request;
    if (this.failFeed) {
      return throwError(() => new Error('boom'));
    }
    const index = request.cursor === null ? 0 : Number(request.cursor);
    const items = this.pages[index] ?? [];
    const hasNext = index + 1 < this.pages.length;
    return of({ items, nextCursor: hasNext ? String(index + 1) : null });
  }

  setLike(post: PostId, liked: boolean): Observable<PostEngagement> {
    return this.mutate(post, (current) => ({
      ...current,
      viewerHasLiked: liked,
      likeCount: current.likeCount + (liked ? 1 : -1),
    }));
  }

  setSaved(post: PostId, saved: boolean): Observable<PostEngagement> {
    return this.mutate(post, (current) => ({ ...current, viewerHasSaved: saved }));
  }

  private mutate(
    id: PostId,
    update: (current: PostEngagement) => PostEngagement,
  ): Observable<PostEngagement> {
    if (this.failNextMutation) {
      this.failNextMutation = false;
      return throwError(() => new Error('boom'));
    }
    const post = POSTS.find((candidate) => candidate.id === id)!;
    return of(update(post.engagement));
  }
}

function setup(pages: readonly Post[][]): {
  facade: FeedFacade;
  repository: FakeFeedRepository;
  toasts: ToastService;
} {
  const repository = new FakeFeedRepository(pages);

  TestBed.configureTestingModule({
    providers: [FeedFacade, { provide: FEED_REPOSITORY, useValue: repository }],
  });

  return {
    facade: TestBed.inject(FeedFacade),
    repository,
    toasts: TestBed.inject(ToastService),
  };
}

const livePosts = POSTS.filter((post) => post.removed === null);

describe('FeedFacade', () => {
  beforeEach(() => TestBed.resetTestingModule());

  describe('loading', () => {
    it('moves idle -> ready and exposes the first page', () => {
      const { facade } = setup([livePosts.slice(0, 3)]);
      expect(facade.status()).toBe('idle');

      facade.load();

      expect(facade.status()).toBe('ready');
      expect(facade.posts()).toHaveLength(3);
    });

    it('does not refetch when the feed is already loaded', () => {
      const { facade, repository } = setup([livePosts.slice(0, 3), livePosts.slice(3, 6)]);
      facade.load();
      repository.lastRequest = null;

      // Navigating back to /feed must not throw away what we already have.
      facade.load();

      expect(repository.lastRequest).toBeNull();
    });

    it('reports a first-page failure as an error state', () => {
      const { facade, repository } = setup([livePosts.slice(0, 3)]);
      repository.failFeed = true;

      facade.load();

      expect(facade.status()).toBe('error');
      expect(facade.error()).not.toBeNull();
      expect(facade.posts()).toHaveLength(0);
    });

    it('marks the end of the feed when the cursor comes back null', () => {
      const { facade } = setup([livePosts.slice(0, 2)]);
      facade.load();
      expect(facade.hasMore()).toBe(false);
    });
  });

  describe('pagination', () => {
    it('appends the next page instead of replacing', () => {
      const { facade } = setup([livePosts.slice(0, 2), livePosts.slice(2, 4)]);
      facade.load();
      facade.loadMore();

      expect(facade.posts()).toHaveLength(4);
      expect(facade.hasMore()).toBe(false);
    });

    it('keeps already-loaded posts on screen when a later page fails', () => {
      const { facade, repository } = setup([livePosts.slice(0, 2), livePosts.slice(2, 4)]);
      facade.load();
      repository.failFeed = true;

      facade.loadMore();

      // The critical assertion: a page-2 failure must not blank out page 1.
      expect(facade.posts()).toHaveLength(2);
      expect(facade.status()).toBe('ready');
      expect(facade.loadMoreError()).not.toBeNull();
    });
  });

  describe('optimistic like', () => {
    it('applies immediately and confirms on success', () => {
      const target = livePosts[0]!;
      const { facade } = setup([[target]]);
      facade.load();

      const before = facade.posts()[0]!.engagement;
      facade.toggleLike(facade.posts()[0]!);
      const after = facade.posts()[0]!.engagement;

      expect(after.viewerHasLiked).toBe(!before.viewerHasLiked);
      expect(after.likeCount).toBe(before.likeCount + (after.viewerHasLiked ? 1 : -1));
    });

    it('reverts to the exact previous value on failure', () => {
      const target = livePosts[0]!;
      const { facade, repository } = setup([[target]]);
      facade.load();
      const before = facade.posts()[0]!.engagement;
      repository.failNextMutation = true;

      facade.toggleLike(facade.posts()[0]!);

      expect(facade.posts()[0]!.engagement).toEqual(before);
    });

    it('explains the failure with a retryable toast rather than reverting silently', () => {
      const target = livePosts[0]!;
      const { facade, repository, toasts } = setup([[target]]);
      facade.load();
      repository.failNextMutation = true;

      facade.toggleLike(facade.posts()[0]!);

      // A silent revert reads as the app randomly undoing the user's action.
      const shown = toasts.toasts();
      expect(shown).toHaveLength(1);
      expect(shown[0]!.tone).toBe('danger');
      expect(shown[0]!.action?.label).toBe('Retry');
    });

    it('clears the pending flag whether the mutation succeeds or fails', () => {
      const target = livePosts[0]!;
      const { facade, repository } = setup([[target]]);
      facade.load();

      facade.toggleLike(facade.posts()[0]!);
      expect(facade.isPending(target.id)).toBe(false);

      repository.failNextMutation = true;
      facade.toggleLike(facade.posts()[0]!);
      expect(facade.isPending(target.id)).toBe(false);
    });
  });

  describe('optimistic save', () => {
    it('toggles and reverts on failure', () => {
      const target = livePosts[0]!;
      const { facade, repository } = setup([[target]]);
      facade.load();
      const before = facade.posts()[0]!.engagement.viewerHasSaved;

      facade.toggleSave(facade.posts()[0]!);
      expect(facade.posts()[0]!.engagement.viewerHasSaved).toBe(!before);

      repository.failNextMutation = true;
      facade.toggleSave(facade.posts()[0]!);
      expect(facade.posts()[0]!.engagement.viewerHasSaved).toBe(!before);
    });
  });
});
