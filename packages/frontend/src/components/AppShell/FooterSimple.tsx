import { Container, Group, Text } from '@mantine/core';
import classes from './FooterSimple.module.css';

/**
 * Minimal application footer showing the app name and the current copyright year.
 */

/**
 * Renders the application footer bar with the app name and copyright year.
 */
export function FooterSimple() {
  const year = new Date().getFullYear();
  return (
    <div className={classes.footer}>
      <Container className={classes.inner}>
        <Text c="dimmed" size="sm">
          Personal Contract Management
        </Text>
        <Group className={classes.links}>
          <Text c="dimmed" size="sm">
            © {year}
          </Text>
        </Group>
      </Container>
    </div>
  );
}
