import { Pipe, type PipeTransform } from '@angular/core';
import type { IsoInstant } from '@core/models';

/**
 * Compact relative time: 12s, 4m, 3h, 6d, 2w, then an absolute date.
 *
 * Cuts over to an absolute date after four weeks because "43w" is not something
 * anyone reads as a duration. Pure, so it costs nothing until its input changes
 * - the trade-off is that a rendered "4m" does not tick to "5m" on its own,
 * which is correct: a feed that silently re-renders while being read is worse
 * than a slightly stale timestamp.
 */
@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(value: IsoInstant | string | null | undefined): string {
    if (!value) {
      return '';
    }

    const then = new Date(value).getTime();
    if (Number.isNaN(then)) {
      return '';
    }

    const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days}d`;
    }
    const weeks = Math.floor(days / 7);
    if (weeks < 5) {
      return `${weeks}w`;
    }

    return new Date(then).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: new Date(then).getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    });
  }
}

/**
 * The full, unambiguous timestamp for `title`/`datetime` attributes.
 *
 * The compact form above is for scanning; this is what a screen reader and a
 * hover tooltip get, so the precise time is never actually lost.
 */
@Pipe({ name: 'exactTime' })
export class ExactTimePipe implements PipeTransform {
  transform(value: IsoInstant | string | null | undefined): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });
  }
}

/**
 * 1840 -> "1,840"; 18400 -> "18.4K".
 *
 * Stays exact below 10,000 because on a social product the difference between
 * 1.2K and 1,247 likes matters to the person who received them.
 */
@Pipe({ name: 'compactCount' })
export class CompactCountPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    const count = value ?? 0;
    if (count < 10_000) {
      return count.toLocaleString();
    }
    return new Intl.NumberFormat(undefined, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(count);
  }
}

/** "1 like" / "2 likes" - avoids "1 likes" in every count label. */
@Pipe({ name: 'plural' })
export class PluralPipe implements PipeTransform {
  transform(count: number, singular: string, plural?: string): string {
    return count === 1 ? singular : (plural ?? `${singular}s`);
  }
}
