import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from './utils';

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const modalStack: symbol[] = [];
let lockedModalCount = 0;
let previousBodyOverflow = '';

interface ModalShellRenderProps {
  titleId: string;
  descriptionId: string | undefined;
}

interface ModalShellProps {
  title: string;
  hasDescription?: boolean;
  onClose: () => void;
  children: (props: ModalShellRenderProps) => ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
}

export function ModalShell({
  title,
  hasDescription = false,
  onClose,
  children,
  className,
  closeOnBackdrop = true
}: ModalShellProps) {
  const modalId = useRef(Symbol('modal'));
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const ariaDescriptionId = hasDescription ? descriptionId : undefined;

  useEffect(() => {
    const currentModalId = modalId.current;
    modalStack.push(currentModalId);
    return () => {
      const index = modalStack.indexOf(currentModalId);
      if (index >= 0) modalStack.splice(index, 1);
    };
  }, []);

  useEffect(() => {
    if (lockedModalCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    lockedModalCount += 1;

    return () => {
      lockedModalCount = Math.max(0, lockedModalCount - 1);
      if (lockedModalCount === 0) {
        document.body.style.overflow = previousBodyOverflow;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      openerRef.current = document.activeElement;
    }

    return () => {
      if (openerRef.current?.isConnected) {
        openerRef.current.focus();
      }
    };
  }, []);

  useEffect(() => {
    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialogRef.current)?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (modalStack.at(-1) !== modalId.current) return;

      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 backdrop-blur-sm animate-in fade-in duration-300 sm:items-center sm:p-4',
        className
      )}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-labelledby={titleId}
        aria-describedby={ariaDescriptionId}
        tabIndex={-1}
        className="w-full max-w-[600px] outline-none"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children({ titleId, descriptionId: ariaDescriptionId })}
      </div>
    </div>
  );
}
