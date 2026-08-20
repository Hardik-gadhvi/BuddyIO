import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '@shared/ui/icon/icon';
import type { IconName } from '@shared/ui/icon/icon-registry';

/**
 * The "there is nothing here" state.
 *
 * Rule from docs/03: an empty state always says what would be here, why it is
 * not, and what to do next. A bare "No data" is a defect, not a state.
 *
 * The title is a <p>, not a heading: an empty state is a message inside a
 * region, not a new section of the document outline. Emitting an <h2> here
 * would inject a phantom level into the page's heading structure and break
 * screen-reader navigation.
 */
@Component({
  selector: 'bio-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <bio-icon [name]="icon()" [size]="32" />
    <p class="bio-empty-state__title">{{ title() }}</p>
    @if (body(); as text) {
      <p class="bio-empty-state__body">{{ text }}</p>
    }
    <div class="bio-empty-state__actions">
      <ng-content />
    </div>
  `,
  host: {
    class: 'bio-empty-state',
  },
  styles: `
    .bio-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--bio-space-3);
      padding: var(--bio-space-12) var(--bio-space-6);
      text-align: center;
      color: var(--bio-text-muted);
    }

    bio-icon {
      color: var(--bio-text-disabled);
    }

    .bio-empty-state__title {
      font-size: var(--bio-font-size-h4);
      line-height: var(--bio-line-height-h4);
      font-weight: var(--bio-weight-semibold);
      color: var(--bio-text-primary);
    }

    .bio-empty-state__body {
      max-width: 42ch;
      font-size: var(--bio-font-size-body-sm);
      line-height: var(--bio-line-height-body-sm);
      text-wrap: pretty;
    }

    .bio-empty-state__actions:empty {
      display: none;
    }

    .bio-empty-state__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--bio-space-2);
      margin-block-start: var(--bio-space-2);
    }
  `,
})
export class EmptyState {
  readonly icon = input<IconName>('sparkle');
  readonly title = input.required<string>();
  readonly body = input<string | null>(null);
}
