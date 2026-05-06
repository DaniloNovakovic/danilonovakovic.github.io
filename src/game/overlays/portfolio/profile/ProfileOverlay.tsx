import React from 'react';
import { OverlayDialogFrame } from '@/game/overlays/OverlayDialogFrame';
import type { OverlayControllerProps } from '@/game/overlays/types';
import { useMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';
import { Card } from '@/shared/ui';

const ProfileOverlay: React.FC<OverlayControllerProps> = ({ close, titleId, descriptionId }) => {
  const messages = useMessages();
  const { profile } = getPortfolioData(messages);
  
  return (
    <OverlayDialogFrame
      title={messages.catalog.portfolio.profile.name}
      description={messages.catalog.portfolio.profile.description}
      close={close}
      titleId={titleId}
      descriptionId={descriptionId}
    >
      <div className="text-[#1a1a1a]">
        <Card className="mb-4">
          <h3 className="text-2xl font-bold mb-4">{messages.portfolio.profile.title}</h3>
          <p className="text-lg leading-relaxed mb-6 italic">
            "{profile.about}"
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-bold text-gray-600">{messages.portfolio.profile.name}</span>
              <p className="text-xl">{profile.name}</p>
            </div>
            <div>
              <span className="font-bold text-gray-600">{messages.portfolio.profile.location}</span>
              <p className="text-xl">{profile.location}</p>
            </div>
          </div>
        </Card>
        <p className="text-center text-sm text-gray-500 font-mono mt-8">{messages.common.pressEsc}</p>
      </div>
    </OverlayDialogFrame>
  );
};

export default ProfileOverlay;
