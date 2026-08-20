import {
  type CurrentUser,
  type FollowState,
  type PresenceState,
  type UserProfile,
  type UserSummary,
  isoInstant,
  userId,
} from '../../models';

/** Minutes -> an ISO instant that many minutes in the past. */
export const minutesAgo = (minutes: number) =>
  isoInstant(new Date(Date.now() - minutes * 60_000));

const daysAgo = (days: number) => minutesAgo(days * 24 * 60);

interface UserSeed {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly avatar: number | null;
  readonly bio: string | null;
  readonly link: string | null;
  readonly verified?: boolean;
  readonly private?: boolean;
  readonly follows?: FollowState;
  readonly followsYou?: boolean;
  readonly presence?: PresenceState;
  readonly counts: readonly [posts: number, followers: number, following: number];
}

/**
 * Avatars are generated, not sourced: a deterministic hue per user id rendered
 * as initials by <bio-avatar>. `avatar: null` exercises that fallback path on
 * purpose, so it is never an untested branch.
 */
const SEEDS: readonly UserSeed[] = [
  {
    id: 'u_maya',
    username: 'maya.builds',
    displayName: 'Maya Fernandes',
    avatar: 2,
    bio: 'Photographer, plant hoarder, occasional baker. Shooting on film since 2019.',
    link: 'mayafernandes.example',
    counts: [128, 2410, 388],
    follows: 'following',
    followsYou: true,
    presence: 'active-now',
  },
  {
    id: 'u_dev',
    username: 'devreads',
    displayName: 'Dev Kapoor',
    avatar: null,
    bio: 'Mostly here to read. Occasionally posts a sunset.',
    link: null,
    counts: [9, 184, 402],
    follows: 'following',
    followsYou: true,
    presence: 'active-today',
  },
  {
    id: 'u_priya',
    username: 'priya',
    displayName: 'Priya Nair',
    avatar: 5,
    bio: 'Design systems. Long walks. Strong opinions about spacing scales.',
    link: 'priya.example/notes',
    verified: true,
    counts: [341, 18400, 512],
    follows: 'following',
    followsYou: false,
    presence: 'active-now',
  },
  {
    id: 'u_arjun',
    username: 'arjun.makes',
    displayName: 'Arjun Menon',
    avatar: 3,
    bio: 'Woodwork and slow mornings.',
    link: null,
    counts: [67, 903, 245],
    follows: 'following',
    followsYou: true,
    presence: 'hidden',
  },
  {
    id: 'u_lena',
    username: 'lena.k',
    displayName: 'Lena Kowalski',
    avatar: 7,
    bio: 'Architecture, concrete, and the light at 4pm.',
    link: null,
    counts: [212, 5120, 190],
    follows: 'following',
    followsYou: false,
    presence: 'active-today',
  },
  {
    id: 'u_sam',
    username: 'samuel.t',
    displayName: 'Samuel Torres',
    avatar: 4,
    bio: null,
    link: null,
    counts: [43, 610, 730],
    follows: 'not-following',
    followsYou: true,
    presence: 'hidden',
  },
  {
    id: 'u_nina',
    username: 'nina.writes',
    displayName: 'Nina Adeyemi',
    avatar: 6,
    bio: 'Essays, mostly. Private account, ask nicely.',
    link: null,
    private: true,
    counts: [88, 1204, 301],
    follows: 'requested',
    followsYou: false,
    presence: 'hidden',
  },
  {
    id: 'u_theo',
    username: 'theo',
    displayName: 'Theo Bergstrom',
    avatar: 8,
    bio: 'Cyclist. Coffee. Repeat.',
    link: null,
    counts: [156, 2210, 411],
    follows: 'not-following',
    followsYou: false,
    presence: 'active-today',
  },
];

function toProfile(seed: UserSeed): UserProfile {
  return {
    id: userId(seed.id),
    username: seed.username,
    displayName: seed.displayName,
    avatarUrl: seed.avatar === null ? null : `/media/m-0${seed.avatar}.svg`,
    isVerified: seed.verified ?? false,
    isPrivate: seed.private ?? false,
    bio: seed.bio,
    link: seed.link,
    joinedAt: daysAgo(420),
    counts: {
      posts: seed.counts[0],
      followers: seed.counts[1],
      following: seed.counts[2],
    },
    relationship: {
      isSelf: false,
      following: seed.follows ?? 'not-following',
      followsYou: seed.followsYou ?? false,
      isBlockedByYou: false,
      // Server-authoritative (risk R-04): a private account the viewer does not
      // follow withholds content, and the client never re-derives that rule.
      canViewContent: !(seed.private ?? false) || (seed.follows ?? 'not-following') === 'following',
      isMuted: false,
    },
    presence: seed.presence ?? 'hidden',
  };
}

export const USERS: readonly UserProfile[] = SEEDS.map(toProfile);

export const USERS_BY_HANDLE: ReadonlyMap<string, UserProfile> = new Map(
  USERS.map((user) => [user.username, user]),
);

/** Narrows a full profile to the summary embedded in posts, comments, etc. */
export function summaryOf(user: UserProfile): UserSummary {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isVerified: user.isVerified,
    isPrivate: user.isPrivate,
  };
}

export function findUser(handle: string): UserProfile {
  const user = USERS_BY_HANDLE.get(handle);
  if (!user) {
    throw new Error(`Fixture error: no user with handle "${handle}"`);
  }
  return user;
}

export const CURRENT_USER: CurrentUser = {
  id: userId('u_you'),
  username: 'hardik',
  displayName: 'Hardik Gadhvi',
  avatarUrl: null,
  isVerified: false,
  isPrivate: false,
  bio: 'Building BuddyIO. .NET and Angular.',
  link: null,
  joinedAt: daysAgo(90),
  counts: { posts: 12, followers: 341, following: 289 },
  relationship: {
    isSelf: true,
    following: 'not-following',
    followsYou: false,
    isBlockedByYou: false,
    canViewContent: true,
    isMuted: false,
  },
  presence: 'active-now',
  hasCompletedOnboarding: true,
  unreadNotifications: 3,
  unreadConversations: 2,
};
