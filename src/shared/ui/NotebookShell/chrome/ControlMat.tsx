import type { HTMLAttributes } from 'react';
import { cn } from '../../utils';

interface ControlMatProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  showGuide?: boolean;
}

/**
 * Invisible/low-contrast shell input surface around the active page.
 * Use when touch or drag gestures need a larger hit area than the visible canvas.
 */
export function ControlMat({
  label = 'shell-level control mat',
  showGuide = true,
  children,
  className,
  style,
  ...props
}: ControlMatProps) {
  return (
    <div
      className={cn(
        'absolute inset-x-3 top-16 rounded-[1.375rem] bg-[#fbfbf9]/20 outline outline-2 -outline-offset-8 outline-[#1a1a1a]/10 [@media(max-height:420px)]:!bottom-3',
        className
      )}
      style={{ bottom: 'calc(0.75rem + var(--notebook-footer-space, 0px))', ...style }}
      {...props}
    >
      {children}
      {showGuide ? (
        <span className="pointer-events-none absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-widest text-[#1a1a1a]/45">
          {label}
        </span>
      ) : null}
    </div>
  );
}
