# Component Contract: AuthImageLayout

**File**: `packages/frontend/src/components/AuthImageLayout.tsx`

## Purpose

Provides the two-column authentication shell used by all sign-in / forgot-password pages. Consumers pass their form content as `children`; the component handles the image panel and responsive behaviour.

## Props

```ts
interface AuthImageLayoutProps {
  /** Form or page content rendered in the right-hand column. */
  children: ReactNode;
  /** Optional URL for the decorative background image in the left-hand column.
   *  Defaults to a built-in local asset when omitted. */
  imageUrl?: string;
}
```

## Behaviour Contract

| Scenario | Expected behaviour |
|---|---|
| Viewport ≥ sm breakpoint | Two-column layout: image panel on left (~55%), form panel on right (~45%) |
| Viewport < sm breakpoint | Image panel hidden; form panel occupies 100% width |
| `imageUrl` omitted | Default built-in asset rendered in the image panel |
| `imageUrl` provided | Provided URL used as background-image of the image panel |
| Image resource fails to load | Form remains fully visible and functional; image panel shows fallback background colour |
| `children` rendered | Children appear centred (horizontally and vertically) within the right-hand column |

## Rendering Dependencies

- Wraps `PublicLayout` (unchanged) for the outer AppShell (header + footer)
- Uses Mantine `Grid`, `Grid.Col`, `BackgroundImage`, `Center` from `@mantine/core`
- Responsive hiding via Mantine's `visibleFrom` prop (no custom CSS required)
