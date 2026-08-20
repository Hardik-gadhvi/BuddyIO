import { ChangeDetectionStrategy, Component, inject, isDevMode, signal } from '@angular/core';
import { MockControlService } from '@core/config/app-config';
import { BioButton } from '@shared/ui/button/button';
import { Icon } from '@shared/ui/icon/icon';

/**
 * Development-only controls for the mock transport.
 *
 * ADR-0003 rule 3: every error and loading state in the doc-03 matrix must be
 * reachable in the RUNNING app without editing code. Without this panel,
 * "the feed's error state" is a branch someone wrote once and nobody ever saw
 * again, and the Phase 1 review cannot actually verify it.
 *
 * Renders nothing outside dev mode, so it cannot ship to production.
 */
@Component({
  selector: 'bio-dev-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BioButton, Icon],
  template: `
    @if (isDev) {
      @if (open()) {
        <div class="devpanel" role="dialog" aria-label="Development controls">
          <div class="devpanel__head">
            <strong>Mock controls</strong>
            <button
              bioButton
              variant="ghost"
              size="sm"
              class="bio-button--icon"
              aria-label="Close development controls"
              (click)="open.set(false)"
            >
              <bio-icon name="x" [size]="16" />
            </button>
          </div>

          <label class="devpanel__field">
            <span>Latency: {{ controls.latencyMs() }} ms</span>
            <input
              type="range"
              min="0"
              max="3000"
              step="50"
              [value]="controls.latencyMs()"
              (input)="setLatency($event)"
            />
          </label>

          <label class="devpanel__field">
            <span>Error rate: {{ percent() }}%</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              [value]="percent()"
              (input)="setErrorRate($event)"
            />
          </label>

          <button bioButton variant="danger" size="sm" [fullWidth]="true" (click)="primeFailure()">
            {{ controls.isFailurePrimed() ? 'Next request will fail' : 'Fail the next request' }}
          </button>

          <p class="devpanel__hint">
            Set latency high to inspect skeletons, or prime a failure and hit Retry to walk the
            error path.
          </p>
        </div>
      } @else {
        <button
          class="devpanel__toggle"
          type="button"
          aria-label="Open development controls"
          (click)="open.set(true)"
        >
          <bio-icon name="settings" [size]="20" />
        </button>
      }
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .devpanel,
    .devpanel__toggle {
      position: fixed;
      inset-inline-end: var(--bio-space-3);
      /* Above the bottom bar on mobile, clear of the toast stack. */
      inset-block-end: calc(var(--bio-layout-bottomnav-h) + var(--bio-space-16));
      z-index: var(--bio-z-drawer);
    }

    @media (min-width: 768px) {
      .devpanel,
      .devpanel__toggle {
        inset-block-end: var(--bio-space-4);
        inset-inline-end: var(--bio-space-4);
      }
    }

    .devpanel__toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 1px solid var(--bio-border-default);
      border-radius: var(--bio-radius-circle);
      background: var(--bio-surface-raised);
      color: var(--bio-text-muted);
      box-shadow: var(--bio-elevation-2);
      cursor: pointer;
      opacity: 0.72;

      &:hover {
        opacity: 1;
      }

      &:focus-visible {
        outline: var(--bio-focus-ring-width) solid var(--bio-focus-ring);
        outline-offset: var(--bio-focus-ring-offset);
        opacity: 1;
      }
    }

    .devpanel {
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-3);
      width: min(280px, calc(100vw - var(--bio-space-6)));
      padding: var(--bio-space-4);
      border: 1px solid var(--bio-border-default);
      border-radius: var(--bio-radius-lg);
      background: var(--bio-surface-raised);
      box-shadow: var(--bio-elevation-4);
      font-size: var(--bio-font-size-body-sm);
    }

    .devpanel__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--bio-space-2);
    }

    .devpanel__field {
      display: flex;
      flex-direction: column;
      gap: var(--bio-space-1);
      font-size: var(--bio-font-size-caption);
      color: var(--bio-text-secondary);
    }

    input[type='range'] {
      width: 100%;
      accent-color: var(--bio-action-primary-bg);
    }

    .devpanel__hint {
      font-size: var(--bio-font-size-caption);
      color: var(--bio-text-muted);
      text-wrap: pretty;
    }
  `,
})
export class DevPanel {
  protected readonly controls = inject(MockControlService);
  protected readonly isDev = isDevMode();
  protected readonly open = signal(false);

  protected percent(): number {
    return Math.round(this.controls.errorRate() * 100);
  }

  protected setLatency(event: Event): void {
    this.controls.latencyMs.set(Number((event.target as HTMLInputElement).value));
  }

  protected setErrorRate(event: Event): void {
    this.controls.errorRate.set(Number((event.target as HTMLInputElement).value) / 100);
  }

  protected primeFailure(): void {
    this.controls.primeFailure();
  }
}
