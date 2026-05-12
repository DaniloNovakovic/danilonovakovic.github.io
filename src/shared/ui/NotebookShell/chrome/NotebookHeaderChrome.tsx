import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import { ArrowLeft, Menu } from 'lucide-react';
import { Button } from '../../Button';
import { cn } from '../../utils';

interface NotebookHeaderChromeProps extends HTMLAttributes<HTMLElement> {
  backLabel?: string;
  backAriaLabel?: string;
  menuLabel?: string;
  menuAriaLabel?: string;
  showMenu?: boolean;
  onBack?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  onMenu?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}

/**
 * Floating scene navigation chrome for Back and optional Menu controls.
 * Use at the top of `NotebookShellStage` when the scene needs shell-level navigation.
 */
export function NotebookHeaderChrome({
  backLabel = 'Back',
  backAriaLabel,
  menuLabel = 'Menu',
  menuAriaLabel,
  showMenu = true,
  onBack,
  onMenu,
  className,
  ...props
}: NotebookHeaderChromeProps) {
  return (
    <nav
      aria-label="Notebook scene controls"
      className={cn(
        'pointer-events-none absolute left-4 right-4 top-3 z-40 flex items-center justify-between gap-3',
        className
      )}
      {...props}
    >
      <Button
        aria-label={backAriaLabel ?? backLabel}
        className="pointer-events-auto min-h-11 px-3 font-mono text-sm uppercase tracking-widest"
        icon={<ArrowLeft className="h-4 w-4" aria-hidden />}
        onClick={onBack}
        size="sm"
        variant="floating"
      >
        {backLabel}
      </Button>
      {showMenu ? (
        <Button
          aria-label={menuAriaLabel ?? menuLabel}
          className="pointer-events-auto min-h-11 bg-[#b8d8f1] px-3 font-mono text-sm uppercase tracking-widest"
          icon={<Menu className="h-4 w-4" aria-hidden />}
          onClick={onMenu}
          size="sm"
          variant="floating"
        >
          {menuLabel}
        </Button>
      ) : null}
    </nav>
  );
}
