import { ActionIcon, Anchor, Container, Group } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconBrandDocker, IconBrandGithub } from '@tabler/icons-react';
import classes from './FooterSimple.module.css';
import { KlaroIcon } from '../KlaroIcon.js';

/**
 * Application footer with branding on the left, copyright centered, and a GitHub link on
 * the right.
 */

/**
 * Renders the application footer bar with the app name, FAQ link, and GitHub link.
 */
export function FooterSimple() {
  return (
    <div className={classes.footer}>
      <Container className={classes.inner}>
        <div className={classes.section}>
          <KlaroIcon size={32} />
        </div>

        <div className={classes.center}>
          <Anchor component={Link} to="/faq" size="sm">
            FAQ
          </Anchor>
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
            <ActionIcon
              component="a"
              href="https://hub.docker.com/r/walefish/klaro"
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              variant="default"
              radius="xl"
              aria-label="Docker Hub"
            >
              <IconBrandDocker size={18} stroke={1.5} />
            </ActionIcon>
          </Group>
        </div>
      </Container>
    </div>
  );
}
