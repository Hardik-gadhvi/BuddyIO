import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import type { Post, PostAudience } from '@core/models';
import { CompactCountPipe, ExactTimePipe, PluralPipe, TimeAgoPipe } from '@shared/pipes/format.pipes';
import { Avatar } from '@shared/ui/avatar/avatar';
import { BioButton } from '@shared/ui/button/button';
import { Icon } from '@shared/ui/icon/icon';
import type { IconName } from '@shared/ui/icon/icon-registry';
import { IconButton } from '@shared/ui/icon-button/icon-button';

export type PostMenuAction = 'copy-link' | 'mute' | 'unfollow' | 'report';

/** Caption is tokenised rather than injected as HTML - no innerHTML, no XSS surface. */
export interface CaptionToken {
  readonly kind: 'text' | 'hashtag' | 'mention';
  readonly value: string;
}

const AUDIENCE_META: Record<PostAudience, { icon: IconName; label: string }> = {
  public: { icon: 'globe', label: 'Public post' },
  followers: { icon: 'users', label: 'Visible to followers' },
  'close-friends': { icon: 'sparkle', label: 'Visible to close friends' },
};

/**
 * A single post in the feed.
 *
 * Presentational: it receives a `Post` and emits intent. It never injects the
 * facade, never fetches, and never mutates its input - which is what lets the
 * feed page own the optimistic-update contract in one place (ADR-0002).
 */
@Component({
  selector: 'bio-post-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    Avatar,
    BioButton,
    Icon,
    IconButton,
    TimeAgoPipe,
    ExactTimePipe,
    CompactCountPipe,
    PluralPipe,
  ],
  templateUrl: './post-card.html',
  styleUrl: './post-card.scss',
  host: {
    class: 'bio-post-card',
  },
})
export class PostCard {
  readonly post = input.required<Post>();
  /** True while one of this post's mutations is in flight. */
  readonly pending = input(false);

  readonly like = output<Post>();
  readonly save = output<Post>();
  readonly openComments = output<Post>();
  readonly share = output<Post>();
  readonly menuAction = output<{ readonly action: PostMenuAction; readonly post: Post }>();

  private readonly track = viewChild<ElementRef<HTMLElement>>('mediaTrack');

  protected readonly activeMedia = signal(0);

  protected readonly audience = computed(() => AUDIENCE_META[this.post().audience]);

  protected readonly mediaCount = computed(() => this.post().media.length);

  protected readonly profileLink = computed(() => ['/u', this.post().author.username]);

  protected readonly postLink = computed(() => ['/p', this.post().id]);

  /**
   * The media frame's aspect ratio, clamped between 4:5 and 16:9.
   *
   * Taken from the FIRST image so the box is reserved before anything loads
   * (no CLS), and clamped so a pathological 1:20 upload cannot produce a post
   * three screens tall. Anything outside the clamp letterboxes against
   * `--bio-surface-sunken` rather than being cropped - a silent crop destroys
   * the author's composition.
   */
  protected readonly aspectRatio = computed(() => {
    const first = this.post().media[0];
    if (!first) {
      return '4 / 5';
    }
    const ratio = first.width / first.height;
    const clamped = Math.min(Math.max(ratio, 0.8), 1.7778);
    return `${clamped}`;
  });

  protected readonly likeLabel = computed(() => {
    const post = this.post();
    const verb = post.engagement.viewerHasLiked ? 'Unlike' : 'Like';
    return `${verb} post by ${post.author.displayName}`;
  });

  protected readonly saveLabel = computed(() =>
    this.post().engagement.viewerHasSaved ? 'Remove from saved' : 'Save this post',
  );

  protected readonly captionTokens = computed<readonly CaptionToken[]>(() =>
    tokeniseCaption(this.post().caption),
  );

  /** Alt text is optional for authors, so the fallback must be honest, not empty. */
  protected mediaAlt(index: number): string {
    const media = this.post().media[index];
    if (media?.altText) {
      return media.altText;
    }
    const suffix = this.mediaCount() > 1 ? ` ${index + 1} of ${this.mediaCount()}` : '';
    return `Photo${suffix} from ${this.post().author.displayName}. No description was added.`;
  }

  protected goTo(index: number): void {
    const element = this.track()?.nativeElement;
    const clamped = Math.min(Math.max(index, 0), this.mediaCount() - 1);
    this.activeMedia.set(clamped);
    element?.scrollTo({ left: clamped * element.clientWidth, behavior: 'smooth' });
  }

  protected onTrackScroll(): void {
    const element = this.track()?.nativeElement;
    if (!element || element.clientWidth === 0) {
      return;
    }
    this.activeMedia.set(Math.round(element.scrollLeft / element.clientWidth));
  }

  protected emitMenu(action: PostMenuAction): void {
    this.menuAction.emit({ action, post: this.post() });
  }
}

function tokeniseCaption(caption: string): readonly CaptionToken[] {
  const tokens: CaptionToken[] = [];
  const pattern = /([#@][\w.]+)/g;
  let lastIndex = 0;

  for (const match of caption.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      tokens.push({ kind: 'text', value: caption.slice(lastIndex, index) });
    }
    const raw = match[0];
    tokens.push({
      kind: raw.startsWith('#') ? 'hashtag' : 'mention',
      value: raw.slice(1),
    });
    lastIndex = index + raw.length;
  }

  if (lastIndex < caption.length) {
    tokens.push({ kind: 'text', value: caption.slice(lastIndex) });
  }
  return tokens;
}
