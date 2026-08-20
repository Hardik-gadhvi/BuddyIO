import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The centred card every auth screen sits in.
 *
 * Exists so sign-in, sign-up and password reset cannot drift apart in spacing,
 * heading level or max width. It owns the page's single `<h1>`.
 */
@Component({
  selector: 'bio-auth-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth">
      <div class="auth__card">
        <h1 class="auth__title">{{ title() }}</h1>
        @if (subtitle(); as text) {
          <p class="auth__subtitle">{{ text }}</p>
        }

        <div class="auth__content">
          <ng-content />
        </div>
      </div>

      <p class="auth__aside">
        <ng-content select="[authAside]" />
      </p>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .auth {
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-4);
      width: 100%;
      max-width: 440px;
      margin-inline: auto;
      padding: var(--bio-space-8) var(--bio-layout-gutter) var(--bio-space-16);
    }

    .auth__card {
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-2);
      padding: var(--bio-space-6);
      border: 1px solid var(--bio-border-subtle);
      border-radius: var(--bio-radius-xl);
      background: var(--bio-surface-default);
      box-shadow: var(--bio-elevation-1);
    }

    @media (max-width: 479.98px) {
      /* On the smallest screens the card border is noise - go flush. */
      .auth__card {
        padding-inline: var(--bio-space-4);
      }
    }

    .auth__title {
      font-size: var(--bio-font-size-h2);
      line-height: var(--bio-line-height-h2);
      font-weight: var(--bio-weight-bold);
      letter-spacing: var(--bio-tracking-snug);
    }

    .auth__subtitle {
      font-size: var(--bio-font-size-body-sm);
      line-height: var(--bio-line-height-body-sm);
      color: var(--bio-text-muted);
      text-wrap: pretty;
    }

    .auth__content {
      margin-block-start: var(--bio-space-4);
    }

    .auth__aside {
      text-align: center;
      font-size: var(--bio-font-size-body-sm);
      color: var(--bio-text-muted);
    }

    .auth__aside:not(:has(*)) {
      display: none;
    }
  `,
})
export class AuthCard {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
