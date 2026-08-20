import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output } from '@angular/core';

export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly count?: number | null;
}

/**
 * A tab strip with correct keyboard semantics.
 *
 * Built rather than borrowed because the WAI-ARIA tabs pattern has one
 * requirement that is almost always got wrong: the strip is a SINGLE tab stop
 * with a roving tabindex, and arrow keys move between tabs. Rendering N
 * focusable buttons means a user with 5 tabs presses Tab 5 times to get past
 * them.
 *
 * `role="tab"` elements point at their panel with `aria-controls`; the panel is
 * owned by the caller, which passes its id.
 */
@Component({
  selector: 'bio-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bio-tabs__list" role="tablist" (keydown)="onKeydown($event)">
      @for (tab of tabs(); track tab.id; let i = $index) {
        <button
          type="button"
          role="tab"
          class="bio-tabs__tab"
          [class.bio-tabs__tab--active]="tab.id === activeId()"
          [id]="tabId(tab.id)"
          [attr.aria-selected]="tab.id === activeId()"
          [attr.aria-controls]="panelId(tab.id)"
          [tabIndex]="tab.id === activeId() ? 0 : -1"
          (click)="select(tab.id)"
        >
          {{ tab.label }}
          @if (tab.count != null) {
            <span class="bio-tabs__count">{{ tab.count }}</span>
          }
        </button>
      }
    </div>
  `,
  host: {
    class: 'bio-tabs',
  },
  styles: `
    .bio-tabs {
      display: block;
    }

    .bio-tabs__list {
      display: flex;
      gap: var(--bio-space-1);
      border-block-end: 1px solid var(--bio-border-subtle);
      overflow-x: auto;
      scrollbar-width: none;
    }

    .bio-tabs__list::-webkit-scrollbar {
      display: none;
    }

    .bio-tabs__tab {
      display: inline-flex;
      align-items: center;
      gap: var(--bio-space-2);
      min-height: 44px;
      padding-inline: var(--bio-space-4);
      border: none;
      border-block-end: 2px solid transparent;
      background: transparent;
      color: var(--bio-text-muted);
      font-size: var(--bio-font-size-body-sm);
      font-weight: var(--bio-weight-medium);
      white-space: nowrap;
      cursor: pointer;
      transition: color var(--bio-duration-fast) var(--bio-ease-standard);

      &:hover {
        color: var(--bio-text-primary);
      }

      &:focus-visible {
        outline: var(--bio-focus-ring-width) solid var(--bio-focus-ring);
        outline-offset: -2px;
      }

      /* Weight and an underline, not just colour. */
      &--active {
        color: var(--bio-text-primary);
        font-weight: var(--bio-weight-semibold);
        border-block-end-color: var(--bio-action-primary-bg);
      }
    }

    .bio-tabs__count {
      font-size: var(--bio-font-size-caption);
      font-variant-numeric: tabular-nums;
      color: var(--bio-text-muted);
    }
  `,
})
export class Tabs {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly tabs = input.required<readonly TabItem[]>();
  readonly activeId = input.required<string>();
  /** Prefix used to build tab/panel ids so aria-controls resolves. */
  readonly idPrefix = input('bio-tab');

  readonly tabChange = output<string>();

  protected readonly activeIndex = computed(() =>
    this.tabs().findIndex((tab) => tab.id === this.activeId()),
  );

  protected tabId(id: string): string {
    return `${this.idPrefix()}-${id}`;
  }

  protected panelId(id: string): string {
    return `${this.idPrefix()}-${id}-panel`;
  }

  protected select(id: string): void {
    if (id !== this.activeId()) {
      this.tabChange.emit(id);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.tabs().length;
    if (count === 0) {
      return;
    }

    const current = this.activeIndex();
    let next: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        next = (current + 1) % count;
        break;
      case 'ArrowLeft':
        next = (current - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const target = this.tabs()[next];
    if (!target) {
      return;
    }
    this.tabChange.emit(target.id);
    // Focus must follow selection, or the roving tabindex strands the user.
    queueMicrotask(() => {
      this.host.nativeElement
        .querySelector<HTMLElement>(`#${CSS.escape(this.tabId(target.id))}`)
        ?.focus();
    });
  }
}
