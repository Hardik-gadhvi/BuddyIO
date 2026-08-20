import type { Routes } from '@angular/router';
import { Shell } from '@core/layout/shell/shell';
import { PlaceholderPage } from '@features/placeholder/placeholder-page';

/**
 * Route map. Mirrors docs/01 section 3.
 *
 * Two rules hold here:
 *
 * 1. **Every navigation target resolves to something.** Slices that are not
 *    built yet render an honest placeholder rather than 404ing or, worse,
 *    being a nav item that silently does nothing.
 * 2. **Features are lazy.** Only the shell, the design system and the router
 *    are in the initial chunk. `loadChildren` boundaries are per feature, not
 *    per component, so a feature's providers stay with it.
 *
 * Placeholder copy comes from route `data` and is bound to component inputs by
 * `withComponentInputBinding()`.
 */
export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'feed' },

      {
        path: 'feed',
        loadChildren: () => import('@features/feed/feed.routes').then((m) => m.FEED_ROUTES),
      },

      {
        path: 'explore',
        component: PlaceholderPage,
        title: 'Explore',
        data: {
          heading: 'Explore is next',
          body: 'The discovery grid, typeahead search and people/tags/posts result tabs land in the search increment.',
          icon: 'compass',
        },
      },
      {
        path: 'search',
        component: PlaceholderPage,
        title: 'Search',
        data: {
          heading: 'Search is on the way',
          body: 'Recent searches, debounced typeahead and three result tabs, each with its own empty state.',
          icon: 'search',
        },
      },
      {
        path: 'messages',
        component: PlaceholderPage,
        title: 'Messages',
        data: {
          heading: 'Messages are coming',
          body: 'Conversation list, thread, delivery receipts and reconnect behaviour. The hardest slice, and deliberately not the first.',
          icon: 'message',
        },
      },
      {
        path: 'messages/:conversationId',
        component: PlaceholderPage,
        title: 'Conversation',
        data: { heading: 'This conversation is not built yet', icon: 'message' },
      },
      {
        path: 'notifications',
        component: PlaceholderPage,
        title: 'Notifications',
        data: {
          heading: 'The notification centre is next',
          body: 'Grouped actors, unread state, deep links to the exact target, and per-category preferences.',
          icon: 'bell',
        },
      },
      {
        path: 'create',
        component: PlaceholderPage,
        title: 'Create',
        data: {
          heading: 'The composer is coming',
          body: 'Media picking, alt text, audience control, upload progress with retry, and draft persistence.',
          icon: 'plus-square',
        },
      },
      {
        path: 'p/:postId',
        component: PlaceholderPage,
        title: 'Post',
        data: {
          heading: 'Post detail is next',
          body: 'Full-page and dialog presentations of the same route, with flat comments and optimistic replies.',
          icon: 'image',
        },
      },
      {
        path: 'u/:username',
        component: PlaceholderPage,
        title: 'Profile',
        data: {
          heading: 'Profiles are coming',
          body: 'Own and other-user variants, the private-account state, blocked state, and the post grid.',
          icon: 'users',
        },
      },
      {
        path: 'settings',
        component: PlaceholderPage,
        title: 'Settings',
        data: {
          heading: 'Settings are coming',
          body: 'Account, appearance, privacy, blocked and muted accounts, and notification choices.',
          icon: 'settings',
        },
      },
      {
        path: 'admin',
        component: PlaceholderPage,
        title: 'Moderation',
        data: {
          heading: 'Moderation is a Phase 6 surface',
          body: 'Guarded placeholder. It stays outside the member shell so moderator and member context can never be confused.',
          icon: 'flag',
        },
      },

      {
        path: '**',
        component: PlaceholderPage,
        title: 'Not found',
        data: {
          heading: 'We could not find that page',
          body: 'The link may be wrong, or the content may have been removed.',
          icon: 'alert-circle',
        },
      },
    ],
  },
];
