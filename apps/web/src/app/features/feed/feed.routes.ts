import type { Routes } from '@angular/router';
import { FEED_REPOSITORY } from './data-access/feed.repository';
import { MockFeedRepository } from './data-access/mock-feed.repository';

/**
 * Feed routes.
 *
 * The repository is bound HERE rather than in app.config.ts so the mock and its
 * fixtures only enter the bundle when this lazy chunk loads. In Phase 3 this
 * single `useExisting` line becomes `HttpFeedRepository` and nothing else in
 * the feature changes (ADR-0003).
 */
export const FEED_ROUTES: Routes = [
  {
    path: '',
    providers: [{ provide: FEED_REPOSITORY, useExisting: MockFeedRepository }],
    loadComponent: () => import('./feed-page').then((m) => m.FeedPage),
    title: 'Home',
  },
];
