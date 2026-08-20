import { Injectable, computed, signal } from '@angular/core';

export type ToastTone = 'neutral' | 'success' | 'danger';

export interface ToastAction {
  readonly label: string;
  readonly run: () => void;
}

export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly tone: ToastTone;
  readonly action: ToastAction | null;
}

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Transient messages.
 *
 * Exists because of the mutation contract in docs/04 section 9: when an
 * optimistic update is reverted, the revert must be EXPLAINED. A silent revert
 * looks like the app randomly undid the user's action, which is worse than the
 * original failure.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly items = signal<readonly Toast[]>([]);

  readonly toasts = this.items.asReadonly();

  /** Routed to a separate assertive live region - see ToastHost. */
  readonly politeToasts = computed(() => this.items().filter((t) => t.tone !== 'danger'));
  readonly assertiveToasts = computed(() => this.items().filter((t) => t.tone === 'danger'));

  show(
    message: string,
    options: { tone?: ToastTone; action?: ToastAction; timeoutMs?: number } = {},
  ): number {
    const id = this.nextId++;
    const toast: Toast = {
      id,
      message,
      tone: options.tone ?? 'neutral',
      action: options.action ?? null,
    };

    this.items.update((current) => [...current, toast]);

    const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (timeout > 0) {
      setTimeout(() => this.dismiss(id), timeout);
    }
    return id;
  }

  /** Convenience for the failure branch of a mutation. */
  error(message: string, action?: ToastAction): number {
    return this.show(message, { tone: 'danger', action });
  }

  dismiss(id: number): void {
    this.items.update((current) => current.filter((toast) => toast.id !== id));
  }

  clear(): void {
    this.items.set([]);
  }
}
