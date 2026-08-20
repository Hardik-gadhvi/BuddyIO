import type { IsoInstant, UserId } from './ids';

/**
 * The minimal user shape needed to render an avatar + name anywhere in the
 * product (feed header, comment, conversation row, notification). Deliberately
 * small: this is what gets embedded in every other payload, so every field here
 * costs bandwidth on every list response.
 */
export interface UserSummary {
  readonly id: UserId;
  /** Handle without the leading '@'. Assumption A-05. */
  readonly username: string;
  readonly displayName: string;
  /** Absolute or app-relative URL. `null` renders the initials fallback. */
  readonly avatarUrl: string | null;
  readonly isVerified: boolean;
  /** Assumption A-04: private accounts withhold content, not identity. */
  readonly isPrivate: boolean;
}

/** Full profile. Only fetched for a profile screen. */
export interface UserProfile extends UserSummary {
  readonly bio: string | null;
  readonly link: string | null;
  readonly joinedAt: IsoInstant;
  readonly counts: ProfileCounts;
  readonly relationship: RelationshipState;
  /** Coarse by design - assumption A-06. Precise last-seen is a stalking vector. */
  readonly presence: PresenceState;
}

export interface ProfileCounts {
  readonly posts: number;
  readonly followers: number;
  readonly following: number;
}

/**
 * The viewer's relationship to this account, resolved server-side.
 *
 * This is never computed in the client. Risk R-04: private-account and block
 * semantics leaking through a client-side predicate is the classic social-app
 * privacy bug, so the server states the answer and the UI renders it.
 */
export interface RelationshipState {
  readonly isSelf: boolean;
  readonly following: FollowState;
  readonly followsYou: boolean;
  readonly isBlockedByYou: boolean;
  /**
   * Whether the viewer may see this account's posts. Combines privacy, follow
   * state and blocks into one server-authoritative answer, so the template
   * never re-derives a privacy rule.
   */
  readonly canViewContent: boolean;
  readonly isMuted: boolean;
}

export type FollowState = 'not-following' | 'requested' | 'following';

export type PresenceState = 'active-now' | 'active-today' | 'hidden';

/** The signed-in user. Extends the profile with viewer-only fields. */
export interface CurrentUser extends UserProfile {
  readonly hasCompletedOnboarding: boolean;
  readonly unreadNotifications: number;
  readonly unreadConversations: number;
}
