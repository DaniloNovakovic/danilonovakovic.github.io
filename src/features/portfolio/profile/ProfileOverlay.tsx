import React from 'react';
import { PORTFOLIO_DATA } from '../data';
import { PORTFOLIO_TEXT } from '../text';
import { TEXTS } from '@config/content';
import { Card } from '@shared/ui';

const ProfileOverlay: React.FC = () => {
  const { profile } = PORTFOLIO_DATA;
  
  return (
    <div className="text-[#1a1a1a]">
      <Card className="mb-4">
        <h3 className="text-2xl font-bold mb-4">{PORTFOLIO_TEXT.profile.title}</h3>
        <p className="text-lg leading-relaxed mb-6 italic">
          "{profile.about}"
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-bold text-gray-600">{PORTFOLIO_TEXT.profile.name}</span>
            <p className="text-xl">{profile.name}</p>
          </div>
          <div>
            <span className="font-bold text-gray-600">{PORTFOLIO_TEXT.profile.location}</span>
            <p className="text-xl">{profile.location}</p>
          </div>
        </div>
      </Card>
      <p className="text-center text-sm text-gray-500 font-mono mt-8">{TEXTS.common.pressEsc}</p>
    </div>
  );
};

export default ProfileOverlay;
