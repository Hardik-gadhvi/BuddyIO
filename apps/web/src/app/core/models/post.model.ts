import type { CommentId, IsoInstant, MediaId, PostId, UserId } from './ids';
import type { UserSummary } from './user.model';

/**
 * Post audience. Assumption A-04: three tiers, no per-post custom lists.
 * Stored per post so a later privacy change never rewrites history.
 */
export type PostAudience = 'public' | 'followers' | 'close-friends';

export type MediaKind = 'image';

/**
 * A single media item.
 *
 * `width`/`height` are REQUIRED, not optional. They are what makes cumulative
 * layout shift structurally impossible: the media frame reserves the box from
 * the intrinsic ratio before a byte of the image arrives.
 */
export interface PostMedia {
  readonly id: MediaId;
  readonly kind: MediaKind;
  readonly url: string;
  readonly width: number;
  readonly height: number;
  /**
   * Author-supplied alternative text. Nullable because alt text is encouraged
   * but never blocks publishing (docs/04-user-flows.md section 3); when null the
   * media frame falls back to a generic description rather than an empty alt.
   */
  readonly altText: string | null;
  /** Tiny blurred placeholder (data URI) shown while the full image decodes. */
  readonly placeholder: string | null;
}

export interface Post {
  readonly id: PostId;
  readonly author: UserSummary;
  readonly media: readonly PostMedia[];
  readonly caption: string;
  readonly hashtags: readonly string[];
  readonly location: string | null;
  readonly audience: PostAudience;
  readonly createdAt: IsoInstant;
  readonly engagement: PostEngagement;
  /** Up to two comments embedded for the feed preview. */
  readonly previewComments: readonly Comment[];
  /**
   * Set when a post is removed by its author or by moderation. The UI renders a
   * tombstone rather than letting content silently vanish (doc 03 section 5).
   */
  readonly removed: PostRemoval | null;
}

export interface PostRemoval {
  readonly reason: 'deleted-by-author' | 'removed-by-moderation';
  readonly removedAt: IsoInstant;
}

/**
 * Counters plus the viewer's own state, in one object.
 *
 * Kept separate from `Post` so an optimistic like replaces a small immutable
 * value rather than cloning the whole post, and so the eventual
 * `PATCH /posts/{id}/like` response maps onto exactly this shape.
 */
export interface PostEngagement {
  readonly likeCount: number;
  readonly commentCount: number;
  readonly viewerHasLiked: boolean;
  readonly viewerHasSaved: boolean;
  /** False when the author disabled comments or a block is in effect. */
  readonly canComment: boolean;
}

export interface Comment {
  readonly id: CommentId;
  readonly postId: PostId;
  readonly author: UserSummary;
  readonly body: string;
  readonly createdAt: IsoInstant;
  readonly likeCount: number;
  readonly viewerHasLiked: boolean;
  /** Assumption A-02: comments are flat in MVP. */
  readonly replyingTo: UserId | null;
}
