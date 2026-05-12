import type { HTMLAttributes } from 'react';
import { notebookShadowRoles } from '../../tokens';
import { cn } from '../../utils';
import { scrapToneClasses } from '../styles';
import type { NotebookScrapTone } from '../types';

interface NotebookScrapNoteProps extends HTMLAttributes<HTMLElement> {
  tone?: NotebookScrapTone;
}

/**
 * Small rotated note for low-density contextual memory or supporting information.
 * Use sparingly for content-bearing scraps; avoid decorative scraps with no gameplay meaning.
 */
export function NotebookScrapNote({
  tone = 'yellow',
  children,
  className,
  ...props
}: NotebookScrapNoteProps) {
  return (
    <aside
      className={cn(
        'w-fit max-w-52 rotate-[-2deg] border-2 border-[#1a1a1a] p-3 font-mono text-xs font-bold uppercase leading-relaxed tracking-wide text-[#1a1a1a]',
        notebookShadowRoles.control,
        scrapToneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}
