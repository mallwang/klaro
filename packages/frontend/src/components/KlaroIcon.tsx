import { Text } from '@mantine/core';

/**
 * Branded icon component for Klaro, supporting a standalone mark or a full lockup with the
 * wordmark. Mirrors the MantineLogo API: `type="mark"` renders the icon alone, `type="full"`
 * renders icon + "Klaro" text side by side.
 */

interface KlaroIconProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon size in pixels — applied to both width and height of the image. */
  size?: number;
  /** `"mark"` for the icon alone; `"full"` for icon + wordmark. Defaults to `"full"`. */
  type?: 'mark' | 'full';
}

/**
 * Renders the Klaro brand icon, optionally with the "Klaro" wordmark.
 *
 * @param props.size - Width and height of the icon in pixels (default 28)
 * @param props.type - `"mark"` shows the icon alone; `"full"` shows icon + wordmark
 * @returns A flex container with the icon image and optional text label
 */
export function KlaroIcon({ size = 28, type = 'full', style, ...others }: KlaroIconProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...style }} {...others}>
      <img
        src="/klaro.png"
        alt="Klaro"
        style={{ width: size, height: size, display: 'block', flexShrink: 0 }}
      />
      {type === 'full' && (
        <Text fw={600} size="sm" style={{ lineHeight: 1 }}>
          Klaro
        </Text>
      )}
    </div>
  );
}
