import type { HTMLAttributes } from 'react';
import { cn } from '../../utils';
import { actionGridStyles } from '../styles';
import type { NotebookPanelActionsLayout } from '../types';

interface SceneChoiceGridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: NotebookPanelActionsLayout;
}

/**
 * Responsive grid for scene choice cards.
 * Use to lay out `SceneChoiceCard` options inside a panel or choice state.
 */
export function SceneChoiceGrid({
  columns = 'auto',
  children,
  className,
  style,
  ...props
}: SceneChoiceGridProps) {
  const gridClass = columns === 'row' ? 'grid-cols-2' : columns === 'stack' ? 'grid-cols-1' : '';

  return (
    <div
      className={cn('grid gap-3', gridClass, className)}
      data-choice-grid={columns}
      style={{ ...actionGridStyles[columns], ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
