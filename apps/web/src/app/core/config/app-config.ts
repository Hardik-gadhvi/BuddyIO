import { InjectionToken, computed, inject, Injectable, signal } from '@angular/core';

/**
 * Runtime configuration for the web client.
 *
 * Phase 1 supplies literal defaults. Phase 3 will generate this from `.env`
 * at build time (see `.env.example`); nothing that reads the token needs to
 * change when that happens.
 */
export interface BuddyIoConfig {
  /** Which repository implementations get bound at bootstrap (ADR-0003). */
  readonly dataSource: 'mock' | 'http';
  readonly mockLatencyMs: number;
  /** 0..1 - probability that any given mock call fails. */
  readonly mockErrorRate: number;
  readonly apiBaseUrl: string | null;
}

export const DEFAULT_CONFIG: BuddyIoConfig = {
  dataSource: 'mock',
  mockLatencyMs: 450,
  mockErrorRate: 0,
  apiBaseUrl: null,
};

export const BUDDYIO_CONFIG = new InjectionToken<BuddyIoConfig>('BUDDYIO_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_CONFIG,
});

/**
 * Live controls over the mock transport.
 *
 * ADR-0003 rule 3 says every error state in the doc-03 matrix must be reachable
 * in the running app *without editing code*. That is what this exists for: the
 * dev panel writes to these signals, the mock transport reads them.
 *
 * In a `http` build this service is inert - nothing reads it.
 */
@Injectable({ providedIn: 'root' })
export class MockControlService {
  private readonly config = inject(BUDDYIO_CONFIG);

  readonly latencyMs = signal(this.config.mockLatencyMs);
  readonly errorRate = signal(this.config.mockErrorRate);

  /** When true, the very next mock call fails and the flag clears itself. */
  private readonly forceNextFailure = signal(false);

  readonly isFailurePrimed = computed(() => this.forceNextFailure());

  primeFailure(): void {
    this.forceNextFailure.set(true);
  }

  clearPrimedFailure(): void {
    this.forceNextFailure.set(false);
  }

  /** Called by the transport. Consumes the primed failure if one is set. */
  shouldFail(): boolean {
    if (this.forceNextFailure()) {
      this.forceNextFailure.set(false);
      return true;
    }
    return Math.random() < this.errorRate();
  }
}
