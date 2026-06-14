import { useState } from 'react';
import { Building2 } from 'lucide-react';

/**
 * Provider logo component that fetches brand images from logo.dev and falls back to a
 * generic building icon on load failure or when anonymization is active.
 */

/**
 * Constructs the logo.dev image URL for the given provider name.
 *
 * @param name - The contract/provider name to look up
 * @param isAnonymized - When true, returns null to suppress the logo fetch
 * @returns The logo.dev image URL, or null when the logo should be hidden
 */
export function logoUrl(name: string, isAnonymized: boolean): string | null {
  if (isAnonymized || !name.trim()) return null;
  const token = import.meta.env['VITE_LOGO_DEV_TOKEN'] as string | undefined;
  return `https://img.logo.dev/name/${encodeURIComponent(name)}?token=${token ?? ''}`;
}

interface ProviderLogoProps {
  name: string;
  isAnonymized?: boolean;
  size?: number;
  className?: string;
}

/**
 * Renders a provider logo image, falling back to a generic building icon when the image
 * fails to load or when anonymization is active.
 *
 * @param props - name: provider name used to fetch the logo; isAnonymized: suppresses the
 *   logo when true; size: width/height in px; className: optional CSS class
 */
export function ProviderLogo({
  name,
  isAnonymized = false,
  size = 24,
  className,
}: ProviderLogoProps) {
  const [failed, setFailed] = useState(false);

  const url = logoUrl(name, isAnonymized);

  const sizeStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    display: 'inline-flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (!url || failed) {
    return (
      <span style={sizeStyle} className={className}>
        <Building2 style={{ width: '100%', height: '100%' }} color="var(--mantine-color-dimmed)" />
      </span>
    );
  }

  return (
    <span style={sizeStyle} className={className}>
      <img
        src={url}
        alt=""
        role="img"
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </span>
  );
}
