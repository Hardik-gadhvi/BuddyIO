/**
 * Branded identifier types.
 *
 * A `PostId` and a `UserId` are both strings at runtime, which is exactly how
 * `getPost(userId)` bugs happen. Branding makes them distinct at compile time
 * at zero runtime cost.
 */

declare const brand: unique symbol;

export type Brand<TValue, TBrand extends string> = TValue & {
  readonly [brand]: TBrand;
};

export type UserId = Brand<string, 'UserId'>;
export type PostId = Brand<string, 'PostId'>;
export type CommentId = Brand<string, 'CommentId'>;
export type MediaId = Brand<string, 'MediaId'>;
export type ConversationId = Brand<string, 'ConversationId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type NotificationId = Brand<string, 'NotificationId'>;

/**
 * Client-generated idempotency key.
 *
 * Present from Phase 1 on purpose: risk R-02 in docs/00-product-brief.md says
 * the messaging contract must be designed now, not discovered in Phase 5. Every
 * mutation carries one so a retry can never create a duplicate server-side.
 */
export type IdempotencyKey = Brand<string, 'IdempotencyKey'>;

export const userId = (value: string): UserId => value as UserId;
export const postId = (value: string): PostId => value as PostId;
export const commentId = (value: string): CommentId => value as CommentId;
export const mediaId = (value: string): MediaId => value as MediaId;
export const conversationId = (value: string): ConversationId => value as ConversationId;
export const messageId = (value: string): MessageId => value as MessageId;
export const notificationId = (value: string): NotificationId => value as NotificationId;

/** Uses `crypto.randomUUID` where available, with a non-crypto fallback. */
export function newIdempotencyKey(): IdempotencyKey {
  const value =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `k_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  return value as IdempotencyKey;
}

/**
 * An ISO 8601 UTC instant. Assumption A-08: timestamps are UTC end to end and
 * the client formats to local. The alias exists so a raw `string` date is
 * visibly wrong in review.
 */
export type IsoInstant = Brand<string, 'IsoInstant'>;

export const isoInstant = (value: string | Date): IsoInstant =>
  (typeof value === 'string' ? value : value.toISOString()) as IsoInstant;
