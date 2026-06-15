import { ActionIcon, Container, Group, Text } from '@mantine/core';
import { IconBrandGithub } from '@tabler/icons-react';
import classes from './FooterSimple.module.css';
import { KlaroIcon } from '../KlaroIcon.js';

/**
 * Application footer with branding on the left, copyright centered, and a GitHub link on
 * the right.
 */

/**
 * Renders the application footer bar with the app name, copyright year, and GitHub link.
 */
export function FooterSimple() {
  const year = new Date().getFullYear();
  return (
    <div className={classes.footer}>
      <Container className={classes.inner}>
        <div className={classes.section}>
          <KlaroIcon size={32} />
        </div>

        <div className={classes.center}>
          <Text c="dimmed" size="sm">
            © {year}
          </Text>
        </div>

        <div className={classes.right}>
          <Group gap="xs" justify="flex-end">
            <ActionIcon
              component="a"
              href="https://github.com/mallwang/klaro"
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              variant="default"
              radius="xl"
              aria-label="GitHub repository"
            >
              <IconBrandGithub size={18} stroke={1.5} />
            </ActionIcon>
          </Group>
        </div>
      </Container>
    </div>
  );
}
