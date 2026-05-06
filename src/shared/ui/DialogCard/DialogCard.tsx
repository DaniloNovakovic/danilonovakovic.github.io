import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { messages } from '@/shared/i18n';
import { Button } from '../Button';

interface DialogCardProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  titleId?: string;
  descriptionId?: string;
}

export function DialogCard({
  title,
  description,
  onClose,
  children,
  titleId,
  descriptionId
}: DialogCardProps) {
  return (
    <div
      className="relative max-h-[92dvh] w-full max-w-[600px] overflow-y-auto rounded-t-2xl border-4 border-[#1a1a1a] bg-[#fbfbf9] p-4 text-[#1a1a1a] shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] outline-none animate-in zoom-in-95 fade-in sm:rounded-2xl sm:p-8"
    >
      <Button
        variant="icon"
        size="sm"
        onClick={onClose}
        className="absolute right-2 top-2 z-10 p-2 sm:right-4 sm:top-4"
        aria-label={messages.common.close}
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
          <p id={descriptionId} className="mb-6 font-medium italic opacity-80 sm:mb-8">{description}</p>
        )}

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
