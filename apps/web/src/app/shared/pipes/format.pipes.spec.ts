import { describe, expect, it } from 'vitest';
import { isoInstant } from '@core/models';
import { CompactCountPipe, PluralPipe, TimeAgoPipe } from './format.pipes';

describe('TimeAgoPipe', () => {
  const pipe = new TimeAgoPipe();
  const ago = (ms: number) => isoInstant(new Date(Date.now() - ms));

  it('renders seconds under a minute', () => {
    expect(pipe.transform(ago(12_000))).toBe('12s');
  });

  it('renders minutes, hours, days and weeks at each boundary', () => {
    expect(pipe.transform(ago(3 * 60_000))).toBe('3m');
    expect(pipe.transform(ago(5 * 3_600_000))).toBe('5h');
    expect(pipe.transform(ago(3 * 86_400_000))).toBe('3d');
    expect(pipe.transform(ago(14 * 86_400_000))).toBe('2w');
  });

  it('falls back to an absolute date past four weeks', () => {
    // "43w" is not a duration anyone reads, so it must not be produced.
    expect(pipe.transform(ago(300 * 86_400_000))).not.toMatch(/w$/);
  });

  it('never renders a negative duration for a clock-skewed future timestamp', () => {
    expect(pipe.transform(isoInstant(new Date(Date.now() + 60_000)))).toBe('0s');
  });

  it('returns an empty string for null, undefined and unparseable input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('not-a-date')).toBe('');
  });
});

describe('CompactCountPipe', () => {
  const pipe = new CompactCountPipe();

  it('stays exact below ten thousand', () => {
    // On a social product, 1,247 likes vs "1.2K" matters to the recipient.
    expect(pipe.transform(1840)).toBe((1840).toLocaleString());
    expect(pipe.transform(9999)).toBe((9999).toLocaleString());
  });

  it('compacts at and above ten thousand', () => {
    expect(pipe.transform(18_400)).toMatch(/K/i);
  });

  it('treats null as zero', () => {
    expect(pipe.transform(null)).toBe('0');
  });
});

describe('PluralPipe', () => {
  const pipe = new PluralPipe();

  it('does not produce "1 likes"', () => {
    expect(pipe.transform(1, 'like')).toBe('like');
    expect(pipe.transform(0, 'like')).toBe('likes');
    expect(pipe.transform(2, 'like')).toBe('likes');
  });

  it('accepts an irregular plural', () => {
    expect(pipe.transform(3, 'reply', 'replies')).toBe('replies');
  });
});
