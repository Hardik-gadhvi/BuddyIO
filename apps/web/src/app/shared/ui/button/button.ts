import { Directive, ElementRef, computed, inject, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'accent' | 'neutral' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button styling, applied to a NATIVE `<button>` or `<a>`.
 *
 * Deliberately a directive rather than a wrapper component: a wrapper either
 * nests a button inside a custom element (breaking `form` association and
 * producing two focus stops) or re-implements `type`, `disabled`, `form` and
 * keyboard activation by hand. The native element already does all of that
 * correctly, so it keeps doing it and we only add appearance.
 *
 *   <button bioButton variant="primary" [loading]="saving()">Publish</button>
 *   <a bioButton variant="ghost" routerLink="/explore">Explore</a>
 */
@Directive({
  selector: 'button[bioButton], a[bioButton]',
  host: {
    class: 'bio-button',
    // Discrete class bindings rather than a single `[class]` string, so classes
    // the caller puts on the element are never clobbered by this directive.
    '[class.bio-button--primary]': 'variant() === "primary"',
    '[class.bio-button--accent]': 'variant() === "accent"',
    '[class.bio-button--neutral]': 'variant() === "neutral"',
    '[class.bio-button--ghost]': 'variant() === "ghost"',
    '[class.bio-button--danger]': 'variant() === "danger"',
    '[class.bio-button--sm]': 'size() === "sm"',
    '[class.bio-button--md]': 'size() === "md"',
    '[class.bio-button--lg]': 'size() === "lg"',
    '[class.bio-button--full]': 'fullWidth()',
    '[class.bio-button--loading]': 'loading()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.aria-disabled]': 'isInert() ? "true" : null',
    // A disabled <a> is not a thing, so links are made inert via tabindex and
    // pointer-events, and buttons use the real `disabled` attribute.
    '[attr.tabindex]': 'isInertLink() ? "-1" : null',
    '[attr.disabled]': 'isDisabledButton() ? "" : null',
  },
})
export class BioButton {
  readonly variant = input<ButtonVariant>('neutral');
  readonly size = input<ButtonSize>('md');
  readonly fullWidth = input(false);
  /**
   * Keeps the button's width while swapping the label for a spinner, so the
   * layout never jumps when a mutation starts.
   */
  readonly loading = input(false);
  readonly disabled = input(false);

  private readonly elementTag = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName;

  protected readonly isInert = computed(() => this.disabled() || this.loading());

  /** `disabled` is a real attribute only on <button>. */
  protected readonly isDisabledButton = computed(() => this.isInert() && this.elementTag === 'BUTTON');

  /** An <a> cannot be disabled, so it is removed from the tab order instead. */
  protected readonly isInertLink = computed(() => this.isInert() && this.elementTag === 'A');
}
