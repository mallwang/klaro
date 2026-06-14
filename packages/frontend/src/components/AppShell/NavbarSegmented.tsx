import { useState } from 'react';
import { NavLink as RouterNavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Group, Text, SegmentedControl, Stack, Tooltip, ActionIcon, Avatar } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconFileText,
  IconUser,
  IconUsers,
  IconLogout,
} from '@tabler/icons-react';
import { useCurrentUser, useSignOut } from '../../hooks/useAuth.js';
import classes from './NavbarSegmented.module.css';

/**
 * Sidebar navigation with an app/admin segment switcher and user identity footer.
 */

type Segment = 'app' | 'admin';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

/**
 * Renders the sidebar navigation with app/admin segments, route links, and a sign-out
 * button.
 */
export function NavbarSegmented() {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  const { mutate: signOut, isPending } = useSignOut();
  const location = useLocation();
  const navigate = useNavigate();
  const [segment, setSegment] = useState<Segment>('app');

  /**
   * Switches the active nav segment and navigates to the segment's default route.
   *
   * @param value - The new segment value, either "app" or "admin"
   */
  function handleSegmentChange(value: string) {
    const next = value as Segment;
    setSegment(next);
    navigate(next === 'admin' ? '/admin/accounts' : '/');
  }

  const appLinks: NavItem[] = [
    { label: t('nav.dashboard'), to: '/', icon: <IconLayoutDashboard size={18} /> },
    { label: t('nav.contracts'), to: '/contracts', icon: <IconFileText size={18} /> },
    { label: t('nav.accountSettings'), to: '/account', icon: <IconUser size={18} /> },
  ];

  const adminLinks: NavItem[] = [
    { label: t('nav.accounts'), to: '/admin/accounts', icon: <IconUsers size={18} /> },
  ];

  /**
   * Returns true when the given route path matches the current location.
   *
   * @param to - The route path to test
   * @returns Whether the current location starts with (or exactly matches) the path
   */
  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const links = segment === 'app' ? appLinks : adminLinks;

  return (
    <div className={classes.navbar}>
      {user?.role === 'ADMIN' && (
        <SegmentedControl
          value={segment}
          onChange={handleSegmentChange}
          data={[
            { label: 'App', value: 'app' },
            { label: 'Admin', value: 'admin' },
          ]}
          mb="md"
        />
      )}

      <div className={classes.navbarMain}>
        <Stack gap={4}>
          {links.map((item) => (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className={[classes.link, isActive(item.to) ? classes.linkActive : ''].join(' ')}
            >
              {item.icon}
              <Text ml="xs" size="sm" fw={500}>
                {item.label}
              </Text>
            </RouterNavLink>
          ))}
        </Stack>
      </div>

      <div className={classes.userSection}>
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center" style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
            <Avatar size="sm" radius="xl" color="teal">
              <IconUser size={14} />
            </Avatar>
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>
                {user?.displayName}
              </Text>
              <Text size="xs" c="dimmed">
                {user?.role === 'ADMIN' ? t('nav.roleAdmin') : t('nav.roleMember')}
              </Text>
            </div>
          </Group>
          <Tooltip label={t('auth.signOut')}>
            <ActionIcon
              variant="default"
              size="md"
              onClick={() => signOut()}
              disabled={isPending}
              aria-label={t('auth.signOut')}
            >
              <IconLogout size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </div>
    </div>
  );
}
