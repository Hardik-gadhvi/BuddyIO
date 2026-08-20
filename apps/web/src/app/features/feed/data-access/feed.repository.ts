import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CursorPage, IdempotencyKey, Post, PostEngagement, PostId } from '@core/models';

export interface FeedPageRequest {
  /** `null` requests the first page. */
  readonly cursor: string | null;
  readonly limit: number;
}

/**
 * The feed's data contract.
 *
 * Phase 1 binds `MockFeedRepository`; Phase 3 binds an HTTP implementation
 * generated from the OpenAPI 3.1 document. Nothing above this interface changes
 * when that happens - that is the entire point of ADR-0003.
 *
 * Note the `IdempotencyKey` on every mutation. It is not useful against a mock,
 * but designing it in now means the REST endpoints and the eventual SignalR
 * path inherit it for free, rather than having it retrofitted in Phase 5 after
 * the first duplicate-like bug (risk R-02).
 */
export interface FeedRepository {
  getHomeFeed(request: FeedPageRequest): Observable<CursorPage<Post>>;

  setLike(post: PostId, liked: boolean, key: IdempotencyKey): Observable<PostEngagement>;

  setSaved(post: PostId, saved: boolean, key: IdempotencyKey): Observable<PostEngagement>;
}

export const FEED_REPOSITORY = new InjectionToken<FeedRepository>('FEED_REPOSITORY');
