import { cn } from '../../lib/utils.js';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'warning' | 'destructive';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variant === 'default' && 'bg-[--color-primary] text-white',
        variant === 'secondary' && 'bg-[--color-muted] text-[--color-muted-foreground]',
        variant === 'warning' && 'bg-amber-100 text-amber-800',
        variant === 'destructive' && 'bg-red-100 text-red-800',
        className,
      )}
      {...props}
    />
  );
}
