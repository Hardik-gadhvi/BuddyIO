import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
} from '@angular/core';

/**
 * Emits once each time the host element scrolls into view.
 *
 * Used as the feed's prefetch sentinel. Note that it is only ever an
 * ENHANCEMENT: an explicit "Load more" button is always rendered alongside it,
 * because a sentinel-only list is unreachable by keyboard and is a dead end for
 * screen-reader users (docs/05, "Keyboard").
 */
@Directive({
  selector: '[bioIntersect]',
})
export class Intersect {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** How far ahead of the viewport to fire. One screen is a good default. */
  readonly rootMargin = input('600px');
  readonly disabled = input(false);

  readonly bioIntersect = output<void>();

  constructor() {
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && !this.disabled()) {
              this.bioIntersect.emit();
            }
          }
        },
        { rootMargin: this.rootMargin() },
      );

      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
