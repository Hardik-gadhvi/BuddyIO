import type { Routes } from '@angular/router';

/**
 * Children of the public (signed-out) layout.
 *
 * Exported as a plain child array rather than a `loadChildren` bundle on
 * purpose. The app has TWO route groups at path '' - public and authenticated -
 * and the router must be able to fall through from the first to the second when
 * a URL like /feed matches neither public child. Falling through past a lazily
 * loaded children block is fragile, so the group itself is static and laziness
 * lives on each page via `loadComponent`.
 */
export const AUTH_CHILD_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./landing-page').then((m) => m.LandingPage),
    title: 'A calmer social feed',
  },
  {
    path: 'sign-in',
    loadComponent: () => import('./sign-in-page').then((m) => m.SignInPage),
    title: 'Sign in',
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./sign-up-page').then((m) => m.SignUpPage),
    title: 'Create your account',
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password-page').then((m) => m.ForgotPasswordPage),
    title: 'Reset your password',
  },
  {
    path: 'legal/terms',
    loadComponent: () => import('./legal-page').then((m) => m.LegalPage),
    title: 'Terms',
    data: { document: 'terms' },
  },
  {
    path: 'legal/privacy',
    loadComponent: () => import('./legal-page').then((m) => m.LegalPage),
    title: 'Privacy',
    data: { document: 'privacy' },
  },
];
