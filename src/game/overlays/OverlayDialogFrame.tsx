import type { ReactNode } from 'react';
import { DialogCard } from '@/shared/ui';
import type { OverlayControllerProps } from './types';

interface OverlayDialogFrameProps
  extends Pick<OverlayControllerProps, 'close' | 'titleId' | 'descriptionId'> {
  title: string;
  description?: string;
  children: ReactNode;
}

export function OverlayDialogFrame({
  title,
  description,
  close,
  titleId,
  descriptionId,
  children
}: OverlayDialogFrameProps) {
  return (
    <DialogCard
      title={title}
      description={description}
      onClose={close}
      titleId={titleId}
      descriptionId={descriptionId}
    >
      {children}
    </DialogCard>
  );
}
