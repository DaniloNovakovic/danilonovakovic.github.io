import React from 'react';
import { OverlayDialogFrame } from '@/game/overlays/OverlayDialogFrame';
import type { OverlayControllerProps } from '@/game/overlays/types';
import { useMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';
import { Card, Tag } from '@/shared/ui';

const AbilitiesOverlay: React.FC<OverlayControllerProps> = ({ close, titleId, descriptionId }) => {
  const messages = useMessages();
  const { abilities } = getPortfolioData(messages);
  
  return (
    <OverlayDialogFrame
      title={messages.catalog.portfolio.abilities.name}
      description={messages.catalog.portfolio.abilities.description}
      close={close}
      titleId={titleId}
      descriptionId={descriptionId}
    >
      <div className="text-[#1a1a1a]">
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-100 pb-2">{messages.portfolio.abilities.skills}</h3>
            <div className="flex flex-wrap gap-2">
              {abilities.skills.map((skill, index) => (
                <Tag key={index}>
                  {skill}
                </Tag>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-100 pb-2">{messages.portfolio.abilities.tools}</h3>
            <div className="flex flex-wrap gap-2">
              {abilities.tools.map((tool, index) => (
                <Tag key={index}>
                  {tool}
                </Tag>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-100 pb-2">{messages.portfolio.abilities.languages}</h3>
            <ul className="space-y-2">
              {abilities.languages.map((lang, index) => (
                <li key={index} className="text-base flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#1a1a1a] rounded-full"></span>
                  {lang}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </OverlayDialogFrame>
  );
};

export default AbilitiesOverlay;
