import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { Button } from '../../Button';
import { notebookShadowRoles } from '../../tokens';
import { cn } from '../../utils';
import { actionGridStyles, panelPlacementStyles } from '../styles';
import type { NotebookPanelActionsLayout, NotebookPanelPlacement } from '../types';

interface ScenePanelSheetAction {
  label: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

interface ScenePanelSheetProps extends HTMLAttributes<HTMLElement> {
  title: string;
  body: ReactNode;
  actions?: readonly ScenePanelSheetAction[];
  actionsLayout?: NotebookPanelActionsLayout;
  placement?: NotebookPanelPlacement;
}

/**
 * Blocking loose sheet for scene start, result, upgrade, or terminal states.
 * Use as an absolutely positioned child of `NotebookShellStage`, not as a generic page card.
 */
export function ScenePanelSheet({
  title,
  body,
  actions = [],
  actionsLayout = 'auto',
  placement = 'centered',
  className,
  style,
  ...props
}: ScenePanelSheetProps) {
  const actionGridClass =
    actionsLayout === 'row' ? 'grid-cols-2' : actionsLayout === 'stack' ? 'grid-cols-1' : '';

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-label={title}
      className={cn(
        'absolute left-1/2 top-1/2 z-30 grid -translate-x-1/2 -translate-y-1/2 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden rounded-lg border-4 border-[#1a1a1a] bg-[#fbfbf9]/95 p-4 text-center',
        notebookShadowRoles.sheet,
        className
      )}
      style={{ ...panelPlacementStyles[placement], ...style }}
      {...props}
    >
      <h2
        className="font-mono font-black uppercase leading-none tracking-wider text-[#1a1a1a]"
        style={{ fontSize: 'clamp(1.6rem, 7vw, 3rem)' }}
      >
        {title}
      </h2>
      <div className="min-h-0 overflow-y-auto font-mono text-sm font-bold leading-relaxed text-[#5a554f]">
        {body}
      </div>
      {actions.length > 0 ? (
        <div
          className={cn('grid gap-3', actionGridClass)}
          data-actions-layout={actionsLayout}
          style={actionGridStyles[actionsLayout]}
        >
          {actions.map((action) => (
            <Button
              key={action.label}
              disabled={action.disabled}
              onClick={action.onClick}
              size="lg"
              variant={action.variant === 'primary' ? 'primary' : 'secondary'}
              className="min-h-12 w-full font-mono uppercase tracking-widest"
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
