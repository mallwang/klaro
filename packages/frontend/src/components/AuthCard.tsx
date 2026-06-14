import type { ReactNode } from 'react';
import { Paper, Title } from '@mantine/core';
import { PublicLayout } from './PublicLayout.js';

/**
 * Shared card wrapper for public authentication pages, composing the public layout with
 * a centred, bordered card and a consistent title.
 */

interface AuthCardProps {
  title: string;
  children: ReactNode;
}

/**
 * Renders the standard auth page shell: PublicLayout containing a fixed-width bordered
 * Paper card with a centred title above the provided content.
 *
 * @param props - title: displayed as the card heading; children: form or page content
 */
export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <PublicLayout>
      <Paper withBorder shadow="md" p="xl" w={400} radius="md">
        <Title order={2} mb="lg" ta="center">
          {title}
        </Title>
        {children}
      </Paper>
    </PublicLayout>
  );
}
