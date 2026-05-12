import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { notebookShadowRoles } from '../../tokens';
import { cn } from '../../utils';
import { stageLayoutStyles } from '../styles';
import type {
  NotebookFooterMode,
  NotebookSceneProfile,
  NotebookShellLayout
} from '../types';

interface NotebookShellStageProps extends HTMLAttributes<HTMLDivElement> {
  profile: NotebookSceneProfile;
  layout?: NotebookShellLayout;
  footerMode?: NotebookFooterMode;
  header?: ReactNode;
  panel?: ReactNode;
  footer?: ReactNode;
}

/**
 * Outer notebook scene container that owns profile, footer reservation, chrome, and panels.
 * Use as the root wrapper for Storybook profile specimens and runtime scene UI shells.
 */
export function NotebookShellStage({
  profile,
  layout = 'focus',
  footerMode = 'reserved',
  header,
  panel,
  footer,
  children,
  className,
  style,
  ...props
}: NotebookShellStageProps) {
  const footerSpace = footer && footerMode === 'reserved' ? '4.75rem' : '0px';
  return (
    <div
      data-profile={profile}
      data-layout={layout}
      data-footer-mode={footerMode}
      className={cn(
        'relative overflow-hidden rounded-br-[1.75rem] bg-[#f4f1ea] text-[#1a1a1a]',
        'font-[var(--font-ui)]',
        notebookShadowRoles.stage,
        className
      )}
      style={{
        background:
          'linear-gradient(rgba(26,26,26,0.025) 1px, transparent 1px) 0 0 / 100% 2.5rem, #f4f1ea',
        '--notebook-footer-space': footerSpace,
        ...stageLayoutStyles[layout],
        ...style
      } as CSSProperties}
      {...props}
    >
      {header}
      {children}
      {panel}
      {footer ? (
        <div
          className={cn(
            'absolute inset-x-3 bottom-3 flex justify-center [@media(max-height:420px)]:hidden',
            footerMode === 'floating' ? 'z-40' : 'z-20'
          )}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}
