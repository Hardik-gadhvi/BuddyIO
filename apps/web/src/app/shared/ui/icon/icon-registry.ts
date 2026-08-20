/**
 * BuddyIO icon set.
 *
 * Hand-authored geometry on a 24x24 grid, 1.75 stroke, round caps and joins
 * (docs/02 section 7). Authored rather than imported so there is no third-party
 * icon licence to track and no network request per glyph.
 *
 * Filled variants exist for the states where fill IS the state (a liked heart,
 * an active nav item), because colour alone may not carry meaning.
 */
export interface IconDefinition {
  /** Stroked path data, unless `filled` is true. */
  readonly paths: readonly string[];
  /** Circles as [cx, cy, r]. Always filled with currentColor. */
  readonly dots?: readonly (readonly [number, number, number])[];
  /** When true the paths are filled with currentColor instead of stroked. */
  readonly filled?: boolean;
}

export const ICONS = {
  home: {
    paths: ['M3 10.2 12 3.2l9 7v10.1a1.2 1.2 0 0 1-1.2 1.2H15v-6.6H9v6.6H4.2A1.2 1.2 0 0 1 3 20.3Z'],
  },
  'home-fill': {
    paths: ['M3 10.2 12 3.2l9 7v10.1a1.2 1.2 0 0 1-1.2 1.2H15v-6.6H9v6.6H4.2A1.2 1.2 0 0 1 3 20.3Z'],
    filled: true,
  },
  compass: {
    paths: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'm15.6 8.4-2.3 4.9-4.9 2.3 2.3-4.9z'],
  },
  'compass-fill': {
    paths: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm3.6 5.4-2.3 4.9-4.9 2.3 2.3-4.9z'],
    filled: true,
  },
  search: {
    paths: ['M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z', 'm15.9 15.9 4.6 4.6'],
  },
  plus: {
    paths: ['M12 5v14', 'M5 12h14'],
  },
  'plus-square': {
    paths: ['M5.5 3.5h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z', 'M12 8.5v7', 'M8.5 12h7'],
  },
  message: {
    paths: ['M20.5 4.5h-17a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1H7.5v4l5-4h8a1 1 0 0 0 1-1v-10a1 1 0 0 0-1-1Z'],
  },
  'message-fill': {
    paths: ['M20.5 4.5h-17a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1H7.5v4l5-4h8a1 1 0 0 0 1-1v-10a1 1 0 0 0-1-1Z'],
    filled: true,
  },
  bell: {
    paths: ['M18 9.2a6 6 0 1 0-12 0c0 5.1-2 6.6-2 6.6h16s-2-1.5-2-6.6Z', 'M13.7 19.4a2 2 0 0 1-3.4 0'],
  },
  'bell-fill': {
    paths: ['M18 9.2a6 6 0 1 0-12 0c0 5.1-2 6.6-2 6.6h16s-2-1.5-2-6.6Z'],
    dots: [[12, 20, 1.9]],
    filled: true,
  },
  heart: {
    paths: ['M12 20.4 4.7 13.1a4.8 4.8 0 0 1 6.8-6.8l.5.5.5-.5a4.8 4.8 0 0 1 6.8 6.8Z'],
  },
  'heart-fill': {
    paths: ['M12 20.4 4.7 13.1a4.8 4.8 0 0 1 6.8-6.8l.5.5.5-.5a4.8 4.8 0 0 1 6.8 6.8Z'],
    filled: true,
  },
  comment: {
    paths: ['M21 11.8a8.2 8.2 0 0 1-11.9 7.3L3.6 20.8l1.6-5.4A8.2 8.2 0 1 1 21 11.8Z'],
  },
  share: {
    paths: ['M21.3 2.7 2.9 10.1l7.5 3 3 7.5z', 'M21.3 2.7 10.4 13.1'],
  },
  bookmark: {
    paths: ['M6.5 3.5h11a1 1 0 0 1 1 1v16.2l-6.5-4-6.5 4V4.5a1 1 0 0 1 1-1Z'],
  },
  'bookmark-fill': {
    paths: ['M6.5 3.5h11a1 1 0 0 1 1 1v16.2l-6.5-4-6.5 4V4.5a1 1 0 0 1 1-1Z'],
    filled: true,
  },
  'more-horizontal': {
    paths: [],
    dots: [
      [5.2, 12, 1.7],
      [12, 12, 1.7],
      [18.8, 12, 1.7],
    ],
    filled: true,
  },
  settings: {
    paths: ['M4 7.5h16', 'M4 12h16', 'M4 16.5h16'],
    dots: [
      [9, 7.5, 2.2],
      [15, 12, 2.2],
      [7, 16.5, 2.2],
    ],
  },
  sun: {
    paths: [
      'M12 7.8a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Z',
      'M12 2.5v2.2',
      'M12 19.3v2.2',
      'M2.5 12h2.2',
      'M19.3 12h2.2',
      'M5.3 5.3l1.6 1.6',
      'M17.1 17.1l1.6 1.6',
      'M18.7 5.3l-1.6 1.6',
      'M6.9 17.1l-1.6 1.6',
    ],
  },
  moon: {
    paths: ['M20.3 14.6A8.6 8.6 0 0 1 9.4 3.7a8.6 8.6 0 1 0 10.9 10.9Z'],
  },
  monitor: {
    paths: ['M4.5 4.5h15a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15V6a1.5 1.5 0 0 1 1.5-1.5Z', 'M8.5 20.5h7', 'M12 16.5v4'],
  },
  x: {
    paths: ['m6.2 6.2 11.6 11.6', 'M17.8 6.2 6.2 17.8'],
  },
  check: {
    paths: ['m5 12.6 4.6 4.6L19 7.8'],
  },
  'chevron-left': {
    paths: ['m14.5 5.5-6.2 6.5 6.2 6.5'],
  },
  'chevron-right': {
    paths: ['m9.5 5.5 6.2 6.5-6.2 6.5'],
  },
  'chevron-down': {
    paths: ['m5.5 9.5 6.5 6.2 6.5-6.2'],
  },
  'alert-circle': {
    paths: ['M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z', 'M12 7.4v5.4'],
    dots: [[12, 16.4, 1.15]],
  },
  'alert-triangle': {
    paths: ['M12 3.6 1.9 20.4h20.2Z', 'M12 9.4v4.6'],
    dots: [[12, 17.4, 1.1]],
  },
  image: {
    paths: [
      'M4.5 4h15A1.5 1.5 0 0 1 21 5.5v13A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-13A1.5 1.5 0 0 1 4.5 4Z',
      'm3.4 16.6 4.8-4.8 3.8 3.8 3.2-3.2 5.4 5.4',
    ],
    dots: [[8.6, 8.8, 1.5]],
  },
  refresh: {
    paths: ['M20.2 12a8.2 8.2 0 1 1-2.4-5.8', 'M20.4 3.4v3.9h-3.9'],
  },
  lock: {
    paths: ['M5.5 10.5h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z', 'M8 10.5V7.6a4 4 0 0 1 8 0v2.9'],
  },
  globe: {
    paths: [
      'M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Z',
      'M3.4 12h17.2',
      'M12 3.2c2.2 2.4 3.4 5.5 3.4 8.8s-1.2 6.4-3.4 8.8c-2.2-2.4-3.4-5.5-3.4-8.8s1.2-6.4 3.4-8.8Z',
    ],
  },
  users: {
    paths: [
      'M9 11.6a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6Z',
      'M2.8 20.2a6.2 6.2 0 0 1 12.4 0',
      'M16.2 4.6a3.8 3.8 0 0 1 0 7.2',
      'M17 13.8a6.2 6.2 0 0 1 4.2 5.9',
    ],
  },
  'wifi-off': {
    paths: ['M3 3.5 20.5 21', 'M8.4 15.4a5 5 0 0 1 7 0', 'M5 12a10 10 0 0 1 3.6-2.3', 'M15.6 9.9A10 10 0 0 1 19 12'],
    dots: [[12, 19, 1.3]],
  },
  sparkle: {
    paths: ['m12 3.4 2 5.6 5.6 2-5.6 2-2 5.6-2-5.6-5.6-2 5.6-2z'],
  },
  'log-out': {
    paths: ['M14.5 4.5h-8a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h8', 'M17 8.5 20.5 12 17 15.5', 'M10.5 12h10'],
  },
  flag: {
    paths: ['M5.5 21V3.6', 'M5.5 4.4h12.9l-2.6 4.4 2.6 4.4H5.5Z'],
  },
} as const satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as readonly IconName[];
