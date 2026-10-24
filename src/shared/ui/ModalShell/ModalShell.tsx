import { useEffect, useId, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { cn } from '../utils';

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const modalStack: symbol[] = [];
let lockedModalCount = 0;
let previousBodyOverflow = '';
/** Long enough to cover a mobile compatibility click after the opening tap. */
const OPENING_CLICK_GRACE_MS = 500;

/**
 * Implicit touch capture keeps `pointerup` targeted at the backdrop after the
 * finger slides onto the dialog. Compare the release point with the dialog box.
 * An empty box has no layout, so the backdrop target check decides instead.
 */
function releasePointIsInsideDialog(
  dialog: HTMLElement | null,
  clientX: number,
  clientY: number
): boolean {
  if (!dialog) return false;
  const bounds = dialog.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return false;
  return (
    clientX >= bounds.left &&
    clientX <= bounds.right &&
    clientY >= bounds.top &&
    clientY <= bounds.bottom
  );
}

interface ModalShellRenderProps {
  titleId: string;
  descriptionId: string;
}

interface ModalShellProps {
  onClose: () => void;
  children: (props: ModalShellRenderProps) => ReactNode;
  className?: string;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
}

/**
 * Accessible modal overlay shell with focus management, escape handling, and scroll lock.
 * Use as the outer layer for blocking React overlays; render dialog content via children.
 */
export function ModalShell({
  onClose,
  children,
  className,
  closeOnEscape = true,
  closeOnBackdrop = true
}: ModalShellProps) {
  const modalId = useRef(Symbol('modal'));
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const backdropPointerDownRef = useRef(false);
  const dialogPointerDownRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(function registerModalInStack() {
    const currentModalId = modalId.current;
    modalStack.push(currentModalId);
    return () => {
      const index = modalStack.indexOf(currentModalId);
      if (index >= 0) modalStack.splice(index, 1);
    };
  }, []);

  useEffect(function lockBodyScrollWhileModalIsOpen() {
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

  useEffect(function captureAndRestoreModalOpenerFocus() {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      openerRef.current = document.activeElement;
    }

    return () => {
      if (openerRef.current?.isConnected) {
        openerRef.current.focus();
      }
    };
  }, []);

  useEffect(function focusInitialModalElement() {
    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialogRef.current)?.focus();
  }, []);

  useEffect(function ignoreOpeningCompatibilityClick() {
    const openedAt = performance.now();
    // Mobile browsers send a click after the tap that opened the modal. By then
    // focus is on the close control, so that click dismisses the dialog immediately.
    const swallowOpeningClick = (event: MouseEvent) => {
      if (performance.now() - openedAt > OPENING_CLICK_GRACE_MS) {
        window.removeEventListener('click', swallowOpeningClick, true);
        return;
      }
      if (event.detail === 0 || dialogPointerDownRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      window.removeEventListener('click', swallowOpeningClick, true);
    };

    window.addEventListener('click', swallowOpeningClick, true);
    const timeoutId = window.setTimeout(() => {
      window.removeEventListener('click', swallowOpeningClick, true);
    }, OPENING_CLICK_GRACE_MS);

    return () => {
      window.removeEventListener('click', swallowOpeningClick, true);
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(function bindModalKeyboardControls() {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (modalStack.at(-1) !== modalId.current) return;

      if (event.key === 'Escape' && closeOnEscape && !event.defaultPrevented) {
        queueMicrotask(() => {
          if (event.defaultPrevented || modalStack.at(-1) !== modalId.current) return;
          event.preventDefault();
          onClose();
        });
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

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [closeOnEscape, onClose]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 backdrop-blur-sm animate-in fade-in duration-300 sm:p-4',
        className
      )}
      onPointerCancel={() => {
        backdropPointerDownRef.current = false;
      }}
      onPointerDown={(event) => {
        backdropPointerDownRef.current = event.target === event.currentTarget;
      }}
      onPointerUp={(event) => {
        const pressedBackdrop = backdropPointerDownRef.current;
        backdropPointerDownRef.current = false;
        if (
          closeOnBackdrop &&
          pressedBackdrop &&
          event.target === event.currentTarget &&
          !releasePointIsInsideDialog(dialogRef.current, event.clientX, event.clientY)
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="max-w-full outline-none"
        onPointerDown={(event: ReactPointerEvent<HTMLDivElement>) => {
          dialogPointerDownRef.current = true;
          event.stopPropagation();
        }}
      >
        {children({ titleId, descriptionId })}
      </div>
    </div>
  );
}
