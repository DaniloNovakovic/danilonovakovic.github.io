import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils';
import { notesBackground, profileBackgrounds } from '../styles';
import type { NotebookSceneProfile } from '../types';

interface NotebookPageFrameProps extends HTMLAttributes<HTMLElement> {
  profile: NotebookSceneProfile;
  kind?: 'game' | 'notes';
  status?: ReactNode;
}

/**
 * Bordered notebook page that hosts a playable scene or notes page.
 * Use inside `NotebookShellStage` or `NotebookSpread` as the primary framed surface.
 */
export function NotebookPageFrame({
  profile,
  kind = 'game',
  status,
  children,
  className,
  style,
  ...props
}: NotebookPageFrameProps) {
  const Component = kind === 'notes' ? 'aside' : 'section';
  return (
    <Component
      className={cn(
        'relative min-h-0 min-w-0 overflow-hidden border-4 border-[#1a1a1a] bg-[#fbfbf9]',
        kind === 'notes' ? 'rounded-l-2xl border-r-2 p-5 pt-14' : 'rounded-2xl',
        className
      )}
      style={{ ...(kind === 'notes' ? notesBackground : profileBackgrounds[profile]), ...style }}
      {...props}
    >
      {status}
      {children}
    </Component>
  );
}
