import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState } from '@shared/patterns/empty-state/empty-state';
import { BioButton } from '@shared/ui/button/button';
import type { IconName } from '@shared/ui/icon/icon-registry';

/**
 * Honest placeholder for routes whose feature slice has not been built yet.
 *
 * The Phase 1 acceptance criteria forbid dead controls. Every navigation target
 * therefore resolves to something that states what will live here and which
 * increment builds it - a nav item that goes nowhere is a defect, and a 404 on
 * your own product's navigation is worse.
 *
 * Inputs are bound straight from route `data` via `withComponentInputBinding()`.
 */
@Component({
  selector: 'bio-placeholder-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BioButton, EmptyState, RouterLink],
  template: `
    <div class="placeholder">
      <bio-empty-state [icon]="icon()" [title]="heading()" [body]="body()">
        <a bioButton variant="neutral" size="md" routerLink="/feed">Back to your feed</a>
      </bio-empty-state>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60dvh;
      padding: var(--bio-space-6);
    }
  `,
})
export class PlaceholderPage {
  readonly heading = input.required<string>();
  readonly body = input<string | null>(null);
  readonly icon = input<IconName>('sparkle');
}
