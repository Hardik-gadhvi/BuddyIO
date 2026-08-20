import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { BioButton } from '@shared/ui/button/button';
import { DialogShell } from './dialog-shell';

export interface ConfirmDialogData {
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  /** Styles the confirm action as destructive and keeps focus on Cancel. */
  readonly destructive?: boolean;
}

/**
 * A yes/no confirmation.
 *
 * The safe action is focused by default (`cdkFocusInitial` on Cancel) whenever
 * the confirm is destructive. Dialogs that open with "Delete" focused turn a
 * reflexive Enter keypress into data loss.
 */
@Component({
  selector: 'bio-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BioButton, DialogShell],
  template: `
    <bio-dialog-shell [title]="data.title" titleId="bio-confirm-title" (close)="cancel()">
      <p class="confirm__body">{{ data.body }}</p>

      <div dialogFooter>
        <button bioButton variant="ghost" size="md" cdkFocusInitial (click)="cancel()">
          {{ data.cancelLabel ?? 'Cancel' }}
        </button>
        <button
          bioButton
          [variant]="data.destructive ? 'danger' : 'primary'"
          size="md"
          (click)="confirm()"
        >
          {{ data.confirmLabel }}
        </button>
      </div>
    </bio-dialog-shell>
  `,
  styles: `
    .confirm__body {
      font-size: var(--bio-font-size-body);
      line-height: var(--bio-line-height-body);
      color: var(--bio-text-secondary);
      text-wrap: pretty;
    }
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);

  protected confirm(): void {
    this.dialogRef.close(true);
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
