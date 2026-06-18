import type { ReactNode } from 'react';
import { Box } from '@mantine/core';
import { AuthHeader } from './AppShell/AuthHeader.js';

const FALLBACK_IMAGE_URL =
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1280&q=80';

/**
 * Full-screen two-column authentication page shell: form content on the left, decorative
 * image panel on the right. The image panel is hidden on small viewports so the form
 * occupies full width. No footer — the layout fills 100dvh.
 */

interface AuthImageLayoutProps {
  /** Form or page content rendered in the left-hand column. */
  children: ReactNode;
  /**
   * Optional URL for the decorative background image.
   * Defaults to the built-in Unsplash photo when omitted.
   */
  imageUrl?: string;
}

/**
 * Renders the full-screen public-page shell used for sign-in and forgot-password.
 * The left column centres the provided children below a slim header.
 * The right column shows a full-height background image (hidden on xs/sm viewports).
 *
 * @param props - children: form content; imageUrl: optional override for the panel image
 */
export function AuthImageLayout({ children, imageUrl }: AuthImageLayoutProps) {
  const imageSrc = imageUrl ?? FALLBACK_IMAGE_URL;

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <AuthHeader showSignIn />

      <Box style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Form panel */}
        <Box
          style={{
            flex: '1',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '12vh',
            paddingLeft: 'var(--mantine-spacing-xl)',
            paddingRight: 'var(--mantine-spacing-xl)',
            paddingBottom: 'var(--mantine-spacing-xl)',
            overflowY: 'auto',
          }}
        >
          {children}
        </Box>

        {/* Image panel — hidden on small viewports */}
        <Box
          visibleFrom="sm"
          style={{
            flex: '0 0 62%',
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </Box>
    </Box>
  );
}
