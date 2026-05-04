import React from 'react';
import { PORTFOLIO_DATA } from '../data';
import { PORTFOLIO_TEXT } from '../text';
import { Card, Tag } from '@shared/ui';

const AbilitiesOverlay: React.FC = () => {
  const { abilities } = PORTFOLIO_DATA;
  
  return (
    <div className="text-[#1a1a1a]">
      <div className="grid grid-cols-1 gap-6">
        {/* Skills */}
        <Card>
          <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-100 pb-2">{PORTFOLIO_TEXT.abilities.skills}</h3>
          <div className="flex flex-wrap gap-2">
            {abilities.skills.map((skill, index) => (
              <Tag key={index}>
                {skill}
              </Tag>
            ))}
          </div>
        </Card>

        {/* Tools */}
        <Card>
          <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-100 pb-2">{PORTFOLIO_TEXT.abilities.tools}</h3>
          <div className="flex flex-wrap gap-2">
            {abilities.tools.map((tool, index) => (
              <Tag key={index}>
                {tool}
              </Tag>
            ))}
          </div>
        </Card>

        {/* Languages */}
        <Card>
          <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-100 pb-2">{PORTFOLIO_TEXT.abilities.languages}</h3>
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
  );
};

export default AbilitiesOverlay;
