import type { HTMLAttributes, ReactNode } from 'react';
import { notebookShadowRoles } from '../../tokens';
import { cn } from '../../utils';
import { NotebookPageFrame } from './NotebookPageFrame';
import type { NotebookSceneProfile } from '../types';

interface NotebookSpreadProps extends HTMLAttributes<HTMLDivElement> {
  profile: NotebookSceneProfile;
  notes: ReactNode;
  status?: ReactNode;
}

/**
 * Two-page notebook layout with notes on the left and the playable page on the right.
 * Use when low-density notes/status help the scene without stealing playfield clarity.
 */
export function NotebookSpread({
  profile,
  notes,
  status,
  children,
  className,
  ...props
}: NotebookSpreadProps) {
  return (
    <div
      className={cn(
        'absolute inset-x-4 bottom-4 top-16 grid grid-cols-1 md:grid-cols-[minmax(12rem,0.76fr)_minmax(0,1.36fr)]',
        notebookShadowRoles.page,
        className
      )}
      {...props}
    >
      <NotebookPageFrame profile={profile} kind="notes" className="hidden md:block">
        {notes}
      </NotebookPageFrame>
      <NotebookPageFrame
        profile={profile}
        className="rounded-2xl md:rounded-l-none md:border-l-2"
        status={status}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 top-0 z-10 -ml-1 w-2 bg-[linear-gradient(90deg,rgba(26,26,26,0.22),rgba(26,26,26,0.04),rgba(26,26,26,0.18))]"
        />
        {children}
      </NotebookPageFrame>
    </div>
  );
}
