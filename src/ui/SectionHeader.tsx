import type { ReactNode } from 'react';
import { cn } from './utils';

interface SectionHeaderProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function SectionHeader({ id, children, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-6 flex items-end gap-3', className)}>
      <h2 id={id} className="text-3xl font-bold tracking-tight text-[#1a1a1a] sm:text-4xl">
        {children}
      </h2>
      <span aria-hidden className="mb-2 h-0.5 flex-1 bg-[#1a1a1a]/30" />
    </div>
  );
}
