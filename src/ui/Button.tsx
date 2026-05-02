import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'floating' | 'icon' | 'control';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

const baseClass =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 font-bold text-[#1a1a1a] transition-all focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'rounded border-2 border-[#1a1a1a] bg-[#1a1a1a] text-[#fbfbf9] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-[#333333] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]',
  secondary:
    'rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]',
  ghost:
    'rounded-sm underline decoration-dashed underline-offset-2 hover:text-[#1a1a1a]/75',
  floating:
    'rounded border-2 border-[#1a1a1a] bg-[#fbfbf9]/90 text-[11px] uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] backdrop-blur-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]',
  icon:
    'rounded-full border-2 border-[#1a1a1a] bg-[#f4f1ea] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-[#e8e5df] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
  control:
    'border-4 border-[#1a1a1a] bg-[#f4f1ea] hover:bg-[#e8e5df] active:bg-[#1a1a1a] active:text-[#fbfbf9]'
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base'
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(baseClass, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
