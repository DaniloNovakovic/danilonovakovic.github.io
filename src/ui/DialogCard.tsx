import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const dialogStack: HTMLElement[] = [];

interface DialogCardProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export function DialogCard({ title, description, onClose, children }: DialogCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const first = cardRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? cardRef.current)?.focus();
  }, []);

  useEffect(() => {
    const modal = cardRef.current;
    if (!modal) return;

    dialogStack.push(modal);
    return () => {
      const index = dialogStack.indexOf(modal);
      if (index >= 0) dialogStack.splice(index, 1);
    };
  }, []);

  useEffect(() => {
    const modal = cardRef.current;
    if (!modal) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, []);

  useEffect(() => {
    const modal = cardRef.current;
    if (!modal) return;

    const handleEscape = (e: KeyboardEvent) => {
      const isTopDialog = dialogStack.at(-1) === modal;
      if (e.key === 'Escape' && !e.defaultPrevented && isTopDialog) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="relative max-h-[92dvh] w-full max-w-[600px] overflow-y-auto rounded-t-2xl border-4 border-[#1a1a1a] bg-[#fbfbf9] p-4 text-[#1a1a1a] shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] outline-none animate-in zoom-in-95 fade-in sm:rounded-2xl sm:p-8"
    >
      <Button
        variant="icon"
        size="sm"
        onClick={onClose}
        className="absolute right-2 top-2 z-10 p-2 sm:right-4 sm:top-4"
        aria-label="Close"
      >
        <X size={20} color="#1a1a1a" />
      </Button>

      <h2
        id={titleId}
        className="mb-3 mt-1 border-b-4 border-[#1a1a1a] pb-2 pr-12 text-2xl font-bold uppercase tracking-wider sm:mb-4 sm:mt-0 sm:pr-0 sm:text-4xl"
      >
        {title}
      </h2>

      <div className="mt-4 text-base leading-relaxed sm:mt-6 sm:text-xl">
        {description && (
          <p className="mb-6 font-medium italic opacity-80 sm:mb-8">{description}</p>
        )}

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
