import type { HTMLAttributes } from 'react';
import { cn } from './utils';

type BadgeTone = 'neutral' | 'paper' | 'highlight' | 'ink';
type BadgeShape = 'square' | 'pill';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  shape?: BadgeShape;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'border-[#1a1a1a] bg-gray-100 text-[#1a1a1a]',
  paper: 'border-[#1a1a1a] bg-[#fbfbf9] text-[#1a1a1a]',
  highlight: 'border-[#1a1a1a] bg-yellow-100 text-[#1a1a1a]',
  ink: 'border-[#1a1a1a] bg-[#1a1a1a] text-[#fbfbf9]'
};

export function Badge({
  tone = 'neutral',
  shape = 'square',
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        shape === 'pill' ? 'rounded-full px-3 py-1' : 'rounded',
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

export function Tag(props: BadgeProps) {
  return <Badge tone="neutral" className="text-sm font-semibold normal-case tracking-normal" {...props} />;
}
