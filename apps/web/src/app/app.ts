import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHost } from '@shared/ui/toast/toast-host';

/**
 * Root component.
 *
 * Intentionally almost empty: all persistent chrome belongs to the shell, which
 * is a routed component, so that public routes (landing, sign-in) can later use
 * a completely different layout without unpicking anything here.
 *
 * The two things that DO live at the root are the ones that must outlive any
 * layout: the toast region and the route announcer.
 */
@Component({
  selector: 'bio-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastHost],
  templateUrl: './app.html',
})
export class App {}
