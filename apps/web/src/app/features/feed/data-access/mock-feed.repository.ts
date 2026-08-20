import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { POSTS } from '@core/mock/fixtures/posts.fixture';
import { MockTransport } from '@core/mock/mock-transport';
import type {
  CursorPage,
  IdempotencyKey,
  Post,
  PostEngagement,
  PostId,
} from '@core/models';
import type { FeedPageRequest, FeedRepository } from './feed.repository';

/**
 * In-memory feed backed by fixtures.
 *
 * Stateful for the lifetime of the session (ADR-0003 rule 4): liking a post and
 * scrolling away must not un-like it when the page is re-fetched, because that
 * would hide exactly the optimistic-update bugs this layer exists to expose.
 *
 * Root-provided so that state survives navigating away from /feed and back.
 */
@Injectable({ providedIn: 'root' })
export class MockFeedRepository implements FeedRepository {
  private readonly transport = inject(MockTransport);

  /** Mutations recorded on top of the immutable fixtures. */
  private readonly engagementOverrides = new Map<PostId, PostEngagement>();

  /** Idempotency keys already applied, so a retry is genuinely a no-op. */
  private readonly appliedKeys = new Set<string>();

  getHomeFeed(request: FeedPageRequest): Observable<CursorPage<Post>> {
    return this.transport.respond(() => {
      const start = decodeCursor(request.cursor);
      const slice = POSTS.slice(start, start + request.limit);
      const nextIndex = start + slice.length;

      return {
        items: slice.map((post) => this.withOverrides(post)),
        nextCursor: nextIndex < POSTS.length ? encodeCursor(nextIndex) : null,
      };
    });
  }

  setLike(post: PostId, liked: boolean, key: IdempotencyKey): Observable<PostEngagement> {
    return this.transport.respond(() =>
      this.mutate(post, key, (current) => ({
        ...current,
        viewerHasLiked: liked,
        // Guarded so a replayed key can never drive the counter negative.
        likeCount: Math.max(0, current.likeCount + (liked ? 1 : -1)),
      })),
    );
  }

  setSaved(post: PostId, saved: boolean, key: IdempotencyKey): Observable<PostEngagement> {
    return this.transport.respond(() =>
      this.mutate(post, key, (current) => ({ ...current, viewerHasSaved: saved })),
    );
  }

  private mutate(
    id: PostId,
    key: IdempotencyKey,
    update: (current: PostEngagement) => PostEngagement,
  ): PostEngagement {
    const current = this.engagementFor(id);

    // Replaying a key returns the stored result instead of applying twice.
    if (this.appliedKeys.has(key)) {
      return current;
    }
    this.appliedKeys.add(key);

    const next = update(current);
    this.engagementOverrides.set(id, next);
    return next;
  }

  private engagementFor(id: PostId): PostEngagement {
    const override = this.engagementOverrides.get(id);
    if (override) {
      return override;
    }
    const post = POSTS.find((candidate) => candidate.id === id);
    if (!post) {
      throw new Error(`Mock error: no post with id ${id}`);
    }
    return post.engagement;
  }

  private withOverrides(post: Post): Post {
    const override = this.engagementOverrides.get(post.id);
    return override ? { ...post, engagement: override } : post;
  }
}

/**
 * Cursors are opaque to the client on purpose. Base64 here so nothing in the UI
 * can start doing arithmetic on them - when Phase 3 replaces this with a real
 * keyset cursor, no calling code notices.
 */
function encodeCursor(index: number): string {
  return btoa(`offset:${index}`);
}

function decodeCursor(cursor: string | null): number {
  if (!cursor) {
    return 0;
  }
  try {
    const parsed = Number.parseInt(atob(cursor).replace('offset:', ''), 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}
