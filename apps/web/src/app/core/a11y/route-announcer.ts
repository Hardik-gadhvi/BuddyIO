import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const APP_NAME = 'BuddyIO';

/**
 * Sets the document title and announces the new page to screen readers.
 *
 * A single-page app changes the URL without a page load, so assistive tech gets
 * no navigation event for free. Without this, a screen-reader user has no idea
 * the route changed. Required by docs/05 section "Live regions".
 */
@Injectable({ providedIn: 'root' })
export class BuddyIoTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    const fullTitle = routeTitle ? `${routeTitle} - ${APP_NAME}` : APP_NAME;

    this.title.setTitle(fullTitle);
    this.announce(routeTitle ?? APP_NAME);
  }

  private announce(pageName: string): void {
    const region = this.document.getElementById('bio-route-announcer');
    if (!region) {
      return;
    }
    // Clear first: setting identical text twice is not re-announced by most
    // screen readers, which silently breaks repeat navigation to the same page.
    region.textContent = '';
    this.document.defaultView?.setTimeout(() => {
      region.textContent = `${pageName} page loaded`;
    }, 60);
  }
}
