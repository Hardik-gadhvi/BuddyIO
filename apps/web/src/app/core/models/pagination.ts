/**
 * Cursor (seek) pagination.
 *
 * Offset pagination is never used for the feed, comments, messages or
 * notifications: on a list that grows at the head, `OFFSET n` both scans more
 * rows as the user scrolls and silently duplicates or skips items when new
 * content arrives mid-scroll. The mocks use cursors from day one so the UI
 * never learns habits it would have to unlearn (ADR-0003).
 */
export interface CursorPage<T> {
  readonly items: readonly T[];
  /** Opaque cursor for the next page. `null` means this is the last page. */
  readonly nextCursor: string | null;
}

export const emptyPage = <T>(): CursorPage<T> => ({ items: [], nextCursor: null });

/** Standard page size for the home feed. */
export const FEED_PAGE_SIZE = 6;
