import {
  type Comment,
  type Post,
  type PostAudience,
  type PostMedia,
  commentId,
  mediaId,
  postId,
} from '../../models';
import { findUser, minutesAgo, summaryOf } from './users.fixture';

/**
 * Intrinsic dimensions of the generated placeholder images in `public/media`.
 *
 * These are not decoration: PostMedia.width/height are required fields and the
 * media frame reserves its box from them before any image loads. That is what
 * makes layout shift structurally impossible (docs/02 section 9).
 */
const MEDIA_SIZES: Record<string, readonly [number, number]> = {
  'm-01': [1080, 1350],
  'm-02': [1080, 1080],
  'm-03': [1080, 810],
  'm-04': [1080, 1350],
  'm-05': [1080, 1080],
  'm-06': [1080, 1350],
  'm-07': [1080, 1080],
  'm-08': [1080, 810],
};

function media(slug: string, altText: string | null): PostMedia {
  const size = MEDIA_SIZES[slug];
  if (!size) {
    throw new Error(`Fixture error: unknown media slug ${slug}`);
  }
  return {
    id: mediaId(`md_${slug}`),
    kind: 'image',
    url: `/media/${slug}.svg`,
    width: size[0],
    height: size[1],
    altText,
    placeholder: null,
  };
}

interface CommentSeed {
  readonly id: string;
  readonly handle: string;
  readonly body: string;
  readonly minutes: number;
  readonly likes?: number;
}

interface PostSeed {
  readonly id: string;
  readonly handle: string;
  readonly media: readonly (readonly [slug: string, alt: string | null])[];
  readonly caption: string;
  readonly hashtags?: readonly string[];
  readonly location?: string;
  readonly audience?: PostAudience;
  readonly minutes: number;
  readonly likes: number;
  readonly liked?: boolean;
  readonly saved?: boolean;
  readonly canComment?: boolean;
  readonly comments?: readonly CommentSeed[];
  readonly removed?: 'deleted-by-author' | 'removed-by-moderation';
}

const SEEDS: readonly PostSeed[] = [
  {
    id: 'p_001',
    handle: 'maya.builds',
    media: [['m-01', 'A tall window casting long shapes across a pale wall']],
    caption:
      'Spent the morning chasing the light in the stairwell. Six rolls in and I still cannot walk past this window.',
    hashtags: ['filmphotography', 'availablelight'],
    location: 'Lisbon, Portugal',
    minutes: 14,
    likes: 248,
    liked: false,
    comments: [
      {
        id: 'c_001',
        handle: 'priya',
        body: 'The falloff on the left edge is unreal. What stock is this?',
        minutes: 9,
        likes: 12,
      },
      {
        id: 'c_002',
        handle: 'devreads',
        body: 'Saving this one.',
        minutes: 4,
      },
    ],
  },
  {
    id: 'p_002',
    handle: 'priya',
    media: [
      ['m-02', 'Overlapping translucent shapes in indigo and coral'],
      ['m-05', 'A softer variation of the same composition'],
      ['m-07', null],
    ],
    caption:
      'Three passes at the same idea. Second one is closest, but the first has something the others lost. Swipe for the whole set.',
    hashtags: ['designsystems', 'colour'],
    audience: 'followers',
    minutes: 96,
    likes: 1840,
    liked: true,
    saved: true,
    comments: [
      {
        id: 'c_003',
        handle: 'lena.k',
        body: 'Second one. Not close.',
        minutes: 61,
        likes: 34,
      },
    ],
  },
  {
    id: 'p_003',
    handle: 'devreads',
    media: [['m-03', 'A low horizon at dusk with a band of warm cloud']],
    caption: 'Obligatory sunset. I do not make the rules.',
    minutes: 210,
    likes: 92,
    comments: [],
  },
  {
    id: 'p_004',
    handle: 'arjun.makes',
    media: [['m-04', 'A half-finished chair frame resting on a workbench']],
    caption:
      'Four evenings on the joinery and it finally sits flat. The trick was giving up on the router and going back to the chisel.',
    hashtags: ['woodworking', 'slowmade'],
    location: 'Kochi, India',
    minutes: 380,
    likes: 431,
    liked: false,
    comments: [
      {
        id: 'c_004',
        handle: 'samuel.t',
        body: 'That joint is clean. How long did the dry fit take?',
        minutes: 300,
        likes: 3,
      },
      {
        id: 'c_005',
        handle: 'maya.builds',
        body: 'The chisel always wins eventually.',
        minutes: 240,
        likes: 8,
      },
    ],
  },
  {
    id: 'p_005',
    handle: 'lena.k',
    media: [['m-05', 'Concrete stair treads photographed from directly above']],
    caption: 'Brutalism gets a bad name from people who have only seen it in the rain.',
    hashtags: ['architecture', 'concrete'],
    minutes: 640,
    likes: 2104,
    saved: true,
    comments: [],
  },
  {
    id: 'p_006',
    handle: 'theo',
    media: [['m-08', 'An empty road curving between low green hills']],
    caption: 'Ninety kilometres and not one car. Comments are off on this one, sorry.',
    hashtags: ['cycling'],
    minutes: 900,
    likes: 318,
    canComment: false,
    comments: [],
  },
  {
    id: 'p_007',
    handle: 'maya.builds',
    media: [
      ['m-06', 'A pale interior with a single chair by a window'],
      ['m-01', 'The same room from the opposite corner'],
    ],
    caption: 'Before and after, six months apart. Same chair.',
    audience: 'close-friends',
    minutes: 1500,
    likes: 176,
    liked: true,
    comments: [
      {
        id: 'c_006',
        handle: 'nina.writes',
        body: 'The light did all the work.',
        minutes: 1400,
        likes: 5,
      },
    ],
  },
  {
    id: 'p_008',
    handle: 'samuel.t',
    media: [['m-07', null]],
    caption:
      'Testing something. This post has no alt text on purpose so the fallback description is exercised.',
    minutes: 2200,
    likes: 21,
    comments: [],
  },
  {
    id: 'p_009',
    handle: 'priya',
    media: [['m-02', 'A grid of colour swatches']],
    caption: 'This one came down.',
    minutes: 3000,
    likes: 0,
    removed: 'deleted-by-author',
    comments: [],
  },
  {
    id: 'p_010',
    handle: 'lena.k',
    media: [['m-03', 'A long shadow across a plaza at midday']],
    caption:
      'Every city has one square that only works for about eleven minutes a day. This is that square, and those are the eleven minutes.',
    hashtags: ['architecture', 'shadows', 'midday'],
    location: 'Warsaw, Poland',
    minutes: 4300,
    likes: 887,
    comments: [
      {
        id: 'c_007',
        handle: 'theo',
        body: 'Rode past this last summer and completely missed it.',
        minutes: 4100,
      },
    ],
  },
  {
    id: 'p_011',
    handle: 'arjun.makes',
    media: [['m-04', 'Wood shavings collected on a workshop floor']],
    caption: 'The part nobody photographs.',
    minutes: 5800,
    likes: 264,
    comments: [],
  },
  {
    id: 'p_012',
    handle: 'theo',
    media: [['m-08', 'A bicycle leaning against a stone wall at first light']],
    caption: 'Out before the town woke up.',
    hashtags: ['cycling', 'earlystart'],
    minutes: 7400,
    likes: 512,
    liked: true,
    comments: [],
  },
];

function toComment(seed: CommentSeed, parent: string): Comment {
  return {
    id: commentId(seed.id),
    postId: postId(parent),
    author: summaryOf(findUser(seed.handle)),
    body: seed.body,
    createdAt: minutesAgo(seed.minutes),
    likeCount: seed.likes ?? 0,
    viewerHasLiked: false,
    replyingTo: null,
  };
}

function toPost(seed: PostSeed): Post {
  const comments = (seed.comments ?? []).map((comment) => toComment(comment, seed.id));

  return {
    id: postId(seed.id),
    author: summaryOf(findUser(seed.handle)),
    media: seed.media.map(([slug, alt]) => media(slug, alt)),
    caption: seed.caption,
    hashtags: seed.hashtags ?? [],
    location: seed.location ?? null,
    audience: seed.audience ?? 'public',
    createdAt: minutesAgo(seed.minutes),
    engagement: {
      likeCount: seed.likes,
      commentCount: comments.length,
      viewerHasLiked: seed.liked ?? false,
      viewerHasSaved: seed.saved ?? false,
      canComment: seed.canComment ?? true,
    },
    previewComments: comments.slice(0, 2),
    removed: seed.removed
      ? { reason: seed.removed, removedAt: minutesAgo(seed.minutes - 100) }
      : null,
  };
}

/** Newest first - the feed is strictly reverse-chronological (assumption A-01). */
export const POSTS: readonly Post[] = SEEDS.map(toPost);
