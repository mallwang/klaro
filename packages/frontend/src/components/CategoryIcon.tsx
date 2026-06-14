import { Zap, Play, Shield, Home, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Category } from '@pcm/shared';

/**
 * Mapping from contract category values to Lucide icon components, plus a single-prop icon
 * component for use in tables and forms.
 */

export const CATEGORY_ICON_MAP: Record<Category | 'DEFAULT', LucideIcon> = {
  UTILITIES: Zap,
  SUBSCRIPTIONS: Play,
  INSURANCE: Shield,
  HOUSING: Home,
  OTHER: FileText,
  DEFAULT: FileText,
};

interface CategoryIconProps {
  category: Category;
  size?: number;
  className?: string;
}

/**
 * Renders the Lucide icon associated with the given contract category.
 *
 * @param props - category: the contract category; size: icon size in px; className: optional
 *   CSS class
 */
export function CategoryIcon({ category, size, className }: CategoryIconProps) {
  const Icon = CATEGORY_ICON_MAP[category] ?? CATEGORY_ICON_MAP.DEFAULT;
  return <Icon size={size} className={className} />;
}
