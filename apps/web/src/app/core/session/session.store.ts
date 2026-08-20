import { Injectable, computed, signal } from '@angular/core';
import { CURRENT_USER } from '../mock/fixtures/users.fixture';
import type { CurrentUser } from '../models';

/**
 * The signed-in user and the counters the shell chrome depends on.
 *
 * Root-provided signal store rather than a facade, because this is genuinely
 * cross-feature state (ADR-0002). Phase 1 seeds it from a fixture; Phase 3
 * replaces the seed with the identity flow without changing its shape.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly currentUser = signal<CurrentUser | null>(CURRENT_USER);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly unreadNotifications = computed(() => this.currentUser()?.unreadNotifications ?? 0);
  readonly unreadConversations = computed(() => this.currentUser()?.unreadConversations ?? 0);

  signOut(): void {
    this.currentUser.set(null);
  }
}
