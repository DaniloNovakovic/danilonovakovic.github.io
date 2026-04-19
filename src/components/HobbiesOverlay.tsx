import React from 'react';
import { PORTFOLIO_DATA } from '../config/portfolio';
import { TEXTS } from '../config/content';

const HobbiesOverlay: React.FC = () => {
  const { hobbies } = PORTFOLIO_DATA;
  
  return (
    <div className="text-[#1a1a1a]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hobbies.map((hobby) => (
          <div key={hobby.id} className="bg-white p-6 rounded-lg border-4 border-[#1a1a1a] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              {hobby.name}
            </h3>
            <p className="text-gray-700 italic">
              {hobby.description}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-gray-500 font-mono">{TEXTS.common.pressEsc}</p>
    </div>
  );
};

export default HobbiesOverlay;

