import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { SessionStore } from '@core/session/session.store';
import { ThemeService, type ThemePreference } from '@core/theme/theme.service';
import { Avatar } from '@shared/ui/avatar/avatar';
import { Badge } from '@shared/ui/badge/badge';
import { BioButton } from '@shared/ui/button/button';
import { Icon } from '@shared/ui/icon/icon';
import type { IconName } from '@shared/ui/icon/icon-registry';
import { IconButton } from '@shared/ui/icon-button/icon-button';
import { ToastService } from '@shared/ui/toast/toast.service';
import { DevPanel } from '@core/dev/dev-panel';
import { PRIMARY_NAV, type NavBadge } from '../nav-items';

const THEME_OPTIONS: readonly { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'Match system', icon: 'monitor' },
];

/**
 * The authenticated application shell.
 *
 * Owns all persistent chrome - skip link, top bar, sidebar, bottom navigation,
 * toast region - and renders the active route into `<main>`. It is the only
 * place any of these exist, so no feature can accidentally ship a second
 * navigation.
 *
 * Responsive behaviour is entirely CSS-driven (docs/01 section 4): the sidebar
 * and the bottom bar are both always in the DOM, and the breakpoint decides
 * which is displayed. Switching on a JS-observed viewport width would flash the
 * wrong chrome on first paint and would not survive a resize gracefully.
 */
@Component({
  selector: 'bio-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    Avatar,
    Badge,
    BioButton,
    DevPanel,
    Icon,
    IconButton,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly session = inject(SessionStore);
  protected readonly theme = inject(ThemeService);
  private readonly toasts = inject(ToastService);

  protected readonly navItems = PRIMARY_NAV;
  protected readonly themeOptions = THEME_OPTIONS;

  protected readonly user = this.session.user;

  protected readonly themeIcon = computed<IconName>(() => {
    switch (this.theme.preference()) {
      case 'light':
        return 'sun';
      case 'dark':
        return 'moon';
      default:
        return 'monitor';
    }
  });

  protected readonly themeLabel = computed(() => {
    const current = THEME_OPTIONS.find((option) => option.value === this.theme.preference());
    return `Theme: ${current?.label ?? 'Match system'}`;
  });

  /** Unread counts are cross-feature state, so they come from the session store. */
  protected badgeCount(badge: NavBadge): number {
    switch (badge) {
      case 'messages':
        return this.session.unreadConversations();
      case 'notifications':
        return this.session.unreadNotifications();
      default:
        return 0;
    }
  }

  /** Announced as "Messages, 2 unread" rather than as a bare number. */
  protected navLabel(label: string, badge: NavBadge): string {
    const count = this.badgeCount(badge);
    return count > 0 ? `${label}, ${count} unread` : label;
  }

  protected setTheme(preference: ThemePreference): void {
    this.theme.setPreference(preference);
  }

  protected notImplemented(what: string): void {
    this.toasts.show(`${what} arrives in a later increment.`);
  }
}
