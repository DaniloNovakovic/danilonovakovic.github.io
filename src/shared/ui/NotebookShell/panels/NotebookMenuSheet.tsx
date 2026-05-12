import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import { Button } from '../../Button';
import { notebookShadowRoles } from '../../tokens';
import { cn } from '../../utils';

interface NotebookMenuSheetItem {
  label: string;
  detail?: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  disabled?: boolean;
}

interface NotebookMenuSheetProps extends HTMLAttributes<HTMLElement> {
  title: string;
  items: readonly NotebookMenuSheetItem[];
}

/**
 * Compact menu sheet for shell-level scene actions.
 * Use for navigation/settings-style choices, not for scene outcome or upgrade panels.
 */
export function NotebookMenuSheet({
  title,
  items,
  className,
  ...props
}: NotebookMenuSheetProps) {
  return (
    <section
      role="dialog"
      aria-label={title}
      className={cn(
        'grid w-[min(22rem,calc(100vw-2rem))] gap-3 rounded-lg border-4 border-[#1a1a1a] bg-[#fbfbf9] p-4 font-mono',
        notebookShadowRoles.sheet,
        className
      )}
      {...props}
    >
      <h2 className="text-2xl font-black uppercase tracking-widest text-[#1a1a1a]">
        {title}
      </h2>
      <div className="grid gap-2">
        {items.map((item) => (
          <Button
            key={item.label}
            disabled={item.disabled}
            onClick={item.onClick}
            size="md"
            variant="secondary"
            className="grid min-h-12 justify-items-start gap-1 text-left font-mono uppercase tracking-widest"
          >
            <span>{item.label}</span>
            {item.detail ? (
              <span className="text-[10px] font-bold tracking-wide text-[#5a554f]">{item.detail}</span>
            ) : null}
          </Button>
        ))}
      </div>
    </section>
  );
}
