import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Terms and Privacy placeholders.
 *
 * These are NOT legal documents and say so plainly at the top. Shipping
 * plausible-looking invented legal text would be worse than shipping nothing:
 * a reader cannot tell the difference, and a portfolio project has no business
 * implying it has been reviewed by anyone.
 *
 * `document` is bound from route data by `withComponentInputBinding()`.
 */
@Component({
  selector: 'bio-legal-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="legal">
      <h1 class="legal__title">{{ heading() }}</h1>

      <p class="legal__notice" role="note">
        <strong>Placeholder.</strong> BuddyIO is a portfolio project. This page exists so the
        links in the product resolve to something honest. It is not a legal agreement, it has
        not been reviewed by a lawyer, and it does not bind anyone.
      </p>

      <p class="legal__body">
        Before this project were ever operated as a real service, this page would need to
        cover the points below, drafted and reviewed properly.
      </p>

      <ul class="legal__list">
        @for (point of points(); track point) {
          <li>{{ point }}</li>
        }
      </ul>

      <p class="legal__body">
        The engineering groundwork for these commitments is tracked in
        <code>docs/00-product-brief.md</code> and the security section of the project
        specification.
      </p>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }

    .legal {
      max-width: 68ch;
      margin-inline: auto;
      padding: var(--bio-space-12) var(--bio-layout-gutter) var(--bio-space-16);
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-4);
    }

    .legal__title {
      font-size: var(--bio-font-size-h1);
      line-height: var(--bio-line-height-h1);
      font-weight: var(--bio-weight-bold);
      letter-spacing: var(--bio-tracking-tight);
    }

    .legal__notice {
      padding: var(--bio-space-4);
      border: 1px solid var(--bio-warning-border);
      border-radius: var(--bio-radius-md);
      background: var(--bio-warning-bg);
      color: var(--bio-warning-fg);
      font-size: var(--bio-font-size-body-sm);
      line-height: var(--bio-line-height-body-sm);
      text-wrap: pretty;
    }

    .legal__body {
      color: var(--bio-text-secondary);
      text-wrap: pretty;
    }

    .legal__list {
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-2);
      padding-inline-start: var(--bio-space-5);
      color: var(--bio-text-secondary);
    }

    code {
      font-family: var(--bio-font-mono);
      font-size: 0.9375em;
      padding: 1px 5px;
      border-radius: var(--bio-radius-xs);
      background: var(--bio-surface-sunken);
    }
  `,
})
export class LegalPage {
  readonly document = input<'terms' | 'privacy'>('terms');

  protected readonly heading = computed(() =>
    this.document() === 'privacy' ? 'Privacy Policy' : 'Terms of Service',
  );

  protected readonly points = computed<readonly string[]>(() =>
    this.document() === 'privacy'
      ? [
          'What personal data is collected, why, and the lawful basis for it.',
          'How long each category is retained, and what happens when an account is deleted.',
          'Who data is shared with, including infrastructure providers and their regions.',
          'How to export your data, and how to request deletion.',
          'How cookies and similar storage are used, and how to refuse the non-essential ones.',
          'That transport is encrypted with TLS - and that this is NOT end-to-end encryption of message content.',
        ]
      : [
          'Who may use BuddyIO, including the minimum age.',
          'What counts as acceptable use, and what gets content or accounts removed.',
          'Who owns the content you post, and what licence you grant by posting it.',
          'How moderation decisions are made and how to appeal one.',
          'Termination, suspension, and what happens to your content afterwards.',
          'Liability, warranties, and the governing jurisdiction.',
        ],
  );
}
