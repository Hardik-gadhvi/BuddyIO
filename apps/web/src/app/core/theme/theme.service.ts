import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'buddyio.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Theme preference, resolved theme, and the single place the DOM is touched.
 *
 * The contract with _tokens.scss:
 *   - preference 'light' | 'dark' -> `data-theme` attribute is SET (explicit
 *     choice wins over the OS in both directions)
 *   - preference 'system'         -> attribute is REMOVED, so the
 *     `prefers-color-scheme` media query decides
 *
 * Any other arrangement produces the classic bug where a user who picks Light
 * on a dark-mode OS still gets a dark page.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  /** Tracks the OS setting so `resolved` recomputes when the OS flips. */
  private readonly systemPrefersDark = signal(this.readSystemPreference());

  readonly preference = signal<ThemePreference>(this.readStoredPreference());

  readonly resolved = computed<ResolvedTheme>(() => {
    const preference = this.preference();
    if (preference !== 'system') {
      return preference;
    }
    return this.systemPrefersDark() ? 'dark' : 'light';
  });

  constructor() {
    this.watchSystemPreference();

    effect(() => {
      const preference = this.preference();
      const resolved = this.resolved();
      const root = this.document.documentElement;

      if (preference === 'system') {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', preference);
      }

      // Keeps mobile browser chrome in step with the page.
      this.document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', resolved === 'dark' ? '#101014' : '#f6f5f3');

      this.persist(preference);
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
  }

  /** Light -> Dark -> System -> Light. Used by the top-bar toggle. */
  cycle(): void {
    const order: readonly ThemePreference[] = ['light', 'dark', 'system'];
    const next = (order.indexOf(this.preference()) + 1) % order.length;
    this.preference.set(order[next]!);
  }

  private watchSystemPreference(): void {
    const media = this.document.defaultView?.matchMedia?.(DARK_QUERY);
    if (!media) {
      return;
    }
    media.addEventListener('change', (event) => this.systemPrefersDark.set(event.matches));
  }

  private readSystemPreference(): boolean {
    return this.document.defaultView?.matchMedia?.(DARK_QUERY).matches ?? false;
  }

  private readStoredPreference(): ThemePreference {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    } catch {
      // Private browsing / blocked storage must not break the app.
      return 'system';
    }
  }

  private persist(preference: ThemePreference): void {
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Non-fatal: the theme still applies for this session.
    }
  }
}
