import type { IconName } from '@shared/ui/icon/icon-registry';

export type NavBadge = 'messages' | 'notifications' | null;

export interface NavItem {
  readonly label: string;
  readonly route: string;
  readonly icon: IconName;
  /** Filled variant for the active state - fill, not just colour, marks "here". */
  readonly iconActive: IconName;
  readonly badge: NavBadge;
}

/**
 * Primary navigation.
 *
 * Capped at five destinations, and that cap is a hard constraint rather than a
 * starting point (docs/01 section 2): a mobile bottom bar degrades badly past
 * five, so the answer to "can we add a tab" is normally "put it inside an
 * existing destination".
 *
 * Create is deliberately NOT in this list. It is an action that opens a modal
 * route over the current page, not a destination, so it is rendered separately
 * in both the sidebar and the bottom bar.
 *
 * Profile is also absent: it is reached from the avatar, which keeps all five
 * slots for things users move BETWEEN rather than things they own.
 */
export const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Home', route: '/feed', icon: 'home', iconActive: 'home-fill', badge: null },
  { label: 'Explore', route: '/explore', icon: 'compass', iconActive: 'compass-fill', badge: null },
  {
    label: 'Messages',
    route: '/messages',
    icon: 'message',
    iconActive: 'message-fill',
    badge: 'messages',
  },
  {
    label: 'Notifications',
    route: '/notifications',
    icon: 'bell',
    iconActive: 'bell-fill',
    badge: 'notifications',
  },
];
