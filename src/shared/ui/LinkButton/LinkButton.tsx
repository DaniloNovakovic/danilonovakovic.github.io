import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { sketchFocusVisible } from '../tokens';
import { cn } from '../utils';

type LinkButtonVariant = 'secondary' | 'primary' | 'quiet';

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: LinkButtonVariant;
  icon?: ReactNode;
}

const variantClasses: Record<LinkButtonVariant, string> = {
  secondary:
    'border-2 border-[#1a1a1a] bg-[#fbfbf9] text-[#1a1a1a] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]',
  primary:
    'border-2 border-[#1a1a1a] bg-[#1a1a1a] text-[#fbfbf9] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-[#333333] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]',
  quiet:
    'text-[#1a1a1a] underline decoration-dashed underline-offset-2 hover:opacity-80'
};

export function LinkButton({
  variant = 'secondary',
  icon,
  children,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <a
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold uppercase tracking-widest transition-all sm:text-sm',
        sketchFocusVisible,
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </a>
  );
}
