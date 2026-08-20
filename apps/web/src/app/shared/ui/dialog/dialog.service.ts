import { Injectable, inject } from '@angular/core';
import { Dialog, type DialogConfig, type DialogRef } from '@angular/cdk/dialog';
import type { ComponentType } from '@angular/cdk/portal';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog, type ConfirmDialogData } from './confirm-dialog';

export type DialogSize = 'sm' | 'md' | 'lg';

const WIDTHS: Record<DialogSize, string> = {
  sm: '420px',
  md: '640px',
  lg: '760px',
};

/**
 * Opens dialogs with BuddyIO's presentation rules applied.
 *
 * Wraps CDK Dialog rather than replacing it: CDK already provides the focus
 * trap, the `Esc` handler, focus restoration to the trigger, scroll blocking
 * and `aria-modal`. Re-implementing any of that would be strictly worse.
 *
 * What this adds is the product decision: below `md` a dialog presents as a
 * bottom SHEET, above it as a centred dialog. That is one class swap here
 * rather than a media query in every dialog component.
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog);

  open<TResult, TData = unknown>(
    component: ComponentType<unknown>,
    options: {
      data?: TData;
      size?: DialogSize;
      /** Set false for flows that must be completed or explicitly cancelled. */
      dismissible?: boolean;
      labelledBy?: string;
    } = {},
  ): DialogRef<TResult> {
    const size = options.size ?? 'md';
    const dismissible = options.dismissible ?? true;

    // DialogConfig's second generic is the ref type; leaving it to default to
    // `unknown` makes the config incompatible with Dialog.open's overloads.
    const config: DialogConfig<TData, DialogRef<TResult>> = {
      data: options.data,
      width: WIDTHS[size],
      maxWidth: 'calc(100vw - 2 * var(--bio-space-4))',
      // dvh, not vh: mobile browser chrome makes vh wrong exactly here.
      maxHeight: 'calc(100dvh - 2 * var(--bio-space-6))',
      panelClass: ['bio-dialog-panel', `bio-dialog-panel--${size}`],
      backdropClass: 'bio-dialog-backdrop',
      disableClose: !dismissible,
      ariaModal: true,
      ariaLabelledBy: options.labelledBy,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    };

    return this.dialog.open<TResult, TData>(component, config);
  }

  /**
   * Returns true only if the user actively confirmed. Dismissing by backdrop,
   * `Esc` or Cancel all resolve false, so a confirm can never be won by
   * accident.
   */
  async confirm(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.open<boolean, ConfirmDialogData>(ConfirmDialog, {
      data,
      size: 'sm',
      labelledBy: 'bio-confirm-title',
    });
    const result = await firstValueFrom(ref.closed);
    return result === true;
  }
}
