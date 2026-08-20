import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ThemeService, type ThemePreference } from '@core/theme/theme.service';
import { BioButton } from '@shared/ui/button/button';
import { Icon } from '@shared/ui/icon/icon';
import type { IconName } from '@shared/ui/icon/icon-registry';

const THEME_OPTIONS: readonly { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'Match system', icon: 'monitor' },
];

/**
 * Chrome for signed-out routes: landing, sign-in, sign-up, password reset, legal.
 *
 * A separate layout from the app shell rather than a variant of it. The two
 * have almost nothing in common - no primary navigation, no unread counts, no
 * account menu - and conditionally hiding half the shell would leave the
 * authenticated chrome one bug away from rendering to a signed-out visitor.
 */
@Component({
  selector: 'bio-public-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterOutlet, CdkMenu, CdkMenuItem, CdkMenuTrigger, BioButton, Icon],
  template: `
    <a class="bio-skip-link" href="#bio-main">Skip to content</a>

    <div class="public">
      <header class="public__header">
        <a class="public__brand" routerLink="/" aria-label="BuddyIO home">
          <img src="/brand/mark.svg" alt="" width="30" height="30" aria-hidden="true" />
          <span class="public__wordmark">buddy<span class="public__accent">IO</span></span>
        </a>

        <div class="public__actions">
          <button
            bioButton
            variant="ghost"
            size="sm"
            class="bio-button--icon"
            [attr.aria-label]="themeLabel()"
            [cdkMenuTriggerFor]="themeMenu"
          >
            <bio-icon [name]="themeIcon()" [size]="20" />
          </button>

          <a bioButton variant="ghost" size="sm" routerLink="/sign-in">Sign in</a>
          <a bioButton variant="primary" size="sm" routerLink="/sign-up">Create account</a>
        </div>
      </header>

      <main id="bio-main" class="public__main" tabindex="-1">
        <router-outlet />
      </main>

      <footer class="public__footer">
        <p class="public__copyright">BuddyIO &middot; a portfolio project</p>
        <nav class="public__links" aria-label="Footer">
          <a routerLink="/legal/terms">Terms</a>
          <a routerLink="/legal/privacy">Privacy</a>
        </nav>
      </footer>
    </div>

    <ng-template #themeMenu>
      <div class="bio-menu" cdkMenu>
        @for (option of themeOptions; track option.value) {
          <button
            class="bio-menu__item"
            cdkMenuItem
            [attr.aria-current]="theme.preference() === option.value ? 'true' : null"
            (cdkMenuItemTriggered)="theme.setPreference(option.value)"
          >
            <bio-icon [name]="option.icon" [size]="20" />
            {{ option.label }}
            @if (theme.preference() === option.value) {
              <bio-icon name="check" [size]="20" class="bio-menu__check" label="Selected" />
            }
          </button>
        }
      </div>
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
    }

    .public {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
      background: var(--bio-surface-canvas);
    }

    .public__header {
      display: flex;
      align-items: center;
      gap: var(--bio-space-3);
      height: var(--bio-layout-topbar-h-md);
      padding-inline: var(--bio-layout-gutter);
      max-width: var(--bio-layout-page-max);
      width: 100%;
      margin-inline: auto;
    }

    @media (min-width: 768px) {
      .public__header {
        padding-inline: var(--bio-layout-gutter-md);
      }
    }

    .public__brand {
      display: flex;
      align-items: center;
      gap: var(--bio-space-2);
      border-radius: var(--bio-radius-md);
      text-decoration: none;

      &:focus-visible {
        outline: var(--bio-focus-ring-width) solid var(--bio-focus-ring);
        outline-offset: var(--bio-focus-ring-offset);
      }
    }

    .public__wordmark {
      font-size: var(--bio-font-size-h4);
      font-weight: var(--bio-weight-bold);
      letter-spacing: -0.03em;
      color: var(--bio-text-primary);
    }

    .public__accent {
      color: var(--bio-text-accent);
    }

    .public__actions {
      display: flex;
      align-items: center;
      gap: var(--bio-space-2);
      margin-inline-start: auto;
    }

    .public__main {
      flex: 1;
    }

    .public__footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--bio-space-4);
      max-width: var(--bio-layout-page-max);
      width: 100%;
      margin-inline: auto;
      padding: var(--bio-space-8) var(--bio-layout-gutter);
      border-block-start: 1px solid var(--bio-border-subtle);
      font-size: var(--bio-font-size-body-sm);
      color: var(--bio-text-muted);
    }

    .public__links {
      display: flex;
      gap: var(--bio-space-4);
      margin-inline-start: auto;
    }

    .public__links a {
      color: var(--bio-text-muted);
      text-decoration: none;

      &:hover {
        color: var(--bio-text-primary);
        text-decoration: underline;
      }
    }
  `,
})
export class PublicLayout {
  protected readonly theme = inject(ThemeService);
  protected readonly themeOptions = THEME_OPTIONS;

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
}
