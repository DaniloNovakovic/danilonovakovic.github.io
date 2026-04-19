import React from 'react';
import { PORTFOLIO_DATA } from '../config/portfolio';
import { TEXTS } from '../config/content';

const AbilitiesOverlay: React.FC = () => {
  const { abilities } = PORTFOLIO_DATA;
  
  return (
    <div className="text-[#1a1a1a]">
      <div className="grid grid-cols-1 gap-6">
        {/* Skills */}
        <div className="bg-white p-6 rounded-lg border-4 border-[#1a1a1a] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
          <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-100 pb-2">{TEXTS.abilities.skills}</h3>
          <div className="flex flex-wrap gap-2">
            {abilities.skills.map((skill, index) => (
              <span key={index} className="px-2 py-0.5 bg-gray-50 border border-[#1a1a1a] rounded text-sm font-semibold">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="bg-white p-6 rounded-lg border-4 border-[#1a1a1a] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
          <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-100 pb-2">{TEXTS.abilities.tools}</h3>
          <div className="flex flex-wrap gap-2">
            {abilities.tools.map((tool, index) => (
              <span key={index} className="px-2 py-0.5 bg-gray-50 border border-[#1a1a1a] rounded text-sm font-semibold">
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white p-6 rounded-lg border-4 border-[#1a1a1a] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
          <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-100 pb-2">{TEXTS.abilities.languages}</h3>
          <ul className="space-y-2">
            {abilities.languages.map((lang, index) => (
              <li key={index} className="text-base flex items-center gap-2">
                <span className="w-2 h-2 bg-[#1a1a1a] rounded-full"></span>
                {lang}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AbilitiesOverlay;

