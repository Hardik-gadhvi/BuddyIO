import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BioButton } from '@shared/ui/button/button';
import { Icon } from '@shared/ui/icon/icon';
import type { IconName } from '@shared/ui/icon/icon-registry';

interface Highlight {
  readonly icon: IconName;
  readonly title: string;
  readonly body: string;
}

/**
 * The signed-out landing page.
 *
 * Sells the product's actual position (docs/00): a calmer feed for people you
 * know. It deliberately does not claim things the product does not do - most
 * pointedly, nothing here says "private" or "encrypted" about messages, because
 * TLS is not end-to-end encryption (risk R-06).
 */
@Component({
  selector: 'bio-landing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BioButton, Icon, RouterLink],
  template: `
    <section class="hero">
      <div class="hero__text">
        <p class="hero__eyebrow">A social feed, minus the stadium</p>
        <h1 class="hero__title">
          Share your day with the people who
          <span class="hero__accent">actually know you</span>
        </h1>
        <p class="hero__body">
          BuddyIO is a calmer place to post photos, keep up with friends and talk in real time.
          No ads, no algorithmic guessing, no endless scroll designed to keep you here.
        </p>

        <div class="hero__actions">
          <a bioButton variant="primary" size="lg" routerLink="/sign-up">Create your account</a>
          <a bioButton variant="ghost" size="lg" routerLink="/sign-in">I already have one</a>
        </div>

        <p class="hero__note">Free while it is a portfolio project. Which is to say, free.</p>
      </div>

      <!-- Decorative: the real product shot replaces this later. -->
      <div class="hero__art" aria-hidden="true">
        <div class="hero__card hero__card--back"></div>
        <div class="hero__card hero__card--mid"></div>
        <div class="hero__card hero__card--front">
          <span class="hero__avatar"></span>
          <span class="hero__lines">
            <span></span>
            <span></span>
          </span>
        </div>
      </div>
    </section>

    <section class="points" aria-labelledby="points-title">
      <h2 id="points-title" class="points__title">What makes it different</h2>

      <ul class="points__list" role="list">
        @for (item of highlights; track item.title) {
          <li class="point">
            <span class="point__icon"><bio-icon [name]="item.icon" [size]="24" /></span>
            <h3 class="point__title">{{ item.title }}</h3>
            <p class="point__body">{{ item.body }}</p>
          </li>
        }
      </ul>
    </section>

    <section class="cta">
      <h2 class="cta__title">Ready when you are</h2>
      <p class="cta__body">It takes about a minute to set up.</p>
      <a bioButton variant="accent" size="lg" routerLink="/sign-up">Get started</a>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    /* ------------------------------- Hero ------------------------------- */
    .hero {
      display: grid;
      gap: var(--bio-space-10);
      align-items: center;
      max-width: var(--bio-layout-page-max);
      margin-inline: auto;
      padding: var(--bio-space-12) var(--bio-layout-gutter);
    }

    @media (min-width: 1024px) {
      .hero {
        grid-template-columns: 1.05fr 0.95fr;
        padding-inline: var(--bio-layout-gutter-md);
        padding-block: var(--bio-space-20);
      }
    }

    .hero__eyebrow {
      font-size: var(--bio-font-size-overline);
      font-weight: var(--bio-weight-semibold);
      letter-spacing: var(--bio-tracking-wide);
      text-transform: uppercase;
      color: var(--bio-text-accent);
    }

    .hero__title {
      margin-block-start: var(--bio-space-3);
      font-size: var(--bio-font-size-h1);
      line-height: var(--bio-line-height-h1);
      font-weight: var(--bio-weight-bold);
      letter-spacing: var(--bio-tracking-tight);
      text-wrap: balance;
    }

    @media (min-width: 768px) {
      .hero__title {
        font-size: var(--bio-font-size-display);
        line-height: var(--bio-line-height-display);
      }
    }

    .hero__accent {
      color: var(--bio-text-link);
    }

    .hero__body {
      max-width: 52ch;
      margin-block-start: var(--bio-space-4);
      font-size: var(--bio-font-size-body-lg);
      line-height: var(--bio-line-height-body-lg);
      color: var(--bio-text-secondary);
      text-wrap: pretty;
    }

    .hero__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--bio-space-3);
      margin-block-start: var(--bio-space-6);
    }

    .hero__note {
      margin-block-start: var(--bio-space-4);
      font-size: var(--bio-font-size-caption);
      color: var(--bio-text-muted);
    }

    /* Pure CSS composition - no image to download, nothing to license. */
    .hero__art {
      position: relative;
      display: none;
      height: 380px;
    }

    @media (min-width: 1024px) {
      .hero__art {
        display: block;
      }
    }

    .hero__card {
      position: absolute;
      border-radius: var(--bio-radius-xl);
      border: 1px solid var(--bio-border-subtle);
      background: var(--bio-surface-default);
      box-shadow: var(--bio-elevation-2);
    }

    .hero__card--back {
      inset: 40px 120px 140px 0;
      background: var(--bio-surface-tint);
      rotate: -6deg;
    }

    .hero__card--mid {
      inset: 90px 40px 60px 80px;
      background: var(--bio-coral-50);
      rotate: 4deg;
    }

    .hero__card--front {
      display: flex;
      align-items: center;
      gap: var(--bio-space-3);
      inset: 150px 0 40px 40px;
      padding: var(--bio-space-5);
      box-shadow: var(--bio-elevation-3);
    }

    .hero__avatar {
      width: 44px;
      height: 44px;
      flex: none;
      border-radius: var(--bio-radius-circle);
      background: var(--bio-indigo-300);
    }

    .hero__lines {
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-2);
      flex: 1;
    }

    .hero__lines span {
      height: 10px;
      border-radius: var(--bio-radius-pill);
      background: var(--bio-surface-sunken);
    }

    .hero__lines span:last-child {
      width: 60%;
    }

    /* ------------------------------ Points ------------------------------ */
    .points {
      max-width: var(--bio-layout-page-max);
      margin-inline: auto;
      padding: var(--bio-space-12) var(--bio-layout-gutter);
    }

    .points__title {
      font-size: var(--bio-font-size-h2);
      line-height: var(--bio-line-height-h2);
      font-weight: var(--bio-weight-bold);
      letter-spacing: var(--bio-tracking-snug);
      text-align: center;
    }

    .points__list {
      display: grid;
      gap: var(--bio-space-6);
      margin-block-start: var(--bio-space-8);
      list-style: none;
      padding: 0;
    }

    @media (min-width: 768px) {
      .points__list {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .point {
      padding: var(--bio-space-6);
      border: 1px solid var(--bio-border-subtle);
      border-radius: var(--bio-radius-lg);
      background: var(--bio-surface-default);
    }

    .point__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: var(--bio-radius-md);
      background: var(--bio-surface-tint);
      color: var(--bio-text-link);
    }

    .point__title {
      margin-block-start: var(--bio-space-4);
      font-size: var(--bio-font-size-h4);
      line-height: var(--bio-line-height-h4);
      font-weight: var(--bio-weight-semibold);
    }

    .point__body {
      margin-block-start: var(--bio-space-2);
      font-size: var(--bio-font-size-body-sm);
      line-height: var(--bio-line-height-body-sm);
      color: var(--bio-text-secondary);
      text-wrap: pretty;
    }

    /* -------------------------------- CTA ------------------------------- */
    .cta {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--bio-space-3);
      max-width: var(--bio-layout-page-max);
      margin-inline: auto;
      padding: var(--bio-space-16) var(--bio-layout-gutter);
      text-align: center;
    }

    .cta__title {
      font-size: var(--bio-font-size-h2);
      line-height: var(--bio-line-height-h2);
      font-weight: var(--bio-weight-bold);
    }

    .cta__body {
      color: var(--bio-text-muted);
    }
  `,
})
export class LandingPage {
  protected readonly highlights: readonly Highlight[] = [
    {
      icon: 'users',
      title: 'People, not reach',
      body: 'A chronological feed of the accounts you follow. Nothing is promoted, hidden or reordered to hold your attention.',
    },
    {
      icon: 'message',
      title: 'Conversations that keep up',
      body: 'Real-time messages with honest delivery and read state. If something fails to send, you will know, and it will still be there.',
    },
    {
      icon: 'lock',
      title: 'Controls that mean something',
      body: 'Public, followers or close friends, chosen per post. Block, mute and report are enforced on the server, not just hidden in your view.',
    },
  ];
}
