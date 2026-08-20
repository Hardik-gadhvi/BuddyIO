import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { BuddyIoTitleStrategy } from '@core/a11y/route-announcer';
import { routes } from './app.routes';

/**
 * Application providers.
 *
 * Zoneless is the Angular 22 default - there is no `provideZonelessChangeDetection()`
 * call and no zone.js polyfill, and change detection is driven entirely by signals.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Binds route params, query params and `data` straight to component
      // inputs, so a route component never has to inject ActivatedRoute just
      // to read its own parameters.
      withComponentInputBinding(),
      // Restores scroll on back-navigation (feed -> post -> back), and honours
      // #fragment links. Without this, returning from a post detail dumps the
      // user at the top of a feed they had scrolled a long way into.
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    { provide: TitleStrategy, useClass: BuddyIoTitleStrategy },
  ],
};
